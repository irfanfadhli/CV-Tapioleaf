import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as productionService from '$lib/server/production/service';
import { db } from '$lib/server/db';
import { productionEntries } from '$lib/server/db/schema/production';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const query = Object.fromEntries(event.url.searchParams) as Record<string, string>;
	const result = await productionService.listProductions(query as any);
	return {
		items: result.items,
		pagination: result.pagination,
		query,
		sort: query.sort || 'productionDate',
		order: query.order || 'desc'
	};
};

export const actions: Actions = {
	delete: async (event) => {
		const formData = await event.request.formData();
		const id = formData.get('id')?.toString() ?? '';
		if (!id) return fail(400, { message: 'ID tidak valid' });

		const [entry] = await db.select().from(productionEntries).where(eq(productionEntries.id, id)).limit(1);
		if (entry?.status === 'CONFIRMED') {
			return fail(400, { message: 'Batch yang sudah CONFIRMED tidak bisa dihapus langsung.' });
		}

		try {
			await productionService.deleteProduction(id);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal menghapus' });
		}
		return { success: true, message: 'Produksi dihapus' };
	}
};
