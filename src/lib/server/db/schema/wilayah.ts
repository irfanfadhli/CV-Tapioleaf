import { pgTable, text, varchar, index } from 'drizzle-orm/pg-core';

export const wilayah = pgTable('wilayah', {
	kode: varchar('kode', { length: 13 }).primaryKey(),
	nama: text('nama').notNull()
}, (table) => [
	index('wilayah_nama_idx').on(table.nama)
]);
