import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function optimizeImageUrl(url: string | null | undefined, width = 400, quality = 75): string | null {
	if (!url) return null;
	if (url.includes('supabase.co') && url.includes('/storage/v1/object/public/')) {
		return url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + `?width=${width}&quality=${quality}&format=webp`;
	}
	return url;
}

const STATUS_LABELS: Record<string, string> = {
	PAID: 'Lunas',
	PENDING: 'Menunggu',
	APPROVED: 'Disetujui',
	PROCESSING: 'Diproses',
	SHIPPED: 'Dikirim',
	COMPLETED: 'Selesai',
	CANCELLED: 'Dibatalkan',
	draft: 'Draft',
	confirmed: 'Terkonfirmasi',
	cancelled: 'Dibatalkan'
};

/** Pusat mapping status → label Indonesia (laporan & ekspor). */
export function reportStatusLabel(status: string): string {
	return STATUS_LABELS[status] ?? status;
}

/** Pusat mapping tipe transaksi → label Indonesia. */
export function reportTypeLabel(type: 'sale' | 'order'): string {
	return type === 'sale' ? 'Penjualan Timbangan' : 'Pesanan Katalog';
}
