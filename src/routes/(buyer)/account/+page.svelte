<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import User from '@lucide/svelte/icons/user';
	import ShoppingBag from '@lucide/svelte/icons/shopping-bag';
	import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Receipt from '@lucide/svelte/icons/receipt';

	let { data } = $props();
</script>

<svelte:head>
	<title>Akun Saya — CV TapioLeaf</title>
</svelte:head>

<div class="mx-auto max-w-3xl space-y-6">
	<!-- Page Header -->
	<div>
		<h1 class="text-2xl font-extrabold tracking-tight text-foreground">Akun Saya</h1>
		<p class="text-xs sm:text-sm text-muted-foreground mt-0.5">Kelola informasi akun dan pantau seluruh transaksi pembelian Anda</p>
	</div>

	<!-- Profile Hero Card (Modern Clean Gradient) -->
	<div class="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-5 sm:p-6 shadow-xs">
		<div class="flex items-center gap-4">
			<div class="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner ring-1 ring-primary/20">
				<User size={28} />
			</div>
			<div class="min-w-0">
				<h2 class="text-lg font-bold text-foreground truncate">{data.user.name || 'Pelanggan CV TapioLeaf'}</h2>
				<p class="text-xs text-muted-foreground mt-0.5 font-medium">{data.user.email}</p>
			</div>
		</div>
	</div>

	<!-- Quick Navigation Card: Semua Pesanan -->
	<div>
		<a
			href="/orders"
			class="group relative flex items-center justify-between rounded-2xl border border-border/80 bg-card p-4 sm:p-5 transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]"
		>
			<div class="flex items-center gap-3.5">
				<div class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
					<ShoppingBag size={20} />
					{#if data.unreadCount && data.unreadCount > 0}
						<span class="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground animate-pulse">
							{data.unreadCount}
						</span>
					{/if}
				</div>
				<div>
					<div class="flex items-center gap-2">
						<p class="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Semua Pesanan</p>
						{#if data.unreadCount && data.unreadCount > 0}
							<span class="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
								Ada Update
							</span>
						{/if}
					</div>
					<p class="text-xs text-muted-foreground mt-0.5">Pantau status pesanan, pembayaran, dan riwayat belanja</p>
				</div>
			</div>
			<span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-all group-hover:bg-primary/10 group-hover:text-primary group-hover:translate-x-1">
				<ChevronRight size={16} />
			</span>
		</a>
	</div>

	<!-- Orders Section (Pesanan Saya) -->
	<div class="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
		<!-- Section Header -->
		<div class="flex items-center justify-between border-b border-border/60 pb-3.5">
			<div class="flex items-center gap-3">
				<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
					<Receipt size={18} />
				</div>
				<div>
					<h3 class="text-sm sm:text-base font-bold text-foreground">Pesanan Saya</h3>
					<p class="text-[11px] sm:text-xs text-muted-foreground">Riwayat transaksi pembelian Anda</p>
				</div>
			</div>
			{#if data.orders.length > 0}
				<span class="rounded-full bg-muted/70 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
					{data.orders.length} Transaksi
				</span>
			{/if}
		</div>

		<!-- Orders List -->
		{#if data.orders.length === 0}
			<div class="rounded-xl border border-dashed border-border/80 p-8 text-center bg-muted/20">
				<div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/70 text-muted-foreground">
					<ShoppingBag size={22} />
				</div>
				<p class="text-sm font-bold text-foreground">Belum ada riwayat pesanan</p>
				<p class="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
					Pesanan Anda akan muncul di sini setelah Anda melakukan pemesanan.
				</p>
				<div class="mt-4 flex items-center justify-center">
					<a href="/orders">
						<Button variant="default" size="sm" class="rounded-full px-5 text-xs font-semibold gap-1.5 shadow-xs">
							<ShoppingBag size={14} /> Cek Status Pesanan
						</Button>
					</a>
				</div>
			</div>
		{:else}
			<div class="space-y-3">
				{#each data.orders as order}
					<a
						href="/orders/{order.id}"
						class="group flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:bg-muted/20 hover:shadow-xs active:scale-[0.99]"
					>
						<!-- Left: ID, Product Info, Date -->
						<div class="min-w-0 flex-1 space-y-1">
							<div class="flex items-center gap-2">
								<span class="font-mono text-xs font-semibold text-muted-foreground">
									#{order.id.slice(0, 8)}
								</span>
								<span class="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
									<CheckCircle2 size={10} /> Lunas
								</span>
							</div>

							{#if order.items && order.items.length > 0}
								<p class="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
									{order.items.map((i: any) => `${i.productName} (${i.quantity} ${i.unit})`).join(', ')}
								</p>
							{/if}

							<div class="flex items-center gap-1 text-[11px] text-muted-foreground">
								<Calendar size={12} />
								<span>
									{new Date(order.createdAt).toLocaleDateString('id-ID', {
										weekday: 'short',
										day: 'numeric',
										month: 'short',
										year: 'numeric'
									})}
								</span>
							</div>
						</div>

						<!-- Right: Total & Action -->
						<div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
							<div class="text-left sm:text-right">
								<p class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Transaksi</p>
								<p class="text-sm sm:text-base font-extrabold text-primary tracking-tight">
									Rp {Number(order.totalAmount).toLocaleString('id-ID')}
								</p>
							</div>

							<div class="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground transition-all group-hover:bg-primary/10 group-hover:text-primary group-hover:translate-x-0.5">
								<ChevronRight size={16} />
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
