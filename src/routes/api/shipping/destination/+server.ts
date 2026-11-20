import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { wilayah } from '$lib/server/db/schema/wilayah';
import { ilike } from 'drizzle-orm';
import { searchDestination as searchDestinationOnline } from '$lib/server/shipping/rajaongkir';
import { INDONESIA_REGIONS } from '$lib/data/indonesia-regions';

export const GET: RequestHandler = async ({ url }) => {
	const keyword = (url.searchParams.get('q') || '').trim();
	if (keyword.length < 2) {
		return json({ results: [] });
	}

	const qLower = keyword.toLowerCase();

	// 1. Prioritaskan cari dari database lokal (tabel wilayah) jika sudah di-seed
	try {
		const localRows = await db
			.select({
				kode: wilayah.kode,
				nama: wilayah.nama
			})
			.from(wilayah)
			.where(ilike(wilayah.nama, `%${keyword}%`))
			.limit(15);

		if (localRows.length > 0) {
			const results = localRows.map((r) => ({
				id: r.kode,
				label: r.nama
			}));
			return json({ results });
		}
	} catch (err) {
		console.warn('Gagal membaca tabel wilayah lokal:', err);
	}

	// 2. Gunakan Master Data Wilayah Lengkap 38 Provinsi (cahyadsn/wilayah Kemendagri)
	const matchedRegions = INDONESIA_REGIONS.filter((item) =>
		item.nama.toLowerCase().includes(qLower) || item.kode.toLowerCase().includes(qLower)
	).slice(0, 15);

	if (matchedRegions.length > 0) {
		return json({
			results: matchedRegions.map((m) => ({
				id: m.kode,
				label: m.nama
			}))
		});
	}

	// 3. Fallback ke service online RajaOngkir jika ada
	const onlineResults = await searchDestinationOnline(keyword);
	if (onlineResults && onlineResults.length > 0) {
		return json({ results: onlineResults });
	}

	// 4. Jika masih tidak ditemukan, buat opsi dinamis agar pembeli tetap bisa memesan
	return json({
		results: [
			{
				id: `custom-${encodeURIComponent(keyword)}`,
				label: `${keyword} (Wilayah Lainnya)`
			}
		]
	});
};
