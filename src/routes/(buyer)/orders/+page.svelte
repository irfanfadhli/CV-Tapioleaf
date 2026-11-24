<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { ShoppingBag, ChevronRight, Package, Clock, XCircle } from '@lucide/svelte';
	import BackButton from '$lib/components/ui/back-button.svelte';

	let { data } = $props();

	const statusLabels: Record<string, string> = {
		PENDING: 'Menunggu Persetujuan',
		APPROVED: 'Menunggu Pembayaran',
		PAID: 'Lunas',
		CANCELLED: 'Dibatalkan'
	};

	const statusColors: Record<string, string> = {
		PENDING: 'text-warning bg-warning/10 border-warning/20',
		APPROVED: 'text-blue-600 bg-blue-50 border-blue-200',
		PAID: 'text-primary bg-primary/10 border-primary/20',
		CANCELLED: 'text-destructive bg-destructive/10 border-destructive/20'
	};
</script>

<svelte:head>
	<title>Pesanan Saya — CV TapioLeaf</title>
</svelte:head>

<div class="mb-4">
	<BackButton fallbackHref="/account" label="Kembali ke Dashboard" variant="ghost" />
</div>

<div class="mb-6 flex items-center justify-between">
	<div class="flex items-center gap-3">
		<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
			<ShoppingBag size={22} />
		</div>
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Pesanan Saya</h1>
			<p class="text-xs text-muted-foreground sm:text-sm">Semua riwayat dan status pesanan Anda</p>
		</div>
	</div>
</div>

{#if data.orders.some((o: any) => o.status === 'APPROVED' || (o.status === 'CANCELLED' && o.cancelledBy === 'ADMIN'))}
	<div class="mb-6 space-y-2.5">
		{#each data.orders.filter((o: any) => o.status === 'APPROVED') as approvedOrder}
			<div
				class="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3.5 text-xs sm:p-4 sm:text-sm"
			>
				<div class="flex items-center gap-2.5">
					<div
						class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary"
					>
						<Clock size={15} />
					</div>
					<div>
						<p class="font-semibold text-foreground">
							Pesanan #{approvedOrder.id.slice(0, 8)} Telah Disetujui Admin!
						</p>
						<p class="text-[11px] text-muted-foreground">
							Silakan lanjutkan pembayaran sebesar <strong
								>Rp {Number(approvedOrder.totalAmount).toLocaleString('id-ID')}</strong
							>
						</p>
					</div>
				</div>
				<a href="/orders/{approvedOrder.id}">
					<Button size="sm" class="h-8 gap-1.5 text-xs font-semibold">Bayar Sekarang</Button>
				</a>
			</div>
		{/each}

		{#each data.orders.filter((o: any) => o.status === 'CANCELLED' && o.cancelledBy === 'ADMIN') as cancelledOrder}
			<div
				class="flex flex-col justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-xs sm:flex-row sm:items-center sm:p-4 sm:text-sm"
			>
				<div class="flex items-start gap-2.5">
					<div
						class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-destructive/20 text-destructive"
					>
						<XCircle size={15} />
					</div>
					<div>
						<p class="font-semibold text-foreground">
							Pesanan #{cancelledOrder.id.slice(0, 8)} Telah Dibatalkan Admin
						</p>
						{#if cancelledOrder.cancellationReason}
							<p class="mt-0.5 text-[11px] text-destructive">
								<span class="font-bold">Alasan:</span>
								{cancelledOrder.cancellationReason}
							</p>
						{:else}
							<p class="mt-0.5 text-[11px] text-muted-foreground">
								Pesanan ini telah dibatalkan oleh pihak toko.
							</p>
						{/if}
					</div>
				</div>
				<a href="/orders/{cancelledOrder.id}">
					<Button
						size="sm"
						variant="outline"
						class="h-8 gap-1.5 border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10"
					>
						Lihat Detail
					</Button>
				</a>
			</div>
		{/each}
	</div>
{/if}

{#if data.orders.length === 0}
	<Card>
		<CardContent class="py-12 text-center">
			<Package size={48} class="mx-auto mb-4 text-muted-foreground/50" />
			<p class="text-lg font-medium text-muted-foreground">Belum ada pesanan</p>
			<p class="mt-1 text-sm text-muted-foreground/70">
				Kunjungi katalog untuk mulai memesan tepung tapioka
			</p>
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
					<div class="mb-2 flex items-center justify-between gap-2">
						<span class="font-mono text-xs font-medium text-muted-foreground">
							#{order.id.slice(0, 8)}
						</span>
						<span
							class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium {statusColors[
								order.status
							] || 'border-transparent bg-muted text-muted-foreground'}"
						>
							{statusLabels[order.status] || order.status}
						</span>
					</div>

					{#if order.items && order.items.length > 0}
						<div class="mb-3 space-y-1">
							{#each order.items as item}
								<p class="line-clamp-1 text-sm font-semibold text-foreground">
									{item.productName}
								</p>
								<p class="text-xs text-muted-foreground">
									{item.quantity}
									{item.unit} × Rp {Number(item.unitPrice).toLocaleString('id-ID')}
								</p>
							{/each}
						</div>
					{/if}

					{#if order.status === 'CANCELLED' && order.cancellationReason}
						<div
							class="mb-2 rounded-lg border border-destructive/20 bg-destructive/10 p-2 text-[11px] text-destructive"
						>
							<span class="font-bold">Alasan Batal:</span>
							<span class="line-clamp-2 text-foreground/90">{order.cancellationReason}</span>
						</div>
					{/if}
				</div>

				<div class="mt-2 flex items-center justify-between border-t pt-3">
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
					<span
						class="flex items-center text-xs font-medium text-primary transition-transform group-hover:translate-x-0.5"
					>
						Detail <ChevronRight size={14} class="ml-0.5" />
					</span>
				</div>
			</a>
		{/each}
	</div>
{/if}
