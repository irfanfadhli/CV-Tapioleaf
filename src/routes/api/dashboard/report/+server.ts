import { getDashboardDataWithMargins } from '$lib/server/dashboard/service';
import type { RequestHandler } from './$types';
import PDFDocument from 'pdfkit';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
	if (!['owner', 'admin_penjualan'].includes(event.locals.user.role)) {
		return new Response('Forbidden', { status: 403 });
	}

	const period = event.url.searchParams.get('period') || 'today';
	const data = await getDashboardDataWithMargins(period);

	const doc = new PDFDocument({ margin: 40, size: 'A4' });
	const buffers: Buffer[] = [];
	doc.on('data', (chunk: Buffer) => buffers.push(chunk));

	const periodLabel = period === 'today' ? 'Hari Ini' : period === 'week' ? 'Minggu Ini' : 'Bulan Ini';

	doc.font('Helvetica-Bold').fontSize(18).text('CV TapioLeaf', { align: 'center' });
	doc.font('Helvetica').fontSize(10).fillColor('#666').text('Laporan Dashboard', { align: 'center' });
	doc.fillColor('#666').fontSize(9).text(`Periode: ${periodLabel}`, { align: 'center' });
	doc.moveDown(1.5);

	const lineY = doc.y;
	doc.moveTo(40, lineY).lineTo(550, lineY).stroke('#ddd');
	doc.moveDown(1);

	doc.font('Helvetica-Bold').fontSize(12).fillColor('#333').text('Ringkasan Penjualan');
	doc.font('Helvetica').fontSize(10).fillColor('#555');
	doc.text(`Total: Rp ${data.sales.total.toLocaleString('id-ID')}`);
	doc.text(`Transaksi: ${data.sales.count}`);
	if (data.sales.change !== null) {
		doc.text(`Perubahan: ${data.sales.change >= 0 ? '+' : ''}${data.sales.change.toFixed(1)}%`, { continued: false });
	}
	doc.moveDown(0.5);

	doc.font('Helvetica-Bold').fontSize(12).fillColor('#333').text('Ringkasan Produksi');
	doc.font('Helvetica').fontSize(10).fillColor('#555');
	doc.text(`Total: ${data.production.totalKg.toLocaleString('id-ID')} kg dari ${data.production.targetKg.toLocaleString('id-ID')} kg (${data.production.percentage}%)`);
	doc.moveDown(0.5);

	doc.font('Helvetica-Bold').fontSize(12).fillColor('#333').text('Ringkasan Stok');
	doc.font('Helvetica').fontSize(10).fillColor('#555');
	doc.text(`Total SKU: ${data.stock.totalSKU}`);
	doc.text(`Stok Kritis: ${data.stock.criticalCount}`);
	doc.moveDown(0.5);

	doc.font('Helvetica-Bold').fontSize(12).fillColor('#333').text('Pendapatan & Margin');
	doc.font('Helvetica').fontSize(10).fillColor('#555');
	doc.text(`Total Pendapatan: Rp ${data.revenue.total.toLocaleString('id-ID')}`);
	if (data.revenue.margin !== null) doc.text(`Margin: ${data.revenue.margin}%`);
	doc.moveDown(1);

	if (data.marginPerProduct.length > 0) {
		const lineY2 = doc.y;
		doc.moveTo(40, lineY2).lineTo(550, lineY2).stroke('#ddd');
		doc.moveDown(1);

		doc.font('Helvetica-Bold').fontSize(12).fillColor('#333').text('Margin Per Produk');
		doc.moveDown(0.3);

		const tableTop = doc.y;
		const colX = [40, 200, 320, 430];

		doc.font('Helvetica-Bold').fontSize(9).fillColor('#333');
		doc.text('Produk', colX[0], tableTop);
		doc.text('Modal', colX[1], tableTop);
		doc.text('Penjualan', colX[2], tableTop);
		doc.text('Margin', colX[3], tableTop);

		doc.moveTo(40, doc.y + 2).lineTo(550, doc.y + 2).stroke('#ddd');

		doc.font('Helvetica').fontSize(8).fillColor('#555');
		for (const m of data.marginPerProduct) {
			const y = doc.y + 4;
			if (y > 750) break;
			doc.text(m.name.length > 20 ? m.name.slice(0, 20) + '...' : m.name, colX[0], y);
			doc.text(`Rp ${m.cost.toLocaleString('id-ID')}`, colX[1], y);
			doc.text(`Rp ${m.revenue.toLocaleString('id-ID')}`, colX[2], y);
			doc.text(m.margin !== null ? `${m.margin}%` : 'N/A', colX[3], y);
			doc.y = y + 14;
		}
		doc.moveDown(1);
	}

	const lineY3 = doc.y;
	doc.moveTo(40, lineY3).lineTo(550, lineY3).stroke('#ddd');
	doc.moveDown(1);

	doc.font('Helvetica-Bold').fontSize(12).fillColor('#333').text('Transaksi Terbaru');
	doc.moveDown(0.3);

	for (const t of data.recentTransactions.slice(0, 10)) {
		const y = doc.y;
		if (y > 750) break;
		doc.font('Helvetica').fontSize(9).fillColor('#333').text(t.customerName || 'Anonim', 40, y);
		doc.font('Helvetica').fontSize(9).fillColor('#555').text(`Rp ${Number(t.totalAmount).toLocaleString('id-ID')}`, 250, y);
		doc.font('Helvetica').fontSize(9).fillColor('#666').text(t.status, 400, y);
		doc.y = y + 14;
	}

	doc.moveDown(2);
	doc.fontSize(8).fillColor('#999').text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, { align: 'center' });

	doc.end();

	const pdfBuffer = await new Promise<Buffer>((resolve) => {
		doc.on('end', () => resolve(Buffer.concat(buffers) as unknown as Buffer));
	});

	return new Response(pdfBuffer as BodyInit, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="dashboard-${period}-${new Date().toISOString().slice(0, 10)}.pdf"`
		}
	});
};
