import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as orderService from '$lib/server/order/service';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const [count, recent] = await Promise.all([
		orderService.getPendingOrdersCount(),
		orderService.getRecentPendingOrders(5)
	]);

	return json({ count, recent });
};