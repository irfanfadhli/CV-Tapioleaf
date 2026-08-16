import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as orderService from '$lib/server/order/service';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) throw redirect(303, '/login');

	const section = event.url.searchParams.get('section') || 'latest';
	const activeProducts = await orderService.getActiveProductsForOrder();

	if (section === 'all') {
		const page = Number(event.url.searchParams.get('page')) || 1;
		const limit = 12;
		const search = event.url.searchParams.get('search') || undefined;

		const items = await orderService.getAllOrders(search, page, limit);
		const total = await orderService.getOrderCount(search);

		return {
			orders: items,
			activeProducts,
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
			search,
			section: 'all'
		};
	}

	const items = await orderService.getAllOrders(undefined, 1, 6);
	const total = await orderService.getOrderCount();

	return {
		orders: items,
		activeProducts,
		page: 1,
		limit: 6,
		total,
		totalPages: 1,
		search: undefined,
		section: 'latest'
	};
};

export const actions: Actions = {
	cancel: async (event) => {
		if (!event.locals.user) return fail(401, { message: 'Silakan login terlebih dahulu' });
		
		const formData = await event.request.formData();
		const orderId = formData.get('orderId')?.toString() ?? '';
		
		if (!orderId) return fail(400, { message: 'ID pesanan tidak valid' });
		
		try {
			await orderService.cancelOrder(orderId, 'ADMIN');
			return { success: true, message: 'Pesanan berhasil dibatalkan' };
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal membatalkan pesanan' });
		}
	},
	approve: async (event) => {
		if (!event.locals.user) return fail(401, { message: 'Silakan login terlebih dahulu' });
		
		const formData = await event.request.formData();
		const orderId = formData.get('orderId')?.toString() ?? '';
		
		if (!orderId) return fail(400, { message: 'ID pesanan tidak valid' });
		
		try {
			const result = await orderService.approveOrder(orderId, event.url.origin);
			return { success: true, invoiceUrl: result.invoiceUrl, message: result.message };
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal menyetujui pesanan' });
		}
	},
	createOffline: async (event) => {
		if (!event.locals.user) return fail(401, { message: 'Silakan login terlebih dahulu' });

		const formData = await event.request.formData();
		const customerName = formData.get('customerName')?.toString().trim() || '';
		const customerPhone = formData.get('customerPhone')?.toString().trim() || undefined;
		const customerAddress = formData.get('customerAddress')?.toString().trim() || undefined;
		const notes = formData.get('notes')?.toString().trim() || undefined;
		const itemsJson = formData.get('items')?.toString() || '[]';

		if (!customerName) {
			return fail(400, { message: 'Nama pelanggan wajib diisi' });
		}

		let items: Array<{ productId: string; quantity: number }> = [];
		try {
			items = JSON.parse(itemsJson);
		} catch {
			return fail(400, { message: 'Format data item tidak valid' });
		}

		if (!items || items.length === 0) {
			return fail(400, { message: 'Pilih minimal satu produk' });
		}

		try {
			const result = await orderService.createOfflineCashOrder({
				customerName,
				customerPhone,
				customerAddress,
				notes,
				items
			});

			return {
				success: true,
				message: `Pesanan offline tunai senilai Rp ${Number(result.totalAmount).toLocaleString('id-ID')} berhasil dibuat dan berstatus LUNAS.`
			};
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal membuat pesanan offline' });
		}
	}
};
