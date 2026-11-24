import { and, eq, gte, lte, isNull, or, sql, desc, asc, type SQL } from 'drizzle-orm';
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

	const cassavaKg = data.cassavaUsedKg || 0;
	let calculatedYield = data.yieldPercentage;
	if (!calculatedYield && cassavaKg > 0 && data.quantityKg > 0) {
		calculatedYield = Math.round((data.quantityKg / cassavaKg) * 100 * 10) / 10;
	}
	const tapiocaResult = data.quantityKg;

	const [entry] = await db.insert(productionEntries).values({
		productId: data.productId,
		quantityKg: String(data.quantityKg),
		cassavaUsedKg: data.cassavaUsedKg ? String(data.cassavaUsedKg) : null,
		yieldPercentage: calculatedYield ? String(calculatedYield) : null,
		tapiocaFlourResult: String(tapiocaResult),
		productionDate: date,
		notes: data.notes,
		isLateEntry: isLate,
		createdByUserId: userId,
		status: 'DRAFT'
	}).returning();

	const stockQty = tapiocaResult !== null ? tapiocaResult : data.quantityKg;
	await addMovement({
		productId: data.productId,
		quantityChange: stockQty,
		movementType: 'PURCHASE_IN',
		movementDate: date.toISOString().slice(0, 10),
		note: `Produksi: ${entry.id}`
	}, userId);

	return entry;
}

export async function updateProduction(
	id: string,
	input: {
		productId?: string;
		quantityKg?: number;
		cassavaUsedKg?: number;
		yieldPercentage?: number;
		productionDate?: string;
		notes?: string;
	},
	userId?: string
) {
	const [existing] = await db.select().from(productionEntries).where(and(eq(productionEntries.id, id), isNull(productionEntries.deletedAt))).limit(1);
	if (!existing) throw new Error('Entry produksi tidak ditemukan');

	const date = input.productionDate ? new Date(input.productionDate) : existing.productionDate;
	const newQuantity = input.quantityKg !== undefined ? input.quantityKg : Number(existing.quantityKg);
	const newCassava = input.cassavaUsedKg !== undefined ? input.cassavaUsedKg : (existing.cassavaUsedKg ? Number(existing.cassavaUsedKg) : null);
	
	let calculatedYield = input.yieldPercentage;
	if (!calculatedYield && newCassava && newCassava > 0 && newQuantity > 0) {
		calculatedYield = Math.round((newQuantity / newCassava) * 100 * 10) / 10;
	}

	const oldQuantity = Number(existing.quantityKg);
	const diff = newQuantity - oldQuantity;

	const [updated] = await db.update(productionEntries)
		.set({
			productId: input.productId ?? existing.productId,
			quantityKg: String(newQuantity),
			tapiocaFlourResult: String(newQuantity),
			cassavaUsedKg: newCassava ? String(newCassava) : null,
			yieldPercentage: calculatedYield ? String(calculatedYield) : (existing.yieldPercentage ? String(existing.yieldPercentage) : null),
			productionDate: date,
			notes: input.notes !== undefined ? input.notes : existing.notes,
			updatedAt: new Date()
		})
		.where(eq(productionEntries.id, id))
		.returning();

	// Jika produk berubah atau jumlah berubah, sesuaikan mutasi stok
	if (input.productId && input.productId !== existing.productId) {
		// Tarik kembali stok produk lama
		await addMovement({
			productId: existing.productId,
			quantityChange: -oldQuantity,
			movementType: 'ADJUSTMENT',
			reason: `Koreksi ganti produk produksi: ${id}`,
			note: `Koreksi ganti produk produksi: ${id}`
		}, userId);
		// Tambah stok ke produk baru
		await addMovement({
			productId: input.productId,
			quantityChange: newQuantity,
			movementType: 'ADJUSTMENT',
			reason: `Koreksi ganti produk produksi: ${id}`,
			note: `Koreksi ganti produk produksi: ${id}`
		}, userId);
	} else if (diff !== 0) {
		await addMovement({
			productId: existing.productId,
			quantityChange: diff,
			movementType: 'ADJUSTMENT',
			reason: `Koreksi kuantitas produksi: ${id}`,
			note: `Koreksi kuantitas produksi: ${id}`
		}, userId);
	}

	return updated;
}

export async function confirmTodayProduction(userId?: string) {
	const entries = await db.update(productionEntries)
		.set({
			status: 'CONFIRMED',
			confirmedByUserId: userId,
			confirmedAt: new Date(),
			updatedAt: new Date()
		})
		.where(eq(productionEntries.status, 'DRAFT'))
		.returning();

	return entries;
}

export async function deleteProduction(id: string, userId?: string) {
	const [existing] = await db.select().from(productionEntries).where(and(eq(productionEntries.id, id), isNull(productionEntries.deletedAt))).limit(1);
	if (!existing) throw new Error('Entry produksi tidak ditemukan');

	// Soft delete entry produksi
	await db.update(productionEntries).set({ deletedAt: new Date() }).where(eq(productionEntries.id, id));

	// Kembalikan/kurangi stok tepung yang sebelumnya ditambahkan
	const qtyToReverse = Number(existing.tapiocaFlourResult || existing.quantityKg || 0);
	if (qtyToReverse > 0 && existing.productId) {
		await addMovement({
			productId: existing.productId,
			quantityChange: -qtyToReverse,
			movementType: 'ADJUSTMENT',
			reason: `Penyesuaian stok karena penghapusan batch produksi: ${id}`,
			note: `Batal/Hapus produksi: ${id}`
		}, userId);
	}
}

export async function listProductions(query: ProductionQuery) {
	const q = productionQuerySchema.parse(query);
	const conditions: SQL<unknown>[] = [isNull(productionEntries.deletedAt)];
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
		cassavaUsedKg: productionEntries.cassavaUsedKg,
		yieldPercentage: productionEntries.yieldPercentage,
		tapiocaFlourResult: productionEntries.tapiocaFlourResult,
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
		items: rows.map((r) => ({ ...r, quantityKg: Number(r.quantityKg), cassavaUsedKg: r.cassavaUsedKg ? Number(r.cassavaUsedKg) : null, yieldPercentage: r.yieldPercentage ? Number(r.yieldPercentage) : null, tapiocaFlourResult: r.tapiocaFlourResult ? Number(r.tapiocaFlourResult) : null })),
		pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) }
	};
}

export async function getCassavaTargetKg(): Promise<number> {
	const TAPIOCA_FLOUR_TARGET_KG = 4000;
	const result = await db.select({
		avgYield: sql<number>`COALESCE(AVG(yield_percentage), 0)`,
	})
		.from(productionEntries)
		.where(and(eq(productionEntries.status, 'CONFIRMED'), sql`yield_percentage IS NOT NULL`))
		.limit(1);

	const avgYield = Number(result[0]?.avgYield || 0);
	if (avgYield > 0) {
		return Math.round(TAPIOCA_FLOUR_TARGET_KG / (avgYield / 100));
	}
	return Math.round(TAPIOCA_FLOUR_TARGET_KG / 0.25);
}

export async function getTodaySummary() {
	const [result] = await db.select({
		totalKg: sql<string>`COALESCE(SUM(cassava_used_kg), 0)`,
		draftCount: sql<number>`COUNT(*) FILTER (WHERE status = 'DRAFT')`,
		confirmedCount: sql<number>`COUNT(*) FILTER (WHERE status = 'CONFIRMED')`
	})
		.from(productionEntries)
		.where(isNull(productionEntries.deletedAt));

	const targetKg = await getCassavaTargetKg();
	const totalKg = Number(result?.totalKg || 0);

	return {
		totalKg,
		targetKg,
		percentage: Math.min(Math.round((totalKg / targetKg) * 100), 100),
		draftCount: Number(result?.draftCount || 0),
		confirmedCount: Number(result?.confirmedCount || 0)
	};
}
