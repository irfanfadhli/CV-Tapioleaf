<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { ShoppingBag, ChevronRight, Package } from '@lucide/svelte';
	import BackButton from '$lib/components/ui/back-button.svelte';

	let { data } = $props();

	const statusLabels: Record<string, string> = {
		PENDING: 'Menunggu Pembayaran',
		PAID: 'Lunas',
		PROCESSING: 'Diproses',
		SHIPPED: 'Dikirim',
		COMPLETED: 'Selesai',
		CANCELLED: 'Dibatalkan'
	};

	const statusColors: Record<string, string> = {
		PENDING: 'text-yellow-600 bg-yellow-50',
		PAID: 'text-green-600 bg-green-50',
		PROCESSING: 'text-blue-600 bg-blue-50',
		SHIPPED: 'text-purple-600 bg-purple-50',
		COMPLETED: 'text-emerald-600 bg-emerald-50',
		CANCELLED: 'text-red-600 bg-red-50'
	};
</script>

<div class="mb-6 flex items-center gap-3">
	<BackButton fallbackHref="/account" />
	<ShoppingBag size={24} class="text-emerald-600" />
	<h1 class="text-2xl font-bold">Pesanan Saya</h1>
</div>

{#if data.orders.length === 0}
	<Card>
		<CardContent class="py-12 text-center">
			<Package size={48} class="mx-auto mb-4 text-muted-foreground/50" />
			<p class="text-lg font-medium text-muted-foreground">Belum ada pesanan</p>
			<p class="mt-1 text-sm text-muted-foreground/70">Kunjungi katalog untuk mulai berbelanja</p>
			<a href="/"><Button class="mt-4" variant="outline">Lihat Katalog</Button></a>
		</CardContent>
	</Card>
{:else}
	<div class="space-y-3">
		{#each data.orders as order}
			<a href="/orders/{order.id}" class="block rounded-xl border bg-white p-4 shadow-sm transition-colors hover:bg-gray-50">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-xs text-muted-foreground">Rp {Number(order.totalAmount).toLocaleString('id-ID')}</p>
						<p class="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
					</div>
					<div class="flex items-center gap-2">
						<span class="rounded-full px-3 py-1 text-xs font-medium {statusColors[order.status] || 'bg-gray-50 text-gray-600'}">{statusLabels[order.status] || order.status}</span>
						<ChevronRight size={16} class="text-muted-foreground" />
					</div>
				</div>
			</a>
		{/each}
	</div>
{/if}
