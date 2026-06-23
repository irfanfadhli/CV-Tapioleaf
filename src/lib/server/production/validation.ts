import { z } from 'zod';

export const createProductionSchema = z.object({
	productId: z.string().min(1, 'Produk wajib dipilih'),
	quantityKg: z.coerce.number().positive('Quantity harus lebih dari 0').max(10000, 'Maksimal 10.000 kg per entry'),
	cassavaUsedKg: z.coerce.number().positive('Jumlah singkong digunakan harus lebih dari 0'),
	yieldPercentage: z.coerce.number().min(0, 'Yield tidak boleh negatif').max(100, 'Yield maksimal 100%').optional(),
	productionDate: z.string().optional(),
	notes: z.string().max(255).optional()
});

export const productionQuerySchema = z.object({
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	productId: z.string().optional(),
	status: z.enum(['DRAFT', 'CONFIRMED', 'all']).default('all'),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(20),
	sort: z.enum(['productionDate', 'quantityKg', 'createdAt']).default('productionDate'),
	order: z.enum(['asc', 'desc']).default('desc')
});

export type CreateProductionInput = z.infer<typeof createProductionSchema>;
export type ProductionQuery = z.infer<typeof productionQuerySchema>;
