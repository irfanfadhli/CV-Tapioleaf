# Product Management Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement product management module — CRUD products with categories, S3 image upload, search/filter/pagination.

**Architecture:** Drizzle schema for products + categories. ProductService for all business logic (CRUD, code generation, search). SvelteKit form actions for API. S3 client abstraction with `@aws-sdk/client-s3`. Client-side image resize via canvas.

**Tech Stack:** SvelteKit 5, Drizzle ORM (pg), shadcn-svelte, @aws-sdk/client-s3, @lucide/svelte

---

### Task 1: Drizzle Schema for Products & Categories

**Files:**
- Create: `src/lib/server/db/schema/product.ts`
- Modify: `src/lib/server/db/schema.ts`

- [ ] **Step 1: Create the schema file**

Create `src/lib/server/db/schema/product.ts`:
```typescript
import { pgTable, text, integer, decimal, timestamp, boolean, index } from 'drizzle-orm/pg-core';

export const productCategories = pgTable('product_categories', {
	id: text('id').defaultRandom().primaryKey(),
	name: text('name').notNull().unique(),
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const products = pgTable('products', {
	id: text('id').defaultRandom().primaryKey(),
	code: text('code').notNull().unique(),
	name: text('name').notNull(),
	description: text('description'),
	price: decimal('price', { precision: 15, scale: 2 }).notNull(),
	unit: text('unit', { enum: ['KG', 'TON', 'SAK', 'PCS'] }).notNull(),
	minimumStock: integer('minimum_stock').default(0).notNull(),
	imageUrl: text('image_url'),
	isActive: boolean('is_active').default(true).notNull(),
	categoryId: text('category_id').notNull().references(() => productCategories.id),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	deletedAt: timestamp('deleted_at', { withTimezone: true })
}, (table) => [
	index('products_code_idx').on(table.code),
	index('products_name_idx').on(table.name),
	index('products_category_idx').on(table.categoryId),
	index('products_active_idx').on(table.isActive)
]);
```

- [ ] **Step 2: Export from main schema**

Edit `src/lib/server/db/schema.ts` to add the export:
```typescript
export * from './schema/product';
```

- [ ] **Step 3: Push schema to database**

```bash
cd "C:\Users\asus\my-svelte-app"
bun run db:push -- --force
```

Expected: Tables `products` and `product_categories` created.

---

### Task 2: Zod Validation Schemas

**Files:**
- Create: `src/lib/server/product/validation.ts`

- [ ] **Step 1: Create validation schemas**

Create `src/lib/server/product/validation.ts`:
```typescript
import { z } from 'zod';

export const createProductSchema = z.object({
	name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter').trim(),
	code: z.string().regex(/^[A-Z0-9\-]+$/, 'Kode hanya huruf besar, angka, dan tanda hubung').min(3).max(20).optional(),
	categoryId: z.string().min(1, 'Kategori wajib dipilih'),
	price: z.coerce.number().positive('Harga harus lebih dari 0').max(100_000_000, 'Harga terlalu besar'),
	unit: z.enum(['KG', 'TON', 'SAK', 'PCS'], { errorMap: () => ({ message: 'Satuan tidak valid' }) }),
	minimumStock: z.coerce.number().int().min(0, 'Stok minimum tidak boleh negatif').default(0),
	description: z.string().max(500).optional()
});

export const updateProductSchema = z.object({
	name: z.string().min(2).max(100).trim().optional(),
	price: z.coerce.number().positive().max(100_000_000).optional(),
	unit: z.enum(['KG', 'TON', 'SAK', 'PCS']).optional(),
	minimumStock: z.coerce.number().int().min(0).optional(),
	description: z.string().max(500).optional(),
	categoryId: z.string().min(1).optional()
});

export const productQuerySchema = z.object({
	search: z.string().optional(),
	categoryId: z.string().optional(),
	status: z.enum(['active', 'inactive', 'all']).default('active'),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(50).default(20),
	sort: z.enum(['code', 'name', 'price', 'createdAt']).default('name'),
	order: z.enum(['asc', 'desc']).default('asc')
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;

export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
```

---

### Task 3: S3 Storage Service

**Files:**
- Create: `src/lib/server/storage/s3.ts`
- Modify: `.env` — add S3 config

- [ ] **Step 1: Install @aws-sdk/client-s3**

```bash
cd "C:\Users\asus\my-svelte-app"
bun add @aws-sdk/client-s3
```

- [ ] **Step 2: Create S3 storage service**

Create `src/lib/server/storage/s3.ts`:
```typescript
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';
import { MAX_IMAGE_SIZE, ALLOWED_MIME_TYPES } from '../product/validation';

const s3 = new S3Client({
	endpoint: env.S3_ENDPOINT,
	region: env.S3_REGION || 'auto',
	credentials: {
		accessKeyId: env.S3_ACCESS_KEY,
		secretAccessKey: env.S3_SECRET_KEY
	},
	forcePathStyle: true
});

const bucket = env.S3_BUCKET;

export async function uploadImage(filename: string, buffer: Buffer, mimeType: string): Promise<string> {
	if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
		throw new Error('Format gambar harus JPG, PNG, atau WebP');
	}
	if (buffer.length > MAX_IMAGE_SIZE) {
		throw new Error('Ukuran gambar maksimal 2MB');
	}

	const key = `products/${filename}`;
	await s3.send(new PutObjectCommand({
		Bucket: bucket,
		Key: key,
		Body: buffer,
		ContentType: mimeType
	}));

	return `${env.S3_PUBLIC_URL}/${key}`;
}

export async function deleteImage(url: string): Promise<void> {
	const key = url.replace(`${env.S3_PUBLIC_URL}/`, '');
	await s3.send(new DeleteObjectCommand({
		Bucket: bucket,
		Key: key
	}));
}

export function generateImageFilename(prefix: string): string {
	const ext = 'webp';
	return `${prefix}-${Date.now()}.${ext}`;
}
```

- [ ] **Step 3: Add S3 env vars**

Edit `.env`:
```
S3_ENDPOINT="http://localhost:9000"
S3_REGION="auto"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="tapioleaf"
S3_PUBLIC_URL="http://localhost:9000/tapioleaf"
```

---

### Task 4: Product Service

**Files:**
- Create: `src/lib/server/product/service.ts`

- [ ] **Step 1: Create product service**

Create `src/lib/server/product/service.ts`:
```typescript
import { and, eq, ilike, or, sql, desc, asc } from 'drizzle-orm';
import { db } from '../db';
import { products, productCategories } from '../db/schema/product';
import type { CreateProductInput, UpdateProductInput, ProductQuery } from './validation';
import { uploadImage, deleteImage, generateImageFilename } from '../storage/s3';
import { createProductSchema, updateProductSchema, productQuerySchema } from './validation';

async function generateCode(): Promise<string> {
	const today = new Date();
	const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
	const prefix = `I-${dateStr}-`;

	const lastProduct = await db
		.select({ code: products.code })
		.from(products)
		.where(ilike(products.code, `${prefix}%`))
		.orderBy(desc(products.code))
		.limit(1);

	const lastNum = lastProduct.length > 0
		? parseInt(lastProduct[0].code.slice(prefix.length), 10)
		: 0;
	const nextNum = String(lastNum + 1).padStart(3, '0');
	return `${prefix}${nextNum}`;
}

export async function createProduct(input: CreateProductInput, imageBuffer?: Buffer, mimeType?: string) {
	const data = createProductSchema.parse(input);
	const code = data.code || await generateCode();

	const existing = await db.select({ id: products.id }).from(products).where(eq(products.code, code)).limit(1);
	if (existing.length > 0) {
		throw new Error('Kode produk sudah digunakan');
	}

	let imageUrl: string | undefined;
	if (imageBuffer && mimeType) {
		const filename = generateImageFilename(code);
		imageUrl = await uploadImage(filename, imageBuffer, mimeType);
	}

	const [product] = await db.insert(products).values({
		code,
		name: data.name,
		description: data.description,
		price: String(data.price),
		unit: data.unit,
		minimumStock: data.minimumStock,
		categoryId: data.categoryId,
		imageUrl
	}).returning();

	return product;
}

export async function updateProduct(id: string, input: UpdateProductInput, imageBuffer?: Buffer, mimeType?: string) {
	const data = updateProductSchema.parse(input);

	let imageUrl: string | undefined;
	if (imageBuffer && mimeType) {
		const existing = await db.select({ imageUrl: products.imageUrl }).from(products).where(eq(products.id, id)).limit(1);
		if (existing[0]?.imageUrl) {
			await deleteImage(existing[0].imageUrl).catch(() => {});
		}
		const filename = generateImageFilename(id);
		imageUrl = await uploadImage(filename, imageBuffer, mimeType);
	}

	const [product] = await db.update(products)
		.set({
			...data,
			...(imageUrl ? { imageUrl } : {}),
			updatedAt: new Date()
		})
		.where(eq(products.id, id))
		.returning();

	return product;
}

export async function toggleProductStatus(id: string) {
	const [existing] = await db.select({ isActive: products.isActive }).from(products).where(eq(products.id, id)).limit(1);
	if (!existing) throw new Error('Produk tidak ditemukan');

	const [product] = await db.update(products)
		.set({ isActive: !existing.isActive, updatedAt: new Date() })
		.where(eq(products.id, id))
		.returning();

	return product;
}

export async function listProducts(query: ProductQuery) {
	const q = productQuerySchema.parse(query);
	const conditions = [eq(products.deletedAt, null as unknown as Date)];

	if (q.search) {
		conditions.push(or(
			ilike(products.name, `%${q.search}%`),
			ilike(products.code, `%${q.search}%`)
		));
	}
	if (q.categoryId) {
		conditions.push(eq(products.categoryId, q.categoryId));
	}
	if (q.status === 'active') {
		conditions.push(eq(products.isActive, true));
	} else if (q.status === 'inactive') {
		conditions.push(eq(products.isActive, false));
	}

	const where = and(...conditions);
	const offset = (q.page - 1) * q.limit;
	const orderFn = q.order === 'desc' ? desc : asc;

	const items = await db.select()
		.from(products)
		.where(where)
		.orderBy(orderFn(products[q.sort]))
		.limit(q.limit)
		.offset(offset);

	const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(products).where(where);
	const total = Number(totalResult.count);

	return {
		items,
		pagination: {
			total,
			page: q.page,
			limit: q.limit,
			totalPages: Math.ceil(total / q.limit)
		}
	};
}

export async function getProduct(id: string) {
	const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
	if (!product) throw new Error('Produk tidak ditemukan');
	return product;
}

export async function getCategories() {
	return db.select().from(productCategories).where(eq(productCategories.isActive, true)).orderBy(asc(productCategories.name));
}

export async function createCategory(name: string) {
	const existing = await db.select({ id: productCategories.id }).from(productCategories).where(eq(productCategories.name, name)).limit(1);
	if (existing.length > 0) throw new Error('Kategori sudah ada');

	const [category] = await db.insert(productCategories).values({ name }).returning();
	return category;
}

export async function deleteCategory(id: string) {
	const productCount = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.categoryId, id));
	if (Number(productCount[0].count) > 0) {
		throw new Error('Kategori tidak bisa dihapus karena masih memiliki produk');
	}
	await db.delete(productCategories).where(eq(productCategories.id, id));
}
```

---

### Task 5: Product List Server Page

**Files:**
- Create: `src/routes/(app)/produk/+page.server.ts`

- [ ] **Step 1: Create the server page with load + actions**

Create `src/routes/(app)/produk/+page.server.ts`:
```typescript
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as productService from '$lib/server/product/service';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		throw redirect(303, '/login');
	}

	const query = Object.fromEntries(event.url.searchParams);
	const result = await productService.listProducts(query);
	const categories = await productService.getCategories();

	return {
		products: result.items,
		pagination: result.pagination,
		categories,
		query
	};
};

export const actions: Actions = {
	create: async (event) => {
		const formData = await event.request.formData();
		const imageFile = formData.get('image') as File | null;

		const input = {
			name: formData.get('name')?.toString() ?? '',
			code: formData.get('code')?.toString() || undefined,
			categoryId: formData.get('categoryId')?.toString() ?? '',
			price: formData.get('price')?.toString() ?? '0',
			unit: formData.get('unit')?.toString() ?? 'KG',
			minimumStock: formData.get('minimumStock')?.toString() ?? '0',
			description: formData.get('description')?.toString() || undefined
		};

		try {
			let imageBuffer: Buffer | undefined;
			let mimeType: string | undefined;
			if (imageFile && imageFile.size > 0) {
				imageBuffer = Buffer.from(await imageFile.arrayBuffer());
				mimeType = imageFile.type;
			}
			await productService.createProduct(input, imageBuffer, mimeType);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal menyimpan produk' });
		}
		return { success: true, message: 'Produk berhasil ditambahkan' };
	},

	update: async (event) => {
		const formData = await event.request.formData();
		const id = formData.get('id')?.toString() ?? '';
		const imageFile = formData.get('image') as File | null;

		const input: Record<string, unknown> = {};
		for (const field of ['name', 'price', 'unit', 'minimumStock', 'description', 'categoryId']) {
			const val = formData.get(field)?.toString();
			if (val) input[field] = val;
		}

		try {
			let imageBuffer: Buffer | undefined;
			let mimeType: string | undefined;
			if (imageFile && imageFile.size > 0) {
				imageBuffer = Buffer.from(await imageFile.arrayBuffer());
				mimeType = imageFile.type;
			}
			await productService.updateProduct(id, input, imageBuffer, mimeType);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal memperbarui produk' });
		}
		return { success: true, message: 'Produk berhasil diperbarui' };
	},

	toggleStatus: async (event) => {
		const formData = await event.request.formData();
		const id = formData.get('id')?.toString() ?? '';
		try {
			await productService.toggleProductStatus(id);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal mengubah status' });
		}
		return { success: true };
	},

	createCategory: async (event) => {
		const formData = await event.request.formData();
		const name = formData.get('name')?.toString() ?? '';
		try {
			await productService.createCategory(name);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal membuat kategori' });
		}
		return { success: true };
	},

	deleteCategory: async (event) => {
		const formData = await event.request.formData();
		const id = formData.get('id')?.toString() ?? '';
		try {
			await productService.deleteCategory(id);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal menghapus kategori' });
		}
		return { success: true };
	}
};
```

---

### Task 6: Product List UI

**Files:**
- Create: `src/routes/(app)/produk/+page.svelte`
- Create: `src/lib/components/produk/ProductTable.svelte`

- [ ] **Step 1: Create product directory**

```bash
New-Item -ItemType Directory -Path "C:\Users\asus\my-svelte-app\src\lib\components\produk" -Force
```

- [ ] **Step 2: Create ProductTable component**

Create `src/lib/components/produk/ProductTable.svelte`:
```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';

	import { Pencil, ToggleLeft, ToggleRight, Trash2 } from 'lucide-svelte';

	let { products = [], onEdit }: { products: Array<{ id: string; code: string; name: string; price: string; unit: string; imageUrl: string | null; isActive: boolean; minimumStock: number; categoryId: string; description: string | null }>; onEdit: (product: any) => void } = $props();
</script>

<div class="overflow-x-auto rounded-lg border">
	<table class="w-full text-sm">
		<thead class="bg-muted/50">
			<tr>
				<th class="px-4 py-3 text-left font-medium text-muted-foreground">Kode</th>
				<th class="px-4 py-3 text-left font-medium text-muted-foreground">Nama</th>
				<th class="px-4 py-3 text-right font-medium text-muted-foreground">Harga</th>
				<th class="px-4 py-3 text-right font-medium text-muted-foreground">Stok</th>
				<th class="px-4 py-3 text-center font-medium text-muted-foreground">Gambar</th>
				<th class="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
			</tr>
		</thead>
		<tbody>
			{#each products as product (product.id)}
				<tr class="border-t transition-colors hover:bg-muted/30">
					<td class="px-4 py-3 font-mono text-xs">{product.code}</td>
					<td class="px-4 py-3">
						<div class="font-medium">{product.name}</div>
						<span class="text-xs text-muted-foreground">{product.description || ''}</span>
					</td>
					<td class="px-4 py-3 text-right">Rp {Number(product.price).toLocaleString('id-ID')}</td>
					<td class="px-4 py-3 text-right">{product.minimumStock} {product.unit}</td>
					<td class="px-4 py-3 text-center">
						{#if product.imageUrl}
							<img src={product.imageUrl} alt={product.name} class="mx-auto h-10 w-10 rounded object-cover" />
						{:else}
							<span class="text-xs text-muted-foreground">—</span>
						{/if}
					</td>
					<td class="px-4 py-3">
						<div class="flex items-center justify-center gap-1">
							<Button variant="ghost" size="sm" onclick={() => onEdit(product)}>
								<Pencil size={14} />
							</Button>
							<form method="post" action="?/toggleStatus">
								<input type="hidden" name="id" value={product.id} />
								<Button variant="ghost" size="sm" type="submit">
									{#if product.isActive}
										<ToggleRight size={14} class="text-green-600" />
									{:else}
										<ToggleLeft size={14} class="text-muted-foreground" />
									{/if}
								</Button>
							</form>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
	{#if products.length === 0}
		<div class="py-12 text-center text-sm text-muted-foreground">Belum ada produk</div>
	{/if}
</div>
```

- [ ] **Step 3: Create the main produk page**

Create `src/routes/(app)/produk/+page.svelte`:
```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import ProductTable from '$lib/components/produk/ProductTable.svelte';
	import { Plus, Search } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';

	let { data, form } = $props();

	let searchQuery = $state($page.url.searchParams.get('search') || '');
	let showModal = $state(false);
	let editingProduct = $state<any>(null);
	let showCategoryModal = $state(false);

	function handleSearch() {
		const url = new URL($page.url);
		if (searchQuery) url.searchParams.set('search', searchQuery);
		else url.searchParams.delete('search');
		url.searchParams.set('page', '1');
		goto(url.toString(), { replaceState: true });
	}

	function openCreate() {
		editingProduct = null;
		showModal = true;
	}

	function openEdit(product: any) {
		editingProduct = product;
		showModal = true;
	}

	import { goto } from '$app/navigation';

	onMount(() => {
		if (form?.message) {
			toast.success(form.message);
		}
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Manajemen Produk</h1>
		<div class="flex gap-2">
			<Button variant="outline" onclick={() => showCategoryModal = true}>Kelola Kategori</Button>
			<Button onclick={openCreate}><Plus size={16} class="mr-1" /> Tambah Produk</Button>
		</div>
	</div>

	<div class="flex gap-4">
		<div class="relative flex-1">
			<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
			<input
				type="text"
				placeholder="Cari nama atau kode produk..."
				class="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
				bind:value={searchQuery}
				onkeydown={(e) => e.key === 'Enter' && handleSearch()}
			/>
		</div>
		<select
			class="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
			onchange={(e) => {
				const url = new URL($page.url);
				const val = (e.target as HTMLSelectElement).value;
				if (val) url.searchParams.set('status', val);
				else url.searchParams.delete('status');
				goto(url.toString(), { replaceState: true });
			}}
		>
			<option value="active">Aktif</option>
			<option value="all">Semua</option>
			<option value="inactive">Nonaktif</option>
		</select>
	</div>

	<ProductTable products={data.products} onEdit={openEdit} />

	{#if data.pagination.totalPages > 1}
		<div class="flex items-center justify-center gap-2">
			{#each Array(data.pagination.totalPages) as _, i}
				<a
					href="?page={i + 1}"
					class="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm"
					class:bg-primary={data.pagination.page === i + 1}
					class:text-primary-foreground={data.pagination.page === i + 1}
					class:hover:bg-muted={data.pagination.page !== i + 1}
				>{i + 1}</a>
			{/each}
		</div>
	{/if}
</div>
```

---

### Task 7: Product Form Modal & Category Manager

**Files:**
- Create: `src/lib/components/produk/ProductFormModal.svelte`
- Create: `src/lib/components/produk/CategoryManager.svelte`
- Install: shadcn-svelte dialog component

- [ ] **Step 1: Install shadcn dialog component**

```bash
cd "C:\Users\asus\my-svelte-app"
bunx shadcn-svelte@latest add dialog badge --yes
```

- [ ] **Step 2: Create ProductFormModal**

Create `src/lib/components/produk/ProductFormModal.svelte`:
```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '$lib/components/ui/dialog';
	import { Loader2 } from 'lucide-svelte';

	let {
		open,
		product,
		categories,
		onClose
	}: {
		open: boolean;
		product: any | null;
		categories: Array<{ id: string; name: string }>;
		onClose: () => void;
	} = $props();

	let submitting = $state(false);
	let name = $state(product?.name || '');
	let code = $state(product?.code || '');
	let price = $state(product?.price?.toString() || '');
	let unit = $state(product?.unit || 'KG');
	let categoryId = $state(product?.categoryId || '');
	let minimumStock = $state(product?.minimumStock?.toString() || '0');
	let description = $state(product?.description || '');
	let imagePreview = $state(product?.imageUrl || '');
	let imageFile = $state<File | null>(null);

	function handleImageSelect(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		if (file.size > 2 * 1024 * 1024) {
			alert('Ukuran gambar maksimal 2MB');
			return;
		}
		imageFile = file;
		const reader = new FileReader();
		reader.onload = () => imagePreview = reader.result as string;
		reader.readAsDataURL(file);
	}

	function handleClose() {
		submitting = false;
		onClose();
	}
</script>

<Dialog {open} onOpenChange={(o) => { if (!o) handleClose(); }}>
	<DialogContent class="sm:max-w-lg">
		<DialogHeader>
			<DialogTitle>{product ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
			<DialogDescription>Isi data produk {product ? 'yang akan diperbarui' : 'baru'}</DialogDescription>
		</DialogHeader>
		<form
			method="post"
			action={product ? '?/update' : '?/create'}
			use:enhance={() => {
				submitting = true;
				return async ({ result }) => {
					submitting = false;
					if (result.type === 'success') handleClose();
				};
			}}
		>
			<input type="hidden" name="id" value={product?.id || ''} />
			<div class="grid gap-4 py-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="grid gap-2">
						<Label for="name">Nama Produk *</Label>
						<Input id="name" name="name" required bind:value={name} />
					</div>
					<div class="grid gap-2">
						<Label for="code">Kode Produk</Label>
						<Input id="code" name="code" placeholder="Auto-generate" bind:value={code} disabled={!!product} />
					</div>
				</div>
				<div class="grid grid-cols-3 gap-4">
					<div class="grid gap-2">
						<Label for="price">Harga *</Label>
						<Input id="price" name="price" type="number" required bind:value={price} />
					</div>
					<div class="grid gap-2">
						<Label for="unit">Satuan *</Label>
						<select id="unit" name="unit" class="rounded-lg border bg-background px-3 py-2 text-sm" bind:value={unit}>
							<option value="KG">Kg</option>
							<option value="TON">Ton</option>
							<option value="SAK">Sak</option>
							<option value="PCS">Pcs</option>
						</select>
					</div>
					<div class="grid gap-2">
						<Label for="categoryId">Kategori *</Label>
						<select id="categoryId" name="categoryId" class="rounded-lg border bg-background px-3 py-2 text-sm" bind:value={categoryId}>
							<option value="">Pilih kategori</option>
							{#each categories as cat}
								<option value={cat.id}>{cat.name}</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="grid gap-2">
						<Label for="minimumStock">Stok Minimum</Label>
						<Input id="minimumStock" name="minimumStock" type="number" bind:value={minimumStock} />
					</div>
					<div class="grid gap-2">
						<Label for="image">Gambar (opsional)</Label>
						<Input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" onchange={handleImageSelect} />
					</div>
				</div>
				{#if imagePreview}
					<div class="flex justify-center">
						<img src={imagePreview} alt="Preview" class="h-24 w-24 rounded-lg object-cover" />
					</div>
				{/if}
				<div class="grid gap-2">
					<Label for="description">Deskripsi</Label>
					<textarea id="description" name="description" rows="2" class="rounded-lg border bg-background px-3 py-2 text-sm" bind:value={description}></textarea>
				</div>
			</div>
			<div class="flex justify-end gap-3">
				<Button type="button" variant="outline" onclick={handleClose}>Batal</Button>
				<Button type="submit" disabled={submitting}>
					{#if submitting}<Loader2 size={14} class="mr-1 animate-spin" />{/if}
					{product ? 'Perbarui' : 'Simpan'}
				</Button>
			</div>
		</form>
	</DialogContent>
</Dialog>
```

- [ ] **Step 3: Create CategoryManager**

Create `src/lib/components/produk/CategoryManager.svelte`:
```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '$lib/components/ui/dialog';
	import { Plus, Trash2, Loader2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let {
		open,
		categories,
		onClose
	}: {
		open: boolean;
		categories: Array<{ id: string; name: string }>;
		onClose: () => void;
	} = $props();

	let newCategoryName = $state('');
	let submitting = $state(false);
</script>

<Dialog {open} onOpenChange={(o) => { if (!o) onClose(); }}>
	<DialogContent class="sm:max-w-md">
		<DialogHeader>
			<DialogTitle>Kelola Kategori</DialogTitle>
			<DialogDescription>Tambah atau hapus kategori produk</DialogDescription>
		</DialogHeader>
		<div class="space-y-4">
			<form method="post" action="?/createCategory" use:enhance={() => {
				submitting = true;
				return async ({ result, update }) => {
					submitting = false;
					update();
					if (result.type === 'failure') {
						toast.error(result.data?.message || 'Gagal');
					} else {
						newCategoryName = '';
						toast.success('Kategori ditambahkan');
					}
				};
			}} class="flex gap-2">
				<Input name="name" placeholder="Nama kategori baru" bind:value={newCategoryName} required disabled={submitting} />
				<Button type="submit" size="sm" disabled={submitting}>
					{#if submitting}<Loader2 size={14} class="animate-spin" />{:else}<Plus size={14} />{/if}
				</Button>
			</form>
			<div class="space-y-1">
				{#each categories as cat}
					<div class="flex items-center justify-between rounded-lg border px-3 py-2">
						<span class="text-sm">{cat.name}</span>
						<form method="post" action="?/deleteCategory">
							<input type="hidden" name="id" value={cat.id} />
							<Button variant="ghost" size="sm" type="submit">
								<Trash2 size={14} class="text-destructive" />
							</Button>
						</form>
					</div>
				{/each}
			</div>
		</div>
	</DialogContent>
</Dialog>
```

- [ ] **Step 4: Wire modals into produk page**

Update `src/routes/(app)/produk/+page.svelte` — add the modal imports and rendering after the table:
```svelte
<!-- At bottom of the produk page, after pagination -->
<ProductFormModal
	open={showModal}
	product={editingProduct}
	categories={data.categories}
	onClose={() => { showModal = false; editingProduct = null; }}
/>
<CategoryManager
	open={showCategoryModal}
	categories={data.categories}
	onClose={() => showCategoryModal = false}
/>
```

---

### Task 8: Push Schema & Verify

**Files:**
- Run: `npm run db:push`

- [ ] **Step 1: Push database schema**

```bash
cd "C:\Users\asus\my-svelte-app"
bun run db:push -- --force
```

Expected: Tables `products` and `product_categories` created.

- [ ] **Step 2: Create test categories via curl or browser**

Open the browser at `/produk`, click "Kelola Kategori", add "Tepung Tapioka", "Tapioka Premium".

- [ ] **Step 3: Create a test product via the UI**

Open browser, click "+ Tambah Produk", fill in the form, submit.

- [ ] **Step 4: Run type check**

```bash
cd "C:\Users\asus\my-svelte-app"
bun run check
```

Expected: No type errors.

---

### Task 9: Run Tests

**Files:**
- Create: `src/lib/server/product/service.spec.ts`

- [ ] **Step 1: Write service tests**

Create `src/lib/server/product/service.spec.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { createProductSchema, updateProductSchema, productQuerySchema } from './validation';

describe('Product Validation', () => {
	it('validates create product input', () => {
		const result = createProductSchema.safeParse({
			name: 'Test Product',
			categoryId: 'abc123',
			price: 50000,
			unit: 'KG'
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid price', () => {
		const result = createProductSchema.safeParse({
			name: 'Test',
			categoryId: 'abc',
			price: -1,
			unit: 'KG'
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid unit', () => {
		const result = createProductSchema.safeParse({
			name: 'Test',
			categoryId: 'abc',
			price: 1000,
			unit: 'INVALID'
		});
		expect(result.success).toBe(false);
	});

	it('parses product query with defaults', () => {
		const result = productQuerySchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.page).toBe(1);
			expect(result.data.limit).toBe(20);
			expect(result.data.status).toBe('active');
		}
	});
});
```

- [ ] **Step 2: Run unit tests**

```bash
cd "C:\Users\asus\my-svelte-app"
bun run test:unit -- --run
```

Expected: All tests pass.
