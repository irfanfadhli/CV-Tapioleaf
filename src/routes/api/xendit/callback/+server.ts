import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import * as orderService from '$lib/server/order/service';

export const POST: RequestHandler = async (event) => {
	try {
		const body = await event.request.json();
		const token = event.request.headers.get('x-callback-token');
		const expectedToken = env.XENDIT_WEBHOOK_TOKEN;

		if (expectedToken && token !== expectedToken) {
			return json({ error: 'invalid token' }, { status: 401 });
		}

		const { external_id, id: invoiceId, status } = body;
		if (!external_id || !status) {
			return json({ error: 'missing fields' }, { status: 400 });
		}

		await orderService.handleXenditCallback(external_id, invoiceId, status);
		return json({ received: true });
	} catch {
		return json({ error: 'invalid payload' }, { status: 400 });
	}
};
