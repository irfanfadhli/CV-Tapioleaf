import { and, eq, gte, lte, sql, desc, isNull } from 'drizzle-orm';
import { db } from '../db';
import { orders, orderItems } from '../db/schema/order';
import { products, productCategories } from '../db/schema/product';
import { productionEntries } from '../db/schema/production';
import { stockMovements } from '../db/schema/stock';

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
