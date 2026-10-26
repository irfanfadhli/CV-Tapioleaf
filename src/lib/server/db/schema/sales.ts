import { pgTable, text, decimal, timestamp, index, integer } from 'drizzle-orm/pg-core';
import { products } from './product';

export const sales = pgTable('sales', {
	id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
	buyer_name: text('buyer_name'),
	buyer_type: text('buyer_type', {
		enum: ['pengepul', 'umkm']
	}),
	product_id: text('product_id').references(() => products.id),
	sale_number: text('sale_number'),
	tara_per_sack: decimal('tara_per_sack', { precision: 10, scale: 2 }),
	gross_weight: decimal('gross_weight', { precision: 15, scale: 2 }),
	net_weight: decimal('net_weight', { precision: 15, scale: 2 }),
	price_per_kg: decimal('price_per_kg', { precision: 15, scale: 2 }),
	kuli_fee_per_sack: decimal('kuli_fee_per_sack', { precision: 10, scale: 2 }).default('3000'),
	total_cost: decimal('total_cost', { precision: 15, scale: 2 }),
	total_payment: decimal('total_payment', { precision: 15, scale: 2 }),
	status: text('status', {
		enum: ['draft', 'confirmed', 'cancelled']
	}).default('draft').notNull(),
	sale_date: timestamp('sale_date', { withTimezone: true }),
	created_by: text('created_by'),
	created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [
	index('sales_buyer_idx').on(table.buyer_name),
	index('sales_product_idx').on(table.product_id),
	index('sales_sale_idx').on(table.sale_number)
]);

export const saleItems = pgTable('sale_items', {
	id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
	sale_id: text('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
	sack_index: integer('sack_index').notNull(),
	sack_weight: decimal('sack_weight', { precision: 10, scale: 2 }).notNull()
}, (table) => [
	index('sale_items_sale_idx').on(table.sale_id)
]);