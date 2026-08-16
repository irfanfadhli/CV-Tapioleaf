import { and, eq, desc, asc, isNull, sql, or, ilike, inArray } from 'drizzle-orm';
import { db } from '../db';
import { orders, orderItems } from '../db/schema/order';
import { products } from '../db/schema/product';
import { stockMovements } from '../db/schema/stock';
import { customerNotifications } from '../db/schema/notification';
import { user } from '../db/auth.schema';
import { createInvoice } from '../xendit/service';
import type { CheckoutInput } from '../xendit/validation';

export async function createOrder(input: CheckoutInput, userId: string | undefined) {
	const prod = await db.select().from(products).where(and(eq(products.id, input.productId), isNull(products.deletedAt))).limit(1);
	if (!prod.length) throw new Error('Produk tidak ditemukan');

	const p = prod[0];
	const totalAmount = Number(p.price) * input.quantity;
	if (isNaN(totalAmount) || totalAmount <= 0) throw new Error('Jumlah pesanan tidak valid');

	const [order] = await db.insert(orders).values({
		userId,
		totalAmount: String(totalAmount),
		customerName: input.customerName,
		customerPhone: input.customerPhone,
		customerAddress: input.customerAddress,
		notes: input.notes,
		status: 'PENDING'
	}).returning();

	await db.insert(orderItems).values({
		orderId: order.id,
		productId: p.id,
		productName: p.name,
		productCode: p.code,
		quantity: String(input.quantity),
		unitPrice: p.price,
		unit: p.unit
	});

	return { orderId: order.id };
}

export async function approveOrder(orderId: string, requestOrigin: string) {
	const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
	if (!order) throw new Error('Pesanan tidak ditemukan');

	if (order.status !== 'PENDING') {
		throw new Error('Hanya pesanan dengan status Menunggu Persetujuan yang dapat disetujui');
	}

	const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
	if (!items.length) throw new Error('Item pesanan kosong');

	const item = items[0];
	const invoiceInput: CheckoutInput = {
		productId: item.productId || '',
		quantity: Number(item.quantity),
		customerName: order.customerName || '',
		customerPhone: order.customerPhone || '',
		customerAddress: order.customerAddress || '',
		notes: order.notes || undefined
	};

	let invoiceUrl = '';
	let invoiceId = '';
	try {
		const inv = await createInvoice(order.id, invoiceInput, Number(order.totalAmount), requestOrigin);
		invoiceUrl = inv.invoiceUrl;
		invoiceId = inv.invoiceId;
	} catch (e) {
		console.error('Xendit createInvoice error:', e);
	}

	await db.update(orders).set({
		status: 'APPROVED',
		xenditInvoiceId: invoiceId || null,
		xenditInvoiceUrl: invoiceUrl || null,
		updatedAt: new Date()
	}).where(eq(orders.id, order.id));

	// Create notification for customer when admin approves the order
	if (order.userId) {
		await db.insert(customerNotifications).values({
			userId: order.userId,
			orderId: order.id,
			type: 'order_approved',
			message: `Pesanan #${order.id.slice(0, 8)} telah disetujui. Silakan lakukan pembayaran.`,
			totalAmount: order.totalAmount,
			read: false
		});
	}

	return { success: true, invoiceUrl, message: 'Pesanan disetujui, pembayaran siap dilakukan' };
}

export interface OrderItemSummary {
	productName: string;
	productCode: string;
	quantity: string;
	unit: string;
	unitPrice: string;
}

export type UserOrderWithItems = typeof orders.$inferSelect & {
	items: OrderItemSummary[];
};

export async function getUserOrders(userId: string, page = 1, limit = 20): Promise<{ items: UserOrderWithItems[]; total: number; page: number; limit: number }> {
	const where = eq(orders.userId, userId);
	const offset = (page - 1) * limit;
	const items = await db.select().from(orders).where(where).orderBy(desc(orders.createdAt)).limit(limit).offset(offset);
	const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(where);

	const ordersWithItems: UserOrderWithItems[] = [];
	for (const order of items) {
		const orderItemsList = await db
			.select({
				productName: orderItems.productName,
				productCode: orderItems.productCode,
				quantity: orderItems.quantity,
				unit: orderItems.unit,
				unitPrice: orderItems.unitPrice
			})
			.from(orderItems)
			.where(eq(orderItems.orderId, order.id));
		ordersWithItems.push({
			...order,
			items: orderItemsList
		});
	}

	return { items: ordersWithItems, total: Number(countResult.count), page, limit };
}

export async function getUserPaidOrders(userId: string, page = 1, limit = 10): Promise<{ items: UserOrderWithItems[]; total: number; page: number; limit: number }> {
	const where = and(eq(orders.userId, userId), inArray(orders.status, ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED']));
	const offset = (page - 1) * limit;
	const items = await db.select().from(orders).where(where).orderBy(desc(orders.createdAt)).limit(limit).offset(offset);
	const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(where);

	const ordersWithItems: UserOrderWithItems[] = [];
	for (const order of items) {
		const orderItemsList = await db
			.select({
				productName: orderItems.productName,
				productCode: orderItems.productCode,
				quantity: orderItems.quantity,
				unit: orderItems.unit,
				unitPrice: orderItems.unitPrice
			})
			.from(orderItems)
			.where(eq(orderItems.orderId, order.id));
		ordersWithItems.push({
			...order,
			items: orderItemsList
		});
	}

	return { items: ordersWithItems, total: Number(countResult.count), page, limit };
}

export async function getAllOrders(search?: string, page = 1, limit = 20) {
	const offset = (page - 1) * limit;
	const conditions = [];
	if (search) {
		conditions.push(ilike(orders.customerName, `%${search}%`));
		conditions.push(ilike(orders.id, `%${search}%`));
	}

	const where = conditions.length > 0 ? or(...conditions) : undefined;

	const items = await db
		.select({
			id: orders.id,
			userId: orders.userId,
			status: orders.status,
			totalAmount: orders.totalAmount,
			customerName: orders.customerName,
			customerPhone: orders.customerPhone,
			createdAt: orders.createdAt
		})
		.from(orders)
		.where(where)
		.orderBy(desc(orders.createdAt))
		.limit(limit)
		.offset(offset);

	// Get items count for each order
	for (const order of items) {
		const [itemCount] = await db
			.select({ count: sql<number>`count(*)` })
			.from(orderItems)
			.where(eq(orderItems.orderId, order.id));
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(order as any).items = [{ count: Number(itemCount.count) }];
	}

	return items;
}

export async function getOrderCount(search?: string) {
	const conditions = [];
	if (search) {
		conditions.push(ilike(orders.customerName, `%${search}%`));
		conditions.push(ilike(orders.id, `%${search}%`));
	}

	const where = conditions.length > 0 ? or(...conditions) : undefined;
	const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(where);
	return Number(countResult.count);
}

export async function getPendingOrdersCount() {
	const [result] = await db
		.select({ count: sql<number>`count(*)` })
		.from(orders)
		.where(eq(orders.status, 'PENDING'));
	return Number(result.count);
}

export async function getRecentPendingOrders(limit = 5) {
	return await db
		.select({
			id: orders.id,
			customerName: orders.customerName,
			customerPhone: orders.customerPhone,
			totalAmount: orders.totalAmount,
			createdAt: orders.createdAt
		})
		.from(orders)
		.where(eq(orders.status, 'PENDING'))
		.orderBy(desc(orders.createdAt))
		.limit(limit);
}

export async function getOrder(id: string) {
	const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
	if (!order) throw new Error('Pesanan tidak ditemukan');
	const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

	let userEmail: string | null = null;
	if (order.userId) {
		const [u] = await db.select({ email: user.email }).from(user).where(eq(user.id, order.userId)).limit(1);
		if (u) {
			userEmail = u.email;
		}
	}

	return { ...order, items, userEmail };
}

export async function handleXenditCallback(externalId: string, invoiceId: string, status: string) {
	if (status === 'PAID') {
		const [order] = await db.select().from(orders).where(eq(orders.id, externalId)).limit(1);
		if (!order) throw new Error('Pesanan tidak ditemukan');

		// Deduct stock for each order item
		const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
		for (const item of items) {
			if (!item.productId) continue;
			await db.insert(stockMovements).values({
				productId: item.productId,
				quantityChange: String(-Number(item.quantity)), // Negative to deduct
				movementType: 'MANUAL_OUT',
				note: `Penjualan pesanan #${order.id.slice(0, 8)}`,
				referenceId: order.id
			});
		}

		await db.update(orders).set({
			status: 'PAID',
			xenditInvoiceId: invoiceId,
			paidAt: new Date(),
			updatedAt: new Date()
		}).where(eq(orders.id, externalId));
	}
}

export async function cancelOrder(orderId: string, cancelledBy: 'ADMIN' | 'CUSTOMER' = 'CUSTOMER') {
	const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
	if (!order) throw new Error('Pesanan tidak ditemukan');

	if (order.status !== 'PENDING' && order.status !== 'APPROVED') {
		throw new Error('Hanya pesanan dengan status Menunggu Persetujuan atau Menunggu Pembayaran yang dapat dibatalkan');
	}

	// Remove any stock deduction that happened at APPROVED stage (restore stock)
	const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

	for (const item of items) {
		if (!item.productId) continue;

		// Check if stock was deducted for this order (APPROVED stage)
		const [deducted] = await db.select({ count: sql<number>`count(*)` })
			.from(stockMovements)
			.where(and(
				eq(stockMovements.referenceId, orderId),
				eq(stockMovements.productId, item.productId),
				eq(stockMovements.movementType, 'MANUAL_OUT')
			));

		if (Number(deducted?.count || 0) > 0) {
			// Restore stock by adding the quantity back
			await db.insert(stockMovements).values({
				productId: item.productId,
				quantityChange: String(Number(item.quantity)), // Positive to add back
				movementType: 'MANUAL_IN',
				note: `Pembatalan pesanan #${orderId.slice(0, 8)}`,
				referenceId: orderId
			});
		}
	}

	// Update order status to CANCELLED with who cancelled
	await db.update(orders).set({
		status: 'CANCELLED',
		cancelledBy,
		updatedAt: new Date()
	}).where(eq(orders.id, orderId));

	// Create notification for customer if cancelled by admin
	if (cancelledBy === 'ADMIN' && order.userId) {
		await db.insert(customerNotifications).values({
			userId: order.userId,
			orderId: order.id,
			type: 'order_cancelled',
			message: `Pesanan #${order.id.slice(0, 8)} telah dibatalkan.`,
			totalAmount: order.totalAmount,
			read: false
		});
	}

	return { success: true, message: 'Pesanan berhasil dibatalkan' };
}

export async function getUnreadNotifications(userId: string) {
	const notifications = await db
		.select()
		.from(customerNotifications)
		.where(and(eq(customerNotifications.userId, userId), eq(customerNotifications.read, false)))
		.orderBy(desc(customerNotifications.createdAt))
		.limit(20);
	return notifications;
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
	const [result] = await db
		.select({ count: sql<number>`count(*)` })
		.from(customerNotifications)
		.where(and(eq(customerNotifications.userId, userId), eq(customerNotifications.read, false)));
	return Number(result.count);
}

export async function markNotificationsRead(userId: string, ids: string[]) {
	if (ids.length === 0) return;

	await db
		.update(customerNotifications)
		.set({ read: true })
		.where(and(eq(customerNotifications.userId, userId), inArray(customerNotifications.id, ids)));
}

export interface CreateOfflineOrderItemInput {
	productId: string;
	quantity: number;
}

export interface CreateOfflineCashOrderInput {
	customerName: string;
	customerPhone?: string;
	customerAddress?: string;
	notes?: string;
	items: CreateOfflineOrderItemInput[];
}

export async function getActiveProductsForOrder() {
	return await db
		.select({
			id: products.id,
			name: products.name,
			code: products.code,
			price: products.price,
			unit: products.unit
		})
		.from(products)
		.where(and(eq(products.isActive, true), isNull(products.deletedAt)))
		.orderBy(asc(products.name));
}

export async function createOfflineCashOrder(input: CreateOfflineCashOrderInput) {
	if (!input.items || input.items.length === 0) {
		throw new Error('Pilih minimal satu produk untuk dipesan');
	}

	let totalAmount = 0;
	const resolvedItems: Array<{
		product: typeof products.$inferSelect;
		quantity: number;
		unitPrice: number;
	}> = [];

	for (const item of input.items) {
		if (!item.productId) continue;
		const [prod] = await db
			.select()
			.from(products)
			.where(and(eq(products.id, item.productId), isNull(products.deletedAt)))
			.limit(1);

		if (!prod) {
			throw new Error('Produk tidak ditemukan atau telah dinonaktifkan');
		}

		const qty = Number(item.quantity);
		if (isNaN(qty) || qty <= 0) {
			throw new Error(`Jumlah untuk produk ${prod.name} tidak valid`);
		}

		const price = Number(prod.price);
		totalAmount += price * qty;
		resolvedItems.push({
			product: prod,
			quantity: qty,
			unitPrice: price
		});
	}

	if (resolvedItems.length === 0) {
		throw new Error('Pilih minimal satu produk yang valid');
	}

	const now = new Date();
	const [order] = await db
		.insert(orders)
		.values({
			userId: null,
			status: 'PAID',
			totalAmount: String(totalAmount),
			customerName: input.customerName || 'Pelanggan Tunai Offline',
			customerPhone: input.customerPhone || null,
			customerAddress: input.customerAddress || 'Transaksi Offline (Di Toko / Pabrik)',
			notes: input.notes ? `[Tunai / Offline] ${input.notes}` : '[Tunai / Offline]',
			paidAt: now,
			createdAt: now,
			updatedAt: now
		})
		.returning();

	for (const item of resolvedItems) {
		await db.insert(orderItems).values({
			orderId: order.id,
			productId: item.product.id,
			productName: item.product.name,
			productCode: item.product.code,
			quantity: String(item.quantity),
			unitPrice: String(item.unitPrice),
			unit: item.product.unit
		});

		// Deduct stock for offline sale
		await db.insert(stockMovements).values({
			productId: item.product.id,
			quantityChange: String(-item.quantity),
			movementType: 'MANUAL_OUT',
			note: `Penjualan tunai offline pesanan #${order.id.slice(0, 8)} (${input.customerName || 'Offline'})`,
			referenceId: order.id
		});
	}

	return { orderId: order.id, totalAmount, itemsCount: resolvedItems.length };
}
