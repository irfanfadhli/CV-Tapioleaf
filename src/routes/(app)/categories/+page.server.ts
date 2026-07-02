import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as productService from '$lib/server/product/service';

export const load: PageServerLoad = async (event) => {
	const page = Number(event.url.searchParams.get('page')) || 1;
	const search = event.url.searchParams.get('search') || undefined;
	const sort = (event.url.searchParams.get('sort') as 'name') || 'name';
	const order = (event.url.searchParams.get('order') as 'asc' | 'desc') || 'asc';
	const status = event.url.searchParams.get('status') || 'active';
	const result = await productService.listCategories(page, 10, search, sort, order, status);
	return { categories: result.items, pagination: result.pagination, search: search || '', sort, order, status };
};

export const actions: Actions = {
	create: async (event) => {
		const formData = await event.request.formData();
		const name = formData.get('name')?.toString() ?? '';
		try {
			await productService.createCategory(name);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal membuat kategori' });
		}
		return { success: true, message: 'Kategori ditambahkan' };
	},

	toggleStatus: async (event) => {
		const formData = await event.request.formData();
		const id = formData.get('id')?.toString() ?? '';
		try {
			await productService.toggleCategoryStatus(id);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal mengubah status' });
		}
		return { success: true };
	},

	edit: async (event) => {
		const formData = await event.request.formData();
		const id = formData.get('id')?.toString() ?? '';
		const name = formData.get('name')?.toString() ?? '';
		try {
			await productService.updateCategory(id, name);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal mengubah kategori' });
		}
		return { success: true, message: 'Kategori diubah' };
	},

	delete: async (event) => {
		const formData = await event.request.formData();
		const id = formData.get('id')?.toString() ?? '';
		try {
			await productService.deleteCategory(id);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal menghapus kategori' });
		}
		return { success: true, message: 'Kategori dihapus' };
	}
};
