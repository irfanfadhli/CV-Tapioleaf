import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as stockService from '$lib/server/stock/service';

export const load: PageServerLoad = async (event) => {
	const query = Object.fromEntries(event.url.searchParams) as Record<string, string>;
	const result = await stockService.getMovements(query as any);
	return {
		movements: result.items,
		pagination: result.pagination,
		query,
		sort: query.sort || 'createdAt',
		order: query.order || 'desc'
	};
};

export const actions: Actions = {
	edit: async (event) => {
		const formData = await event.request.formData();
		const id = formData.get('id')?.toString() ?? '';
		const note = formData.get('note')?.toString() || undefined;
		const reason = formData.get('reason')?.toString() || undefined;
		const movementDate = formData.get('movementDate')?.toString() || undefined;
		try {
			await stockService.updateMovement(id, { note, reason, movementDate });
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal mengubah' });
		}
		return { success: true, message: 'Pergerakan stok diubah' };
	},

	delete: async (event) => {
		const formData = await event.request.formData();
		const id = formData.get('id')?.toString() ?? '';
		try {
			await stockService.deleteMovement(id);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal menghapus' });
		}
		return { success: true, message: 'Pergerakan stok dihapus' };
	}
};
