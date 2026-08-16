import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import * as orderService from '$lib/server/order/service';

export const load: LayoutServerLoad = async (event) => {
	if (!event.locals.user) throw redirect(303, '/login');

	const [unreadCount, recent] = await Promise.all([
		orderService.getUnreadNotificationCount(event.locals.user.id),
		orderService.getUnreadNotifications(event.locals.user.id)
	]);

	return {
		unreadCount,
		recentNotifications: recent.map((n) => ({
			id: n.id,
			orderId: n.orderId,
			type: n.type,
			message: n.message,
			totalAmount: n.totalAmount ? String(n.totalAmount) : null,
			read: n.read,
			createdAt: n.createdAt.toISOString()
		}))
	};
};