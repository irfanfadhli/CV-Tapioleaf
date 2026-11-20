import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		// Jika dari flow checkout produk, redirect balik ke halaman utama
		const isCheckout = event.url.searchParams.get('checkout') === '1';
		throw redirect(303, isCheckout ? '/?checkout=1' : '/account');
	}
	return {};
};