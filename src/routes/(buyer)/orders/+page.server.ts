import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as orderService from '$lib/server/order/service';
import { checkoutSchema } from '$lib/server/xendit/validation';

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
			const parsed = checkoutSchema.safeParse({
				productId: formData.get('productId')?.toString() ?? '',
				quantity: formData.get('quantity')?.toString() ?? '',
				customerName: (formData.get('customerName')?.toString() ?? '').trim(),
				customerPhone: (formData.get('customerPhone')?.toString() ?? '').trim(),
				customerAddress: (formData.get('customerAddress')?.toString() ?? '').trim(),
				notes: formData.get('notes')?.toString() || undefined,
				shippingFee: formData.get('shippingFee')?.toString() || '0',
				shippingCourier: formData.get('shippingCourier')?.toString() || undefined,
				shippingService: formData.get('shippingService')?.toString() || undefined
			});

			if (!parsed.success) {
				const firstError = parsed.error.issues[0]?.message || 'Data tidak valid';
				return fail(400, { message: firstError });
			}

			const result = await orderService.createOrder(parsed.data, event.locals.user.id);
			return { orderId: result.orderId };
		} catch (e) {
			const msg = e instanceof Error ? `${e.message}\n${e.stack}` : JSON.stringify(e);
			console.error('Checkout error:', msg);
			return fail(500, { message: msg.slice(0, 500) });
		}
	}
};
