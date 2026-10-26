import { and, eq, gte, lte, sql, isNull, desc } from 'drizzle-orm';
import { db } from '../db';
import { products } from '../db/schema/product';
import { stockMovements } from '../db/schema/stock';
import { productionEntries } from '../db/schema/production';
import { orders } from '../db/schema/order';
import { sales } from '../db/schema/sales';

export type Pagination = { page: number; limit: number; total: number; totalPages: number };
export type DateRange = { start: Date; end: Date } | null;

export type SalesReportRow = {
	id: string;
	date: Date;
	buyerName: string;
	type: 'sale' | 'order';
	total: number;
	status: string;
	isDraft: boolean;
	excluded: boolean;
};

export type SalesReport = {
	summary: {
		totalTransactions: number;
		totalValue: number;
		paidCount: number;
		awaitingCount: number;
		draftCount: number;
		draftValue: number;
	};
	rows: SalesReportRow[];
	totalRow: { count: number; value: number };
	pagination: Pagination;
	dataRange: DateRange;
};

export type StockReport = {
	rows: Array<{
		productId: string;
		code: string;
		name: string;
		unit: string;
		opening: number;
		inQty: number;
		outQty: number;
		closing: number;
		minimumStock: number;
		isLow: boolean;
	}>;
	totalRow: { opening: number; inQty: number; outQty: number; closing: number };
	pagination: Pagination;
	dataRange: DateRange;
};

export type ProductionReport = {
	summary: { totalKg: number; totalBatches: number };
	rows: Array<{
		id: string;
		date: Date;
		productName: string;
		quantityKg: number;
		batch: string;
	}>;
	totalRow: { totalKg: number; totalBatches: number };
	pagination: Pagination;
	dataRange: DateRange;
};

const PAGE_LIMIT = 20;

function dateCond<T extends { createdAt?: Date | null; sale_date?: Date | null; movement_date?: Date | null; production_date?: Date | null }>(col: any, start?: Date, end?: Date) {
	const clauses = [];
	if (start) clauses.push(gte(col, start));
	if (end) clauses.push(lte(col, end));
	return clauses.length ? and(...clauses) : undefined;
}

export async function getSalesReport(f: { start?: Date; end?: Date; page?: number; limit?: number }): Promise<SalesReport> {
	const page = f.page ?? 1;
	const limit = f.limit ?? PAGE_LIMIT;

	const [orderRows, saleRows] = await Promise.all([
		db.select({ id: orders.id, date: orders.createdAt, buyerName: orders.customerName, total: orders.totalAmount, status: orders.status })
			.from(orders)
			.where(dateCond(orders.createdAt, f.start, f.end))
			.orderBy(desc(orders.createdAt)),
		db.select({ id: sales.id, date: sales.sale_date, buyerName: sales.buyer_name, total: sales.total_payment, status: sales.status })
			.from(sales)
			.where(dateCond(sales.sale_date, f.start, f.end))
			.orderBy(desc(sales.sale_date))
	]);

	const ORDER_PAID = ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'];
	const all: SalesReportRow[] = [
		...orderRows.map((r) => ({ id: r.id, date: r.date ?? new Date(), buyerName: r.buyerName ?? '-', type: 'order' as const, total: Number(r.total), status: r.status, isDraft: false, excluded: r.status === 'CANCELLED' })),
		...saleRows.map((r) => ({ id: r.id, date: r.date ?? new Date(), buyerName: r.buyerName ?? '-', type: 'sale' as const, total: Number(r.total ?? 0), status: r.status, isDraft: r.status === 'draft', excluded: r.status === 'draft' || r.status === 'cancelled' }))
	].sort((a, b) => b.date.getTime() - a.date.getTime());

	const counted = all.filter((r) => !r.excluded);
	const totalValue = counted.reduce((s, r) => s + r.total, 0);
	const paidCount = counted.filter((r) => (r.type === 'order' && ORDER_PAID.includes(r.status)) || (r.type === 'sale' && r.status === 'confirmed')).length;
	const awaitingCount = counted.filter((r) => r.type === 'order' && r.status === 'APPROVED').length;
	const drafts = all.filter((r) => r.isDraft);
	const draftValue = drafts.reduce((s, r) => s + r.total, 0);

	const total = all.length;
	const totalPages = Math.ceil(total / limit);
	const offset = (page - 1) * limit;
	const rows = all.slice(offset, offset + limit);

	const dates = all.map((r) => r.date).filter((d) => d instanceof Date && !isNaN(d.getTime()));
	const dataRange: DateRange = dates.length ? { start: new Date(Math.min(...dates.map((d) => d.getTime()))), end: new Date(Math.max(...dates.map((d) => d.getTime()))) } : null;

	return { summary: { totalTransactions: counted.length, totalValue, paidCount, awaitingCount, draftCount: drafts.length, draftValue }, rows, totalRow: { count: counted.length, value: totalValue }, pagination: { page, limit, total, totalPages }, dataRange };
}

export async function getStockReport(f: { start?: Date; end?: Date; page?: number; limit?: number }): Promise<StockReport> {
	const page = f.page ?? 1;
	const limit = f.limit ?? PAGE_LIMIT;

	const [activeProducts, movements, dateRow] = await Promise.all([
		db.select({ id: products.id, code: products.code, name: products.name, unit: products.unit, minimumStock: products.minimumStock })
			.from(products).where(and(isNull(products.deletedAt), eq(products.isActive, true))).orderBy(products.name),
		db.select({
			productId: stockMovements.productId,
			inQty: sql<string>`COALESCE(SUM(CASE WHEN ${stockMovements.quantityChange} > 0 THEN ${stockMovements.quantityChange}::numeric ELSE 0 END), 0)`,
			outQty: sql<string>`COALESCE(SUM(CASE WHEN ${stockMovements.quantityChange} < 0 THEN ABS(${stockMovements.quantityChange}::numeric) ELSE 0 END), 0)`
		}).from(stockMovements).where(dateCond(stockMovements.movementDate, f.start, f.end)).groupBy(stockMovements.productId),
		db.select({ minDate: sql<Date | null>`MIN(${stockMovements.movementDate})`, maxDate: sql<Date | null>`MAX(${stockMovements.movementDate})` }).from(stockMovements).where(dateCond(stockMovements.movementDate, f.start, f.end))
	]);

	const movementMap = new Map(movements.map((m) => [m.productId, m]));
	const rows = activeProducts.map((p) => {
		const m = movementMap.get(p.id);
		const inQty = Number(m?.inQty ?? 0), outQty = Number(m?.outQty ?? 0), closing = inQty - outQty;
		return { productId: p.id, code: p.code, name: p.name, unit: p.unit, opening: 0, inQty, outQty, closing, minimumStock: p.minimumStock, isLow: closing < p.minimumStock };
	});
	const total = rows.length;
	const totalPages = Math.ceil(total / limit);
	const offset = (page - 1) * limit;
	const paginatedRows = rows.slice(offset, offset + limit);
	const dataRange: DateRange = dateRow[0]?.minDate && dateRow[0]?.maxDate ? { start: dateRow[0].minDate, end: dateRow[0].maxDate } : null;
	const totalRow = rows.reduce((acc, r) => ({ opening: acc.opening + r.opening, inQty: acc.inQty + r.inQty, outQty: acc.outQty + r.outQty, closing: acc.closing + r.closing }), { opening: 0, inQty: 0, outQty: 0, closing: 0 });

	return { rows: paginatedRows, totalRow, pagination: { page, limit, total, totalPages }, dataRange };
}

export async function getProductionReport(f: { start?: Date; end?: Date; page?: number; limit?: number }): Promise<ProductionReport> {
	const page = f.page ?? 1;
	const limit = f.limit ?? PAGE_LIMIT;

	const [rows, dateRow] = await Promise.all([
		db.select({ id: productionEntries.id, date: productionEntries.productionDate, productName: products.name, quantityKg: productionEntries.quantityKg, batch: productionEntries.notes })
			.from(productionEntries)
			.innerJoin(products, eq(products.id, productionEntries.productId))
			.where(and(eq(productionEntries.status, 'CONFIRMED'), isNull(productionEntries.deletedAt), dateCond(productionEntries.productionDate, f.start, f.end)))
			.orderBy(desc(productionEntries.productionDate)),
		db.select({ minDate: sql<Date | null>`MIN(${productionEntries.productionDate})`, maxDate: sql<Date | null>`MAX(${productionEntries.productionDate})` })
			.from(productionEntries)
			.where(and(eq(productionEntries.status, 'CONFIRMED'), isNull(productionEntries.deletedAt), dateCond(productionEntries.productionDate, f.start, f.end)))
	]);

	const mapped = rows.map((r) => ({ id: r.id, date: r.date, productName: r.productName ?? '-', quantityKg: Number(r.quantityKg), batch: r.batch ?? '-' }));
	const totalKg = mapped.reduce((s, r) => s + r.quantityKg, 0);
	const total = mapped.length;
	const totalPages = Math.ceil(total / limit);
	const offset = (page - 1) * limit;
	const paginatedRows = mapped.slice(offset, offset + limit);
	const dataRange: DateRange = dateRow[0]?.minDate && dateRow[0]?.maxDate ? { start: dateRow[0].minDate, end: dateRow[0].maxDate } : null;

	return { summary: { totalKg, totalBatches: total }, rows: paginatedRows, totalRow: { totalKg, totalBatches: total }, pagination: { page, limit, total, totalPages }, dataRange };
}
