import 'dotenv/config';
import { Pool } from 'pg';

async function clearAll() {
	if (!process.env.DATABASE_URL) {
		console.error('DATABASE_URL is not set in environment');
		process.exit(1);
	}

	console.log('Connecting to database...');
	const pool = new Pool({ connectionString: process.env.DATABASE_URL });

	try {
		// Dapatkan semua nama tabel di schema public
		const res = await pool.query(`
			SELECT tablename 
			FROM pg_tables 
			WHERE schemaname = 'public';
		`);

		const tables = res.rows
			.map((r: { tablename: string }) => r.tablename)
			.filter((name: string) => !name.startsWith('__drizzle')); // jangan hapus drizzle migration table

		if (tables.length === 0) {
			console.log('Tidak ada tabel yang ditemukan.');
			return;
		}

		console.log('Tabel yang akan dikosongkan:', tables.join(', '));
		const query = `TRUNCATE TABLE ${tables.map((t: string) => `"${t}"`).join(', ')} CASCADE;`;
		await pool.query(query);
		console.log('SEMUA DATA DATABASE BERHASIL DIKOSONGKAN!');
	} catch (err) {
		console.error('Gagal mengosongkan data:', err);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

clearAll();
