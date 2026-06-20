<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Search, ShoppingBag, AlertTriangle, Package } from '@lucide/svelte';

	let { data } = $props();

	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let searchQuery = $state($page.url.searchParams.get('search') || '');

	function handleSearch() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			const url = new URL($page.url);
			if (searchQuery) url.searchParams.set('search', searchQuery);
			else url.searchParams.delete('search');
			url.searchParams.set('page', '1');
			goto(url.toString(), { replaceState: true });
		}, 300);
	}

	function formatPrice(price: string, unit: string): string {
		const num = Number(price);
		if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)} juta/${unit.toLowerCase()}`;
		if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)} rb/${unit.toLowerCase()}`;
		return `Rp ${num.toLocaleString('id-ID')}/${unit.toLowerCase()}`;
	}
</script>

<svelte:head>
	<title>Katalog Produk — CV TapioLeaf</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
	<header class="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
			<div class="flex items-center gap-2">
				<img src="/img/logo.png" alt="TapioLeaf" class="h-9 w-9 rounded-full object-cover" />
				<div>
					<p class="font-bold leading-tight">CV TapioLeaf</p>
					<p class="text-xs text-muted-foreground">Tepung Tapioka Berkualitas</p>
				</div>
			</div>
			<div class="flex items-center gap-3">
				<a href="/login" class="text-sm text-muted-foreground hover:text-foreground">Admin</a>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-4 py-8">
		<div class="mb-8 text-center">
			<h1 class="mb-2 text-3xl font-bold">Katalog Produk</h1>
			<p class="text-muted-foreground">Temukan berbagai produk tepung tapioka dan bahan baku berkualitas dari CV TapioLeaf</p>
		</div>

		<div class="relative mx-auto mb-8 max-w-md">
			<Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
			<input
				type="text"
				placeholder="Cari produk..."
				class="w-full rounded-full border bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-emerald-500"
				bind:value={searchQuery}
				oninput={handleSearch}
			/>
		</div>

		{#if data.items.length === 0}
			<div class="py-20 text-center">
				<Package size={48} class="mx-auto mb-4 text-muted-foreground/50" />
				<p class="text-lg font-medium text-muted-foreground">Tidak ada produk ditemukan</p>
				<p class="text-sm text-muted-foreground/70">Coba ubah kata kunci pencarian</p>
			</div>
		{:else}
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.items as item}
					<div class="group rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
						<div class="mb-3 flex items-start justify-between">
							<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-lg font-bold text-emerald-700">
								{item.name.charAt(0)}
							</div>
							{#if item.currentStock < 10}
								<span class="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600"><AlertTriangle size={10} /> Stok terbatas</span>
							{/if}
						</div>
						<h3 class="mb-1 font-semibold">{item.name}</h3>
						<p class="mb-3 line-clamp-2 text-sm text-muted-foreground">{item.description || 'Produk berkualitas tinggi dari CV TapioLeaf'}</p>
						<div class="flex items-center justify-between">
							<span class="text-lg font-bold text-emerald-700">{formatPrice(item.price, item.unit)}</span>
							<span class="text-xs text-muted-foreground">Stok: {item.currentStock} {item.unit}</span>
						</div>
					</div>
				{/each}
			</div>

			{#if data.pagination.totalPages > 1}
				<div class="mt-8 flex items-center justify-center gap-2">
					{#each Array(data.pagination.totalPages) as _, i}
						<a
							href="?page={i + 1}&search={data.search}"
							class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors"
							class:bg-emerald-600={data.pagination.page === i + 1}
							class:text-white={data.pagination.page === i + 1}
							class:hover:bg-emerald-50={data.pagination.page !== i + 1}
							class:text-emerald-700={data.pagination.page === i + 1}
						>{i + 1}</a>
					{/each}
				</div>
			{/if}
		{/if}
	</main>

	<footer class="border-t bg-white py-6 text-center text-sm text-muted-foreground">
		<p>&copy; 2026 CV TapioLeaf. All rights reserved.</p>
	</footer>
</div>
