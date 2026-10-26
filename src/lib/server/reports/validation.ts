import { z } from 'zod';

export const periodEnum = ['all', 'month-pick', 'custom'] as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

export const reportQuerySchema = z.object({
	tab: z.enum(['sales', 'stock', 'production']).catch('sales'),
	period: z.enum(periodEnum).catch('all'),
	startDate: z.string().regex(DATE_RE).optional().or(z.literal('').transform(() => undefined)),
	endDate: z.string().regex(DATE_RE).optional().or(z.literal('').transform(() => undefined)),
	month: z.string().regex(MONTH_RE).optional().or(z.literal('').transform(() => undefined)),
	page: z.coerce.number().int().positive().catch(1)
});

/** Validasi rentang kustom: pesan error atau null bila tidak ada masalah. */
export function validateCustomRange(
	period: string,
	startDate?: string,
	endDate?: string
): string | null {
	if (period !== 'custom') return null;
	if (!startDate && !endDate) return 'Pilih rentang tanggal';
	if (!startDate || !endDate) return 'Isi tanggal awal dan tanggal akhir';
	if (endDate < startDate) return 'Tanggal akhir tidak boleh sebelum tanggal awal';
	return null;
}

export type ReportQuery = z.infer<typeof reportQuerySchema>;
