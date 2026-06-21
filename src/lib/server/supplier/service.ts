import { eq, asc, sql, count } from 'drizzle-orm';
import { db } from '../db';
import { suppliers } from '../db/schema/supplier';
import { cassavaReceipts } from '../db/schema/cassava';

export async function listSuppliers(query: { page?: number; limit?: number }) {
	const page = query.page || 1;
	const limit = query.limit || 100;
	const offset = (page - 1) * limit;

	const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(suppliers);
	const total = Number(countResult.count);

	const items = await db.select().from(suppliers).orderBy(asc(suppliers.name)).limit(limit).offset(offset);
	return { items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function createSupplier(data: { name: string; phone?: string; address?: string }) {
	const [s] = await db.insert(suppliers).values({ name: data.name, phone: data.phone, address: data.address }).returning();
	return s;
}

export async function deleteSupplier(id: string) {
	const [related] = await db.select({ count: sql<number>`count(*)` }).from(cassavaReceipts).where(eq(cassavaReceipts.supplierId, id));
	if (Number(related.count) > 0) {
		throw new Error(`Supplier tidak bisa dihapus karena memiliki ${related.count} penerimaan singkong terkait`);
	}
	await db.delete(suppliers).where(eq(suppliers.id, id));
}
