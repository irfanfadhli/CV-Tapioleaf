import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as productService from '$lib/server/product/service';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		throw redirect(303, '/login');
	}

	const query = Object.fromEntries(event.url.searchParams) as Record<string, string>;
	const result = await productService.listProducts(query as any);
	const categories = await productService.getCategories();

	return {
		products: result.items,
		pagination: result.pagination,
		categories,
		query,
		sort: query.sort || 'name',
		order: query.order || 'asc'
	};
};

export const actions: Actions = {
	create: async (event) => {
		const formData = await event.request.formData();
		const imageFile = formData.get('image') as File | null;

		const input = {
			name: formData.get('name')?.toString() ?? '',
			code: formData.get('code')?.toString() || undefined,
			categoryId: formData.get('categoryId')?.toString() ?? '',
			price: Number(formData.get('price') ?? '0'),
			costPrice: formData.get('costPrice') ? Number(formData.get('costPrice')) : undefined,
			unit: (formData.get('unit')?.toString() ?? 'KG') as 'KG' | 'TON' | 'SAK' | 'PCS',
			minimumStock: Number(formData.get('minimumStock') ?? '0'),
			description: formData.get('description')?.toString() || undefined
		};

		try {
			let imageBuffer: Buffer | undefined;
			let mimeType: string | undefined;
			if (imageFile && imageFile.size > 0) {
				imageBuffer = Buffer.from(await imageFile.arrayBuffer());
				mimeType = imageFile.type;
			}
			await productService.createProduct(input, imageBuffer, mimeType);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal menyimpan produk' });
		}
		return { success: true, message: 'Produk berhasil ditambahkan' };
	},

	update: async (event) => {
		const formData = await event.request.formData();
		const id = formData.get('id')?.toString() ?? '';
		const imageFile = formData.get('image') as File | null;

		const input: Record<string, unknown> = {};
		for (const field of ['name', 'price', 'costPrice', 'unit', 'minimumStock', 'description', 'categoryId']) {
			const val = formData.get(field)?.toString();
			if (val) input[field] = val;
		}
		if (formData.get('removeImage') === '1') input.removeImage = true;

		try {
			let imageBuffer: Buffer | undefined;
			let mimeType: string | undefined;
			if (imageFile && imageFile.size > 0) {
				imageBuffer = Buffer.from(await imageFile.arrayBuffer());
				mimeType = imageFile.type;
			}
			await productService.updateProduct(id, input, imageBuffer, mimeType);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal memperbarui produk' });
		}
		return { success: true, message: 'Produk berhasil diperbarui' };
	},

	delete: async (event) => {
		const formData = await event.request.formData();
		const id = formData.get('id')?.toString() ?? '';
		try {
			await productService.deleteProduct(id);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal menghapus produk' });
		}
		return { success: true, message: 'Produk dihapus' };
	},

	toggleStatus: async (event) => {
		const formData = await event.request.formData();
		const id = formData.get('id')?.toString() ?? '';
		try {
			await productService.toggleProductStatus(id);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal mengubah status' });
		}
		return { success: true };
	},

};
