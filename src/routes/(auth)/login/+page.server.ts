import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const redirectUrl = event.url.searchParams.get('redirect');
	const isCheckout = event.url.searchParams.get('checkout') === '1';

	if (event.locals.user) {
		// Jika sudah login dan ada redirect URL (misal: /checkout?productId=...), langsung teruskan ke sana
		if (redirectUrl) {
			throw redirect(303, redirectUrl);
		}
		if (isCheckout) {
			throw redirect(303, '/#products');
		}
		// Default login biasa masuk ke dashboard
		throw redirect(303, '/dashboard');
	}
	return {};
};