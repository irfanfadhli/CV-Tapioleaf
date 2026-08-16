import { fail, redirect } from '@sveltejs/kit';
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
		try {
			if (!event.locals.user) return fail(401, { message: 'Silakan login terlebih dahulu' });

			const formData = await event.request.formData();
			const productId = formData.get('productId')?.toString() ?? '';
			if (!productId) return fail(400, { message: 'Produk tidak dipilih' });

			const input = {
				productId,
				quantity: Number(formData.get('quantity')?.toString() ?? '0'),
				customerName: formData.get('customerName')?.toString() ?? '',
				customerPhone: formData.get('customerPhone')?.toString() ?? '',
				customerAddress: formData.get('customerAddress')?.toString() ?? '',
				notes: formData.get('notes')?.toString() || undefined
			};

			if (!input.quantity || input.quantity <= 0) return fail(400, { message: 'Jumlah tidak valid' });
			if (!input.customerName) return fail(400, { message: 'Nama harus diisi' });
			if (!input.customerPhone) return fail(400, { message: 'No. telepon harus diisi' });
			if (!input.customerAddress) return fail(400, { message: 'Alamat harus diisi' });

			const result = await orderService.createOrder(input, event.locals.user.id);
			return { orderId: result.orderId };
		} catch (e) {
			const msg = e instanceof Error ? `${e.message}\n${e.stack}` : JSON.stringify(e);
			console.error('Checkout error:', msg);
			return fail(500, { message: msg.slice(0, 500) });
		}
	}
};
