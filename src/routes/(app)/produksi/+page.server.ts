import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as productionService from '$lib/server/production/service';
import * as productService from '$lib/server/product/service';
import { db } from '$lib/server/db';
import { cassavaReceipts } from '$lib/server/db/schema/cassava';
import { sql } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const todaySummary = await productionService.getTodaySummary();
	const allProducts = await productService.listProducts({ search: '', status: 'all', page: 1, limit: 1000, sort: 'name', order: 'asc' } as any);
	const query = Object.fromEntries(event.url.searchParams);
	const todayItems = await productionService.listProductions({ page: 1, limit: 100, sort: 'productionDate', order: 'desc' } as any);

	const [cassavaResult] = await db.select({ total: sql<string>`COALESCE(SUM(final_weight::numeric), 0)` }).from(cassavaReceipts).limit(1);

	return { todaySummary, products: allProducts.items, query, todayItems: todayItems.items, cassavaStock: Number(cassavaResult?.total || 0) };
};

export const actions: Actions = {
	create: async (event) => {
		const formData = await event.request.formData();
		const input = {
			productId: formData.get('productId')?.toString() ?? '',
			quantityKg: Number(formData.get('quantityKg')?.toString() ?? '0'),
			productionDate: formData.get('productionDate')?.toString() || undefined,
			notes: formData.get('notes')?.toString() || undefined
		};
		try {
			await productionService.createProduction(input, event.locals.user?.id);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal menyimpan produksi' });
		}
		return { success: true, message: 'Produksi berhasil dicatat' };
	},

	confirm: async (event) => {
		try {
			await productionService.confirmTodayProduction(event.locals.user?.id);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal konfirmasi' });
		}
		return { success: true, message: 'Produksi hari ini dikonfirmasi' };
	}
};
