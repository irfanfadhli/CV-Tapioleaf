import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  const r = await db.execute(`DELETE FROM "session"`);
  console.log('Deleted', r.rowCount, 'sessions');
  await pool.end();
}

run().catch(console.error);
