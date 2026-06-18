import { pgTable, text, decimal, timestamp, index } from 'drizzle-orm/pg-core';
import { products } from './product';

export const stockMovements = pgTable('stock_movements', {
	id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
	productId: text('product_id').notNull().references(() => products.id),
	quantityChange: decimal('quantity_change', { precision: 10, scale: 2 }).notNull(),
	movementType: text('movement_type', {
		enum: ['PURCHASE_IN', 'MANUAL_IN', 'MANUAL_OUT', 'ADJUSTMENT']
	}).notNull(),
	movementDate: timestamp('movement_date', { withTimezone: true }).defaultNow().notNull(),
	note: text('note'),
	reason: text('reason'),
	referenceId: text('reference_id'),
	createdByUserId: text('created_by_user_id'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [
	index('stock_product_idx').on(table.productId),
	index('stock_type_idx').on(table.movementType),
	index('stock_date_idx').on(table.movementDate),
	index('stock_created_idx').on(table.createdAt)
]);
