import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as orderService from '$lib/server/order/service';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) throw redirect(303, '/login');
	const order = await orderService.getOrder(event.params.id);
	return { order };
};

export const actions: Actions = {
	cancel: async (event) => {
		if (!event.locals.user) return fail(401, { message: 'Silakan login terlebih dahulu' });

		const formData = await event.request.formData();
		const orderId = formData.get('orderId')?.toString() ?? '';

		if (!orderId) return fail(400, { message: 'ID pesanan tidak valid' });

		try {
			await orderService.cancelOrder(orderId, 'ADMIN');
			return { success: true, message: 'Pesanan berhasil dibatalkan' };
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal membatalkan pesanan' });
		}
	},
	approve: async (event) => {
		if (!event.locals.user) return fail(401, { message: 'Silakan login terlebih dahulu' });

		const formData = await event.request.formData();
		const orderId = formData.get('orderId')?.toString() ?? '';

		if (!orderId) return fail(400, { message: 'ID pesanan tidak valid' });

		try {
			const result = await orderService.approveOrder(orderId, event.url.origin);
			return { success: true, invoiceUrl: result.invoiceUrl, message: result.message };
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal menyetujui pesanan' });
		}
	}
};
