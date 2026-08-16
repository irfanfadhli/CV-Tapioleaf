import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import * as orderService from '$lib/server/order/service';

export const load: LayoutServerLoad = async (event) => {
	if (!event.locals.user) {
		throw redirect(303, '/login');
	}
	const [user, pendingCount] = await Promise.all([
		Promise.resolve({
			name: event.locals.user.name,
			email: event.locals.user.email,
			role: event.locals.user.role
		}),
		orderService.getPendingOrdersCount()
	]);
	return { user, pendingCount };
};
