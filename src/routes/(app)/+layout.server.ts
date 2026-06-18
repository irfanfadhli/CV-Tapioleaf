import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	if (!event.locals.user) {
		throw redirect(303, '/login');
	}
	return {
		user: {
			name: event.locals.user.name,
			email: event.locals.user.email,
			role: event.locals.user.role
		}
	};
};
