import { and, eq, desc, isNull, sql } from 'drizzle-orm';
import { db } from '../db';
import { orders, orderItems } from '../db/schema/order';
import { products } from '../db/schema/product';
import { createInvoice } from '../xendit/service';
import type { CheckoutInput } from '../xendit/validation';

export async function createOrder(input: CheckoutInput, userId: string | undefined, requestOrigin: string) {
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

	let invoiceUrl = '';
	let invoiceId = '';
	try {
		const inv = await createInvoice(order.id, input, totalAmount, requestOrigin);
		invoiceUrl = inv.invoiceUrl;
		invoiceId = inv.invoiceId;
	} catch (e) {
		console.error('Xendit createInvoice error:', e);
	}

	try {
		await db.update(orders).set({
			xenditInvoiceId: invoiceId || null,
			xenditInvoiceUrl: invoiceUrl || null,
			updatedAt: new Date()
		}).where(eq(orders.id, order.id));
	} catch (e) {
		console.error('Order update error:', e);
	}

	return {
		orderId: order.id,
		invoiceUrl: invoiceUrl || `${requestOrigin}/orders/${order.id}`
	};
}

export async function getUserOrders(userId: string, page = 1, limit = 10) {
	const offset = (page - 1) * limit;
	const items = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt)).limit(limit).offset(offset);
	const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.userId, userId));
	return { items, total: Number(countResult.count), page, limit };
}

export async function getOrder(id: string) {
	const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
	if (!order) throw new Error('Pesanan tidak ditemukan');
	const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
	return { ...order, items };
}

export async function handleXenditCallback(externalId: string, invoiceId: string, status: string) {
	if (status === 'PAID') {
		await db.update(orders).set({
			status: 'PAID',
			xenditInvoiceId: invoiceId,
			paidAt: new Date(),
			updatedAt: new Date()
		}).where(eq(orders.id, externalId));
	}
}
