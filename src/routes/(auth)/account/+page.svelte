<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { LogOut, User, ShoppingBag, Package } from '@lucide/svelte';

	let { data } = $props();

	function handleLogout() {
		fetch('/api/sign-out', { method: 'POST' }).catch(() => {});
		window.location.href = '/';
	}
</script>

<div class="min-h-screen bg-gray-50">
	<header class="border-b bg-white">
		<div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
			<div class="flex items-center gap-2">
				<a href="/"
					><img src="/img/logo.png" alt="TapioLeaf" class="h-8 w-8 rounded-lg object-cover" /></a
				>
				<span class="text-sm font-semibold">CV TapioLeaf</span>
			</div>
			<div class="flex items-center gap-2">
				<a href="/#products"
					><Button variant="outline" size="sm"><Package size={14} class="mr-1" /> Katalog</Button
					></a
				>
				<a href="/orders"
					><Button variant="outline" size="sm"><ShoppingBag size={14} class="mr-1" /> Pesanan</Button
					></a
				>
				<Button variant="outline" size="sm" onclick={handleLogout}
					><LogOut size={14} class="mr-1" /> Keluar</Button
				>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-4xl px-4 py-8">
		<h1 class="mb-6 text-2xl font-bold">Akun Saya</h1>

		<Card class="mb-6">
			<CardHeader>
				<div class="flex items-center gap-3">
					<div class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
						<User size={22} class="text-emerald-700" />
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
						<ShoppingBag size={18} class="text-emerald-600" />
						<CardTitle class="text-lg">Pesanan Saya</CardTitle>
					</div>
					<a href="/orders" class="text-sm font-medium text-emerald-600 hover:text-emerald-700"
						>Lihat Semua →</a
					>
				</div>
			</CardHeader>
			<CardContent>
				{#if data.orders.length === 0}
					<p class="py-4 text-center text-sm text-muted-foreground">
						Belum ada pesanan. Kunjungi katalog produk untuk memesan.
					</p>
					<div class="flex justify-center">
						<a href="/"
							><Button variant="outline" class="gap-2"
								><Package size={14} /> Kembali ke Katalog</Button
							></a
						>
					</div>
				{:else}
					<div class="space-y-3">
						{#each data.orders as order}
							<a
								href="/orders/{order.id}"
								class="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50 active:scale-[0.98]"
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
										? 'bg-green-100 text-green-700'
										: order.status === 'PENDING'
											? 'bg-yellow-100 text-yellow-700'
											: 'bg-gray-100 text-gray-700'}"
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
	</main>
</div>
