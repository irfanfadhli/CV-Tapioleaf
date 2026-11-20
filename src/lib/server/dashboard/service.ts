import { and, eq, gte, lte, sql, desc, isNull } from 'drizzle-orm';
import { db } from '../db';
import { user } from '../db/auth.schema';
import { orders, orderItems } from '../db/schema/order';
import { products, productCategories } from '../db/schema/product';
import { productionEntries } from '../db/schema/production';
import { stockMovements } from '../db/schema/stock';
import { sales } from '../db/schema/sales';
import { getCassavaTargetKg } from '../production/service';

type Period = 'today' | 'week' | 'month';

function getPeriodRange(period: Period): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
	const now = new Date();
	const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

	switch (period) {
		case 'today': {
			const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const prevStart = new Date(start.getTime() - 86400000);
			const prevEndClamped = new Date(prevStart.getTime() + 86399999);
			return { start, end, prevStart, prevEnd: prevEndClamped };
		}
		case 'week': {
			const dayOfWeek = now.getDay();
			const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
			const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
			const prevStart = new Date(start.getTime() - 7 * 86400000);
			const prevEndClamped = new Date(start.getTime() - 1);
			return { start, end, prevStart, prevEnd: prevEndClamped };
		}
		case 'month': {
			const start = new Date(now.getFullYear(), now.getMonth(), 1);
			const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
			const prevEndClamped = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
			return { start, end, prevStart, prevEnd: prevEndClamped };
		}
	}
}

export type DashboardData = {
	sales: { total: number; count: number; change: number | null };
	production: { totalKg: number; targetKg: number; percentage: number; count: number };
	stock: { totalSKU: number; criticalCount: number };
	revenue: { total: number; change: number | null; margin: number | null };
	totalUsers: number;
	salesTrend: Array<{ date: string; total: number; count: number }>;
	productionTrend: Array<{ date: string; totalKg: number }>;
	recentTransactions: Array<{
		id: string; customerName: string | null; totalAmount: string;
		status: string; createdAt: Date | null; source: 'order' | 'sale';
	}>;
	stockAlerts: Array<{
		id: string; name: string; currentStock: number; minimumStock: number; code: string;
	}>;
	categoryDistribution: Array<{ category: string; total: number }>;
	marginPerProduct: Array<{ name: string; revenue: number; cost: number; margin: number | null }>;
	details: {
		users: Array<{ id: string; name: string; email: string; role: string; createdAt: Date }>;
		sales: Array<{ id: string; invoice: string; customerName: string; type: 'Online' | 'Offline'; amount: number; date: Date | null; status: string }>;
		productions: Array<{ id: string; productName: string; quantityKg: number; cassavaUsedKg: number; yieldPct: number; date: Date; status: string }>;
		stocks: Array<{ id: string; name: string; code: string; unit: string; currentStock: number; minimumStock: number; status: 'Normal' | 'Kritis' }>;
		profit: {
			totalRevenue: number;
			totalCost: number;
			grossProfit: number;
			marginPct: number | null;
			items: Array<{ name: string; soldQty: number; unit: string; revenue: number; cost: number; profit: number; marginPct: number | null }>;
		};
	};
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
		getProductionTrend(),
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
	const marginPerProductData = await getMarginPerProduct(range.start, range.end);

	const [userResult] = await Promise.allSettled([getTotalUsers()]);
	const totalUsers = userResult.status === 'fulfilled' ? userResult.value : 0;

	const salesChange = prevSales.total > 0 ? ((sales.total - prevSales.total) / prevSales.total) * 100 : null;
	const targetKg = await getCassavaTargetKg();
	const percentage = production.totalKg > 0 ? Math.round((production.totalKg / targetKg) * 100) : 0;

	const marginPct = await getMarginSummary(range.start, range.end);
	const profitTotal = marginPct !== null ? Math.round(sales.total * marginPct / 100) : sales.total;
	const prevProfitTotal = marginPct !== null && prevSales.total > 0 ? Math.round(prevSales.total * marginPct / 100) : prevSales.total;
	const profitChange = prevProfitTotal > 0 ? ((profitTotal - prevProfitTotal) / prevProfitTotal) * 100 : null;

	const details = await getDashboardDetails(range.start, range.end);

	return {
		sales: { total: sales.total, count: sales.count, change: salesChange },
		production: { totalKg: production.totalKg, targetKg, percentage, count: production.count },
		stock: { totalSKU: stock.totalSKU, criticalCount: criticalProducts.length },
		revenue: { total: profitTotal, change: profitChange, margin: marginPct },
		totalUsers,
		salesTrend,
		productionTrend,
		recentTransactions: transactions,
		stockAlerts: criticalProducts,
		categoryDistribution: categoryDist,
		marginPerProduct: marginPerProductData,
		details,
	};
}

export async function getDashboardDataWithMargins(periodStr: string): Promise<DashboardData> {
	return await getDashboardData(periodStr);
}

async function getSalesSummary(start: Date, end: Date) {
	// Online orders (PAID)
	const ordersResult = await db.select({
		total: sql<string>`COALESCE(SUM(total_amount::numeric), 0)`,
		count: sql<number>`COUNT(*)`,
	}).from(orders)
		.where(and(eq(orders.status, 'PAID'), gte(orders.createdAt, start), lte(orders.createdAt, end)))
		.limit(1);

	// Offline sales (confirmed)
	const salesResult = await db.select({
		total: sql<string>`COALESCE(SUM(total_payment::numeric), 0)`,
		count: sql<number>`COUNT(*)`,
	}).from(sales)
		.where(and(eq(sales.status, 'confirmed'), gte(sales.sale_date, start), lte(sales.sale_date, end)))
		.limit(1);

	return {
		total: Number(ordersResult[0]?.total || 0) + Number(salesResult[0]?.total || 0),
		count: Number(ordersResult[0]?.count || 0) + Number(salesResult[0]?.count || 0)
	};
}

async function getProductionSummary(start: Date, end: Date) {
	const result = await db.select({
		totalKg: sql<string>`COALESCE(SUM(cassava_used_kg), 0)`,
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
	// Online orders trend
	const ordersTrend = await db.select({
		date: sql<string>`DATE(${orders.createdAt})`,
		total: sql<string>`COALESCE(SUM(total_amount::numeric), 0)`,
		count: sql<number>`COUNT(*)`,
	})
		.from(orders)
		.where(and(eq(orders.status, 'PAID'), gte(orders.createdAt, sql`NOW() - INTERVAL '7 days'`)))
		.groupBy(sql`DATE(${orders.createdAt})`)
		.orderBy(sql`DATE(${orders.createdAt})`);

	// Offline sales trend
	const salesTrend = await db.select({
		date: sql<string>`DATE(${sales.sale_date})`,
		total: sql<string>`COALESCE(SUM(total_payment::numeric), 0)`,
		count: sql<number>`COUNT(*)`,
	})
		.from(sales)
		.where(and(eq(sales.status, 'confirmed'), gte(sales.sale_date, sql`NOW() - INTERVAL '7 days'`)))
		.groupBy(sql`DATE(${sales.sale_date})`)
		.orderBy(sql`DATE(${sales.sale_date})`);

	// Merge both trends by date
	const merged = new Map<string, { total: number; count: number }>();
	for (const r of ordersTrend) {
		const key = r.date;
		const existing = merged.get(key) || { total: 0, count: 0 };
		existing.total += Number(r.total);
		existing.count += Number(r.count);
		merged.set(key, existing);
	}
	for (const r of salesTrend) {
		const key = r.date;
		const existing = merged.get(key) || { total: 0, count: 0 };
		existing.total += Number(r.total);
		existing.count += Number(r.count);
		merged.set(key, existing);
	}

	return Array.from(merged.entries())
		.map(([date, v]) => ({ date, total: v.total, count: v.count }))
		.sort((a, b) => a.date.localeCompare(b.date));
}

async function getProductionTrend() {
	const result = await db.select({
		date: sql<string>`DATE(${productionEntries.productionDate})`,
		totalKg: sql<string>`COALESCE(SUM(cassava_used_kg), 0)`,
	})
		.from(productionEntries)
		.where(and(eq(productionEntries.status, 'CONFIRMED'), gte(productionEntries.productionDate, sql`NOW() - INTERVAL '7 days'`)))
		.groupBy(sql`DATE(${productionEntries.productionDate})`)
		.orderBy(sql`DATE(${productionEntries.productionDate})`);

	return result.map(r => ({ date: r.date, totalKg: Number(r.totalKg) }));
}

async function getRecentTransactions() {
	// Online orders
	const orderResults = await db.select({
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

	// Offline sales
	const saleResults = await db.select({
		id: sales.id,
		buyerName: sales.buyer_name,
		weigherName: sales.weigher_name,
		totalPayment: sales.total_payment,
		status: sales.status,
		createdAt: sales.created_at,
	})
		.from(sales)
		.where(sql`${sales.status} IN ('confirmed', 'draft')`)
		.orderBy(desc(sales.created_at))
		.limit(5);

	// Combine, sort by date, take top 5
	const combined = [
		...orderResults.map(r => ({
			id: r.id,
			customerName: r.customerName,
			totalAmount: r.totalAmount,
			status: r.status,
			createdAt: r.createdAt,
			source: 'order' as const,
		})),
		...saleResults.map(r => ({
			id: r.id,
			customerName: r.weigherName || r.buyerName || 'Penimbangan Tepung',
			totalAmount: r.totalPayment || '0',
			status: r.status === 'confirmed' ? 'PAID' : 'PENDING',
			createdAt: r.createdAt,
			source: 'sale' as const,
		})),
	];

	combined.sort((a, b) => {
		const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
		const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
		return dateB - dateA;
	});

	return combined.slice(0, 8);
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
		totalRevenue: sql<string>`COALESCE(SUM(${orderItems.quantity}::numeric * ${orderItems.unitPrice}::numeric), 0)`,
		totalCost: sql<string>`COALESCE(SUM(${orderItems.quantity}::numeric * ${products.costPrice}::numeric), 0)`,
	})
		.from(orderItems)
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

async function getMarginPerProduct(start: Date, end: Date) {
	const result = await db.select({
		name: products.name,
		revenue: sql<string>`COALESCE(SUM(${orderItems.quantity}::numeric * ${orderItems.unitPrice}::numeric), 0)`,
		cost: sql<string>`COALESCE(SUM(${orderItems.quantity}::numeric * ${products.costPrice}::numeric), 0)`,
	})
		.from(orderItems)
		.innerJoin(orders, eq(orders.id, orderItems.orderId))
		.innerJoin(products, eq(products.id, orderItems.productId))
		.where(and(eq(orders.status, 'PAID'), gte(orders.createdAt, start), lte(orders.createdAt, end), sql`${products.costPrice} IS NOT NULL`))
		.groupBy(products.name);

	const mapped = result.map(r => {
		const rev = Number(r.revenue);
		const cst = Number(r.cost);
		return {
			name: r.name,
			revenue: rev,
			cost: cst,
			margin: rev > 0 ? Math.round(((rev - cst) / rev) * 100 * 10) / 10 : null,
		};
	});

	mapped.sort((a, b) => (b.margin ?? -999) - (a.margin ?? -999));
	return mapped;
}

async function getTotalUsers(): Promise<number> {
	const result = await db.select({ count: sql<number>`COUNT(*)` })
		.from(user)
		.limit(1);
	return Number(result[0]?.count || 0);
}

async function getDashboardDetails(start: Date, end: Date) {
	// 1. Registered Users
	const usersData = await db.select({
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
		createdAt: user.createdAt,
	})
		.from(user)
		.orderBy(desc(user.createdAt))
		.limit(100);

	// 2. Sales in Period (Online PAID + Offline Confirmed)
	const onlineOrders = await db.select({
		id: orders.id,
		customerName: orders.customerName,
		totalAmount: orders.totalAmount,
		createdAt: orders.createdAt,
		status: orders.status,
	})
		.from(orders)
		.where(and(eq(orders.status, 'PAID'), gte(orders.createdAt, start), lte(orders.createdAt, end)))
		.orderBy(desc(orders.createdAt))
		.limit(100);

	const offlineSales = await db.select({
		id: sales.id,
		saleNumber: sales.sale_number,
		buyerName: sales.buyer_name,
		totalPayment: sales.total_payment,
		saleDate: sales.sale_date,
		status: sales.status,
	})
		.from(sales)
		.where(and(eq(sales.status, 'confirmed'), gte(sales.sale_date, start), lte(sales.sale_date, end)))
		.orderBy(desc(sales.sale_date))
		.limit(100);

	const salesList = [
		...onlineOrders.map(o => ({
			id: o.id,
			invoice: `#${o.id.slice(0, 8)}`,
			customerName: o.customerName || 'Pelanggan Online',
			type: 'Online' as const,
			amount: Number(o.totalAmount),
			date: o.createdAt,
			status: 'Lunas',
		})),
		...offlineSales.map(s => ({
			id: s.id,
			invoice: s.saleNumber || `#${s.id.slice(0, 8)}`,
			customerName: s.buyerName || 'Pembeli Offline',
			type: 'Offline' as const,
			amount: Number(s.totalPayment || 0),
			date: s.saleDate,
			status: 'Terkonfirmasi',
		})),
	];
	salesList.sort((a, b) => {
		const timeA = a.date ? new Date(a.date).getTime() : 0;
		const timeB = b.date ? new Date(b.date).getTime() : 0;
		return timeB - timeA;
	});

	// 3. Productions in Period
	const productionsData = await db.select({
		id: productionEntries.id,
		productName: products.name,
		quantityKg: productionEntries.quantityKg,
		cassavaUsedKg: productionEntries.cassavaUsedKg,
		yieldPercentage: productionEntries.yieldPercentage,
		productionDate: productionEntries.productionDate,
		status: productionEntries.status,
	})
		.from(productionEntries)
		.innerJoin(products, eq(products.id, productionEntries.productId))
		.where(and(eq(productionEntries.status, 'CONFIRMED'), gte(productionEntries.productionDate, start), lte(productionEntries.productionDate, end)))
		.orderBy(desc(productionEntries.productionDate))
		.limit(100);

	const productionsList = productionsData.map(p => ({
		id: p.id,
		productName: p.productName,
		quantityKg: Number(p.quantityKg || 0),
		cassavaUsedKg: Number(p.cassavaUsedKg || 0),
		yieldPct: Number(p.yieldPercentage || 0),
		date: p.productionDate,
		status: p.status,
	}));

	// 4. Current Stock of all active products
	const allProductsStock = await db.select({
		id: products.id,
		name: products.name,
		code: products.code,
		unit: products.unit,
		minimumStock: products.minimumStock,
		currentStock: sql<string>`COALESCE(SUM(${stockMovements.quantityChange}), 0)`,
	})
		.from(products)
		.leftJoin(stockMovements, eq(stockMovements.productId, products.id))
		.where(and(isNull(products.deletedAt), eq(products.isActive, true)))
		.groupBy(products.id)
		.orderBy(products.name);

	const stocksList = allProductsStock.map(p => {
		const cur = Number(p.currentStock);
		return {
			id: p.id,
			name: p.name,
			code: p.code,
			unit: p.unit,
			currentStock: cur,
			minimumStock: p.minimumStock,
			status: (cur < p.minimumStock ? 'Kritis' : 'Normal') as 'Normal' | 'Kritis',
		};
	});

	// 5. Detailed Profit Analysis
	const marginItems = await db.select({
		name: products.name,
		unit: products.unit,
		soldQty: sql<string>`COALESCE(SUM(${orderItems.quantity}::numeric), 0)`,
		revenue: sql<string>`COALESCE(SUM(${orderItems.quantity}::numeric * ${orderItems.unitPrice}::numeric), 0)`,
		cost: sql<string>`COALESCE(SUM(${orderItems.quantity}::numeric * ${products.costPrice}::numeric), 0)`,
	})
		.from(orderItems)
		.innerJoin(orders, eq(orders.id, orderItems.orderId))
		.innerJoin(products, eq(products.id, orderItems.productId))
		.where(and(eq(orders.status, 'PAID'), gte(orders.createdAt, start), lte(orders.createdAt, end), sql`${products.costPrice} IS NOT NULL`))
		.groupBy(products.name, products.unit);

	let totalRevenue = 0;
	let totalCost = 0;
	const profitItems = marginItems.map(m => {
		const rev = Number(m.revenue);
		const cst = Number(m.cost);
		const prof = rev - cst;
		totalRevenue += rev;
		totalCost += cst;
		return {
			name: m.name,
			soldQty: Number(m.soldQty),
			unit: m.unit,
			revenue: rev,
			cost: cst,
			profit: prof,
			marginPct: rev > 0 ? Math.round((prof / rev) * 100 * 10) / 10 : null,
		};
	});

	const grossProfit = totalRevenue - totalCost;
	const overallMarginPct = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100 * 10) / 10 : null;

	return {
		users: usersData,
		sales: salesList,
		productions: productionsList,
		stocks: stocksList,
		profit: {
			totalRevenue,
			totalCost,
			grossProfit,
			marginPct: overallMarginPct,
			items: profitItems,
		},
	};
}
