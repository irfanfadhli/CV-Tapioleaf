import { and, eq, gte, lte, ilike, isNull, or, sql, desc, asc, type SQL } from 'drizzle-orm';
import { db } from '../db';
import { products } from '../db/schema/product';
import { stockMovements } from '../db/schema/stock';
import { createMovementSchema, movementQuerySchema, stockQuerySchema, MOVEMENT_LABELS } from './validation';
import type { CreateMovementInput, MovementQuery, StockQuery } from './validation';

export async function getCurrentStock(productId: string): Promise<number> {
	const rows = await db
		.select({ total: sql<string>`coalesce(sum(quantity_change), 0)` })
		.from(stockMovements)
		.where(eq(stockMovements.productId, productId));
	return Number(rows[0]?.total || 0);
}

export async function addMovement(input: CreateMovementInput, userId?: string) {
	const data = createMovementSchema.parse(input);
	const qty = data.quantityChange;

	if ((qty < 0) && (data.movementType === 'MANUAL_OUT' || data.movementType === 'ADJUSTMENT')) {
		const current = await getCurrentStock(data.productId);
		if (current + qty < 0) throw new Error('Stok tidak mencukupi. Tersedia: ' + current);
	}

	if (data.movementType === 'ADJUSTMENT' && !data.reason) {
		throw new Error('Alasan adjustment wajib diisi (minimal 10 karakter)');
	}

	const [movement] = await db.insert(stockMovements).values({
		productId: data.productId,
		quantityChange: String(qty),
		movementType: data.movementType,
		movementDate: data.movementDate ? new Date(data.movementDate) : new Date(),
		note: data.note,
		reason: data.reason,
		createdByUserId: userId
	}	).returning();

	return movement;
}

export async function getMovement(id: string) {
	const [row] = await db
		.select({
			id: stockMovements.id, productId: stockMovements.productId,
			quantityChange: stockMovements.quantityChange, movementType: stockMovements.movementType,
			movementDate: stockMovements.movementDate, note: stockMovements.note,
			reason: stockMovements.reason
		})
		.from(stockMovements)
		.where(eq(stockMovements.id, id))
		.limit(1);
	if (!row) throw new Error('Pergerakan stok tidak ditemukan');
	return row;
}

export async function updateMovement(id: string, data: { note?: string; reason?: string; movementDate?: string }) {
	await getMovement(id);
	const [updated] = await db.update(stockMovements)
		.set({
			note: data.note,
			reason: data.reason,
			movementDate: data.movementDate ? new Date(data.movementDate) : undefined
		})
		.where(eq(stockMovements.id, id))
		.returning();
	return updated;
}

export async function deleteMovement(id: string) {
	await getMovement(id);
	await db.delete(stockMovements).where(eq(stockMovements.id, id));
}

export async function getAllCurrentStock(query: StockQuery) {
	const q = stockQuerySchema.parse(query);
	const conditions = [isNull(products.deletedAt)];
	if (q.search) {
		conditions.push(or(
			ilike(products.name, `%${q.search}%`),
			ilike(products.code, `%${q.search}%`)
		) as SQL<unknown>);
	}
	const offset = (q.page - 1) * q.limit;

	const orderFn = q.order === 'desc' ? desc : asc;
	const productRows = await db
		.select({
			id: products.id, code: products.code, name: products.name,
			price: products.price, unit: products.unit, minimumStock: products.minimumStock,
			imageUrl: products.imageUrl, isActive: products.isActive
		})
		.from(products)
		.where(and(...conditions))
		.orderBy(orderFn(products[q.sort]))
		.limit(q.limit)
		.offset(offset);

	const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(products).where(and(...conditions));
	const total = Number(countResult.count);

	const items = [];
	for (const p of productRows) {
		const currentStock = await getCurrentStock(p.id);
		items.push({
			...p, currentStock,
			stockStatus: (currentStock < p.minimumStock ? 'CRITICAL' : 'NORMAL') as 'CRITICAL' | 'NORMAL'
		});
	}

	return {
		items: q.status === 'critical' ? items.filter((i) => i.stockStatus === 'CRITICAL') : items,
		pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) }
	};
}

export async function getMovements(query: MovementQuery) {
	const q = movementQuerySchema.parse(query);
	const conditions: SQL<unknown>[] = [];
	if (q.productId) conditions.push(eq(stockMovements.productId, q.productId));
	if (q.type) conditions.push(eq(stockMovements.movementType, q.type));
	if (q.startDate) conditions.push(gte(stockMovements.createdAt, new Date(q.startDate)));
	if (q.endDate) conditions.push(lte(stockMovements.createdAt, new Date(q.endDate)));

	const where = conditions.length > 0 ? and(...conditions) : undefined;
	const offset = (q.page - 1) * q.limit;

	const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(stockMovements).where(where);
	const total = Number(countResult.count);

	const orderFn = q.order === 'desc' ? desc : asc;
	const rows = await db
		.select({
			id: stockMovements.id, productId: stockMovements.productId,
			quantityChange: stockMovements.quantityChange, movementType: stockMovements.movementType,
			movementDate: stockMovements.movementDate, note: stockMovements.note,
			reason: stockMovements.reason, createdAt: stockMovements.createdAt,
			productName: products.name, productCode: products.code
		})
		.from(stockMovements)
		.leftJoin(products, eq(products.id, stockMovements.productId))
		.where(where)
		.orderBy(orderFn(stockMovements[q.sort]))
		.limit(q.limit)
		.offset(offset);

	return {
		items: rows.map((r) => ({
			...r,
			quantityChange: Number(r.quantityChange),
			typeLabel: MOVEMENT_LABELS[r.movementType] || r.movementType
		})),
		pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) }
	};
}
