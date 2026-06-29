import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/auth.schema';
import { eq } from 'drizzle-orm';
import * as orderService from '$lib/server/order/service';

const adminEmails = (env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) throw redirect(303, '/login');

	const userEmail = event.locals.user.email?.toLowerCase() || '';
	const userRole = event.locals.user.role;

	if (adminEmails.includes(userEmail) && userRole === 'pembeli_umkm') {
		let role = 'owner';
		if (userEmail.includes('produksi')) role = 'bagian_produksi';
		else if (userEmail.includes('admin') || userEmail.includes('penjualan')) role = 'admin_penjualan';
		else if (userEmail.includes('gudang')) role = 'petugas_gudang';

		await db.update(user).set({ role, name: 'CV TapioLeaf' }).where(eq(user.id, event.locals.user.id));
	}

	const roleAfterUpdate = adminEmails.includes(userEmail) && userRole === 'pembeli_umkm'
		? (userEmail.includes('produksi') ? 'bagian_produksi' :
		   userEmail.includes('admin') || userEmail.includes('penjualan') ? 'admin_penjualan' :
		   userEmail.includes('gudang') ? 'petugas_gudang' : 'owner')
		: userRole;

	const roleRedirects: Record<string, string> = {
		owner: '/dashboard',
		admin_penjualan: '/produk',
		petugas_gudang: '/gudang',
		bagian_produksi: '/produksi'
	};

	if (roleRedirects[roleAfterUpdate]) {
		throw redirect(303, roleRedirects[roleAfterUpdate]);
	}

	const ordersData = await orderService.getUserOrders(event.locals.user.id, 1, 10);
	return { user: event.locals.user, orders: ordersData.items };
};
