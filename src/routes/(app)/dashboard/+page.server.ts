import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDashboardDataWithMargins } from '$lib/server/dashboard/service';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) throw redirect(303, '/login');

	const period = event.url.searchParams.get('period') || 'today';
	if (!['today', 'week', 'month'].includes(period)) {
		throw redirect(303, '/dashboard');
	}

	const data = await getDashboardDataWithMargins(period);
	return { data, period, user: event.locals.user };
};
