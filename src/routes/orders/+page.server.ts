import { fail, redirect, json } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as orderService from '$lib/server/order/service';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) throw redirect(303, '/login');
	const page = Number(event.url.searchParams.get('page')) || 1;
	const result = await orderService.getUserOrders(event.locals.user.id, page);
	return { orders: result.items, page: result.page, total: result.total };
};

export const actions: Actions = {
	checkout: async (event) => {
		if (!event.locals.user) return fail(401, { message: 'Silakan login terlebih dahulu' });

		const formData = await event.request.formData();
		const input = {
			productId: formData.get('productId')?.toString() ?? '',
			quantity: Number(formData.get('quantity')?.toString() ?? '0'),
			customerName: formData.get('customerName')?.toString() ?? '',
			customerPhone: formData.get('customerPhone')?.toString() ?? '',
			customerAddress: formData.get('customerAddress')?.toString() ?? '',
			notes: formData.get('notes')?.toString() || undefined
		};

		try {
			const result = await orderService.createOrder(input, event.locals.user.id);
			return json({ invoiceUrl: result.invoiceUrl });
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal membuat pesanan' });
		}
	}
};
