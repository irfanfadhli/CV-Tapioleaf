import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as supplierService from '$lib/server/supplier/service';

export const load: PageServerLoad = async (event) => {
	const result = await supplierService.listSuppliers({});
	return { suppliers: result.items };
};

export const actions: Actions = {
	delete: async (event) => {
		const formData = await event.request.formData();
		const id = formData.get('id')?.toString() ?? '';
		if (!id) return fail(400, { message: 'ID tidak valid' });
		try {
			await supplierService.deleteSupplier(id);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal menghapus' });
		}
		return { success: true, message: 'Supplier dihapus' };
	}
};
