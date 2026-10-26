import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as salesService from '$lib/server/sales/service';
import { db } from '$lib/server/db';
import { products } from '$lib/server/db/schema/product';
import { eq, isNull, asc, and } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	try {
		const query = Object.fromEntries(event.url.searchParams) as Record<string, string>;
		const [result, summary, activeProducts] = await Promise.all([
			salesService.listSales(query as any),
			salesService.getSalesSummary(),
			db.select({
				id: products.id,
				name: products.name,
				code: products.code,
				price: products.price,
				unit: products.unit
			})
				.from(products)
				.where(and(eq(products.isActive, true), isNull(products.deletedAt)))
				.orderBy(asc(products.name))
		]);

		return {
			items: result.items,
			pagination: result.pagination,
			summary,
			products: activeProducts,
			query,
			sort: query.sort || 'created_at',
			order: query.order || 'desc'
		};
	} catch (e) {
		console.error('Sales load error:', e);
		throw error(500, String(e));
	}
};

export const actions: Actions = {
	create: async (event) => {
		const formData = await event.request.formData();
		const sackWeightsRaw = formData.get('sackWeights')?.toString() ?? '[]';
		let sackWeights: number[];
		try {
			sackWeights = JSON.parse(sackWeightsRaw);
		} catch {
			return fail(400, { message: 'Format berat karung tidak valid' });
		}

		const buyerTypeRaw = formData.get('buyerType')?.toString();
		const productIdRaw = formData.get('productId')?.toString();
		if (buyerTypeRaw !== 'pengepul' && buyerTypeRaw !== 'umkm') {
			return fail(400, { message: 'Jenis pembeli wajib dipilih' });
		}
		if (!productIdRaw) {
			return fail(400, { message: 'Produk wajib dipilih' });
		}

		const input = {
			buyerName: formData.get('buyerName')?.toString() ?? '',
			buyerType: buyerTypeRaw as 'pengepul' | 'umkm',
			productId: productIdRaw,
			sackWeights,
			taraPerSack: Number(formData.get('taraPerSack') ?? 2),
			pricePerKg: Number(formData.get('pricePerKg') ?? 0),
			kuliFeePerSack: Number(formData.get('kuliFeePerSack') ?? 3000),
			saleDate: formData.get('saleDate')?.toString() || undefined,
			status: (formData.get('status')?.toString() || 'draft') as 'draft' | 'confirmed'
		};

		try {
			await salesService.createSale(input, event.locals.user?.id);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal membuat transaksi' });
		}
		return { success: true, message: 'Transaksi berhasil dibuat' };
	},

	confirm: async (event) => {
		const formData = await event.request.formData();
		const saleId = formData.get('saleId')?.toString() ?? '';
		if (!saleId) return fail(400, { message: 'ID transaksi tidak valid' });

		try {
			await salesService.confirmSale(saleId, event.locals.user?.id);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal mengkonfirmasi' });
		}
		return { success: true, message: 'Transaksi berhasil dikonfirmasi' };
	},

	delete: async (event) => {
		const formData = await event.request.formData();
		const saleId = formData.get('saleId')?.toString() ?? '';
		if (!saleId) return fail(400, { message: 'ID transaksi tidak valid' });

		try {
			await salesService.deleteDraftSale(saleId);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal menghapus' });
		}
		return { success: true, message: 'Transaksi berhasil dihapus' };
	}
};
