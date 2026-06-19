import { env } from '$env/dynamic/private';
import type { CheckoutInput } from './validation';

let invoiceClient: any = undefined;

async function getInvoiceClient() {
	if (invoiceClient !== undefined) return invoiceClient;
	try {
		if (!env.XENDIT_SECRET_KEY) { invoiceClient = null; return null; }
		const { Xendit } = await import('xendit-node');
		const xc = new Xendit({ secretKey: env.XENDIT_SECRET_KEY });
		invoiceClient = xc.Invoice;
		return invoiceClient;
	} catch (e) {
		console.error('Xendit init failed:', e);
		invoiceClient = null;
		return null;
	}
}

function toOrigin(origin: string): string {
	return origin || env.ORIGIN || 'https://tapioleaf.vercel.app';
}

export async function createInvoice(orderId: string, input: CheckoutInput, totalAmount: number, requestOrigin: string) {
	const inv = await getInvoiceClient();
	const origin = toOrigin(requestOrigin);

	if (!inv) {
		return { invoiceUrl: `${origin}/orders/${orderId}?status=pending`, invoiceId: 'offline' };
	}
	try {
		const invoice = await inv.createInvoice({
			data: {
				externalId: orderId,
				amount: totalAmount,
				description: `Pesanan ${input.customerName} - ${orderId}`,
				invoiceDuration: 86400,
				customer: {
					givenNames: input.customerName,
					mobileNumber: input.customerPhone,
					addresses: input.customerAddress ? [{ city: '', country: 'ID', streetLine1: input.customerAddress, postalCode: '' }] : undefined
				},
				customerNotificationPreference: { invoicePaid: ['whatsapp', 'email'] },
				successRedirectUrl: `${origin}/orders/${orderId}`,
				failureRedirectUrl: `${origin}/orders/${orderId}?status=failed`
			}
		});
		return { invoiceUrl: invoice.invoiceUrl!, invoiceId: invoice.id! };
	} catch (e) {
		console.error('Xendit createInvoice failed:', e);
		return { invoiceUrl: `${origin}/orders/${orderId}?status=pending`, invoiceId: 'error' };
	}
}

export async function getInvoiceStatus(invoiceId: string) {
	const inv = await getInvoiceClient();
	if (!inv) return 'OFFLINE';
	try {
		const invoice = await inv.getInvoiceById({ invoiceId });
		return invoice.status;
	} catch { return 'UNKNOWN'; }
}
