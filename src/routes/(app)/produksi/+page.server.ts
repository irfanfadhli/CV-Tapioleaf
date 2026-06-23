import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as productionService from '$lib/server/production/service';
import * as productService from '$lib/server/product/service';
import { db } from '$lib/server/db';
import { cassavaReceipts } from '$lib/server/db/schema/cassava';
import { productionEntries } from '$lib/server/db/schema/production';
import { sql } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const todaySummary = await productionService.getTodaySummary();
	const allProducts = await productService.listProducts({ search: '', status: 'all', page: 1, limit: 1000, sort: 'name', order: 'asc' } as any);
	const query = Object.fromEntries(event.url.searchParams);
	const todayItems = await productionService.listProductions({ page: 1, limit: 100, sort: 'productionDate', order: 'desc' } as any);

	const [cassavaIn] = await db.select({ total: sql<string>`COALESCE(SUM(final_weight::numeric), 0)` }).from(cassavaReceipts).limit(1);
	const [cassavaOut] = await db.select({ total: sql<string>`COALESCE(SUM(cassava_used_kg::numeric), 0)` }).from(productionEntries).limit(1);
	const cassavaStock = Math.max(0, Number(cassavaIn?.total || 0) - Number(cassavaOut?.total || 0));

	return { todaySummary, products: allProducts.items, query, todayItems: todayItems.items, cassavaStock };
};

export const actions: Actions = {
	create: async (event) => {
		const formData = await event.request.formData();
		const input = {
			productId: formData.get('productId')?.toString() ?? '',
			quantityKg: Number(formData.get('quantityKg')?.toString() ?? '0'),
			cassavaUsedKg: Number(formData.get('cassavaUsedKg') ?? '0'),
			yieldPercentage: formData.get('yieldPercentage') ? Number(formData.get('yieldPercentage')) : undefined,
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
	},

	delete: async (event) => {
		const formData = await event.request.formData();
		const id = formData.get('id')?.toString() ?? '';
		try {
			await productionService.deleteProduction(id);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal menghapus' });
		}
		return { success: true, message: 'Produksi dihapus' };
	}
};
