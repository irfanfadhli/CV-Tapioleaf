import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as productionService from '$lib/server/production/service';

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
		try {
			await productionService.deleteProduction(id);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal menghapus' });
		}
		return { success: true, message: 'Produksi dihapus' };
	}
};
