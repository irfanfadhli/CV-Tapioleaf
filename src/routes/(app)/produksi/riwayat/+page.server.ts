import type { PageServerLoad } from './$types';
import * as productionService from '$lib/server/production/service';

export const load: PageServerLoad = async (event) => {
	const query = Object.fromEntries(event.url.searchParams) as Record<string, string>;
	const result = await productionService.listProductions(query as any);
	return {
		items: result.items,
		pagination: result.pagination,
		query,
		sort: query.sort || 'productionDate',
		order: query.order || 'desc'
	};
};
