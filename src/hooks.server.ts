import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { getRouteConfig } from '$lib/server/auth/routes';

export const handle: Handle = async ({ event, resolve }) => {
	if (!building) {
		const session = await auth.api.getSession({ headers: event.request.headers });
		if (session) {
			event.locals.session = session.session;
			event.locals.user = session.user as typeof event.locals.user;
		}

		const config = getRouteConfig(event.url.pathname);
		if (config?.protected) {
			if (!event.locals.user) {
				throw redirect(303, `/login?redirect=${encodeURIComponent(event.url.pathname)}`);
			}
			if (config.roles && !config.roles.includes(event.locals.user.role)) {
				throw redirect(303, '/403');
			}
		}

		if (event.url.pathname === '/login' && event.locals.user) {
			throw redirect(303, '/account');
		}
	}

	return svelteKitHandler({ event, resolve, auth, building });
};
