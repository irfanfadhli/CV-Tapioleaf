import PDFDocument from 'pdfkit';
import type { SalesReport, StockReport, ProductionReport } from './service';
import { reportStatusLabel, reportTypeLabel } from '$lib/utils';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 36;

function fmtIDR(v: number): string {
	return `Rp ${v.toLocaleString('id-ID')}`;
}

function fmtDateID(d: Date | string): string {
	const date = typeof d === 'string' ? new Date(d) : d;
	return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function drawHeader(doc: InstanceType<typeof PDFDocument>, title: string, periodLabel: string, printTime: string) {
	doc.font('Helvetica-Bold').fontSize(18).text('CV TapioLeaf', { align: 'center' });
	doc.font('Helvetica-Bold').fontSize(13).text(title, { align: 'center' });
	doc.font('Helvetica').fontSize(9).fillColor('#64748b').text(`Periode: ${periodLabel}`, { align: 'center' });
	doc.font('Helvetica').fontSize(9).fillColor('#64748b').text(`Dicetak: ${printTime}`, { align: 'center' });
	doc.moveDown(0.8);
	doc.moveTo(MARGIN, doc.y).lineTo(A4_WIDTH - MARGIN, doc.y).lineWidth(0.5).stroke('#cbd5e1');
	doc.moveDown(0.8);
	doc.fillColor('#1e293b');
}

function drawFooter(doc: InstanceType<typeof PDFDocument>, pageNum: number, totalPages: number) {
	doc.font('Helvetica').fontSize(8).fillColor('#94a3b8').text(
		`Halaman ${pageNum} dari ${totalPages}`,
		MARGIN,
		A4_HEIGHT - 20,
		{ align: 'center', width: A4_WIDTH - MARGIN * 2, lineBreak: false }
	);
}

function drawTableHeader(doc: InstanceType<typeof PDFDocument>, cols: Array<{ label: string; width: number; align?: 'left' | 'right' | 'center' }>) {
	const tableTop = doc.y;
	let x = MARGIN;
	doc.rect(MARGIN, tableTop, A4_WIDTH - MARGIN * 2, 18).fill('#f1f5f9');
	doc.font('Helvetica-Bold').fontSize(8).fillColor('#1e293b');
	for (const col of cols) {
		const textX = col.align === 'right' ? x + col.width - 4 : x + 4;
		doc.text(col.label, textX, tableTop + 5, { align: col.align || 'left', width: col.width - 8 });
		x += col.width;
	}
	doc.y = tableTop + 22;
	doc.fillColor('#1e293b');
}

function checkPageBreak(doc: InstanceType<typeof PDFDocument>, neededY = 750): boolean {
	if (doc.y > neededY) {
		doc.addPage();
		doc.y = MARGIN;
		return true;
	}
	return false;
}

function drawSalesReport(doc: InstanceType<typeof PDFDocument>, data: SalesReport, periodLabel: string, printTime: string) {
	drawHeader(doc, 'LAPORAN PENJUALAN', periodLabel, printTime);

	// Summary
	doc.font('Helvetica-Bold').fontSize(11).fillColor('#1b5e20').text('Ringkasan');
	doc.font('Helvetica').fontSize(9).fillColor('#334155');
	doc.text(`Total Transaksi: ${data.summary.totalTransactions} transaksi`, { indent: 10 });
	doc.text(`Total Nilai: ${fmtIDR(data.summary.totalValue)}`, { indent: 10 });
	doc.text(`Lunas: ${data.summary.paidCount} transaksi`, { indent: 10 });
	doc.text(`Menunggu Pembayaran: ${data.summary.awaitingCount} transaksi`, { indent: 10 });
	if (data.summary.draftCount > 0) {
		doc.fillColor('#854d0e').text(`Draft (belum dihitung): ${data.summary.draftCount} nota (${fmtIDR(data.summary.draftValue)})`, { indent: 10 });
	}
	doc.fillColor('#1e293b');
	doc.moveDown(0.8);

	// Table
	const cols = [
		{ label: 'Tanggal', width: 80 },
		{ label: 'Pembeli', width: 140 },
		{ label: 'Tipe', width: 110 },
		{ label: 'Total', width: 100, align: 'right' as const },
		{ label: 'Status', width: 80, align: 'center' as const }
	];

	drawTableHeader(doc, cols);
	doc.font('Helvetica').fontSize(8);

	for (const r of data.rows) {
		checkPageBreak(doc, 750);
		if (doc.y < MARGIN + 20) drawTableHeader(doc, cols);
		const y = doc.y;

		doc.fillColor('#334155');
		doc.text(fmtDateID(r.date), MARGIN + 4, y);
		doc.text(r.buyerName.length > 22 ? r.buyerName.slice(0, 22) + '...' : r.buyerName, MARGIN + 84, y);
		doc.text(reportTypeLabel(r.type), MARGIN + 224, y);
		doc.text(fmtIDR(r.total), MARGIN + 334, y, { align: 'right', width: 92 });
		doc.text(r.isDraft ? 'Draft' : reportStatusLabel(r.status), MARGIN + 434, y, { align: 'center', width: 72 });

		doc.y = y + 16;
	}

	// Total row
	checkPageBreak(doc, 730);
	const totalY = doc.y;
	doc.rect(MARGIN, totalY, A4_WIDTH - MARGIN * 2, 18).fill('#f8fafc');
	doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a');
	doc.text('Total', MARGIN + 4, totalY + 5);
	doc.text(`${data.totalRow.count} transaksi`, MARGIN + 84, totalY + 5);
	doc.text(fmtIDR(data.totalRow.value), MARGIN + 334, totalY + 5, { align: 'right', width: 92 });
	doc.y = totalY + 22;
	doc.fillColor('#1e293b');
}

function drawStockReport(doc: InstanceType<typeof PDFDocument>, data: StockReport, periodLabel: string, printTime: string) {
	drawHeader(doc, 'LAPORAN STOK', periodLabel, printTime);

	doc.font('Helvetica-Bold').fontSize(11).fillColor('#1b5e20').text('Posisi Stok Per Produk');
	doc.moveDown(0.5);
	doc.fillColor('#1e293b');

	const cols = [
		{ label: 'Produk', width: 160 },
		{ label: 'Masuk', width: 80, align: 'right' as const },
		{ label: 'Keluar', width: 80, align: 'right' as const },
		{ label: 'Saldo', width: 80, align: 'right' as const },
		{ label: 'Stok Min.', width: 70, align: 'right' as const },
		{ label: 'Status', width: 70, align: 'center' as const }
	];

	drawTableHeader(doc, cols);
	doc.font('Helvetica').fontSize(8);

	for (const r of data.rows) {
		checkPageBreak(doc, 750);
		if (doc.y < MARGIN + 20) drawTableHeader(doc, cols);
		const y = doc.y;

		doc.fillColor('#334155');
		doc.text(`${r.name} (${r.code})`, MARGIN + 4, y, { width: 152 });
		doc.text(fmtIDR(r.inQty).replace('Rp ', ''), MARGIN + 164, y, { align: 'right', width: 72 });
		doc.text(fmtIDR(r.outQty).replace('Rp ', ''), MARGIN + 244, y, { align: 'right', width: 72 });
		doc.text(fmtIDR(r.closing).replace('Rp ', ''), MARGIN + 324, y, { align: 'right', width: 72 });
		doc.text(fmtIDR(r.minimumStock).replace('Rp ', ''), MARGIN + 404, y, { align: 'right', width: 62 });
		doc.fillColor(r.isLow ? '#991b1b' : '#166534');
		doc.text(r.isLow ? 'Kritis' : 'Normal', MARGIN + 468, y, { align: 'center', width: 62 });

		doc.fillColor('#1e293b');
		doc.y = y + 16;
	}

	checkPageBreak(doc, 730);
	const totalY = doc.y;
	doc.rect(MARGIN, totalY, A4_WIDTH - MARGIN * 2, 18).fill('#f8fafc');
	doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a');
	doc.text('Total', MARGIN + 4, totalY + 5);
	doc.text(fmtIDR(data.totalRow.inQty).replace('Rp ', ''), MARGIN + 164, totalY + 5, { align: 'right', width: 72 });
	doc.text(fmtIDR(data.totalRow.outQty).replace('Rp ', ''), MARGIN + 244, totalY + 5, { align: 'right', width: 72 });
	doc.text(fmtIDR(data.totalRow.closing).replace('Rp ', ''), MARGIN + 324, totalY + 5, { align: 'right', width: 72 });
	doc.y = totalY + 22;
	doc.fillColor('#1e293b');
}

function drawProductionReport(doc: InstanceType<typeof PDFDocument>, data: ProductionReport, periodLabel: string, printTime: string) {
	drawHeader(doc, 'LAPORAN PRODUKSI', periodLabel, printTime);

	doc.font('Helvetica-Bold').fontSize(11).fillColor('#1b5e20').text('Ringkasan Produksi');
	doc.font('Helvetica').fontSize(9).fillColor('#334155');
	doc.text(`Total Produksi: ${data.summary.totalKg.toLocaleString('id-ID')} kg`, { indent: 10 });
	doc.text(`Jumlah Batch: ${data.summary.totalBatches}`, { indent: 10 });
	doc.moveDown(0.8);
	doc.fillColor('#1e293b');

	const cols = [
		{ label: 'Tanggal', width: 90 },
		{ label: 'Produk', width: 150 },
		{ label: 'Quantity (kg)', width: 100, align: 'right' as const },
		{ label: 'Batch', width: 120 }
	];

	drawTableHeader(doc, cols);
	doc.font('Helvetica').fontSize(8);

	for (const r of data.rows) {
		checkPageBreak(doc, 750);
		if (doc.y < MARGIN + 20) drawTableHeader(doc, cols);
		const y = doc.y;

		doc.fillColor('#334155');
		doc.text(fmtDateID(r.date), MARGIN + 4, y);
		doc.text(r.productName.length > 25 ? r.productName.slice(0, 25) + '...' : r.productName, MARGIN + 94, y);
		doc.text(r.quantityKg.toLocaleString('id-ID'), MARGIN + 244, y, { align: 'right', width: 92 });
		doc.text(r.batch || '-', MARGIN + 344, y);

		doc.y = y + 16;
	}

	checkPageBreak(doc, 730);
	const totalY = doc.y;
	doc.rect(MARGIN, totalY, A4_WIDTH - MARGIN * 2, 18).fill('#f8fafc');
	doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a');
	doc.text('Total', MARGIN + 4, totalY + 5);
	doc.text(`${data.totalRow.totalKg.toLocaleString('id-ID')} kg`, MARGIN + 244, totalY + 5, { align: 'right', width: 92 });
	doc.text(`${data.totalRow.totalBatches} batch`, MARGIN + 344, totalY + 5);
	doc.y = totalY + 22;
	doc.fillColor('#1e293b');
}

function drawEmptyState(doc: InstanceType<typeof PDFDocument>, printTime: string) {
	drawHeader(doc, 'LAPORAN', '-', printTime);
	doc.moveDown(2);
	doc.font('Helvetica-Oblique').fontSize(10).fillColor('#94a3b8').text('Tidak ada data pada periode ini.', { align: 'center' });
}

export function generateReportPDF(
	type: string,
	data: SalesReport | StockReport | ProductionReport,
	periodLabel: string
): InstanceType<typeof PDFDocument> {
	const doc = new PDFDocument({ margin: MARGIN, size: 'A4', autoFirstPage: false });
	const printTime = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });

	doc.addPage();

	const hasData = type === 'stock' ? (data as StockReport).rows?.length > 0 : type === 'production' ? (data as ProductionReport).rows?.length > 0 : type === 'sales' ? (data as SalesReport).rows?.length > 0 : false;

	if (!hasData) {
		drawEmptyState(doc, printTime);
	} else if (type === 'sales') {
		drawSalesReport(doc, data as SalesReport, periodLabel, printTime);
	} else if (type === 'stock') {
		drawStockReport(doc, data as StockReport, periodLabel, printTime);
	} else if (type === 'production') {
		drawProductionReport(doc, data as ProductionReport, periodLabel, printTime);
	}

	const totalPages = doc.bufferedPageRange().count;
	for (let i = 0; i < totalPages; i++) {
		doc.switchToPage(i);
		drawFooter(doc, i + 1, totalPages);
	}

	doc.end();
	return doc;
}

export function pdfToBuffer(doc: InstanceType<typeof PDFDocument>): Promise<Buffer> {
	const buffers: Buffer[] = [];
	doc.on('data', (chunk: Buffer) => buffers.push(chunk));
	return new Promise<Buffer>((resolve) => {
		doc.on('end', () => resolve(Buffer.concat(buffers)));
	});
}
