import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { products } from '$lib/server/db/schema/product';
import { stockMovements } from '$lib/server/db/schema/stock';
import { sql, eq, isNull, asc, or, ilike, and, type SQL } from 'drizzle-orm';
import { optimizeImageUrl } from '$lib/utils';

export const load: PageServerLoad = async (event) => {
	const search = event.url.searchParams.get('search') || '';
	const page = Number(event.url.searchParams.get('page')) || 1;
	const limit = 12;
	const offset = (page - 1) * limit;

	const conditions = [isNull(products.deletedAt), eq(products.isActive, true)];
	if (search) {
		conditions.push(or(
			ilike(products.name, `%${search}%`),
			ilike(products.description, `%${search}%`)
		) as SQL<unknown>);
	}
	const where = and(...conditions);

	const items = await db.select({
		id: products.id,
		code: products.code,
		name: products.name,
		description: products.description,
		price: products.price,
		unit: products.unit,
		imageUrl: products.imageUrl,
		currentStock: sql<number>`COALESCE(SUM(${stockMovements.quantityChange}), 0)`
	})
		.from(products)
		.leftJoin(stockMovements, eq(stockMovements.productId, products.id))
		.where(where)
		.groupBy(products.id)
		.orderBy(asc(products.name))
		.limit(limit)
		.offset(offset);

	const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(products).where(where);
	const total = Number(countResult.count);

	return {
		items: items.map(i => ({ ...i, imageUrl: optimizeImageUrl(i.imageUrl), currentStock: Number(i.currentStock) })),
		pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
		search
	};
};
