<script lang="ts">
	import SkeletonWidget from './SkeletonWidget.svelte';

	let { data = [] as Array<{ name: string; revenue: number; cost: number; margin: number | null }>, loading = false }: {
		data?: Array<{ name: string; revenue: number; cost: number; margin: number | null }>;
		loading?: boolean;
	} = $props();

	let maxMargin = $derived(Math.max(...data.map(d => Math.abs(d.margin ?? 0)), 1));
</script>

<div class="rounded-xl border bg-card p-5 shadow-sm">
	<h3 class="mb-3 text-sm font-semibold text-muted-foreground">📊 Margin Per Produk</h3>
	{#if loading}
		<SkeletonWidget height="h-64" />
	{:else if data.length === 0}
		<div class="flex h-48 items-center justify-center text-sm text-muted-foreground">Belum ada data margin. Isi harga modal di produk untuk melihat margin.</div>
	{:else}
		<div class="space-y-3">
			{#each data as d}
				<div class="flex items-center gap-2">
					<div class="w-10 shrink-0 text-right">
						<span class="text-xs font-bold {d.margin !== null && d.margin >= 20 ? 'text-primary' : d.margin !== null && d.margin >= 0 ? 'text-warning' : 'text-destructive'}">
							{d.margin !== null ? `${d.margin}%` : 'N/A'}
						</span>
					</div>
					<div class="min-w-0 flex-1">
						<div class="flex items-baseline justify-between">
							<span class="truncate text-sm font-medium">{d.name}</span>
						</div>
						<div class="relative h-5 w-full overflow-hidden rounded-md bg-muted">
							<div
								class="h-full rounded-md transition-all duration-500"
								style="width: {Math.max(Math.abs(d.margin ?? 0) / maxMargin * 100, 2)}%; background: {d.margin !== null && d.margin >= 20 ? 'var(--primary)' : d.margin !== null && d.margin >= 0 ? 'var(--warning)' : 'var(--destructive)'};"
							></div>
						</div>
						<div class="flex justify-between text-xs text-muted-foreground">
							<span>Modal: Rp {d.cost.toLocaleString('id-ID')}</span>
							<span>Jual: Rp {d.revenue.toLocaleString('id-ID')}</span>
							<span>Untung: Rp {(d.revenue - d.cost).toLocaleString('id-ID')}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
