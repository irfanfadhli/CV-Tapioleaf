import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as salesService from '$lib/server/sales/service';
import PDFDocument from 'pdfkit';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) {
		throw error(401, 'Unauthorized');
	}

	const status = event.url.searchParams.get('status') || 'all';
	const search = event.url.searchParams.get('search') || '';

	try {
		const [result, summary] = await Promise.all([
			salesService.listSales({
				status: status as any,
				search: search || undefined,
				limit: 100,
				page: 1,
				sort: 'created_at',
				order: 'desc'
			}),
			salesService.getSalesSummary()
		]);

	const doc = new PDFDocument({
		margin: 36,
		size: 'A4',
		margins: { top: 36, bottom: 20, left: 36, right: 36 }
	});
	const buffers: Buffer[] = [];
	doc.on('data', (chunk: Buffer) => buffers.push(chunk));

	// Header
	doc.font('Helvetica-Bold').fontSize(16).text('CV TapioLeaf', { align: 'center' });
	doc.font('Helvetica-Bold').fontSize(13).fillColor('#1b5e20').text('REKAP KALKULATOR TIMBANGAN TEPUNG', { align: 'center' });
	doc.font('Helvetica').fontSize(8.5).fillColor('#666').text(`Waktu Cetak: ${new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}`, { align: 'center' });
	doc.moveDown(0.8);

	// Divider
	doc.moveTo(36, doc.y).lineTo(559, doc.y).lineWidth(1).stroke('#cbd5e1');
	doc.moveDown(0.6);

	// Summary Cards in PDF
	const summaryY = doc.y;
	const cardW = 120;
	const cardH = 50;
	const startX = 36;
	const spacing = (559 - 36 - cardW * 4) / 3;

	const cards = [
		{ label: 'Total Rekap', val: `${result.pagination.total} Transaksi` },
		{ label: 'Pendapatan Bulan Ini', val: `Rp ${Number(summary.monthlyRevenue).toLocaleString('id-ID')}` },
		{ label: 'Berat Bersih Terjual', val: `${Number(summary.monthlyWeight).toLocaleString('id-ID', { minimumFractionDigits: 2 })} kg` },
		{ label: 'Draft Pending', val: `${summary.draftCount} Transaksi` }
	];

	cards.forEach((c, idx) => {
		const x = startX + idx * (cardW + spacing);
		doc.rect(x, summaryY, cardW, cardH).lineWidth(0.5).strokeColor('#e2e8f0').fillAndStroke('#f8fafc', '#e2e8f0');
		doc.font('Helvetica').fontSize(8).fillColor('#64748b').text(c.label, x + 8, summaryY + 8, { width: cardW - 16 });
		doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text(c.val, x + 8, summaryY + 24, { width: cardW - 16 });
	});

	doc.y = summaryY + cardH + 15;

	// Table Header
	const tableTop = doc.y;
	const colX = [36, 120, 220, 310, 400, 480];
	const colW = [80, 95, 85, 85, 75, 75];

	doc.rect(36, tableTop, 523, 20).fill('#f1f5f9');
	doc.font('Helvetica-Bold').fontSize(8).fillColor('#1e293b');
	doc.text('No. Nota', colX[0] + 4, tableTop + 6);
	doc.text('Pembeli', colX[1], tableTop + 6);
	doc.text('Berat Bersih', colX[2], tableTop + 6, { align: 'right', width: colW[2] - 8 });
	doc.text('Total Bayar', colX[3], tableTop + 6, { align: 'right', width: colW[3] - 8 });
	doc.text('Status', colX[4] + 10, tableTop + 6);
	doc.text('Tanggal', colX[5], tableTop + 6);

	doc.y = tableTop + 24;

	// Table Rows
	doc.font('Helvetica').fontSize(8);
	let alt = false;

	for (const item of result.items) {
		const y = doc.y;
		if (y > 770) {
			doc.addPage();
			doc.y = 36;
		}

		const curY = doc.y;
		if (alt) {
			doc.rect(36, curY - 2, 523, 18).fill('#f8fafc');
		}
		alt = !alt;

		doc.fillColor('#334155');
		doc.text(item.sale_number || '-', colX[0] + 4, curY + 2);
		doc.text(item.buyer_name ? (item.buyer_name.length > 18 ? item.buyer_name.slice(0, 18) + '...' : item.buyer_name) : '-', colX[1], curY + 2);
		doc.text(`${Number(item.net_weight || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })} kg`, colX[2], curY + 2, { align: 'right', width: colW[2] - 8 });
		doc.text(`Rp ${Number(item.total_payment || 0).toLocaleString('id-ID')}`, colX[3], curY + 2, { align: 'right', width: colW[3] - 8 });
		
		const statusText = item.status === 'confirmed' ? 'Confirmed' : item.status === 'draft' ? 'Draft' : 'Cancelled';
		const statusColor = item.status === 'confirmed' ? '#166534' : item.status === 'draft' ? '#854d0e' : '#991b1b';
		doc.fillColor(statusColor).text(statusText, colX[4] + 10, curY + 2);

		const dateText = item.sale_date ? new Date(item.sale_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
		doc.fillColor('#64748b').text(dateText, colX[5], curY + 2);

		doc.y = curY + 18;
	}

	if (result.items.length === 0) {
		doc.y += 10;
		doc.font('Helvetica-Oblique').fontSize(9).fillColor('#94a3b8').text('Belum ada data rekapan penimbangan tepung.', { align: 'center' });
	}

	// Footer 1 baris tepat di bagian bawah halaman tanpa memicu halaman baru
	const footerY = Math.max(doc.y + 15, 780);
	doc.font('Helvetica').fontSize(8).fillColor('#94a3b8').text(
		'Laporan ini dibuat otomatis oleh Sistem Manajemen CV TapioLeaf.',
		36,
		footerY,
		{ align: 'center', width: 523, lineBreak: false }
	);

	doc.end();

	const pdfBuffer = await new Promise<Buffer>((resolve) => {
		doc.on('end', () => resolve(Buffer.concat(buffers) as unknown as Buffer));
	});

	const filename = `rekap-timbangan-tepung-${new Date().toISOString().slice(0, 10)}.pdf`;

	return new Response(pdfBuffer as unknown as BodyInit, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
	} catch (e) {
		console.error('Error generating sales report PDF:', e);
		throw error(500, e instanceof Error ? e.message : 'Gagal membuat rekap PDF');
	}
};
