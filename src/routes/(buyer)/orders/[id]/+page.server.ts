import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as orderService from '$lib/server/order/service';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) throw redirect(303, '/login');
	const order = await orderService.getOrder(event.params.id);
	if (order.userId && order.userId !== event.locals.user.id) {
		throw redirect(303, '/orders');
	}
	return { order };
};

export const actions: Actions = {};
