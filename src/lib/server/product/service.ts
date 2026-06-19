import { and, eq, ilike, or, sql, desc, asc, isNull, type SQL } from 'drizzle-orm';
import { db } from '../db';
import { products, productCategories } from '../db/schema/product';
import type { CreateProductInput, UpdateProductInput, ProductQuery } from './validation';
import { uploadImage, deleteImage, generateImageFilename } from '../storage/s3';
import { createProductSchema, updateProductSchema, productQuerySchema } from './validation';

function formatError(e: unknown): string {
	if (e && typeof e === 'object' && 'issues' in e && Array.isArray((e as any).issues)) {
		return (e as { issues: Array<{ message: string }> }).issues.map((i) => i.message).join(', ');
	}
	return e instanceof Error ? e.message : 'Terjadi kesalahan';
}

async function generateCode(): Promise<string> {
	const today = new Date();
	const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
	const prefix = `Item-${dateStr}-`;

	const lastProduct = await db
		.select({ code: products.code })
		.from(products)
		.where(ilike(products.code, `${prefix}%`))
		.orderBy(desc(products.code))
		.limit(1);

	const lastNum = lastProduct.length > 0
		? parseInt(lastProduct[0].code.slice(prefix.length), 10)
		: 0;
	const nextNum = String(lastNum + 1).padStart(3, '0');
	return `${prefix}${nextNum}`;
}

export async function createProduct(input: CreateProductInput, imageBuffer?: Buffer, mimeType?: string) {
	let data: any;
	try { data = createProductSchema.parse(input); } catch (e) { throw new Error(formatError(e)); }
	const code = data.code || await generateCode();

	const existing = await db.select({ id: products.id }).from(products).where(eq(products.code, code)).limit(1);
	if (existing.length > 0) {
		throw new Error('Kode produk sudah digunakan');
	}

	let imageUrl: string | undefined;
	if (imageBuffer && mimeType) {
		const filename = generateImageFilename(code);
		imageUrl = await uploadImage(filename, imageBuffer, mimeType) ?? undefined;
	}

	const [product] = await db.insert(products).values({
		code,
		name: data.name,
		description: data.description,
		price: String(data.price),
		costPrice: data.costPrice ? String(data.costPrice) : null,
		unit: data.unit,
		minimumStock: data.minimumStock,
		categoryId: data.categoryId,
		imageUrl
	}).returning();

	return product;
}

export async function updateProduct(id: string, input: UpdateProductInput, imageBuffer?: Buffer, mimeType?: string) {
	let data: any;
	try { data = updateProductSchema.parse(input); } catch (e) { throw new Error(formatError(e)); }

	let imageUrl: string | undefined;
	if (imageBuffer && mimeType) {
		const existing = await db.select({ imageUrl: products.imageUrl }).from(products).where(eq(products.id, id)).limit(1);
		if (existing[0]?.imageUrl) {
			await deleteImage(existing[0].imageUrl).catch(() => {});
		}
		const filename = generateImageFilename(id);
		imageUrl = await uploadImage(filename, imageBuffer, mimeType) ?? undefined;
	}

	const { price, costPrice, ...restData } = data;
	const [product] = await db.update(products)
		.set({
			...restData,
			...(price !== undefined ? { price: String(price) } : {}),
			...(costPrice !== undefined ? { costPrice: costPrice === null || costPrice === undefined ? null : String(costPrice) } : {}),
			...(imageUrl ? { imageUrl } : {}),
			updatedAt: new Date()
		})
		.where(eq(products.id, id))
		.returning();

	return product;
}

export async function deleteProduct(id: string) {
	const [product] = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1);
	if (!product) throw new Error('Produk tidak ditemukan');
	await db.update(products)
		.set({ deletedAt: new Date(), updatedAt: new Date() })
		.where(eq(products.id, id));
}

export async function toggleProductStatus(id: string) {
	const [existing] = await db.select({ isActive: products.isActive }).from(products).where(eq(products.id, id)).limit(1);
	if (!existing) throw new Error('Produk tidak ditemukan');

	const [product] = await db.update(products)
		.set({ isActive: !existing.isActive, updatedAt: new Date() })
		.where(eq(products.id, id))
		.returning();

	return product;
}

export async function listProducts(query: ProductQuery) {
	const q = productQuerySchema.parse(query);
	const conditions = [isNull(products.deletedAt)];

	if (q.search) {
		conditions.push(or(
			ilike(products.name, `%${q.search}%`),
			ilike(products.code, `%${q.search}%`)
		) as SQL<unknown>);
	}
	if (q.categoryId) {
		conditions.push(eq(products.categoryId, q.categoryId));
	}
	if (q.status === 'active') {
		conditions.push(eq(products.isActive, true));
	} else if (q.status === 'inactive') {
		conditions.push(eq(products.isActive, false));
	}

	const where = and(...conditions);
	const offset = (q.page - 1) * q.limit;
	const orderFn = q.order === 'desc' ? desc : asc;

	const items = await db.select()
		.from(products)
		.where(where)
		.orderBy(orderFn(products[q.sort]))
		.limit(q.limit)
		.offset(offset);

	const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(products).where(where);
	const total = Number(totalResult.count);

	return {
		items,
		pagination: {
			total,
			page: q.page,
			limit: q.limit,
			totalPages: Math.ceil(total / q.limit)
		}
	};
}

export async function getProduct(id: string) {
	const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
	if (!product) throw new Error('Produk tidak ditemukan');
	return product;
}

export async function getCategories() {
	return db.select().from(productCategories).where(eq(productCategories.isActive, true)).orderBy(asc(productCategories.name));
}

export async function createCategory(name: string) {
	const existing = await db.select({ id: productCategories.id }).from(productCategories).where(eq(productCategories.name, name)).limit(1);
	if (existing.length > 0) throw new Error('Kategori sudah ada');

	const [category] = await db.insert(productCategories).values({ name }).returning();
	return category;
}

export async function toggleCategoryStatus(id: string) {
	const [existing] = await db.select({ isActive: productCategories.isActive }).from(productCategories).where(eq(productCategories.id, id)).limit(1);
	if (!existing) throw new Error('Kategori tidak ditemukan');
	const [category] = await db.update(productCategories)
		.set({ isActive: !existing.isActive, updatedAt: new Date() })
		.where(eq(productCategories.id, id))
		.returning();
	return category;
}

export async function listCategories(page: number = 1, limit: number = 10, search?: string, sort: 'name' = 'name', order: 'asc' | 'desc' = 'asc', status?: string) {
	const offset = (page - 1) * limit;
	const conditions: SQL<unknown>[] = [];
	if (status === 'active') conditions.push(eq(productCategories.isActive, true));
	else if (status === 'inactive') conditions.push(eq(productCategories.isActive, false));
	if (search) {
		conditions.push(ilike(productCategories.name, `%${search}%`) as SQL<unknown>);
	}
	const where = conditions.length > 0 ? and(...conditions) : undefined;
	const orderFn = order === 'desc' ? desc : asc;
	const items = await db.select()
		.from(productCategories)
		.where(where)
		.orderBy(orderFn(productCategories[sort]))
		.limit(limit)
		.offset(offset);
	const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(productCategories).where(where);
	const total = Number(totalResult.count);
	return {
		items,
		pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
	};
}

export async function updateCategory(id: string, name: string) {
	const existing = await db.select({ id: productCategories.id }).from(productCategories).where(eq(productCategories.name, name)).limit(1);
	if (existing.length > 0 && existing[0].id !== id) throw new Error('Nama kategori sudah ada');

	const [category] = await db.update(productCategories)
		.set({ name, updatedAt: new Date() })
		.where(eq(productCategories.id, id))
		.returning();
	return category;
}

export async function deleteCategory(id: string) {
	const [activeCount] = await db.select({ count: sql<number>`count(*)` }).from(products).where(and(eq(products.categoryId, id), isNull(products.deletedAt)));
	if (Number(activeCount.count) > 0) {
		throw new Error('Hapus atau nonaktifkan produk terlebih dahulu');
	}
	await db.delete(productCategories).where(eq(productCategories.id, id));
}
