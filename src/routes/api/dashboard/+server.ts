import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDashboardDataWithMargins } from '$lib/server/dashboard/service';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const allowedRoles = ['owner', 'admin_penjualan'];
	if (!allowedRoles.includes(event.locals.user.role)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const period = event.url.searchParams.get('period') || 'today';
	if (!['today', 'week', 'month'].includes(period)) {
		return json({ error: 'Invalid period' }, { status: 400 });
	}

	const data = await getDashboardDataWithMargins(period);
	return json(data);
};
