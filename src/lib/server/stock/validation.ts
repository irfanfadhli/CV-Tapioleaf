import { z } from 'zod';

export const movementTypeEnum = ['PURCHASE_IN', 'MANUAL_IN', 'MANUAL_OUT', 'ADJUSTMENT'] as const;

export const createMovementSchema = z.object({
	productId: z.string().min(1, 'Produk wajib dipilih'),
	quantityChange: z.coerce.number().refine((v) => v !== 0, 'Quantity tidak boleh 0'),
	movementType: z.enum(movementTypeEnum),
	movementDate: z.string().optional(),
	note: z.string().max(255).optional(),
	reason: z.string().min(10, 'Alasan minimal 10 karakter').optional()
});

export const movementQuerySchema = z.object({
	productId: z.string().optional(),
	type: z.enum(movementTypeEnum).optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(20),
	sort: z.enum(['movementDate', 'createdAt', 'quantityChange']).default('createdAt'),
	order: z.enum(['asc', 'desc']).default('desc')
});

export const stockQuerySchema = z.object({
	search: z.string().optional(),
	status: z.enum(['all', 'critical']).default('all'),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(20),
	sort: z.enum(['code', 'name']).default('name'),
	order: z.enum(['asc', 'desc']).default('asc')
});

export type CreateMovementInput = z.infer<typeof createMovementSchema>;
export type MovementQuery = z.infer<typeof movementQuerySchema>;
export type StockQuery = z.infer<typeof stockQuerySchema>;

export const MOVEMENT_LABELS: Record<string, string> = {
	PURCHASE_IN: 'Pembelian',
	MANUAL_IN: 'Stok Masuk',
	MANUAL_OUT: 'Stok Keluar',
	ADJUSTMENT: 'Penyesuaian'
};

export const MOVEMENT_ICONS: Record<string, string> = {
	PURCHASE_IN: 'in',
	MANUAL_IN: 'in',
	MANUAL_OUT: 'out',
	ADJUSTMENT: 'adjust'
};
