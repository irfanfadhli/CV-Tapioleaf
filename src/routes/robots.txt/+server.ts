import { siteConfig } from '$lib/config';

const BASE = siteConfig.url.toString().replace(/\/$/, '');

export async function GET() {
	const body = `User-agent: *
Disallow:
Allow: /

Sitemap: ${BASE}/sitemap.xml
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
}
