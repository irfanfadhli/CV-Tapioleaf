import { env } from '$env/dynamic/private';
import { Xendit } from 'xendit-node';
import type { CheckoutInput } from './validation';

const xenditClient = new Xendit({
	secretKey: env.XENDIT_SECRET_KEY || ''
});

const { Invoice } = xenditClient;

export async function createInvoice(orderId: string, input: CheckoutInput, totalAmount: number) {
	const invoice = await Invoice.createInvoice({
		data: {
			externalId: orderId,
			amount: totalAmount,
			description: `Pesanan ${input.customerName} - ${orderId}`,
			invoiceDuration: 86400,
			customer: {
				givenNames: input.customerName,
				email: input.customerName.includes('@') ? input.customerName : undefined,
				mobileNumber: input.customerPhone,
				addresses: input.customerAddress ? [{ city: '', country: 'ID', streetLine1: input.customerAddress, postalCode: '' }] : undefined
			},
			customerNotificationPreference: {
				invoicePaid: ['whatsapp', 'email']
			},
			successRedirectUrl: `${env.ORIGIN}/orders/${orderId}`,
			failureRedirectUrl: `${env.ORIGIN}/orders/${orderId}?status=failed`
		}
	});

	return {
		invoiceUrl: invoice.invoiceUrl!,
		invoiceId: invoice.id!
	};
}

export async function getInvoiceStatus(invoiceId: string) {
	const invoice = await Invoice.getInvoiceById({ invoiceId });
	return invoice.status;
}
