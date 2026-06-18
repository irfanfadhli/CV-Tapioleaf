import type { RequestHandler } from './$types';
import { auth } from '$lib/server/auth';

const handle: RequestHandler = async (event) => {
	const url = new URL(event.request.url);
	const req = new Request(url.toString(), {
		method: event.request.method,
		headers: event.request.headers,
		body: ['GET', 'HEAD'].includes(event.request.method) ? undefined : await event.request.arrayBuffer()
	});
	return auth.handler(req);
};

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
