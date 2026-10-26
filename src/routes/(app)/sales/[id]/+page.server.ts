import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import * as salesService from '$lib/server/sales/service';

export const load: PageServerLoad = async (event) => {
	try {
		const sale = await salesService.getSale(event.params.id);
		return { sale };
	} catch (e) {
		console.error('Sale detail load error:', e);
		throw error(404, e instanceof Error ? e.message : 'Transaksi tidak ditemukan');
	}
};
