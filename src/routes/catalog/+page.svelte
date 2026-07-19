<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Search, AlertTriangle, Package } from '@lucide/svelte';

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
		if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)} Juta`;
		return `Rp ${num.toLocaleString('id-ID')}`;
	}
</script>

<svelte:head>
	<title>Katalog Produk — CV TapioLeaf</title>
</svelte:head>

<div class="min-h-screen bg-[#f5f5f5]">
	<header class="sticky top-0 z-10 border-b bg-[#ee4d2d] shadow-sm">
		<div class="mx-auto flex max-w-5xl items-center gap-3 px-3 py-2.5">
			<a href="/" class="shrink-0">
				<picture><source srcset="/img/logo.webp" type="image/webp" /><img src="/img/logo.png" alt="TapioLeaf" class="h-8 w-8 rounded-full object-cover" width="32" height="32" loading="lazy" decoding="async" /></picture>
			</a>
			<div class="relative flex-1">
				<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
				<input
					type="text"
					placeholder="Cari tepung tapioka..."
					class="w-full rounded-sm border-0 bg-white py-2 pl-9 pr-3 text-sm outline-none placeholder:text-gray-400"
					bind:value={searchQuery}
					oninput={handleSearch}
				/>
			</div>
			<a href="/login" class="shrink-0 text-xs font-medium text-white/90 hover:text-white">Admin</a>
		</div>
	</header>

	<main class="mx-auto max-w-5xl px-2 py-3">
		{#if data.items.length === 0}
			<div class="flex flex-col items-center justify-center py-20 text-center">
				<Package size={56} class="mb-4 text-gray-300" />
				<p class="text-base font-medium text-gray-500">Tidak ada produk ditemukan</p>
				<p class="mt-1 text-sm text-gray-400">Coba ubah kata kunci pencarian</p>
			</div>
		{:else}
			<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
				{#each data.items as item (item.id)}
					<div
						class="group block overflow-hidden rounded-lg bg-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
					>
						<div class="relative aspect-square w-full overflow-hidden bg-gray-100">
							{#if item.imageUrl}
								<picture>
									<img
										src={item.imageUrl}
										alt={item.name}
										class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
										loading="lazy"
										decoding="async"
									/>
								</picture>
							{:else}
								<div class="flex h-full w-full items-center justify-center bg-primary/5">
									<span class="text-3xl font-bold text-primary/30">{item.name.charAt(0)}</span>
								</div>
							{/if}

							{#if item.currentStock < 10}
								<span class="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-sm bg-[#ee4d2d] px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
									<AlertTriangle size={9} /> Stok Terbatas
								</span>
							{/if}
						</div>

						<div class="px-2 pt-1.5 pb-2">
							<h3 class="line-clamp-2 text-sm leading-snug text-gray-800">{item.name}</h3>
							<p class="mt-1 text-base font-bold text-[#ee4d2d]">{formatPrice(item.price, item.unit)}</p>
							<p class="mt-0.5 text-[10px] text-gray-400">per {item.unit.toLowerCase()}</p>
							<p class="mt-1 text-[10px] text-gray-400">Kab. Pati</p>
						</div>
					</div>
				{/each}
			</div>

			{#if data.pagination.totalPages > 1}
				<div class="mt-4 flex items-center justify-center gap-1.5">
					{#each Array(data.pagination.totalPages) as _, i}
						<a
							href="?page={i + 1}&search={data.search}"
							class="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-sm px-2 text-xs font-medium transition-colors {data.pagination.page === i + 1 ? 'bg-[#ee4d2d] text-white shadow-sm' : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50'}"
						>{i + 1}</a>
					{/each}
				</div>
			{/if}
		{/if}
	</main>

	<footer class="mt-4 border-t bg-white py-4 text-center text-xs text-gray-400">
		<p>&copy; 2026 CV TapioLeaf. All rights reserved.</p>
	</footer>
</div>
