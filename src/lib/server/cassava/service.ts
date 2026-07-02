import { and, eq, ne, desc, isNull, sql, gte, lte } from 'drizzle-orm';
import { db } from '../db';
import { cassavaReceipts } from '../db/schema/cassava';
import { suppliers } from '../db/schema/supplier';
import { productionEntries } from '../db/schema/production';

export async function createReceipt(input: {
	receiptDate: string; supplierId: string; vehicleNumber: string;
	driverName?: string; grossWeight: number; taraWeight: number;
	refraction: number; pricePerKg: number; notes?: string;
}, userId: string) {
	const gross = Number(input.grossWeight);
	const tara = Number(input.taraWeight);
	const refr = Number(input.refraction);
	const net = gross - tara;
	const finalW = net - refr;
	const cost = finalW * Number(input.pricePerKg);

	const [receipt] = await db.insert(cassavaReceipts).values({
		receiptDate: new Date(input.receiptDate),
		supplierId: input.supplierId,
		vehicleNumber: input.vehicleNumber,
		driverName: input.driverName,
		grossWeight: String(gross),
		taraWeight: String(tara),
		netWeight: String(net),
		refraction: String(refr),
		finalWeight: String(finalW),
		pricePerKg: String(input.pricePerKg),
		totalCost: String(cost),
		notes: input.notes,
		receivedById: userId,
	}).returning();
	return receipt;
}

export async function listReceipts(query: { page?: number; limit?: number; supplierId?: string; startDate?: string; endDate?: string }) {
	const conditions = [isNull(cassavaReceipts.deletedAt)];
	if (query.supplierId) conditions.push(eq(cassavaReceipts.supplierId, query.supplierId));
	if (query.startDate) conditions.push(gte(cassavaReceipts.receiptDate, new Date(query.startDate)));
	if (query.endDate) conditions.push(lte(cassavaReceipts.receiptDate, new Date(query.endDate)));

	const where = conditions.length > 0 ? and(...conditions) : undefined;
	const page = query.page || 1;
	const limit = query.limit || 20;
	const offset = (page - 1) * limit;

	const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(cassavaReceipts).where(where);
	const total = Number(countResult.count);

	const items = await db.select({
		id: cassavaReceipts.id,
		receiptDate: cassavaReceipts.receiptDate,
		vehicleNumber: cassavaReceipts.vehicleNumber,
		driverName: cassavaReceipts.driverName,
		grossWeight: cassavaReceipts.grossWeight,
		taraWeight: cassavaReceipts.taraWeight,
		netWeight: cassavaReceipts.netWeight,
		refraction: cassavaReceipts.refraction,
		finalWeight: cassavaReceipts.finalWeight,
		pricePerKg: cassavaReceipts.pricePerKg,
		totalCost: cassavaReceipts.totalCost,
		notes: cassavaReceipts.notes,
		supplierName: suppliers.name,
	})
		.from(cassavaReceipts)
		.innerJoin(suppliers, eq(suppliers.id, cassavaReceipts.supplierId))
		.where(where)
		.orderBy(desc(cassavaReceipts.receiptDate))
		.limit(limit)
		.offset(offset);

	return {
		items: items.map(r => ({
			...r,
			grossWeight: Number(r.grossWeight),
			taraWeight: Number(r.taraWeight),
			netWeight: Number(r.netWeight),
			refraction: Number(r.refraction),
			finalWeight: Number(r.finalWeight),
			pricePerKg: Number(r.pricePerKg),
			totalCost: Number(r.totalCost),
		})),
		pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
	};
}

export async function updateReceipt(id: string, input: {
	receiptDate: string; supplierId: string; vehicleNumber: string;
	driverName?: string; grossWeight: number; taraWeight: number;
	refraction: number; pricePerKg: number; notes?: string;
}, userId: string) {
	const gross = Number(input.grossWeight);
	const tara = Number(input.taraWeight);
	const refr = Number(input.refraction);
	const net = gross - tara;
	const finalW = net - refr;
	const cost = finalW * Number(input.pricePerKg);

	const [receipt] = await db.update(cassavaReceipts).set({
		receiptDate: new Date(input.receiptDate),
		supplierId: input.supplierId,
		vehicleNumber: input.vehicleNumber,
		driverName: input.driverName,
		grossWeight: String(gross),
		taraWeight: String(tara),
		netWeight: String(net),
		refraction: String(refr),
		finalWeight: String(finalW),
		pricePerKg: String(input.pricePerKg),
		totalCost: String(cost),
		notes: input.notes,
		receivedById: userId,
	}).where(eq(cassavaReceipts.id, id)).returning();
	return receipt;
}

export async function deleteReceipt(id: string) {
	const [receipt] = await db.select().from(cassavaReceipts).where(eq(cassavaReceipts.id, id)).limit(1);
	if (!receipt) return;
	const receiptFinal = Number(receipt.finalWeight);

	const [usedResult] = await db.select({ total: sql<string>`COALESCE(SUM(cassava_used_kg::numeric), 0)` }).from(productionEntries).limit(1);
	const totalUsed = Number(usedResult?.total || 0);

	const [remainingResult] = await db.select({ total: sql<string>`COALESCE(SUM(final_weight::numeric), 0)` }).from(cassavaReceipts).where(and(ne(cassavaReceipts.id, id), isNull(cassavaReceipts.deletedAt))).limit(1);
	const remainingFinal = Number(remainingResult?.total || 0);

	if (remainingFinal < totalUsed) {
		throw new Error('Tidak bisa menghapus penerimaan ini karena sudah digunakan dalam produksi');
	}

	await db.update(cassavaReceipts).set({ deletedAt: new Date() }).where(eq(cassavaReceipts.id, id));
}

export async function getSummary() {
	const [result] = await db.select({
		totalGross: sql<string>`COALESCE(SUM(gross_weight::numeric), 0)`,
		totalRefraction: sql<string>`COALESCE(SUM(refraction::numeric), 0)`,
		totalFinal: sql<string>`COALESCE(SUM(final_weight::numeric), 0)`,
		totalCost: sql<string>`COALESCE(SUM(total_cost::numeric), 0)`,
		count: sql<number>`COUNT(*)`,
	})
		.from(cassavaReceipts)
		.where(isNull(cassavaReceipts.deletedAt))
		.limit(1);

	return {
		totalGross: Number(result?.totalGross || 0),
		totalRefraction: Number(result?.totalRefraction || 0),
		totalFinal: Number(result?.totalFinal || 0),
		totalCost: Number(result?.totalCost || 0),
		count: Number(result?.count || 0),
	};
}
