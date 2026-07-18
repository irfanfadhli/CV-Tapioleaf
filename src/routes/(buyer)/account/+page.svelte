<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { User, ShoppingBag, Package } from '@lucide/svelte';

	let { data } = $props();
</script>

<h1 class="mb-6 text-2xl font-bold">Akun Saya</h1>

<Card class="mb-6">
	<CardHeader>
		<div class="flex items-center gap-3">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
				<User size={22} class="text-primary" />
			</div>
			<div>
				<CardTitle class="text-lg">{data.user.name || 'Pelanggan'}</CardTitle>
				<p class="text-sm text-muted-foreground">{data.user.email}</p>
			</div>
		</div>
	</CardHeader>
</Card>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<ShoppingBag size={18} class="text-primary" />
				<CardTitle class="text-lg">Pesanan Saya</CardTitle>
			</div>
			<a href="/orders" class="text-sm font-medium text-primary hover:text-primary"
				>Lihat Semua →</a
			>
		</div>
	</CardHeader>
	<CardContent>
		{#if data.orders.length === 0}
			<p class="py-4 text-center text-sm text-muted-foreground">
				Belum ada pesanan. Kunjungi katalog untuk mulai berbelanja.
			</p>
			<div class="flex justify-center">
				<a href="/"
					><Button variant="outline" class="gap-2"
						><Package size={14} /> Lihat Katalog</Button
					></a
				>
			</div>
		{:else}
			<div class="space-y-3">
				{#each data.orders as order}
					<a
						href="/orders/{order.id}"
						class="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50 active:scale-[0.98]"
					>
						<div>
							<p class="text-sm font-medium">
								Rp {Number(order.totalAmount).toLocaleString('id-ID')}
							</p>
							<p class="text-xs text-muted-foreground">
								{new Date(order.createdAt).toLocaleDateString('id-ID')}
							</p>
						</div>
						<span
							class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium {order.status ===
							'PAID'
								? 'bg-primary/10 text-primary'
								: order.status === 'PENDING'
									? 'bg-warning/20 text-warning'
									: 'bg-muted text-muted-foreground'}"
						>
							{order.status === 'PAID'
								? 'Lunas'
								: order.status === 'PENDING'
									? 'Menunggu'
									: order.status}
						</span>
					</a>
				{/each}
			</div>
		{/if}
	</CardContent>
</Card>
