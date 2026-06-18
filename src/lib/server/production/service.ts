import { and, eq, gte, lte, ilike, isNull, or, sql, desc, asc, type SQL } from 'drizzle-orm';
import { db } from '../db';
import { products } from '../db/schema/product';
import { productionEntries } from '../db/schema/production';
import { createProductionSchema, productionQuerySchema } from './validation';
import type { CreateProductionInput, ProductionQuery } from './validation';
import { addMovement } from '../stock/service';

export async function createProduction(input: CreateProductionInput, userId?: string) {
	const data = createProductionSchema.parse(input);
	const date = data.productionDate ? new Date(data.productionDate) : new Date();
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const isLate = date < today;

	const [entry] = await db.insert(productionEntries).values({
		productId: data.productId,
		quantityKg: String(data.quantityKg),
		productionDate: date,
		notes: data.notes,
		isLateEntry: isLate,
		createdByUserId: userId,
		status: 'DRAFT'
	}).returning();

	await addMovement({
		productId: data.productId,
		quantityChange: data.quantityKg,
		movementType: 'PURCHASE_IN',
		movementDate: date.toISOString().slice(0, 10),
		note: `Produksi: ${entry.id}`
	}, userId);

	return entry;
}

export async function updateProduction(id: string, input: { quantityKg?: number; notes?: string }, userId?: string) {
	const [existing] = await db.select().from(productionEntries).where(eq(productionEntries.id, id)).limit(1);
	if (!existing) throw new Error('Entry produksi tidak ditemukan');
	if (existing.status === 'CONFIRMED') throw new Error('Produksi yang sudah dikonfirmasi tidak bisa diedit');

	const diff = input.quantityKg ? input.quantityKg - Number(existing.quantityKg) : 0;

	const [updated] = await db.update(productionEntries)
		.set({
			quantityKg: input.quantityKg ? String(input.quantityKg) : existing.quantityKg,
			notes: input.notes ?? existing.notes,
			updatedAt: new Date()
		})
		.where(eq(productionEntries.id, id))
		.returning();

	if (diff !== 0) {
		await addMovement({
			productId: existing.productId,
			quantityChange: diff,
			movementType: 'ADJUSTMENT',
			note: `Koreksi produksi: ${id}`
		}, userId);
	}

	return updated;
}

export async function confirmTodayProduction(userId?: string) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	const entries = await db.update(productionEntries)
		.set({
			status: 'CONFIRMED',
			confirmedByUserId: userId,
			confirmedAt: new Date(),
			updatedAt: new Date()
		})
		.where(and(
			eq(productionEntries.status, 'DRAFT'),
			gte(productionEntries.productionDate, today),
			lte(productionEntries.productionDate, tomorrow)
		))
		.returning();

	return entries;
}

export async function deleteProduction(id: string) {
	const [existing] = await db.select().from(productionEntries).where(eq(productionEntries.id, id)).limit(1);
	if (!existing) throw new Error('Entry produksi tidak ditemukan');
	if (existing.status === 'CONFIRMED') throw new Error('Produksi yang sudah dikonfirmasi tidak bisa dihapus');

	await db.delete(productionEntries).where(eq(productionEntries.id, id));
}

export async function listProductions(query: ProductionQuery) {
	const q = productionQuerySchema.parse(query);
	const conditions: SQL<unknown>[] = [];
	if (q.productId) conditions.push(eq(productionEntries.productId, q.productId));
	if (q.startDate) conditions.push(gte(productionEntries.productionDate, new Date(q.startDate)));
	if (q.endDate) conditions.push(lte(productionEntries.productionDate, new Date(q.endDate)));
	if (q.status !== 'all') conditions.push(eq(productionEntries.status, q.status));

	const where = conditions.length > 0 ? and(...conditions) : undefined;
	const offset = (q.page - 1) * q.limit;
	const orderFn = q.order === 'desc' ? desc : asc;

	const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(productionEntries).where(where);
	const total = Number(countResult.count);

	const rows = await db.select({
		id: productionEntries.id,
		productId: productionEntries.productId,
		quantityKg: productionEntries.quantityKg,
		productionDate: productionEntries.productionDate,
		status: productionEntries.status,
		notes: productionEntries.notes,
		isLateEntry: productionEntries.isLateEntry,
		createdAt: productionEntries.createdAt,
		confirmedAt: productionEntries.confirmedAt,
		productName: products.name,
		productCode: products.code
	})
		.from(productionEntries)
		.leftJoin(products, eq(products.id, productionEntries.productId))
		.where(where)
		.orderBy(orderFn(productionEntries[q.sort]))
		.limit(q.limit)
		.offset(offset);

	return {
		items: rows.map((r) => ({ ...r, quantityKg: Number(r.quantityKg) })),
		pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) }
	};
}

export async function getTodaySummary() {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	const [result] = await db.select({
		totalKg: sql<string>`COALESCE(SUM(quantity_kg), 0)`,
		draftCount: sql<number>`COUNT(*) FILTER (WHERE status = 'DRAFT')`,
		confirmedCount: sql<number>`COUNT(*) FILTER (WHERE status = 'CONFIRMED')`
	})
		.from(productionEntries)
		.where(and(
			gte(productionEntries.productionDate, today),
			lte(productionEntries.productionDate, tomorrow)
		));

	const targetKg = 4000;
	const totalKg = Number(result?.totalKg || 0);

	return {
		totalKg,
		targetKg,
		percentage: Math.min(Math.round((totalKg / targetKg) * 100), 100),
		draftCount: Number(result?.draftCount || 0),
		confirmedCount: Number(result?.confirmedCount || 0)
	};
}
