<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { ShoppingBag, ChevronRight, Package, Clock } from '@lucide/svelte';
	import BackButton from '$lib/components/ui/back-button.svelte';

	let { data } = $props();

	const statusLabels: Record<string, string> = {
		PENDING: 'Menunggu Persetujuan',
		APPROVED: 'Menunggu Pembayaran',
		PAID: 'Lunas',
		PROCESSING: 'Diproses',
		SHIPPED: 'Dikirim',
		COMPLETED: 'Selesai',
		CANCELLED: 'Dibatalkan'
	};

	const statusColors: Record<string, string> = {
		PENDING: 'text-warning bg-warning/10 border-warning/20',
		APPROVED: 'text-blue-600 bg-blue-50 border-blue-200',
		PAID: 'text-primary bg-primary/10 border-primary/20',
		PROCESSING: 'text-info bg-info/10 border-info/20',
		SHIPPED: 'text-info bg-info/20 border-info/30',
		COMPLETED: 'text-primary bg-primary/10 border-primary/20',
		CANCELLED: 'text-destructive bg-destructive/10 border-destructive/20'
	};
</script>

<svelte:head>
	<title>Pesanan Saya — CV TapioLeaf</title>
</svelte:head>

<div class="mb-4">
	<BackButton fallbackHref="/account" label="Kembali ke Dashboard" variant="ghost" />
</div>

<div class="mb-6 flex items-center gap-3">
	<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
		<ShoppingBag size={22} />
	</div>
	<div>
		<h1 class="text-2xl font-bold tracking-tight">Pesanan Saya</h1>
		<p class="text-xs text-muted-foreground sm:text-sm">Semua riwayat dan status pesanan Anda</p>
	</div>
</div>

{#if data.orders.length === 0}
	<Card>
		<CardContent class="py-12 text-center">
			<Package size={48} class="mx-auto mb-4 text-muted-foreground/50" />
			<p class="text-lg font-medium text-muted-foreground">Belum ada pesanan</p>
			<p class="mt-1 text-sm text-muted-foreground/70">Kunjungi katalog untuk mulai memesan tepung tapioka</p>
			<a href="/"><Button class="mt-4" variant="default">Lihat Katalog</Button></a>
		</CardContent>
	</Card>
{:else}
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.orders as order}
			<a
				href="/orders/{order.id}"
				class="group flex flex-col justify-between rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.99]"
			>
				<div>
					<div class="flex items-center justify-between gap-2 mb-2">
						<span class="text-xs font-mono font-medium text-muted-foreground">
							#{order.id.slice(0, 8)}
						</span>
						<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium {statusColors[order.status] || 'bg-muted text-muted-foreground border-transparent'}">
							{statusLabels[order.status] || order.status}
						</span>
					</div>

					{#if order.items && order.items.length > 0}
						<div class="space-y-1 mb-3">
							{#each order.items as item}
								<p class="text-sm font-semibold text-foreground line-clamp-1">
									{item.productName}
								</p>
								<p class="text-xs text-muted-foreground">
									{item.quantity} {item.unit} × Rp {Number(item.unitPrice).toLocaleString('id-ID')}
								</p>
							{/each}
						</div>
					{/if}
				</div>

				<div class="pt-3 border-t flex items-center justify-between mt-2">
					<div>
						<p class="text-[11px] text-muted-foreground">
							{new Date(order.createdAt).toLocaleDateString('id-ID', {
								day: 'numeric',
								month: 'short',
								year: 'numeric'
							})}
						</p>
						<p class="text-sm font-bold text-primary">
							Rp {Number(order.totalAmount).toLocaleString('id-ID')}
						</p>
					</div>
					<span class="flex items-center text-xs font-medium text-primary group-hover:translate-x-0.5 transition-transform">
						Detail <ChevronRight size={14} class="ml-0.5" />
					</span>
				</div>
			</a>
		{/each}
	</div>
{/if}