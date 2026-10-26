import { z } from 'zod';

export const saleStatusEnum = ['draft', 'confirmed', 'cancelled'] as const;

export const createSaleSchema = z.object({
	buyerName: z.string().min(1, 'Nama pembeli wajib diisi'),
	buyerType: z.enum(['pengepul', 'umkm'], { message: 'Jenis pembeli wajib dipilih' }),
	productId: z.string().min(1, 'Produk wajib dipilih'),
	sackWeights: z.array(z.coerce.number().positive('Berat karung harus > 0')).min(1, 'Minimal 1 karung'),
	taraPerSack: z.coerce.number().min(0, 'Tara tidak boleh negatif').default(2),
	pricePerKg: z.coerce.number().positive('Harga per kg harus > 0'),
	kuliFeePerSack: z.coerce.number().min(0, 'Biaya kuli tidak boleh negatif').default(3000),
	saleDate: z.string().optional(),
	status: z.enum(['draft', 'confirmed']).default('draft')
});

export const updateSaleSchema = z.object({
	buyerName: z.string().min(1, 'Nama pembeli wajib diisi').optional(),
	buyerType: z.enum(['pengepul', 'umkm']).optional(),
	productId: z.string().min(1, 'Produk wajib dipilih').optional(),
	sackWeights: z.array(z.coerce.number().positive('Berat karung harus > 0')).min(1, 'Minimal 1 karung').optional(),
	taraPerSack: z.coerce.number().min(0).optional(),
	pricePerKg: z.coerce.number().positive().optional(),
	kuliFeePerSack: z.coerce.number().min(0).optional(),
	saleDate: z.string().optional()
});

export const salesQuerySchema = z.object({
	search: z.string().optional(),
	status: z.enum(['all', ...saleStatusEnum]).default('all'),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(20),
	sort: z.enum(['sale_date', 'created_at', 'total_payment', 'buyer_name']).default('created_at'),
	order: z.enum(['asc', 'desc']).default('desc')
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
export type SalesQuery = z.infer<typeof salesQuerySchema>;
