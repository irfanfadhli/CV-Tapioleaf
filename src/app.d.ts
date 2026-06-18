import type { User, Session } from 'better-auth';

declare global {
	namespace App {
		interface Locals {
			user?: User & { role: 'owner' | 'admin_penjualan' | 'petugas_gudang' | 'bagian_produksi' | 'pembeli_umkm' };
			session?: Session;
		}
	}
}

export {};
