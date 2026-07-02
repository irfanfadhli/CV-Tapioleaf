import { describe, it, expect } from 'vitest';
import { getRouteConfig } from './routes';

describe('getRouteConfig', () => {
	it('returns public config for catalog page', () => {
		const config = getRouteConfig('/catalog');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(false);
	});

	it('returns public config for login page', () => {
		const config = getRouteConfig('/login');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(false);
	});

	it('returns protected config for dashboard with owner and admin roles', () => {
		const config = getRouteConfig('/dashboard');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(true);
		expect(config!.roles).toContain('owner');
		expect(config!.roles).toContain('admin_penjualan');
	});

	it('returns protected config for warehouses with owner and petugas roles', () => {
		const config = getRouteConfig('/warehouses');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(true);
		expect(config!.roles).toContain('owner');
		expect(config!.roles).toContain('bagian_produksi');
	});

	it('returns public config for auth API routes', () => {
		const config = getRouteConfig('/api/auth/sign-in');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(false);
	});

	it('returns public config for 403 page', () => {
		const config = getRouteConfig('/403');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(false);
	});

	it('returns protected config for categories with owner and admin roles', () => {
		const config = getRouteConfig('/categories');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(true);
		expect(config!.roles).toContain('owner');
		expect(config!.roles).toContain('admin_penjualan');
	});

	it('returns protected config for warehouses with owner and petugas roles', () => {
		const config = getRouteConfig('/warehouses');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(true);
		expect(config!.roles).toContain('owner');
		expect(config!.roles).toContain('petugas_gudang');
	});

	it('returns warehouses config for warehouses/history path', () => {
		const config = getRouteConfig('/warehouses/history');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(true);
		expect(config!.roles).toContain('petugas_gudang');
	});

	it('returns protected config for production with owner and bagian_produksi roles', () => {
		const config = getRouteConfig('/production');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(true);
		expect(config!.roles).toContain('owner');
		expect(config!.roles).toContain('bagian_produksi');
	});

	it('returns production config for production/history path', () => {
		const config = getRouteConfig('/production/history');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(true);
		expect(config!.roles).toContain('bagian_produksi');
	});
});
