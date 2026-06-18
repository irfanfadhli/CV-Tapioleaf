import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as stockService from '$lib/server/stock/service';
import * as productService from '$lib/server/product/service';

export const load: PageServerLoad = async (event) => {
	try {
		const query = Object.fromEntries(event.url.searchParams) as Record<string, string>;
		const result = await stockService.getAllCurrentStock(query as any);
		const allProducts = await productService.listProducts({ search: '', status: 'all', page: 1, limit: 50, sort: 'name', order: 'asc' } as any);
		return {
			items: result.items,
			pagination: result.pagination,
			products: allProducts.items,
			query,
			sort: query.sort || 'name',
			order: query.order || 'asc'
		};
	} catch (e) {
		console.error('Gudang load error:', e);
		throw error(500, String(e));
	}
};

export const actions: Actions = {
	adjust: async (event) => {
		const formData = await event.request.formData();
		const input = {
			productId: formData.get('productId')?.toString() ?? '',
			quantityChange: Number(formData.get('quantityChange')?.toString() ?? '0'),
			movementType: 'ADJUSTMENT',
			note: formData.get('note')?.toString() || undefined,
			reason: 'Penyesuaian dari halaman stok'
		};
		try {
			await stockService.addMovement(input as any, event.locals.user?.id);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal' });
		}
		return { success: true, message: 'Stok disesuaikan' };
	},

	deleteStock: async (event) => {
		const formData = await event.request.formData();
		const productId = formData.get('productId')?.toString() ?? '';
		try {
			const movements = await stockService.getMovements({ productId, page: 1, limit: 100 } as any);
			for (const m of movements.items) {
				await stockService.deleteMovement(m.id);
			}
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal' });
		}
		return { success: true, message: 'Stok dihapus' };
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
