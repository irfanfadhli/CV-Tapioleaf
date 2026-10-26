import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { reportQuerySchema, validateCustomRange } from '$lib/server/reports/validation';
import * as reportsService from '$lib/server/reports/service';

const JKT_OFFSET_MS = 7 * 60 * 60 * 1000;

function toJktNow(): Date {
	return new Date(Date.now() + JKT_OFFSET_MS);
}

function getDateRange(period: string, opts: { startDate?: string; endDate?: string; month?: string }): { start: Date; end: Date } | null {
	if (period === 'all') return null;

	const todayJkt = toJktNow();

	if (period === 'month-pick') {
		const mStr = opts.month ?? `${todayJkt.getUTCFullYear()}-${String(todayJkt.getUTCMonth() + 1).padStart(2, '0')}`;
		const [yRaw, mRaw] = mStr.split('-');
		const y = Number(yRaw), m = Number(mRaw) - 1;
		const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
		return {
			start: new Date(Date.UTC(y, m, 1) - JKT_OFFSET_MS),
			end: new Date(Date.UTC(y, m, lastDay, 23, 59, 59, 999) - JKT_OFFSET_MS)
		};
	}
	if (period === 'custom') {
		if (!opts.startDate || !opts.endDate) return null;
		return { start: new Date(opts.startDate + 'T00:00:00+07:00'), end: new Date(opts.endDate + 'T23:59:59.999+07:00') };
	}

	// Termasuk nilai tidak dikenal (today/week lama) → tampil sebagai Semua
	return null;
}

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;
	if (!user) throw redirect(303, '/login');

	const role = user.role as string;
	const allowed = ['owner', 'admin_penjualan', 'petugas_gudang', 'bagian_produksi'];
	if (!allowed.includes(role)) throw error(403, 'Akses ditolak');

	const q = reportQuerySchema.safeParse(Object.fromEntries(event.url.searchParams));
	const query = q.success
		? q.data
		: { tab: 'sales' as const, period: 'all' as const, startDate: undefined, endDate: undefined, month: undefined, page: 1 };

	const customError = validateCustomRange(query.period, query.startDate, query.endDate);
	const range = customError ? null : getDateRange(query.period, { startDate: query.startDate, endDate: query.endDate, month: query.month });

	const filter = { start: range?.start, end: range?.end, page: query.page };

	let data: any = { rows: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }, dataRange: null };
	let loadError: string | null = null;

	if (!customError) {
		try {
			if (query.tab === 'sales') data = await reportsService.getSalesReport(filter);
			else if (query.tab === 'stock') data = await reportsService.getStockReport(filter);
			else data = await reportsService.getProductionReport(filter);
		} catch (e) {
			console.error('Laporan load error:', e);
			loadError = e instanceof Error ? e.message : 'Gagal memuat laporan';
		}
	}

	return {
		query: { tab: query.tab, period: query.period, startDate: query.startDate, endDate: query.endDate, month: query.month, page: query.page },
		range: range ? { start: range.start.toISOString(), end: range.end.toISOString() } : null,
		customError,
		loadError,
		data,
		role,
		userId: user.id
	};
};
