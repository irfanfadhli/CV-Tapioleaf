import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as stockService from '$lib/server/stock/service';
import * as productService from '$lib/server/product/service';
import { db } from '$lib/server/db';
import { cassavaReceipts } from '$lib/server/db/schema/cassava';
import { productionEntries } from '$lib/server/db/schema/production';
import { products } from '$lib/server/db/schema/product';
import { sales } from '$lib/server/db/schema/sales';
import { sql, eq, isNull } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	try {
		const query = Object.fromEntries(event.url.searchParams) as Record<string, string>;
		const result = await stockService.getAllCurrentStock(query as any);
		const allProducts = await productService.listProducts({ search: '', status: 'all', page: 1, limit: 50, sort: 'name', order: 'asc' } as any);
		const [cassavaIn] = await db.select({ total: sql<string>`COALESCE(SUM(final_weight::numeric), 0)` }).from(cassavaReceipts).where(isNull(cassavaReceipts.deletedAt)).limit(1);
		const [cassavaOut] = await db.select({ total: sql<string>`COALESCE(SUM(cassava_used_kg::numeric), 0)` }).from(productionEntries).where(isNull(productionEntries.deletedAt)).limit(1);
		const cassavaStock = Math.max(0, Number(cassavaIn?.total || 0) - Number(cassavaOut?.total || 0));

		// Total berat bersih dari penimbangan tepung (sales) yang sudah dikonfirmasi
		const [totalWeighed] = await db
			.select({ total: sql<string>`COALESCE(SUM(net_weight::numeric), 0)` })
			.from(sales)
			.where(eq(sales.status, 'confirmed'))
			.limit(1);
		const totalWeighedKg = Number(totalWeighed?.total || 0);

		// Hitung total berat stok produk jadi di gudang
		const productStockKg = (result.items || []).reduce((sum, item: any) => {
			const stock = Number(item.currentStock || 0);
			const unit = (item.unit || '').toUpperCase();
			const name = (item.productName || item.name || '').toLowerCase();
			if (unit === 'SAK' || unit.includes('SAK')) {
				const match = name.match(/(\d+)\s*kg/);
				const sakWeight = match ? Number(match[1]) : 25;
				return sum + (stock * sakWeight);
			}
			return sum + stock;
		}, 0);

		// Total stok tepung tapioka = stok produk di gudang + total hasil penimbangan tepung bersih
		const totalTapiocaStockKg = totalWeighedKg > 0 ? totalWeighedKg : productStockKg;

		return {
			items: result.items,
			pagination: result.pagination,
			products: allProducts.items,
			query,
			sort: query.sort || 'name',
			order: query.order || 'asc',
			cassavaStock,
			totalTapiocaStockKg
		};
	} catch (e) {
		console.error('Gudang load error:', e);
		throw error(500, String(e));
	}
};

export const actions: Actions = {
	deleteStock: async (event) => {
		const formData = await event.request.formData();
		const productId = formData.get('productId')?.toString() ?? '';
		if (!productId) return fail(400, { message: 'ID tidak valid' });
		try {
			// Reset stok produk di gudang menjadi 0 (menggunakan stock movement penyesuaian/reset)
			// Produk di manajemen produk TETAP ADA (tidak dihapus)
			const currentStock = await stockService.getCurrentStock(productId);
			if (currentStock !== 0) {
				await stockService.addMovement({
					productId,
					quantityChange: -currentStock,
					movementType: 'ADJUSTMENT',
					reason: 'Pengosongan/reset stok gudang manual',
					note: 'Reset stok gudang ke 0'
				}, event.locals.user?.id);
			}
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal mengosongkan stok' });
		}
		return { success: true };
	},

	create: async (event) => {
		const formData = await event.request.formData();
		let qty = Number(formData.get('quantityChange')?.toString() ?? '0');
		const movementType = formData.get('movementType')?.toString() ?? 'MANUAL_IN';
		if (movementType === 'MANUAL_OUT' && qty > 0) qty = -qty;
		const input = {
			productId: formData.get('productId')?.toString() ?? '',
			quantityChange: qty,
			movementType,
			movementDate: formData.get('movementDate')?.toString() || undefined,
			note: formData.get('note')?.toString() || undefined,
			reason: formData.get('reason')?.toString() || undefined
		} as any;
		try {
			await stockService.addMovement(input, event.locals.user?.id);
		} catch (e) {
			return { message: e instanceof Error ? e.message : 'Gagal', success: false };
		}
		return { success: true, message: 'Pergerakan stok berhasil dicatat' };
	}
};
