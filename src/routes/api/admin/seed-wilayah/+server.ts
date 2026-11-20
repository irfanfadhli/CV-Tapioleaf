import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { wilayah } from '$lib/server/db/schema/wilayah';
import { sql } from 'drizzle-orm';
import { INDONESIA_REGIONS } from '$lib/data/indonesia-regions';

export const POST: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS wilayah (
				kode VARCHAR(13) PRIMARY KEY,
				nama TEXT NOT NULL
			);
			CREATE INDEX IF NOT EXISTS wilayah_nama_idx ON wilayah(nama);
		`);

		let inserted = 0;
		for (const item of INDONESIA_REGIONS) {
			await db
				.insert(wilayah)
				.values({
					kode: item.kode,
					nama: item.nama
				})
				.onConflictDoUpdate({
					target: wilayah.kode,
					set: { nama: item.nama }
				});
			inserted++;
		}

		return json({
			success: true,
			message: `Berhasil melakukan seeding ${inserted} data wilayah Kemendagri (seluruh 38 provinsi & kab/kota) ke database.`,
			count: inserted
		});
	} catch (e) {
		console.error('Error seeding wilayah:', e);
		return json(
			{
				success: false,
				error: e instanceof Error ? e.message : 'Gagal melakukan seed data wilayah'
			},
			{ status: 500 }
		);
	}
};
