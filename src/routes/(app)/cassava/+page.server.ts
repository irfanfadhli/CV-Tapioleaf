import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import * as cassavaService from '$lib/server/cassava/service';
import * as supplierService from '$lib/server/supplier/service';

export const load: PageServerLoad = async (event) => {
	const query = Object.fromEntries(event.url.searchParams);
	const [receipts, summary, supplierList] = await Promise.all([
		cassavaService.listReceipts(query as any),
		cassavaService.getSummary(),
		supplierService.listSuppliers({}),
	]);
	return { receipts, summary, suppliers: supplierList.items, query };
};

export const actions: Actions = {
	addSupplier: async (event) => {
		const formData = await event.request.formData();
		const name = formData.get('name')?.toString() ?? '';
		if (!name) return fail(400, { message: 'Nama supplier wajib diisi' });
		try {
			await supplierService.createSupplier({ name, phone: formData.get('phone')?.toString() || undefined, address: formData.get('address')?.toString() || undefined });
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal' });
		}
		return { success: true, message: 'Supplier ditambahkan' };
	},

	update: async (event) => {
		const formData = await event.request.formData();
		const id = formData.get('id')?.toString() ?? '';
		if (!id) return fail(400, { message: 'ID tidak valid' });
		const input = {
			receiptDate: formData.get('receiptDate')?.toString() ?? '',
			supplierId: formData.get('supplierId')?.toString() ?? '',
			vehicleNumber: formData.get('vehicleNumber')?.toString() ?? '',
			driverName: formData.get('driverName')?.toString() || undefined,
			grossWeight: Number(formData.get('grossWeight') ?? '0'),
			taraWeight: Number(formData.get('taraWeight') ?? '0'),
			refraction: Number(formData.get('refraction') ?? '0'),
			pricePerKg: Number(formData.get('pricePerKg') ?? '0'),
			notes: formData.get('notes')?.toString() || undefined,
		};
		try {
			await cassavaService.updateReceipt(id, input, event.locals.user!.id);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal memperbarui' });
		}
		return { success: true, message: 'Penerimaan diperbarui' };
	},

	delete: async (event) => {
		const formData = await event.request.formData();
		const id = formData.get('id')?.toString() ?? '';
		if (!id) return fail(400, { message: 'ID tidak valid' });
		try {
			await cassavaService.deleteReceipt(id);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal menghapus' });
		}
		return { success: true, message: 'Penerimaan dihapus' };
	},

	create: async (event) => {
		const formData = await event.request.formData();
		const input = {
			receiptDate: formData.get('receiptDate')?.toString() ?? new Date().toISOString().slice(0, 10),
			supplierId: formData.get('supplierId')?.toString() ?? '',
			vehicleNumber: formData.get('vehicleNumber')?.toString() ?? '',
			driverName: formData.get('driverName')?.toString() || undefined,
			grossWeight: Number(formData.get('grossWeight') ?? '0'),
			taraWeight: Number(formData.get('taraWeight') ?? '0'),
			refraction: Number(formData.get('refraction') ?? '0'),
			pricePerKg: Number(formData.get('pricePerKg') ?? '0'),
			notes: formData.get('notes')?.toString() || undefined,
		};
		if (!input.supplierId) return fail(400, { message: 'Pilih supplier' });
		if (input.grossWeight <= 0) return fail(400, { message: 'Gross weight harus > 0' });
		if (input.taraWeight > input.grossWeight) return fail(400, { message: 'Tara tidak boleh melebihi gross' });
		if (input.refraction > input.grossWeight - input.taraWeight) return fail(400, { message: 'Refraction tidak boleh melebihi net' });

		try {
			await cassavaService.createReceipt(input, event.locals.user!.id);
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal menyimpan' });
		}
		return { success: true, message: 'Penerimaan singkong berhasil dicatat' };
	}
};
