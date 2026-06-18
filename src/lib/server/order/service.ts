import { and, eq, desc, isNull, sql } from 'drizzle-orm';
import { db } from '../db';
import { orders, orderItems } from '../db/schema/order';
import { products } from '../db/schema/product';
import { createInvoice } from '../xendit/service';
import type { CheckoutInput } from '../xendit/validation';

export async function createOrder(input: CheckoutInput, userId?: string) {
	const product = await db.select().from(products).where(and(eq(products.id, input.productId), isNull(products.deletedAt))).limit(1);
	if (!product.length) throw new Error('Produk tidak ditemukan');

	const p = product[0];
	const totalAmount = Number(p.price) * input.quantity;

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

	const invoice = await createInvoice(order.id, input, totalAmount);
	await db.update(orders).set({
		xenditInvoiceId: invoice.invoiceId,
		xenditInvoiceUrl: invoice.invoiceUrl,
		updatedAt: new Date()
	}).where(eq(orders.id, order.id));

	return { orderId: order.id, invoiceUrl: invoice.invoiceUrl };
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
