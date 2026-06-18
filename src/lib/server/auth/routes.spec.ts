import { describe, it, expect } from 'vitest';
import { getRouteConfig } from './routes';

describe('getRouteConfig', () => {
	it('returns public config for katalog page', () => {
		const config = getRouteConfig('/katalog');
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

	it('returns protected config for gudang with owner and petugas roles', () => {
		const config = getRouteConfig('/gudang');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(true);
		expect(config!.roles).toContain('owner');
		expect(config!.roles).toContain('petugas_gudang');
	});

	it('returns protected config for produksi with owner and bagian_produksi roles', () => {
		const config = getRouteConfig('/produksi');
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

	it('returns protected config for kategori with owner and admin roles', () => {
		const config = getRouteConfig('/kategori');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(true);
		expect(config!.roles).toContain('owner');
		expect(config!.roles).toContain('admin_penjualan');
	});

	it('returns protected config for gudang with owner and petugas roles', () => {
		const config = getRouteConfig('/gudang');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(true);
		expect(config!.roles).toContain('owner');
		expect(config!.roles).toContain('petugas_gudang');
	});

	it('returns gudang config for gudang/riwayat path', () => {
		const config = getRouteConfig('/gudang/riwayat');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(true);
		expect(config!.roles).toContain('petugas_gudang');
	});

	it('returns protected config for produksi with owner and bagian_produksi roles', () => {
		const config = getRouteConfig('/produksi');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(true);
		expect(config!.roles).toContain('owner');
		expect(config!.roles).toContain('bagian_produksi');
	});

	it('returns produksi config for produksi/riwayat path', () => {
		const config = getRouteConfig('/produksi/riwayat');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(true);
		expect(config!.roles).toContain('bagian_produksi');
	});
});
