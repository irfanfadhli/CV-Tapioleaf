import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createAuthMiddleware } from 'better-auth/api';
import { sveltekitCookies } from 'better-auth/svelte-kit';

import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { authLogs } from '$lib/server/db/schema/auth-logs';

export const auth = betterAuth({
	baseURL: env.ORIGIN || 'http://localhost:5173',
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: { enabled: false },
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID || '',
			clientSecret: env.GOOGLE_CLIENT_SECRET || '',
			prompt: 'select_account'
		}
	},
	user: {
		additionalFields: {
			role: {
				type: 'string',
				required: true,
				defaultValue: 'pembeli_umkm',
				input: false
			}
		}
	},
	rateLimit: {
		enabled: true,
		window: 10,
		max: 100
	},
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			const { path, context } = ctx;
			if (path === '/sign-out') {
				const session = context.newSession || context.session;
				if (session) {
					try {
						const event = getRequestEvent();
						await db.insert(authLogs).values({
							userId: session.user.id,
							email: session.user.email,
							event: 'logout',
							ipAddress: event.request.headers.get('x-forwarded-for') || event.request.headers.get('x-real-ip') || 'unknown',
							userAgent: event.request.headers.get('user-agent')
						});
					} catch {}
				}
			}
		})
	},
	plugins: [sveltekitCookies(getRequestEvent)]
});
