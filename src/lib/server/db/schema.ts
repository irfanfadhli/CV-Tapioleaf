import { pgTable, serial, integer, text } from 'drizzle-orm/pg-core';

export const task = pgTable('task', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export * from './auth.schema';
export * from './schema/auth-logs';
export * from './schema/product';
export * from './schema/stock';
export * from './schema/production';
export * from './schema/order';
