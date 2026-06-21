import { pgTable, text, decimal, timestamp, index } from 'drizzle-orm/pg-core';
import { suppliers } from './supplier';
import { user } from '../auth.schema';

export const cassavaReceipts = pgTable('cassava_receipts', {
	id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
	receiptDate: timestamp('receipt_date', { withTimezone: true }).notNull(),
	supplierId: text('supplier_id').notNull().references(() => suppliers.id),
	vehicleNumber: text('vehicle_number').notNull(),
	driverName: text('driver_name'),
	grossWeight: decimal('gross_weight', { precision: 10, scale: 2 }).notNull(),
	taraWeight: decimal('tara_weight', { precision: 10, scale: 2 }).notNull(),
	netWeight: decimal('net_weight', { precision: 10, scale: 2 }).notNull(),
	refraction: decimal('refraction', { precision: 10, scale: 2 }).notNull(),
	finalWeight: decimal('final_weight', { precision: 10, scale: 2 }).notNull(),
	pricePerKg: decimal('price_per_kg', { precision: 10, scale: 2 }).notNull(),
	totalCost: decimal('total_cost', { precision: 12, scale: 2 }).notNull(),
	notes: text('notes'),
	receivedById: text('received_by_id').notNull().references(() => user.id),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
	index('cassava_supplier_idx').on(table.supplierId),
	index('cassava_date_idx').on(table.receiptDate),
]);
