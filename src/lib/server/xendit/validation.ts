import { z } from 'zod';

export const checkoutSchema = z.object({
	productId: z.string().min(1, 'Produk wajib dipilih'),
	quantity: z.coerce.number().positive('Quantity harus lebih dari 0'),
	customerName: z.string().min(2, 'Nama minimal 2 karakter'),
	customerPhone: z.string().min(8, 'Nomor telepon minimal 8 karakter'),
	customerAddress: z.string().min(10, 'Alamat minimal 10 karakter'),
	notes: z.string().max(500).optional()
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
