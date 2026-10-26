import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { reportQuerySchema } from '$lib/server/reports/validation';
import * as reportsService from '$lib/server/reports/service';
import { generateReportPDF, pdfToBuffer } from '$lib/server/reports/pdf';

const JKT_OFFSET_MS = 7 * 60 * 60 * 1000;

function toJktNow(): Date {
	return new Date(Date.now() + JKT_OFFSET_MS);
}

function getRange(period: string, opts: { startDate?: string; endDate?: string; month?: string }): { start: Date; end: Date } | null {
	if (period === 'all') return null;
	const todayJkt = toJktNow();
	if (period === 'month-pick') { const mStr = opts.month ?? `${todayJkt.getUTCFullYear()}-${String(todayJkt.getUTCMonth() + 1).padStart(2, '0')}`; const [yRaw, mRaw] = mStr.split('-'); const y = Number(yRaw), m = Number(mRaw) - 1; const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); return { start: new Date(Date.UTC(y, m, 1) - JKT_OFFSET_MS), end: new Date(Date.UTC(y, m, lastDay, 23, 59, 59, 999) - JKT_OFFSET_MS) }; }
	if (period === 'custom' && opts.startDate && opts.endDate) return { start: new Date(opts.startDate + 'T00:00:00+07:00'), end: new Date(opts.endDate + 'T23:59:59.999+07:00') };
	// Termasuk nilai tidak dikenal (today/week lama) → tanpa batas tanggal (Semua)
	return null;
}

export const GET: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) throw error(401, 'Unauthorized');
	const role = user.role as string;
	const tabAllowed: Record<string, string[]> = { sales: ['owner', 'admin_penjualan'], stock: ['owner', 'petugas_gudang'], production: ['owner', 'bagian_produksi'] };

	const q = reportQuerySchema.safeParse(Object.fromEntries(event.url.searchParams));
	const query = q.success
		? q.data
		: { tab: 'sales' as const, period: 'all' as const, startDate: undefined, endDate: undefined, month: undefined, page: 1 };
	if (!tabAllowed[query.tab]?.includes(role)) throw error(403, 'Tidak memiliki akses');

	const range = getRange(query.period, { startDate: query.startDate, endDate: query.endDate, month: query.month });

	// Fetch ALL data (no pagination) for export
	const filter = { start: range?.start, end: range?.end, page: 1, limit: 100000 };
	let data: any;
	if (query.tab === 'sales') data = await reportsService.getSalesReport(filter);
	else if (query.tab === 'stock') data = await reportsService.getStockReport(filter);
	else data = await reportsService.getProductionReport(filter);

	const monthLabel = query.month ? (() => { const [yRaw, mRaw] = query.month.split('-'); return new Date(Number(yRaw), Number(mRaw) - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }); })() : '';

	const periodLabel =
		query.period === 'all' ? (data.dataRange ? `Semua Waktu (${data.dataRange.start.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} – ${data.dataRange.end.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })})` : 'Semua Waktu')
		: query.period === 'month-pick' ? `Bulan: ${monthLabel}`
		: range ? `${range.start.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} – ${range.end.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}` : '-';

	const typeLabels: Record<string, string> = { sales: 'penjualan', stock: 'stok', production: 'produksi' };
	const filename =
		query.period === 'all' ? `laporan-${typeLabels[query.tab]}-semua.pdf`
		: query.period === 'month-pick' && query.month ? `laporan-${typeLabels[query.tab]}-${query.month}.pdf`
		: range ? `laporan-${typeLabels[query.tab]}-${range.start.toISOString().slice(0, 10)}-${range.end.toISOString().slice(0, 10)}.pdf`
		: `laporan-${typeLabels[query.tab]}.pdf`;

	const doc = generateReportPDF(query.tab, data, periodLabel);
	const pdfBuffer = await pdfToBuffer(doc);

	return new Response(pdfBuffer as unknown as BodyInit, {
		headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"` }
	});
};
