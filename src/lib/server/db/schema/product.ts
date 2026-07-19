import { pgTable, text, integer, decimal, timestamp, boolean, index } from 'drizzle-orm/pg-core';

export const productCategories = pgTable('product_categories', {
	id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
	name: text('name').notNull().unique(),
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const products = pgTable('products', {
	id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
	code: text('code').notNull().unique(),
	name: text('name').notNull(),
	description: text('description'),
	price: decimal('price', { precision: 15, scale: 2 }).notNull(),
	costPrice: decimal('cost_price', { precision: 15, scale: 2 }),
	unit: text('unit', { enum: ['KG', 'TON', 'SAK', 'PCS'] }).notNull(),
	minimumStock: integer('minimum_stock').default(0).notNull(),
	imageUrl: text('image_url'),
	isActive: boolean('is_active').default(true).notNull(),
	label: text('label'),
	categoryId: text('category_id').references(() => productCategories.id, { onDelete: 'set null' }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	deletedAt: timestamp('deleted_at', { withTimezone: true })
}, (table) => [
	index('products_code_idx').on(table.code),
	index('products_name_idx').on(table.name),
	index('products_category_idx').on(table.categoryId),
	index('products_active_idx').on(table.isActive)
]);
