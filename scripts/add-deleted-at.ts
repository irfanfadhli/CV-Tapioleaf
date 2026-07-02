import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const tables = ['production_entries', 'cassava_receipts', 'suppliers'];
  for (const tbl of tables) {
    const r = await db.execute(`SELECT column_name FROM information_schema.columns WHERE table_name='${tbl}' AND column_name='deleted_at'`);
    if (r.rows.length === 0) {
      await db.execute(`ALTER TABLE "${tbl}" ADD COLUMN deleted_at timestamp with time zone`);
      console.log('Added deleted_at to', tbl);
    } else {
      console.log('deleted_at already exists on', tbl);
    }
  }
  await pool.end();
}

run().catch(console.error);
