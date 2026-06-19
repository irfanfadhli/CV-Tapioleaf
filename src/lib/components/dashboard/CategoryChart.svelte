<script lang="ts">
	import SkeletonWidget from './SkeletonWidget.svelte';

	let { data = [] as Array<{ category: string; total: number }>, loading = false }: {
		data?: Array<{ category: string; total: number }>;
		loading?: boolean;
	} = $props();

	const colors = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];
	let total = $derived(data.reduce((s, d) => s + d.total, 0));
</script>

<div class="rounded-xl border bg-white p-5 shadow-sm">
	<h3 class="mb-3 text-sm font-semibold text-muted-foreground">🍩 Penjualan Per Kategori</h3>
	{#if loading}
		<SkeletonWidget height="h-48" />
	{:else if data.length === 0}
		<div class="flex h-48 items-center justify-center text-sm text-muted-foreground">Belum ada data</div>
	{:else}
		<div class="space-y-3">
			{#each data as d, i}
				<div class="flex items-center gap-3">
					<div class="h-3 w-3 shrink-0 rounded-full" style="background: {colors[i % colors.length]}"></div>
					<div class="min-w-0 flex-1">
						<div class="flex items-baseline justify-between">
							<span class="text-sm font-medium">{d.category}</span>
							<span class="text-sm font-semibold">Rp {d.total.toLocaleString('id-ID')}</span>
						</div>
						<div class="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
							<div class="h-full rounded-full transition-all" style="width: {total > 0 ? (d.total / total) * 100 : 0}%; background: {colors[i % colors.length]}"></div>
						</div>
						<span class="text-xs text-muted-foreground">{total > 0 ? ((d.total / total) * 100).toFixed(1) : 0}%</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
