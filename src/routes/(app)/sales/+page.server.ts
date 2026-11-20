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

		const buyerTypeRaw = formData.get('buyerType')?.toString() || 'pengepul';
		let productIdRaw = formData.get('productId')?.toString() || '';
		if (!productIdRaw) {
			let [firstProduct] = await db
				.select({ id: products.id })
				.from(products)
				.where(and(eq(products.isActive, true), isNull(products.deletedAt)))
				.limit(1);
			if (!firstProduct) {
				[firstProduct] = await db
					.select({ id: products.id })
					.from(products)
					.where(isNull(products.deletedAt))
					.limit(1);
			}
			productIdRaw = firstProduct?.id || '';
		}

		const taraRaw = formData.get('taraPerSack')?.toString();
		const totalTaraCalculatedRaw = formData.get('totalTaraCalculated')?.toString();
		let totalTaraValue: number;
		if (taraRaw && !isNaN(Number(taraRaw))) {
			totalTaraValue = Number(taraRaw);
		} else if (totalTaraCalculatedRaw && !isNaN(Number(totalTaraCalculatedRaw))) {
			totalTaraValue = Number(totalTaraCalculatedRaw);
		} else {
			totalTaraValue = Math.ceil(sackWeights.length / 2);
		}

		const weigherNameVal = formData.get('weigherName')?.toString() || '';
		const buyerNameVal = formData.get('buyerName')?.toString() || '';
		const buyerPhoneVal = formData.get('buyerPhone')?.toString() || '';
		const entryType = (formData.get('entryType')?.toString() || 'weighing') as 'weighing' | 'sale';
		const directlyConfirm = formData.get('status')?.toString() === 'confirmed';

		const input = {
			buyerName: buyerNameVal || (entryType === 'weighing' ? (weigherNameVal || 'Hasil Penimbangan') : 'Pembeli'),
			buyerPhone: buyerPhoneVal || undefined,
			buyerType: buyerTypeRaw as 'pengepul' | 'umkm',
			weigherName: weigherNameVal || undefined,
			weigherAddress: formData.get('weigherAddress')?.toString() || undefined,
			weigherPhone: formData.get('weigherPhone')?.toString() || undefined,
			productId: productIdRaw || '',
			sackWeights,
			taraPerSack: totalTaraValue,
			pricePerKg: Number(formData.get('pricePerKg') ?? 6000),
			kuliFeePerSack: Number(formData.get('kuliFeePerSack') ?? 3500),
			saleDate: formData.get('saleDate')?.toString() || undefined,
			status: directlyConfirm ? ('confirmed' as const) : ('draft' as const),
			entryType
		};

		try {
			await salesService.createSale(input, event.locals.user?.id);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal membuat transaksi' });
		}
		return { success: true, message: 'Transaksi berhasil dibuat' };
	},

	update: async (event) => {
		const formData = await event.request.formData();
		const saleId = formData.get('saleId')?.toString() ?? '';
		if (!saleId) return fail(400, { message: 'ID transaksi tidak valid' });

		const sackWeightsRaw = formData.get('sackWeights')?.toString() ?? '[]';
		let sackWeights: number[];
		try {
			sackWeights = JSON.parse(sackWeightsRaw);
		} catch {
			return fail(400, { message: 'Format berat karung tidak valid' });
		}

		const taraRaw = formData.get('taraPerSack')?.toString();
		const totalTaraCalculatedRaw = formData.get('totalTaraCalculated')?.toString();
		let totalTaraValue: number;
		if (taraRaw && !isNaN(Number(taraRaw))) {
			totalTaraValue = Number(taraRaw);
		} else if (totalTaraCalculatedRaw && !isNaN(Number(totalTaraCalculatedRaw))) {
			totalTaraValue = Number(totalTaraCalculatedRaw);
		} else {
			totalTaraValue = Math.ceil(sackWeights.length / 2);
		}

		const weigherNameVal = formData.get('weigherName')?.toString() || '';
		const buyerNameVal = formData.get('buyerName')?.toString() || '';
		const buyerPhoneVal = formData.get('buyerPhone')?.toString() || '';

		const input = {
			buyerName: buyerNameVal || weigherNameVal || 'Pembeli',
			buyerPhone: buyerPhoneVal || undefined,
			weigherName: weigherNameVal || undefined,
			weigherAddress: formData.get('weigherAddress')?.toString() || undefined,
			weigherPhone: formData.get('weigherPhone')?.toString() || undefined,
			sackWeights,
			taraPerSack: totalTaraValue,
			pricePerKg: Number(formData.get('pricePerKg') ?? 6000),
			kuliFeePerSack: Number(formData.get('kuliFeePerSack') ?? 3500)
		};

		try {
			await salesService.updateDraftSale(saleId, input, event.locals.user?.id);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal memperbarui transaksi' });
		}
		return { success: true, message: 'Transaksi berhasil diperbarui' };
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
