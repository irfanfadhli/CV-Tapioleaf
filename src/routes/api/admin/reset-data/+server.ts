import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sales, saleItems } from '$lib/server/db/schema/sales';
import { stockMovements } from '$lib/server/db/schema/stock';
import { productionEntries } from '$lib/server/db/schema/production';
import { orders, orderItems } from '$lib/server/db/schema/order';

export const POST: RequestHandler = async (event) => {
	// Pastikan user login
	if (!event.locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// 1. Hapus data penimbangan tepung & penjualan tepung
		await db.delete(saleItems);
		await db.delete(sales);

		// 2. Hapus data produksi
		await db.delete(productionEntries);

		// 3. Hapus data pesanan/penjualan mitra/buyer
		try {
			await db.delete(orderItems);
		} catch {}
		try {
			await db.delete(orders);
		} catch {}

		// 4. Hapus riwayat mutasi stok gudang
		await db.delete(stockMovements);

		return json({
			success: true,
			message: 'Semua data produksi, penjualan, mutasi stok gudang, dan penimbangan tepung berhasil dihapus.'
		});
	} catch (e) {
		console.error('Error reset operational data:', e);
		return json({
			success: false,
			error: e instanceof Error ? e.message : 'Gagal menghapus data'
		}, { status: 500 });
	}
};
