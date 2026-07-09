export type AppRole = 'owner' | 'admin_penjualan' | 'petugas_gudang' | 'bagian_produksi' | 'pembeli_umkm';

export interface RouteConfig {
	protected: boolean;
	roles?: AppRole[];
}

const routeMap: Record<string, RouteConfig> = {
	'/': { protected: false },
	'/login': { protected: false },
	'/catalog': { protected: false },
	'/account': { protected: true, roles: ['owner', 'admin_penjualan', 'petugas_gudang', 'bagian_produksi', 'pembeli_umkm'] },
	'/orders': { protected: true, roles: ['owner', 'admin_penjualan', 'petugas_gudang', 'bagian_produksi', 'pembeli_umkm'] },
	'/dashboard': { protected: true, roles: ['owner', 'admin_penjualan'] },
	'/products': { protected: true, roles: ['owner', 'admin_penjualan'] },
	'/categories': { protected: true, roles: ['owner', 'admin_penjualan'] },
	'/warehouses': { protected: true, roles: ['owner', 'petugas_gudang'] },
	'/production': { protected: true, roles: ['owner', 'bagian_produksi'] },
	'/suppliers': { protected: true, roles: ['owner', 'petugas_gudang'] },
	'/cassava': { protected: true, roles: ['owner', 'petugas_gudang'] }
};

export function getRouteConfig(pathname: string): RouteConfig | null {
	if (routeMap[pathname]) return routeMap[pathname];
	if (pathname.startsWith('/warehouses/')) return routeMap['/warehouses'];
	if (pathname.startsWith('/production/')) return routeMap['/production'];
	if (pathname.startsWith('/api/auth')) return { protected: false };
	if (pathname.startsWith('/api/xendit')) return { protected: false };
	if (pathname.startsWith('/api/sign-out')) return { protected: false };
	if (pathname.startsWith('/demo')) return { protected: false };
	if (pathname.startsWith('/')) return { protected: true, roles: ['owner', 'admin_penjualan', 'petugas_gudang', 'bagian_produksi', 'pembeli_umkm'] };
	return { protected: true, roles: ['owner', 'admin_penjualan', 'petugas_gudang', 'bagian_produksi', 'pembeli_umkm'] };
}
