import { pgTable, text, decimal, timestamp, boolean, index } from 'drizzle-orm/pg-core';

export const suppliers = pgTable('suppliers', {
	id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
	name: text('name').notNull(),
	phone: text('phone'),
	address: text('address'),
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});
