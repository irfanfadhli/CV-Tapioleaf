import { pgTable, text, decimal, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { products } from './product';

export const orders = pgTable('orders', {
	id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
	userId: text('user_id'),
	status: text('status', {
		enum: ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED']
	}).default('PENDING').notNull(),
	totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
	xenditInvoiceId: text('xendit_invoice_id'),
	xenditInvoiceUrl: text('xendit_invoice_url'),
	paidAt: timestamp('paid_at', { withTimezone: true }),
	customerName: text('customer_name'),
	customerPhone: text('customer_phone'),
	customerAddress: text('customer_address'),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [
	index('orders_user_idx').on(table.userId),
	index('orders_status_idx').on(table.status),
	index('orders_xendit_idx').on(table.xenditInvoiceId)
]);

export const orderItems = pgTable('order_items', {
	id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
	orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
	productId: text('product_id').notNull().references(() => products.id),
	productName: text('product_name').notNull(),
	productCode: text('product_code').notNull(),
	quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
	unitPrice: decimal('unit_price', { precision: 15, scale: 2 }).notNull(),
	unit: text('unit').notNull()
}, (table) => [
	index('order_items_order_idx').on(table.orderId)
]);
