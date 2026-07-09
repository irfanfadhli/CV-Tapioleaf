import { siteConfig } from '$lib/config';

const BASE = siteConfig.url.toString().replace(/\/$/, '');

const staticPages = [
	{ path: '', priority: '1.0', changefreq: 'weekly' as const },
	{ path: '/login', priority: '0.3', changefreq: 'monthly' as const },
	{ path: '/catalog', priority: '0.8', changefreq: 'daily' as const },
];

function url(loc: string, priority: string, changefreq: string) {
	return `<url><loc>${BASE}${loc}</loc><priority>${priority}</priority><changefreq>${changefreq}</changefreq></url>`;
}

export async function GET() {
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map((p) => url(p.path, p.priority, p.changefreq)).join('\n')}
</urlset>`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
}
