import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	const headers = new Headers({ Location: '/' });
	const expire = 'Thu, 01 Jan 1970 00:00:00 UTC';
	const base = `=; expires=${expire}; path=/; secure; samesite=lax; httponly`;
	const names = [
		'better-auth.session_token',
		'better-auth.session_data',
		'better-auth.account_data',
		'better-auth.dont_remember',
		'__Secure-better-auth.session_token',
		'__Secure-better-auth.session_data',
		'__Secure-better-auth.account_data',
		'__Secure-better-auth.dont_remember',
	];
	for (const name of names) {
		headers.append('Set-Cookie', `${name}${base}`);
	}
	return new Response(null, { status: 303, headers });
};
