import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as orderService from '$lib/server/order/service';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const [notifications, count] = await Promise.all([
		orderService.getUnreadNotifications(locals.user.id),
		orderService.getUnreadNotificationCount(locals.user.id)
	]);

	return json({ notifications, count });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json();
	const { ids } = body as { ids?: string[] };

	if (!ids || !Array.isArray(ids) || ids.length === 0) {
		return json({ error: 'No notification IDs provided' }, { status: 400 });
	}

	await orderService.markNotificationsRead(locals.user.id, ids);
	return json({ success: true });
};