<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { User, ShoppingBag, Package, CheckCircle2, ChevronRight, ShieldCheck } from '@lucide/svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Akun Saya — CV TapioLeaf</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-5">
	<!-- Page Header -->
	<div>
		<h1 class="text-2xl font-bold tracking-tight">Akun Saya</h1>
		<p class="text-xs text-muted-foreground sm:text-sm">Kelola profil dan pantau riwayat transaksi Anda</p>
	</div>

	<!-- Profile Card -->
	<Card class="overflow-hidden border shadow-sm">
		<CardContent class="p-4 sm:p-5">
			<div class="flex items-center justify-between gap-4">
				<div class="flex items-center gap-3.5">
					<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
						<User size={24} />
					</div>
					<div class="min-w-0">
						<div class="flex items-center gap-2">
							<h2 class="truncate text-base font-semibold text-foreground sm:text-lg">{data.user.name || 'Pelanggan'}</h2>
							<span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
								<ShieldCheck size={12} /> Pembeli
							</span>
						</div>
						<p class="truncate text-xs text-muted-foreground sm:text-sm">{data.user.email}</p>
					</div>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Quick Navigation Banner -->
	<div class="grid grid-cols-2 gap-3">
		<a
			href="/orders"
			class="group relative flex flex-col justify-between rounded-xl border bg-card p-3.5 transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.98] sm:p-4"
		>
			<div class="flex items-center justify-between">
				<div class="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-9 sm:w-9">
					<ShoppingBag size={18} />
					{#if data.unreadCount && data.unreadCount > 0}
						<span class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
							{data.unreadCount}
						</span>
					{/if}
				</div>
				<div class="flex items-center gap-1.5">
					{#if data.unreadCount && data.unreadCount > 0}
						<span class="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
							Notifikasi Baru
						</span>
					{/if}
					<ChevronRight size={16} class="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
				</div>
			</div>
			<div class="mt-2.5">
				<div class="flex items-center gap-1.5">
					<p class="text-xs font-semibold text-foreground sm:text-sm">Semua Pesanan</p>
					{#if data.unreadCount && data.unreadCount > 0}
						<span class="h-2 w-2 rounded-full bg-destructive animate-ping"></span>
					{/if}
				</div>
				<p class="text-[11px] text-muted-foreground">Lihat status & proses pesanan</p>
			</div>
		</a>

		<a
			href="/#products"
			class="group flex flex-col justify-between rounded-xl border bg-card p-3.5 transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.98] sm:p-4"
		>
			<div class="flex items-center justify-between">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-9 sm:w-9">
					<Package size={18} />
				</div>
				<ChevronRight size={16} class="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
			</div>
			<div class="mt-2.5">
				<p class="text-xs font-semibold text-foreground sm:text-sm">Katalog Produk</p>
				<p class="text-[11px] text-muted-foreground">Pesan tepung tapioka</p>
			</div>
		</a>
	</div>

	<!-- Paid Orders Card -->
	<Card class="border shadow-sm">
		<CardHeader class="p-4 pb-2 sm:p-5 sm:pb-3">
			<div class="flex items-center gap-2.5">
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<CheckCircle2 size={16} />
				</div>
				<div>
					<CardTitle class="text-base font-semibold sm:text-lg">Pesanan Lunas</CardTitle>
					<p class="text-xs text-muted-foreground">Riwayat pesanan yang telah dibayar</p>
				</div>
			</div>
		</CardHeader>

		<CardContent class="p-4 pt-2 sm:p-5 sm:pt-2">
			{#if data.orders.length === 0}
				<div class="rounded-lg border border-dashed p-6 text-center">
					<div class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
						<ShoppingBag size={20} />
					</div>
					<p class="text-sm font-medium text-foreground">Belum ada pesanan yang lunas</p>
					<p class="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
						Pesanan yang menunggu persetujuan atau belum dibayar dapat Anda pantau di menu Pesanan.
					</p>
					<div class="mt-4 flex items-center justify-center gap-2">
						<a href="/orders">
							<Button variant="default" size="sm" class="gap-1.5">
								<ShoppingBag size={14} /> Cek Pesanan
							</Button>
						</a>
						<a href="/#products">
							<Button variant="outline" size="sm" class="gap-1.5">
								<Package size={14} /> Katalog
							</Button>
						</a>
					</div>
				</div>
			{:else}
				<div class="space-y-2.5">
					{#each data.orders as order}
						<a
							href="/orders/{order.id}"
							class="group flex flex-col justify-between gap-2 rounded-xl border bg-card p-3.5 transition-all hover:border-primary/40 hover:bg-muted/30 active:scale-[0.99] sm:flex-row sm:items-center"
						>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<span class="font-mono text-xs font-medium text-muted-foreground">
										#{order.id.slice(0, 8)}
									</span>
									<span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
										<CheckCircle2 size={10} /> Lunas
									</span>
								</div>

								{#if order.items && order.items.length > 0}
									<p class="mt-1 text-sm font-medium text-foreground">
										{order.items.map((i: any) => `${i.productName} (${i.quantity} ${i.unit})`).join(', ')}
									</p>
								{/if}

								<p class="mt-0.5 text-[11px] text-muted-foreground">
									{new Date(order.createdAt).toLocaleDateString('id-ID', {
										weekday: 'long',
										year: 'numeric',
										month: 'long',
										day: 'numeric'
									})}
								</p>
							</div>

							<div class="flex items-center justify-between border-t pt-2 sm:border-t-0 sm:pt-0 sm:text-right">
								<span class="text-xs text-muted-foreground sm:hidden">Total Bayar:</span>
								<div class="flex items-center gap-1.5 sm:flex-col sm:items-end sm:gap-0">
									<p class="text-sm font-bold text-primary">
										Rp {Number(order.totalAmount).toLocaleString('id-ID')}
									</p>
									<span class="hidden text-[11px] text-muted-foreground group-hover:text-primary sm:inline-flex sm:items-center">
										Detail <ChevronRight size={12} class="ml-0.5" />
									</span>
								</div>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
