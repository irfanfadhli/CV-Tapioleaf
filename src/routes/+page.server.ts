import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { products, productCategories } from '$lib/server/db/schema/product';
import { stockMovements } from '$lib/server/db/schema/stock';
import { sql, eq, isNull, asc, and } from 'drizzle-orm';
import { optimizeImageUrl } from '$lib/utils';

export const load: PageServerLoad = async (event) => {
	const items = await db.select({
		id: products.id,
		code: products.code,
		name: products.name,
		description: products.description,
		price: products.price,
		unit: products.unit,
		imageUrl: products.imageUrl,
		label: products.label,
		categoryId: products.categoryId,
		categoryName: productCategories.name,
		currentStock: sql<number>`COALESCE(SUM(${stockMovements.quantityChange}), 0)`
	})
		.from(products)
		.leftJoin(stockMovements, eq(stockMovements.productId, products.id))
		.leftJoin(productCategories, eq(products.categoryId, productCategories.id))
		.where(and(isNull(products.deletedAt), eq(products.isActive, true)))
		.groupBy(products.id, productCategories.name)
		.orderBy(asc(products.name))
		.limit(50);

	const categories = await db.select({
		id: productCategories.id,
		name: productCategories.name
	})
		.from(productCategories)
		.where(eq(productCategories.isActive, true))
		.orderBy(asc(productCategories.name));

	return {
		items: items.map(i => ({
			...i,
			imageUrl: optimizeImageUrl(i.imageUrl),
			currentStock: Number(i.currentStock),
			label: i.label ?? null,
			categoryName: i.categoryName ?? null
		})),
		categories,
		user: event.locals.user ? { name: event.locals.user.name, email: event.locals.user.email, role: event.locals.user.role } : null
	};
};
