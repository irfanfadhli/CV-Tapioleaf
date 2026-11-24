import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import wilayahData from '$lib/data/wilayah-indonesia.json';

export const GET: RequestHandler = async ({ url }) => {
	const type = url.searchParams.get('type') || 'provinces';
	const parentKode = url.searchParams.get('parent') || '';

	if (type === 'provinces') {
		return json({
			results: wilayahData.provinces.map((p) => ({
				kode: p.kode,
				nama: p.nama
			}))
		});
	}

	if (type === 'regencies') {
		if (!parentKode) {
			return json({ results: [] });
		}
		const filtered = wilayahData.regencies.filter((r) => r.provKode === parentKode);
		return json({
			results: filtered.map((r) => ({
				kode: r.kode,
				nama: r.nama
			}))
		});
	}

	if (type === 'districts') {
		if (!parentKode) {
			return json({ results: [] });
		}
		const filtered = wilayahData.districts.filter((d) => d.regKode === parentKode);
		return json({
			results: filtered.map((d) => ({
				kode: d.kode,
				nama: d.nama
			}))
		});
	}

	// Fitur pencarian cepat jika ada parameter query `q`
	const query = (url.searchParams.get('q') || '').toLowerCase().trim();
	if (query.length >= 2) {
		const matchedDistricts = wilayahData.districts
			.filter((d) => d.nama.toLowerCase().includes(query))
			.slice(0, 15);

		const regMap = new Map(wilayahData.regencies.map((r) => [r.kode, r]));
		const provMap = new Map(wilayahData.provinces.map((p) => [p.kode, p.nama]));

		const results = matchedDistricts.map((d) => {
			const reg = regMap.get(d.regKode);
			const provNama = reg ? provMap.get(reg.provKode) || '' : '';
			return {
				id: d.kode,
				label: `Kec. ${d.nama}, ${reg?.nama || ''}, ${provNama}`
			};
		});

		return json({ results });
	}

	return json({ results: [] });
};
