# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive admin dashboard for Owner (production-to-sales analytics with margin)

**Architecture:** Add `costPrice` to products schema, create `DashboardService` with parallel aggregation queries, 6 dashboard widgets with `Promise.allSettled` isolation, SVG-based charts (zero dependencies), client-side period filter via API endpoint.

**Tech Stack:** SvelteKit 5 (runes), Drizzle ORM (PostgreSQL/Neon), Tailwind CSS v4, shadcn-svelte, SVG charts

---

## File Structure

### New Files
- `src/lib/server/dashboard/service.ts` — 9 aggregation queries (sales summary, production summary, stock summary, revenue, sales trend, production trend, recent transactions, category distribution, stock alerts)
- `src/routes/api/dashboard/+server.ts` — JSON API endpoint with period filter
- `src/lib/components/dashboard/KPICard.svelte` — Reusable card component
- `src/lib/components/dashboard/SalesTrendChart.svelte` — SVG bar chart for daily sales
- `src/lib/components/dashboard/ProductionChart.svelte` — SVG bar chart + target reference line
- `src/lib/components/dashboard/CategoryChart.svelte` — SVG donut chart by category
- `src/lib/components/dashboard/RecentTransactions.svelte` — 5 latest orders table
- `src/lib/components/dashboard/StockAlertBanner.svelte` — Critical stock alert banner
- `src/lib/components/dashboard/PeriodFilter.svelte` — Segmented filter buttons
- `src/lib/components/dashboard/SkeletonWidget.svelte` — Loading placeholder

### Modified Files
- `src/lib/server/db/schema/product.ts` — Add `costPrice` column
- `src/lib/server/product/validation.ts` — Add `costPrice` to Zod schema
- `src/lib/components/produk/ProductFormModal.svelte` — Add costPrice input
- `src/routes/(app)/dashboard/+page.server.ts` — Replace placeholder with dashboard data load
- `src/routes/(app)/dashboard/+page.svelte` — Replace placeholder with full dashboard UI
- `src/lib/server/db/schema.ts` — Update index for costPrice query if needed

---

### Task 1: Add costPrice to Products Schema

**Files:**
- Modify: `src/lib/server/db/schema/product.ts`
- Modify: `src/lib/server/product/validation.ts`
- Modify: `src/lib/components/produk/ProductFormModal.svelte`

- [ ] **Step 1: Add costPrice column to products schema**

Modify `src/lib/server/db/schema/product.ts` — add `costPrice` field after `price`:

```typescript
export const products = pgTable('products', {
	// ... existing fields ...
	price: decimal('price', { precision: 15, scale: 2 }).notNull(),
	costPrice: decimal('cost_price', { precision: 15, scale: 2 }),
	// ... rest of existing fields ...
});
```

- [ ] **Step 2: Add costPrice to Zod validation**

Modify `src/lib/server/product/validation.ts` — add optional `costPrice` field:

```typescript
export const createProductSchema = z.object({
	code: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
	name: z.string().min(1, 'Nama produk wajib diisi'),
	description: z.string().optional(),
	price: z.coerce.number().positive('Harga harus lebih dari 0'),
	costPrice: z.coerce.number().min(0).optional(),
	categoryId: z.string().min(1, 'Pilih kategori').optional(),
	unit: z.enum(['KG', 'TON', 'SAK', 'PCS']),
	minimumStock: z.coerce.number().int().min(0).default(0)
});

export const updateProductSchema = z.object({
	name: z.string().min(1).optional(),
	code: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
	description: z.string().optional(),
	price: z.coerce.number().positive().optional(),
	costPrice: z.coerce.number().min(0).optional(),
	categoryId: z.string().optional(),
	unit: z.enum(['KG', 'TON', 'SAK', 'PCS']).optional(),
	minimumStock: z.coerce.number().int().min(0).optional()
});
```

- [ ] **Step 3: Add costPrice field to product form**

In `src/lib/components/produk/ProductFormModal.svelte`:

Add state variable after `price`:
```typescript
let costPrice = $state('');
```

In `$effect` block:
```typescript
costPrice = product?.costPrice?.toString() || '';
```

Add form field after the price input (around line 128):
```svelte
<div class="grid gap-2">
	<Label for="costPrice">Harga Modal (optional)</Label>
	<Input id="costPrice" name="costPrice" type="number" bind:value={costPrice} />
</div>
```

- [ ] **Step 4: Update product service to handle costPrice**

Modify `src/lib/server/product/service.ts` — in both `createProduct` and `updateProduct`, add `cost_price` field:

```typescript
const [product] = await db.insert(products).values({
	code,
	name: data.name,
	description: data.description,
	price: String(data.price),
	costPrice: data.costPrice ? String(data.costPrice) : null,
	unit: data.unit,
	minimumStock: data.minimumStock,
	categoryId: data.categoryId,
	imageUrl
}).returning();
```

- [ ] **Step 5: Run DB migration**

```bash
bunx drizzle-kit push
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/server/db/schema/product.ts src/lib/server/product/validation.ts src/lib/components/produk/ProductFormModal.svelte src/lib/server/product/service.ts
git commit -m "feat: add costPrice field for margin calculation"
```

---

### Task 2: Create DashboardService

**Files:**
- Create: `src/lib/server/dashboard/service.ts`

- [ ] **Step 1: Create DashboardService with query helpers**

Create `src/lib/server/dashboard/service.ts`:

```typescript
import { and, eq, gte, lte, sql, desc, isNull, count } from 'drizzle-orm';
import { db } from '../db';
import { orders, orderItems } from '../db/schema/order';
import { products, productCategories } from '../db/schema/product';
import { productionEntries } from '../db/schema/production';
import { stockMovements } from '../db/schema/stock';

type Period = 'today' | 'week' | 'month';

function getPeriodRange(period: Period): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
	const now = new Date();
	const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
	let start: Date;
	const prevEnd = new Date(end.getTime() - 1);

	switch (period) {
		case 'today': {
			start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const prevStart = new Date(start.getTime() - 86400000);
			const prevEndClamped = new Date(prevStart.getTime() + 86399999);
			return { start, end, prevStart, prevEnd: prevEndClamped };
		}
		case 'week': {
			const dayOfWeek = now.getDay();
			const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
			start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
			const prevStart = new Date(start.getTime() - 7 * 86400000);
			const prevEndClamped = new Date(start.getTime() - 1);
			return { start, end, prevStart, prevEnd: prevEndClamped };
		}
		case 'month': {
			start = new Date(now.getFullYear(), now.getMonth(), 1);
			const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
			const prevEndClamped = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
			return { start, end, prevStart: prevMonth, prevEnd: prevEndClamped };
		}
	}
}

export type DashboardData = {
	sales: { total: number; count: number; change: number | null };
	production: { totalKg: number; targetKg: number; percentage: number; count: number };
	stock: { totalSKU: number; criticalCount: number };
	revenue: { total: number; change: number | null; margin: number | null };
	salesTrend: Array<{ date: string; total: number; count: number }>;
	productionTrend: Array<{ date: string; totalKg: number }>;
	recentTransactions: Array<{
		id: string; customerName: string | null; totalAmount: string;
		status: string; createdAt: Date | null;
	}>;
	stockAlerts: Array<{
		id: string; name: string; currentStock: number; minimumStock: number; code: string;
	}>;
	categoryDistribution: Array<{ category: string; total: number }>;
};

export async function getDashboardData(periodStr: string): Promise<DashboardData> {
	const period = (periodStr === 'week' || periodStr === 'month') ? periodStr : 'today';
	const range = getPeriodRange(period);

	const [
		salesResult,
		prevSalesResult,
		productionResult,
		stockResult,
		criticalResult,
		salesTrendResult,
		productionTrendResult,
		transactionsResult,
		categoryResult,
	] = await Promise.allSettled([
		getSalesSummary(range.start, range.end),
		getSalesSummary(range.prevStart, range.prevEnd),
		getProductionSummary(range.start, range.end),
		getStockSummary(),
		getStockAlerts(),
		getSalesTrend(),
		getProductionTrend(range.start, range.end),
		getRecentTransactions(),
		getCategoryDistribution(range.start, range.end),
	]);

	const sales = salesResult.status === 'fulfilled' ? salesResult.value : { total: 0, count: 0 };
	const prevSales = prevSalesResult.status === 'fulfilled' ? prevSalesResult.value : { total: 0, count: 0 };
	const production = productionResult.status === 'fulfilled' ? productionResult.value : { totalKg: 0, count: 0 };
	const stock = stockResult.status === 'fulfilled' ? stockResult.value : { totalSKU: 0, critical: [] };
	const criticalProducts = criticalResult.status === 'fulfilled' ? criticalResult.value : [];
	const salesTrend = salesTrendResult.status === 'fulfilled' ? salesTrendResult.value : [];
	const productionTrend = productionTrendResult.status === 'fulfilled' ? productionTrendResult.value : [];
	const transactions = transactionsResult.status === 'fulfilled' ? transactionsResult.value : [];
	const categoryDist = categoryResult.status === 'fulfilled' ? categoryResult.value : [];

	const salesChange = prevSales.total > 0 ? ((sales.total - prevSales.total) / prevSales.total) * 100 : null;
	const percentage = production.totalKg > 0 ? Math.round((production.totalKg / 4000) * 100) : 0;

	return {
		sales: { total: sales.total, count: sales.count, change: salesChange },
		production: { totalKg: production.totalKg, targetKg: 4000, percentage, count: production.count },
		stock: { totalSKU: stock.totalSKU, criticalCount: criticalProducts.length },
		revenue: { total: sales.total, change: salesChange, margin: null },
		salesTrend,
		productionTrend,
		recentTransactions: transactions,
		stockAlerts: criticalProducts,
		categoryDistribution: categoryDist,
	};
}

export async function getDashboardDataWithMargins(periodStr: string): Promise<DashboardData> {
	const data = await getDashboardData(periodStr);
	const period = (periodStr === 'week' || periodStr === 'month') ? periodStr : 'today';
	const range = getPeriodRange(period);

	const marginResult = await getMarginSummary(range.start, range.end);
	if (marginResult !== null) {
		data.revenue.margin = marginResult;
	}
	return data;
}

async function getSalesSummary(start: Date, end: Date) {
	const result = await db.select({
		total: sql<string>`COALESCE(SUM(total_amount::numeric), 0)`,
		count: sql<number>`COUNT(*)`,
	}).from(orders)
		.where(and(eq(orders.status, 'PAID'), gte(orders.createdAt, start), lte(orders.createdAt, end)))
		.limit(1);
	return { total: Number(result[0]?.total || 0), count: Number(result[0]?.count || 0) };
}

async function getProductionSummary(start: Date, end: Date) {
	const result = await db.select({
		totalKg: sql<string>`COALESCE(SUM(quantity_kg), 0)`,
		count: sql<number>`COUNT(*)`,
	}).from(productionEntries)
		.where(and(eq(productionEntries.status, 'CONFIRMED'), gte(productionEntries.productionDate, start), lte(productionEntries.productionDate, end)))
		.limit(1);
	return { totalKg: Number(result[0]?.totalKg || 0), count: Number(result[0]?.count || 0) };
}

async function getStockSummary() {
	const activeProducts = await db.select({ count: sql<number>`COUNT(*)` })
		.from(products)
		.where(and(isNull(products.deletedAt), eq(products.isActive, true)))
		.limit(1);

	const activeCount = Number(activeProducts[0]?.count || 0);

	const criticalProducts = await getStockAlerts();
	return { totalSKU: activeCount, critical: criticalProducts };
}

async function getStockAlerts() {
	const allProducts = await db.select({
		id: products.id,
		name: products.name,
		code: products.code,
		minimumStock: products.minimumStock,
		currentStock: sql<string>`COALESCE(SUM(${stockMovements.quantityChange}), 0)`,
	})
		.from(products)
		.leftJoin(stockMovements, eq(stockMovements.productId, products.id))
		.where(and(isNull(products.deletedAt), eq(products.isActive, true)))
		.groupBy(products.id)
		.having(sql`COALESCE(SUM(${stockMovements.quantityChange}), 0) < ${products.minimumStock}`);

	return allProducts.map(p => ({
		id: p.id,
		name: p.name,
		code: p.code,
		currentStock: Number(p.currentStock),
		minimumStock: p.minimumStock,
	}));
}

async function getSalesTrend() {
	const result = await db.select({
		date: sql<string>`DATE(${orders.createdAt})`,
		total: sql<string>`COALESCE(SUM(total_amount::numeric), 0)`,
		count: sql<number>`COUNT(*)`,
	})
		.from(orders)
		.where(and(eq(orders.status, 'PAID'), gte(orders.createdAt, sql`NOW() - INTERVAL '7 days'`)))
		.groupBy(sql`DATE(${orders.createdAt})`)
		.orderBy(sql`DATE(${orders.createdAt})`);

	return result.map(r => ({ date: r.date, total: Number(r.total), count: Number(r.count) }));
}

async function getProductionTrend(start: Date, end: Date) {
	const result = await db.select({
		date: sql<string>`DATE(${productionEntries.productionDate})`,
		totalKg: sql<string>`COALESCE(SUM(quantity_kg), 0)`,
	})
		.from(productionEntries)
		.where(and(eq(productionEntries.status, 'CONFIRMED'), gte(productionEntries.productionDate, start), lte(productionEntries.productionDate, end)))
		.groupBy(sql`DATE(${productionEntries.productionDate})`)
		.orderBy(sql`DATE(${productionEntries.productionDate})`);

	return result.map(r => ({ date: r.date, totalKg: Number(r.totalKg) }));
}

async function getRecentTransactions() {
	const result = await db.select({
		id: orders.id,
		customerName: orders.customerName,
		totalAmount: orders.totalAmount,
		status: orders.status,
		createdAt: orders.createdAt,
	})
		.from(orders)
		.where(sql`${orders.status} IN ('PAID', 'PENDING')`)
		.orderBy(desc(orders.createdAt))
		.limit(5);

	return result.map(r => ({
		id: r.id,
		customerName: r.customerName,
		totalAmount: r.totalAmount,
		status: r.status,
		createdAt: r.createdAt,
	}));
}

async function getCategoryDistribution(start: Date, end: Date) {
	const result = await db.select({
		category: productCategories.name,
		total: sql<string>`COALESCE(SUM(${orderItems.quantity}::numeric * ${orderItems.unitPrice}::numeric), 0)`,
	})
		.from(orderItems)
		.innerJoin(orders, eq(orders.id, orderItems.orderId))
		.innerJoin(products, eq(products.id, orderItems.productId))
		.innerJoin(productCategories, eq(productCategories.id, products.categoryId!))
		.where(and(eq(orders.status, 'PAID'), gte(orders.createdAt, start), lte(orders.createdAt, end)))
		.groupBy(productCategories.name);

	return result.map(r => ({ category: r.category, total: Number(r.total) }));
}

async function getMarginSummary(start: Date, end: Date) {
	const result = await db.select({
		totalRevenue: sql<string>`COALESCE(SUM(oi.quantity::numeric * oi.unit_price::numeric), 0)`,
		totalCost: sql<string>`COALESCE(SUM(oi.quantity::numeric * p.cost_price::numeric), 0)`,
		count: sql<number>`COUNT(*)`,
	})
		.from(orderItems as any)
		.innerJoin(orders, eq(orders.id, orderItems.orderId))
		.innerJoin(products, eq(products.id, orderItems.productId))
		.where(and(eq(orders.status, 'PAID'), gte(orders.createdAt, start), lte(orders.createdAt, end), sql`${products.costPrice} IS NOT NULL`))
		.limit(1);

	const revenue = Number(result[0]?.totalRevenue || 0);
	const cost = Number(result[0]?.totalCost || 0);
	if (revenue > 0 && cost > 0) {
		return Math.round(((revenue - cost) / revenue) * 100 * 10) / 10;
	}
	return null;
}
```

- [ ] **Step 2: Run type check**

```bash
bun run check
```

Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/server/dashboard/service.ts
git commit -m "feat: add DashboardService with aggregation queries"
```

---

### Task 3: Create Dashboard API Endpoint

**Files:**
- Create: `src/routes/api/dashboard/+server.ts`

- [ ] **Step 1: Create the API endpoint**

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDashboardDataWithMargins } from '$lib/server/dashboard/service';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const allowedRoles = ['owner', 'admin_penjualan'];
	if (!allowedRoles.includes(event.locals.user.role)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const period = event.url.searchParams.get('period') || 'today';
	if (!['today', 'week', 'month'].includes(period)) {
		return json({ error: 'Invalid period' }, { status: 400 });
	}

	const data = await getDashboardDataWithMargins(period);
	return json(data);
};
```

- [ ] **Step 2: Run type check**

```bash
bun run check
```

Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/routes/api/dashboard/+server.ts
git commit -m "feat: add dashboard API endpoint with period filter"
```

---

### Task 4: Create Dashboard Widget Components

**Files:**
- Create: `src/lib/components/dashboard/KPICard.svelte`
- Create: `src/lib/components/dashboard/SkeletonWidget.svelte`
- Create: `src/lib/components/dashboard/PeriodFilter.svelte`
- Create: `src/lib/components/dashboard/StockAlertBanner.svelte`
- Create: `src/lib/components/dashboard/RecentTransactions.svelte`

- [ ] **Step 1: Create KPICard.svelte**

```svelte
<script lang="ts">
	let {
		title,
		value,
		subtitle = '',
		change = null as number | null,
		icon = null as string | null,
		alert = false,
		loading = false
	}: {
		title: string;
		value: string;
		subtitle?: string;
		change?: number | null;
		icon?: string | null;
		alert?: boolean;
		loading?: boolean;
	} = $props();
</script>

<div class="rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md {alert ? 'border-red-300 bg-red-50' : ''}">
	{#if loading}
		<div class="animate-pulse space-y-3">
			<div class="h-4 w-20 rounded bg-gray-200"></div>
			<div class="h-8 w-32 rounded bg-gray-200"></div>
			<div class="h-3 w-24 rounded bg-gray-200"></div>
		</div>
	{:else}
		<div class="flex items-start justify-between">
			<p class="text-sm font-medium text-muted-foreground">{title}</p>
			{#if icon}<span class="text-lg">{icon}</span>{/if}
		</div>
		<p class="mt-1 text-2xl font-bold">{value}</p>
		<div class="mt-1 flex items-center gap-2">
			{subtitle && <p class="text-xs text-muted-foreground">{subtitle}</p>}
			{#if change !== null}
				<span class="inline-flex items-center gap-0.5 text-xs font-medium {change >= 0 ? 'text-green-600' : 'text-red-600'}">
					{change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
				</span>
			{/if}
		</div>
	{/if}
</div>
```

- [ ] **Step 2: Create SkeletonWidget.svelte**

```svelte
<script lang="ts">
	let { height = 'h-48' }: { height?: string } = $props();
</script>

<div class="animate-pulse rounded-xl border bg-white p-5 shadow-sm {height}">
	<div class="space-y-3">
		<div class="h-4 w-24 rounded bg-gray-200"></div>
		<div class="h-6 w-full rounded bg-gray-200"></div>
		<div class="h-6 w-3/4 rounded bg-gray-200"></div>
		<div class="h-6 w-1/2 rounded bg-gray-200"></div>
	</div>
</div>
```

- [ ] **Step 3: Create PeriodFilter.svelte**

```svelte
<script lang="ts">
	let { active, onChange }: { active: string; onChange: (period: string) => void } = $props();

	const periods = [
		{ value: 'today', label: 'Hari Ini' },
		{ value: 'week', label: 'Minggu Ini' },
		{ value: 'month', label: 'Bulan Ini' },
	];
</script>

<div class="inline-flex overflow-hidden rounded-lg border bg-white">
	{#each periods as p}
		<button
			class="px-4 py-2 text-sm font-medium transition-colors {active === p.value ? 'bg-emerald-600 text-white' : 'bg-white text-muted-foreground hover:bg-gray-50'}"
			onclick={() => onChange(p.value)}
		>{p.label}</button>
	{/each}
</div>
```

- [ ] **Step 4: Create StockAlertBanner.svelte**

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';

	let { products: criticalProducts = [] as Array<{ name: string; currentStock: number; minimumStock: number }> }: {
		products?: Array<{ name: string; currentStock: number; minimumStock: number }>;
	} = $props();

	let dismissed = $state(false);
</script>

{#if criticalProducts.length > 0 && !dismissed}
	<div class="rounded-xl border border-yellow-300 bg-yellow-50 p-4">
		<div class="flex items-start justify-between">
			<div class="flex items-start gap-3">
				<span class="text-xl">⚠️</span>
				<div>
					<p class="font-medium text-yellow-800">{criticalProducts.length} produk membutuhkan restock segera</p>
					<ul class="mt-1 list-inside list-disc text-sm text-yellow-700">
						{#each criticalProducts as p}
							<li>{p.name} — stok: {p.currentStock} (min: {p.minimumStock})</li>
						{/each}
					</ul>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<button onclick={() => goto('/gudang')} class="text-sm font-medium text-yellow-800 underline hover:text-yellow-900">Lihat Detail →</button>
				<button onclick={() => dismissed = true} class="text-sm text-yellow-500 hover:text-yellow-700">✕</button>
			</div>
		</div>
	</div>
{/if}
```

- [ ] **Step 5: Create RecentTransactions.svelte**

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';

	let { transactions = [] as Array<{ id: string; customerName: string | null; totalAmount: string; status: string; createdAt: Date | null }>, loading = false }: {
		transactions?: Array<{ id: string; customerName: string | null; totalAmount: string; status: string; createdAt: Date | null }>;
		loading?: boolean;
	} = $props();

	function statusBadge(status: string): string {
		const map: Record<string, string> = { PAID: 'bg-green-100 text-green-700', PENDING: 'bg-yellow-100 text-yellow-700', CANCELLED: 'bg-red-100 text-red-700' };
		return map[status] || 'bg-gray-100 text-gray-700';
	}

	function statusLabel(status: string): string {
		const map: Record<string, string> = { PAID: 'Lunas', PENDING: 'Menunggu', CANCELLED: 'Batal' };
		return map[status] || status;
	}
</script>

<div class="rounded-xl border bg-white p-5 shadow-sm">
	<h3 class="mb-3 text-sm font-semibold text-muted-foreground">🕐 Transaksi Terbaru</h3>
	{#if loading}
		<div class="animate-pulse space-y-3">
			{#each [1,2,3,4,5] as _}
				<div class="h-8 w-full rounded bg-gray-200"></div>
			{/each}
		</div>
	{:else if transactions.length === 0}
		<p class="py-6 text-center text-sm text-muted-foreground">Belum ada transaksi</p>
	{:else}
		<div class="space-y-2">
			{#each transactions as t}
				<button onclick={() => goto(`/orders/${t.id}`)} class="flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors hover:bg-gray-50">
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{t.customerName || 'Anonim'}</p>
						<p class="text-xs text-muted-foreground">{t.createdAt ? new Date(t.createdAt).toLocaleString('id-ID') : '-'}</p>
					</div>
					<div class="flex items-center gap-2">
						<span class="text-sm font-semibold">Rp {Number(t.totalAmount).toLocaleString('id-ID')}</span>
						<span class="rounded-full px-2 py-0.5 text-xs font-medium {statusBadge(t.status)}">{statusLabel(t.status)}</span>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
```

- [ ] **Step 6: Run type check**

```bash
bun run check
```

Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/dashboard/
git commit -m "feat: create dashboard widget components (KPI card, skeleton, filter, alert, transactions)"
```

---

### Task 5: Create Chart Components (SVG-based)

**Files:**
- Create: `src/lib/components/dashboard/SalesTrendChart.svelte`
- Create: `src/lib/components/dashboard/ProductionChart.svelte`
- Create: `src/lib/components/dashboard/CategoryChart.svelte`

- [ ] **Step 1: Create SalesTrendChart.svelte**

```svelte
<script lang="ts">
	import SkeletonWidget from './SkeletonWidget.svelte';

	let { data = [] as Array<{ date: string; total: number; count: number }>, loading = false }: {
		data?: Array<{ date: string; total: number; count: number }>;
		loading?: boolean;
	} = $props();

	let max = $derived(Math.max(...data.map(d => d.total), 1));
</script>

<div class="rounded-xl border bg-white p-5 shadow-sm">
	<h3 class="mb-3 text-sm font-semibold text-muted-foreground">📊 Tren Penjualan 7 Hari</h3>
	{#if loading}
		<SkeletonWidget height="h-48" />
	{:else if data.length === 0}
		<div class="flex h-48 items-center justify-center text-sm text-muted-foreground">Belum ada data</div>
	{:else}
		<div class="flex h-48 items-end gap-2">
			{#each data as d}
				<div class="flex flex-1 flex-col items-center justify-end gap-1">
					<span class="text-xs text-muted-foreground">Rp {(d.total / 1000).toFixed(0)}k</span>
					<div
						class="w-full rounded-t bg-emerald-500 transition-all hover:bg-emerald-600"
						style="height: {(d.total / max) * 160}px; min-height: 4px;"
						title="{d.date}: Rp {d.total.toLocaleString('id-ID')} ({d.count} transaksi)"
					></div>
					<span class="text-xs text-muted-foreground">{d.date.slice(5)}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
```

- [ ] **Step 2: Create ProductionChart.svelte**

```svelte
<script lang="ts">
	import SkeletonWidget from './SkeletonWidget.svelte';

	let { data = [] as Array<{ date: string; totalKg: number }>, loading = false, targetKg = 4000 }: {
		data?: Array<{ date: string; totalKg: number }>;
		loading?: boolean;
		targetKg?: number;
	} = $props();

	let max = $derived(Math.max(...data.map(d => d.totalKg), targetKg, 1));
</script>

<div class="rounded-xl border bg-white p-5 shadow-sm">
	<h3 class="mb-3 text-sm font-semibold text-muted-foreground">🏭 Tren Produksi</h3>
	{#if loading}
		<SkeletonWidget height="h-48" />
	{:else if data.length === 0}
		<div class="flex h-48 items-center justify-center text-sm text-muted-foreground">Belum ada data</div>
	{:else}
		<div class="relative h-48">
			<!-- Target line -->
			<div class="absolute left-0 right-0 border-t-2 border-dashed border-red-400" style="bottom: {(targetKg / max) * 100}%;">
				<span class="absolute -top-4 right-0 text-xs text-red-500">Target {targetKg}kg</span>
			</div>
			<div class="flex h-full items-end gap-2 pt-4">
				{#each data as d}
					<div class="flex flex-1 flex-col items-center justify-end gap-1">
						{#if d.totalKg > targetKg * 0.8}
							<span class="text-xs text-green-600">{(d.totalKg / 1000).toFixed(1)}t</span>
						{/if}
						<div
							class="w-full rounded-t {d.totalKg >= targetKg ? 'bg-green-500' : 'bg-amber-500'} transition-all hover:opacity-80"
							style="height: {(d.totalKg / max) * 160}px; min-height: 4px;"
							title="{d.date}: {d.totalKg}kg"
						></div>
						<span class="text-xs text-muted-foreground">{d.date.slice(5)}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
```

- [ ] **Step 3: Create CategoryChart.svelte**

```svelte
<script lang="ts">
	import SkeletonWidget from './SkeletonWidget.svelte';

	let { data = [] as Array<{ category: string; total: number }>, loading = false }: {
		data?: Array<{ category: string; total: number }>;
		loading?: boolean;
	} = $props();

	const colors = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];
	let total = $derived(data.reduce((s, d) => s + d.total, 0));
</script>

<div class="rounded-xl border bg-white p-5 shadow-sm">
	<h3 class="mb-3 text-sm font-semibold text-muted-foreground">🍩 Penjualan Per Kategori</h3>
	{#if loading}
		<SkeletonWidget height="h-48" />
	{:else if data.length === 0}
		<div class="flex h-48 items-center justify-center text-sm text-muted-foreground">Belum ada data</div>
	{:else}
		<div class="space-y-3">
			{#each data as d, i}
				<div class="flex items-center gap-3">
					<div class="h-3 w-3 shrink-0 rounded-full" style="background: {colors[i % colors.length]}"></div>
					<div class="min-w-0 flex-1">
						<div class="flex items-baseline justify-between">
							<span class="text-sm font-medium">{d.category}</span>
							<span class="text-sm font-semibold">Rp {d.total.toLocaleString('id-ID')}</span>
						</div>
						<div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
							<div class="h-full rounded-full transition-all" style="width: {total > 0 ? (d.total / total) * 100 : 0}%; background: {colors[i % colors.length]}"></div>
						</div>
						<span class="text-xs text-muted-foreground">{total > 0 ? ((d.total / total) * 100).toFixed(1) : 0}%</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
```

- [ ] **Step 4: Run type check**

```bash
bun run check
```

Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/dashboard/SalesTrendChart.svelte src/lib/components/dashboard/ProductionChart.svelte src/lib/components/dashboard/CategoryChart.svelte
git commit -m "feat: create SVG chart components (sales trend, production, category)"
```

---

### Task 6: Build Dashboard Page (SSR + Client)

**Files:**
- Modify: `src/routes/(app)/dashboard/+page.server.ts`
- Modify: `src/routes/(app)/dashboard/+page.svelte`

- [ ] **Step 1: Update server load function**

Replace `src/routes/(app)/dashboard/+page.server.ts` entirely:

```typescript
import { fail, redirect, json } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getDashboardDataWithMargins } from '$lib/server/dashboard/service';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) throw redirect(303, '/login');

	const period = event.url.searchParams.get('period') || 'today';
	if (!['today', 'week', 'month'].includes(period)) {
		throw redirect(303, '/dashboard');
	}

	const data = await getDashboardDataWithMargins(period);
	return { data, period, user: event.locals.user };
};
```

- [ ] **Step 2: Update dashboard page UI**

Replace `src/routes/(app)/dashboard/+page.svelte` entirely:

```svelte
<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import KPICard from '$lib/components/dashboard/KPICard.svelte';
	import SalesTrendChart from '$lib/components/dashboard/SalesTrendChart.svelte';
	import ProductionChart from '$lib/components/dashboard/ProductionChart.svelte';
	import CategoryChart from '$lib/components/dashboard/CategoryChart.svelte';
	import RecentTransactions from '$lib/components/dashboard/RecentTransactions.svelte';
	import StockAlertBanner from '$lib/components/dashboard/StockAlertBanner.svelte';
	import PeriodFilter from '$lib/components/dashboard/PeriodFilter.svelte';
	import SkeletonWidget from '$lib/components/dashboard/SkeletonWidget.svelte';

	let { data } = $props();

	let dashboardData = $state(data.data);
	let currentPeriod = $state(data.period);
	let loading = $state(false);

	function formatKg(kg: number): string {
		if (kg >= 1000) return `${(kg / 1000).toFixed(1)} ton`;
		return `${kg.toLocaleString('id-ID')} kg`;
	}

	async function changePeriod(period: string) {
		if (period === currentPeriod) return;
		loading = true;
		try {
			const url = new URL($page.url);
			url.searchParams.set('period', period);
			goto(url.toString(), { replaceState: true });
			const res = await fetch(`/api/dashboard?period=${period}`);
			if (res.ok) {
				dashboardData = await res.json();
				currentPeriod = period;
			}
		} catch {
			// keep existing data
		} finally {
			loading = false;
		}
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Dashboard</h1>
			<p class="text-sm text-muted-foreground">Selamat datang, {data.user?.name}!</p>
		</div>
		<div class="flex items-center gap-2">
			<PeriodFilter active={currentPeriod} onChange={changePeriod} />
		</div>
	</div>

	<StockAlertBanner products={dashboardData.stockAlerts} />

	<!-- KPI Cards -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<KPICard
			title="Penjualan"
			value={"Rp " + dashboardData.sales.total.toLocaleString('id-ID')}
			subtitle={dashboardData.sales.count + " transaksi"}
			change={dashboardData.sales.change}
			icon="💰"
			loading={false}
		/>
		<KPICard
			title="Produksi"
			value={formatKg(dashboardData.production.totalKg)}
			subtitle={`${dashboardData.production.percentage}% dari ${formatKg(dashboardData.production.targetKg)}`}
			alert={dashboardData.production.percentage < 80}
			icon="📦"
			loading={false}
		/>
		<KPICard
			title="Stok"
			value={dashboardData.stock.totalSKU + " SKU"}
			subtitle={dashboardData.stock.criticalCount > 0 ? dashboardData.stock.criticalCount + " kritis" : "Semua normal"}
			alert={dashboardData.stock.criticalCount > 0}
			icon="🏭"
			loading={false}
		/>
		<KPICard
			title="Pendapatan"
			value={"Rp " + dashboardData.revenue.total.toLocaleString('id-ID')}
			subtitle={dashboardData.revenue.margin !== null ? `Margin: ${dashboardData.revenue.margin}%` : ''}
			change={dashboardData.revenue.change}
			icon="📈"
			loading={false}
		/>
	</div>

	<!-- Charts Row -->
	<div class="grid gap-4 lg:grid-cols-2">
		{#if loading}
			<SkeletonWidget height="h-64" />
			<SkeletonWidget height="h-64" />
		{:else}
			<SalesTrendChart data={dashboardData.salesTrend} />
			<ProductionChart data={dashboardData.productionTrend} targetKg={dashboardData.production.targetKg} />
		{/if}
	</div>

	<!-- Bottom Row -->
	<div class="grid gap-4 lg:grid-cols-2">
		{#if loading}
			<SkeletonWidget height="h-64" />
			<SkeletonWidget height="h-64" />
		{:else}
			<RecentTransactions transactions={dashboardData.recentTransactions} />
			<CategoryChart data={dashboardData.categoryDistribution} />
		{/if}
	</div>
</div>
```

- [ ] **Step 3: Run type check**

```bash
bun run check
```

Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/routes/(app)/dashboard/
git commit -m "feat: implement full dashboard page with SSR data load and period filter"
```

---

### Task 7: Verify & Finalize

- [ ] **Step 1: Run type check**

```bash
bun run check
```

Expected: 0 errors

- [ ] **Step 2: Verify all roles work**
  - Owner: full dashboard
  - admin_penjualan: subset (sales + stock widgets)
  - Other roles: 403 redirect (already configured in routes.ts)

- [ ] **Step 3: Commit any remaining files**

```bash
git add -A
git commit -m "feat: complete admin dashboard implementation"
```
