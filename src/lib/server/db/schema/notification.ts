import { pgTable, text, boolean, timestamp, decimal, index } from 'drizzle-orm/pg-core';

export const userNotificationTypes = ['order_cancelled', 'order_approved'] as const;

export type UserNotificationType = typeof userNotificationTypes[number];

export const customerNotifications = pgTable('customer_notifications', {
	id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
	userId: text('userId').notNull(),
	orderId: text('orderId').notNull(),
	type: text('type', { enum: userNotificationTypes }).default('order_cancelled').notNull(),
	message: text('message').notNull(),
	totalAmount: decimal('total_amount', { precision: 15, scale: 2 }),
	read: boolean('read').default(false).notNull(),
	createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
}, (table) => [
	index('customer_notifications_user_idx').on(table.userId),
	index('customer_notifications_order_idx').on(table.orderId)
]);

export type CustomerNotification = {
	id: string;
	userId: string;
	orderId: string;
	type: UserNotificationType;
	message: string;
	totalAmount: number;
	read: boolean;
	createdAt: Date;
};