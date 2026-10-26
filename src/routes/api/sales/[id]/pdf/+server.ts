import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as salesService from '$lib/server/sales/service';
import PDFDocument from 'pdfkit';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) {
		throw error(401, 'Unauthorized');
	}

	const id = event.params.id;
	let sale: any;
	try {
		sale = await salesService.getSale(id);
	} catch (e) {
		throw error(404, 'Transaksi tidak ditemukan');
	}

	const doc = new PDFDocument({ margin: 40, size: 'A4' });
	const buffers: Buffer[] = [];
	doc.on('data', (chunk: Buffer) => buffers.push(chunk));

	// Company Title & Nota Header
	doc.font('Helvetica-Bold').fontSize(20).fillColor('#1b5e20').text('CV TapioLeaf', { align: 'center' });
	doc.font('Helvetica').fontSize(10).fillColor('#64748b').text('Produsen Tepung Tapioka Berkualitas', { align: 'center' });
	doc.font('Helvetica-Bold').fontSize(13).fillColor('#0f172a').text('NOTA KALKULASI TIMBANGAN TEPUNG', { align: 'center' });
	doc.moveDown(1);

	// Divider
	doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(1.5).stroke('#16a34a');
	doc.moveDown(1);

	// Meta info 2-columns
	const metaY = doc.y;
	doc.font('Helvetica-Bold').fontSize(10).fillColor('#334155').text('INFORMASI TRANSAKSI', 40, metaY);
	doc.font('Helvetica').fontSize(9).fillColor('#475569');
	doc.text(`No. Nota: ${sale.sale_number || '-'}`, 40, metaY + 18);
	doc.text(`Pembeli: ${sale.buyer_name || '-'}`, 40, metaY + 32);
	doc.text(`Produk: ${sale.product_name || 'Tepung Tapioka'}`, 40, metaY + 46);

	const dateStr = sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-';
	doc.text(`Tanggal: ${dateStr}`, 320, metaY + 18);
	doc.text(`Status: ${(sale.status || 'draft').toUpperCase()}`, 320, metaY + 32);
	doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 320, metaY + 46);

	doc.y = metaY + 70;

	// Table Header Karung
	const sackTableTop = doc.y;
	doc.rect(40, sackTableTop, 515, 20).fill('#f1f5f9');
	doc.font('Helvetica-Bold').fontSize(9).fillColor('#1e293b');
	doc.text('No. Karung', 60, sackTableTop + 6);
	doc.text('Berat Kotor / Karung (kg)', 340, sackTableTop + 6, { align: 'right', width: 190 });

	doc.y = sackTableTop + 24;

	// Rows Karung
	doc.font('Helvetica').fontSize(9);
	let isAlt = false;
	const items = sale.items || [];

	for (const item of items) {
		const curY = doc.y;
		if (curY > 720) {
			doc.addPage();
			doc.y = 40;
		}

		if (isAlt) {
			doc.rect(40, doc.y - 2, 515, 18).fill('#f8fafc');
		}
		isAlt = !isAlt;

		doc.fillColor('#334155');
		doc.text(`Karung #${item.sack_index}`, 60, doc.y + 2);
		doc.text(`${Number(item.sack_weight || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })} kg`, 340, doc.y + 2, { align: 'right', width: 190 });

		doc.y += 18;
	}

	doc.moveDown(1);

	// Divider
	doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(0.5).stroke('#cbd5e1');
	doc.moveDown(0.8);

	// Calculation Summary Box
	const calcY = doc.y;
	const boxW = 280;
	const boxX = 555 - boxW;

	doc.rect(boxX, calcY, boxW, 140).fillAndStroke('#f8fafc', '#e2e8f0');

	doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text('Rincian Perhitungan', boxX + 12, calcY + 10);
	doc.font('Helvetica').fontSize(8.5).fillColor('#475569');

	let lineTop = calcY + 28;
	const printRow = (label: string, value: string, isBold = false, isTotal = false) => {
		if (isBold) doc.font('Helvetica-Bold');
		else doc.font('Helvetica');
		if (isTotal) doc.fillColor('#15803d');
		else doc.fillColor('#334155');
		doc.text(label, boxX + 12, lineTop);
		doc.text(value, boxX + 12, lineTop, { align: 'right', width: boxW - 24 });
		lineTop += 16;
	};

	printRow('Jumlah Karung', `${items.length} karung`);
	printRow('Berat Kotor (Gross)', `${Number(sale.gross_weight || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })} kg`);
	printRow(`Tara Total (${items.length} × ${Number(sale.tara_per_sack || 0)} kg)`, `-${(items.length * Number(sale.tara_per_sack || 0)).toLocaleString('id-ID', { minimumFractionDigits: 2 })} kg`);
	printRow('Berat Bersih (Net)', `${Number(sale.net_weight || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })} kg`, true);
	printRow(`Harga (@ Rp ${Number(sale.price_per_kg || 0).toLocaleString('id-ID')})`, `Rp ${Number(sale.total_cost || 0).toLocaleString('id-ID')}`);
	printRow(`Biaya Kuli (${items.length} × Rp ${Number(sale.kuli_fee_per_sack || 0).toLocaleString('id-ID')})`, `-Rp ${(items.length * Number(sale.kuli_fee_per_sack || 0)).toLocaleString('id-ID')}`);
	printRow('TOTAL BAYAR', `Rp ${Number(sale.total_payment || 0).toLocaleString('id-ID')}`, true, true);

	doc.y = calcY + 160;

	// Signature Section
	const sigY = doc.y > 680 ? 680 : doc.y;
	doc.font('Helvetica').fontSize(9).fillColor('#475569');
	doc.text('Petugas Timbangan / Kasir,', 60, sigY);
	doc.text('Pembeli,', 400, sigY);

	doc.text('( ......................................... )', 60, sigY + 50);
	doc.text(`( ${sale.buyer_name || '.........................................'} )`, 400, sigY + 50);

	doc.end();

	const pdfBuffer = await new Promise<Buffer>((resolve) => {
		doc.on('end', () => resolve(Buffer.concat(buffers) as unknown as Buffer));
	});

	const filename = `nota-timbangan-${sale.sale_number || id}.pdf`;

	return new Response(pdfBuffer as unknown as BodyInit, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
