import { z } from 'zod';

export const checkoutSchema = z.object({
	productId: z.string().min(1, 'Produk wajib dipilih'),
	quantity: z.coerce.number().positive('Jumlah tidak boleh minus atau 0'),
	customerName: z
		.string()
		.min(2, 'Nama minimal 2 karakter')
		.regex(/^[a-zA-Z\s.,'-]+$/, 'Nama tidak boleh mengandung angka'),
	customerPhone: z
		.string()
		.min(8, 'Nomor telepon minimal 8 digit')
		.regex(/^(\+62|62|0)[0-9]{7,14}$/, 'Nomor telepon tidak boleh mengandung huruf dan harus berupa nomor yang valid'),
	customerAddress: z.string().min(3, 'Alamat atau informasi lokasi minimal 3 karakter'),
	notes: z.string().max(1000).optional(),
	shippingFee: z.coerce.number().min(0).default(0),
	shippingCourier: z.string().optional(),
	shippingService: z.string().optional()
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
