import { z } from 'zod';

export const createProductSchema = z.object({
	name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter').trim(),
	code: z.string().regex(/^[A-Za-z0-9\-]+$/, 'Kode hanya huruf, angka, dan tanda hubung').min(3).max(20).optional(),
	categoryId: z.string().min(1, 'Kategori wajib dipilih'),
	price: z.coerce.number().positive('Harga harus lebih dari 0').max(100_000_000, 'Harga terlalu besar'),
	unit: z.enum(['KG', 'TON', 'SAK', 'PCS'], { message: 'Satuan tidak valid' }),
	minimumStock: z.coerce.number().int().min(0, 'Stok minimum tidak boleh negatif').default(0),
	description: z.string().max(500).optional()
});

export const updateProductSchema = z.object({
	name: z.string().min(2).max(100).trim().optional(),
	price: z.coerce.number().positive().max(100_000_000).optional(),
	unit: z.enum(['KG', 'TON', 'SAK', 'PCS']).optional(),
	minimumStock: z.coerce.number().int().min(0).optional(),
	description: z.string().max(500).optional(),
	categoryId: z.string().min(1).optional()
});

export const productQuerySchema = z.object({
	search: z.string().optional(),
	categoryId: z.string().optional(),
	status: z.enum(['active', 'inactive', 'all']).default('active'),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(1000).default(20),
	sort: z.enum(['code', 'name', 'price', 'createdAt']).default('name'),
	order: z.enum(['asc', 'desc']).default('asc')
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;

export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
