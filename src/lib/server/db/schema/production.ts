import { pgTable, text, decimal, timestamp, boolean, date, index } from 'drizzle-orm/pg-core';
import { products } from './product';

export const productionEntries = pgTable('production_entries', {
	id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
	productId: text('product_id').notNull().references(() => products.id),
	quantityKg: decimal('quantity_kg', { precision: 10, scale: 2 }).notNull(),
	cassavaUsedKg: decimal('cassava_used_kg', { precision: 10, scale: 2 }),
	yieldPercentage: decimal('yield_percentage', { precision: 5, scale: 2 }),
	tapiocaFlourResult: decimal('tapioca_flour_result', { precision: 10, scale: 2 }),
	productionDate: timestamp('production_date', { withTimezone: true }).defaultNow().notNull(),
	status: text('status', { enum: ['DRAFT', 'CONFIRMED'] }).default('DRAFT').notNull(),
	notes: text('notes'),
	isLateEntry: boolean('is_late_entry').default(false).notNull(),
	createdByUserId: text('created_by_user_id'),
	confirmedByUserId: text('confirmed_by_user_id'),
	confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [
	index('prod_product_idx').on(table.productId),
	index('prod_date_idx').on(table.productionDate),
	index('prod_status_idx').on(table.status)
]);
