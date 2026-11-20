import { z } from 'zod';

export const saleStatusEnum = ['draft', 'confirmed', 'cancelled'] as const;

export const createSaleSchema = z.object({
	buyerName: z.string().optional().default('Pelanggan'),
	buyerPhone: z.string().optional(),
	buyerAddress: z.string().optional(),
	buyerType: z.enum(['pengepul', 'umkm']).optional().default('pengepul'),
	weigherName: z.string().optional(),
	weigherAddress: z.string().optional(),
	weigherPhone: z.string().optional(),
	productId: z.string().optional().default(''),
	sackWeights: z.array(z.coerce.number().positive('Berat karung harus > 0')).min(1, 'Minimal 1 karung'),
	taraPerSack: z.coerce.number().min(0, 'Tara tidak boleh negatif').default(2),
	pricePerKg: z.coerce.number().min(0, 'Harga per kg tidak boleh negatif').default(6000),
	kuliFeePerSack: z.coerce.number().min(0, 'Biaya kuli tidak boleh negatif').default(3500),
	saleDate: z.string().optional(),
	status: z.enum(['draft', 'confirmed']).default('draft'),
	entryType: z.enum(['weighing', 'sale']).default('weighing')
});

export const updateSaleSchema = z.object({
	buyerName: z.string().optional(),
	buyerPhone: z.string().optional(),
	buyerAddress: z.string().optional(),
	buyerType: z.enum(['pengepul', 'umkm']).optional(),
	weigherName: z.string().optional(),
	weigherAddress: z.string().optional(),
	weigherPhone: z.string().optional(),
	productId: z.string().optional(),
	sackWeights: z.array(z.coerce.number().positive('Berat karung harus > 0')).min(1, 'Minimal 1 karung').optional(),
	taraPerSack: z.coerce.number().min(0).optional(),
	pricePerKg: z.coerce.number().min(0).optional(),
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
