import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as stockService from '$lib/server/stock/service';
import * as productService from '$lib/server/product/service';
import { db } from '$lib/server/db';
import { cassavaReceipts } from '$lib/server/db/schema/cassava';
import { productionEntries } from '$lib/server/db/schema/production';
import { products } from '$lib/server/db/schema/product';
import { sql, eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	try {
		const query = Object.fromEntries(event.url.searchParams) as Record<string, string>;
		const result = await stockService.getAllCurrentStock(query as any);
		const allProducts = await productService.listProducts({ search: '', status: 'all', page: 1, limit: 50, sort: 'name', order: 'asc' } as any);
		const [cassavaIn] = await db.select({ total: sql<string>`COALESCE(SUM(final_weight::numeric), 0)` }).from(cassavaReceipts).limit(1);
		const [cassavaOut] = await db.select({ total: sql<string>`COALESCE(SUM(cassava_used_kg::numeric), 0)` }).from(productionEntries).limit(1);
		const cassavaStock = Math.max(0, Number(cassavaIn?.total || 0) - Number(cassavaOut?.total || 0));
		return {
			items: result.items,
			pagination: result.pagination,
			products: allProducts.items,
			query,
			sort: query.sort || 'name',
			order: query.order || 'asc',
			cassavaStock
		};
	} catch (e) {
		console.error('Gudang load error:', e);
		throw error(500, String(e));
	}
};

export const actions: Actions = {
	deleteStock: async (event) => {
		const formData = await event.request.formData();
		const productId = formData.get('productId')?.toString() ?? '';
		if (!productId) return fail(400, { message: 'ID tidak valid' });
		try {
			await db.update(products).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(products.id, productId));
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal menghapus' });
		}
		return { success: true };
	},

	create: async (event) => {
		const formData = await event.request.formData();
		let qty = Number(formData.get('quantityChange')?.toString() ?? '0');
		const movementType = formData.get('movementType')?.toString() ?? 'MANUAL_IN';
		if (movementType === 'MANUAL_OUT' && qty > 0) qty = -qty;
		const input = {
			productId: formData.get('productId')?.toString() ?? '',
			quantityChange: qty,
			movementType,
			movementDate: formData.get('movementDate')?.toString() || undefined,
			note: formData.get('note')?.toString() || undefined,
			reason: formData.get('reason')?.toString() || undefined
		} as any;
		try {
			await stockService.addMovement(input, event.locals.user?.id);
		} catch (e) {
			return { message: e instanceof Error ? e.message : 'Gagal', success: false };
		}
		return { success: true, message: 'Pergerakan stok berhasil dicatat' };
	}
};
