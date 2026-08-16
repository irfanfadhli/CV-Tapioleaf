import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface OrderInfo {
	id: string;
	customerName: string | null;
	totalAmount: string;
	itemCount: number;
	createdAt: string;
}

interface NotificationState {
	pendingCount: number;
	recentPending: OrderInfo[];
	seenIds: Set<string>;
}

function createNotificationStore() {
	const { subscribe, set, update } = writable<NotificationState>({
		pendingCount: 0,
		recentPending: [],
		seenIds: new Set()
	});

	return {
		subscribe,
		async refresh() {
			if (!browser) return;
			const res = await fetch('/api/admin/pending-orders', {
				cache: 'no-store'
			});
			if (!res.ok) return;
			const data = await res.json() as { count: number; recent: OrderInfo[] };
			update((s) => ({
				pendingCount: data.count,
				recentPending: data.recent.map((o) => ({
					id: o.id,
					customerName: o.customerName || '-',
					totalAmount: o.totalAmount || '0',
					itemCount: 0,
					createdAt: o.createdAt ? new Date(o.createdAt).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : ''
				})),
				seenIds: s.seenIds
			}));
		},
		markSeen(id: string) {
			update((s) => {
				const newSeen = new Set(s.seenIds);
				newSeen.add(id);
				return { ...s, seenIds: newSeen };
			});
		},
		reset() { set({ pendingCount: 0, recentPending: [], seenIds: new Set() }); }
	};
}

export const notifications = createNotificationStore();