<script lang="ts">
	import SkeletonWidget from './SkeletonWidget.svelte';

	let { data = [] as Array<{ name: string; revenue: number; cost: number; margin: number | null }>, loading = false }: {
		data?: Array<{ name: string; revenue: number; cost: number; margin: number | null }>;
		loading?: boolean;
	} = $props();

	let maxMargin = $derived(Math.max(...data.map(d => Math.abs(d.margin ?? 0)), 1));
</script>

<div class="rounded-xl border bg-white p-5 shadow-sm">
	<h3 class="mb-3 text-sm font-semibold text-muted-foreground">📊 Margin Per Produk</h3>
	{#if loading}
		<SkeletonWidget height="h-64" />
	{:else if data.length === 0}
		<div class="flex h-48 items-center justify-center text-sm text-muted-foreground">Belum ada data margin. Isi harga modal di produk untuk melihat margin.</div>
	{:else}
		<div class="space-y-4">
			{#each data as d}
				<div class="flex items-center gap-3">
					<div class="w-24 shrink-0 text-right">
						<span class="text-xs font-medium {d.margin !== null && d.margin >= 20 ? 'text-green-600' : d.margin !== null && d.margin >= 0 ? 'text-yellow-600' : 'text-red-600'}">
							{d.margin !== null ? `${d.margin}%` : 'N/A'}
						</span>
					</div>
					<div class="min-w-0 flex-1">
						<div class="flex items-baseline justify-between">
							<span class="text-sm font-medium truncate">{d.name}</span>
							<span class="text-xs text-muted-foreground">Rp {(d.revenue - d.cost).toLocaleString('id-ID')}</span>
						</div>
						<div class="mt-1 h-3 w-full overflow-hidden rounded-full bg-gray-100">
							<div
								class="h-full rounded-full transition-all"
								style="width: {Math.max(Math.abs(d.margin ?? 0) / maxMargin * 100, 2)}%; background: {d.margin !== null && d.margin >= 20 ? '#059669' : d.margin !== null && d.margin >= 0 ? '#d97706' : '#dc2626'};"
							></div>
						</div>
						<div class="flex justify-between text-xs text-muted-foreground">
							<span>Modal: Rp {d.cost.toLocaleString('id-ID')}</span>
							<span>Jual: Rp {d.revenue.toLocaleString('id-ID')}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
