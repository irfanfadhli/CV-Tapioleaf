import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { products } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import wilayahData from '$lib/data/wilayah-indonesia.json';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		const productId = event.url.searchParams.get('productId');
		const qty = event.url.searchParams.get('qty') || '1';
		throw redirect(
			303,
			`/login?redirect=${encodeURIComponent(`/checkout?productId=${productId}&qty=${qty}`)}`
		);
	}

	const productId = event.url.searchParams.get('productId');
	if (!productId) {
		throw redirect(303, '/#products');
	}

	const [product] = await db
		.select({
			id: products.id,
			name: products.name,
			code: products.code,
			price: products.price,
			unit: products.unit,
			description: products.description,
			imageUrl: products.imageUrl
		})
		.from(products)
		.where(eq(products.id, productId))
		.limit(1);

	if (!product) {
		throw error(404, 'Produk tidak ditemukan');
	}

	const initialQty = Number(event.url.searchParams.get('qty')) || 1;

	return {
		product,
		initialQty,
		user: event.locals.user,
		provinces: wilayahData.provinces
	};
};

