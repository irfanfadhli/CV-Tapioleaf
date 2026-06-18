import { pgTable, text, timestamp, json } from 'drizzle-orm/pg-core';

export const authLogs = pgTable('auth_logs', {
	id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
	userId: text('user_id'),
	email: text('email').notNull(),
	event: text('event', {
		enum: ['login_success', 'login_failed', 'logout', 'session_expired', 'unauthorized_access', 'social_signin']
	}).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	metadata: json('metadata'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
