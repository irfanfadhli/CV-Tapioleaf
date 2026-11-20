import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as salesService from '$lib/server/sales/service';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const sale = await salesService.getSale(params.id);
		return json(sale);
	} catch (e) {
		throw error(404, e instanceof Error ? e.message : 'Transaksi tidak ditemukan');
	}
};
