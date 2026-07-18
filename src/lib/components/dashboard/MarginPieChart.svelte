<script lang="ts">
	import SkeletonWidget from './SkeletonWidget.svelte';

	let { data = [] as Array<{ name: string; margin: number | null; revenue: number; cost: number }>, loading = false }: {
		data?: Array<{ name: string; margin: number | null; revenue: number; cost: number }>;
		loading?: boolean;
	} = $props();

	const colors = ['var(--primary)', 'var(--warning)'];
	const r = 38, circ = 2 * Math.PI * r;
	let total = $derived(data.reduce((s, d) => s + d.revenue, 0) || 1);
	let segs = $derived((() => {
		let cum = 0;
		return data.map(d => {
			const pct = d.revenue / total;
			const offset = cum * circ;
			cum += pct;
			return { dash: pct * circ, offset };
		});
	})());
</script>

<div class="rounded-xl border bg-card p-5 shadow-sm">
	<h3 class="mb-3 text-sm font-semibold text-muted-foreground">🍩 Margin Per Produk</h3>
	{#if loading}
		<SkeletonWidget height="h-64" />
	{:else if data.length === 0}
		<div class="flex h-48 items-center justify-center text-sm text-muted-foreground">Belum ada data margin. Isi harga modal di produk.</div>
	{:else}
		<div class="flex flex-col gap-4 sm:flex-row">
			<div class="relative h-40 w-40 shrink-0 self-center">
				<svg viewBox="0 0 100 100" class="h-full w-full -rotate-90">
					{#each data as d, i}
						<circle cx="50" cy="50" r={r} fill="none" stroke={colors[i % colors.length]} stroke-width="8"
							stroke-dasharray="{segs[i].dash} {circ}"
							stroke-dashoffset={-segs[i].offset}
						/>
					{/each}
					<text x="50" y="50" text-anchor="middle" dominant-baseline="middle" fill="currentColor" font-size="9" font-weight="bold" transform="rotate(90, 50, 50)">{data.length} produk</text>
				</svg>
			</div>
			<div class="flex-1 space-y-1.5 self-center">
				{#each data as d, i}
					<div class="flex items-center gap-2 text-sm">
						<div class="h-3 w-3 shrink-0 rounded-full" style="background: {colors[i % colors.length]}"></div>
						<span class="truncate min-w-0 flex-1">{d.name}</span>
						<span class="shrink-0 text-xs text-muted-foreground">{(d.revenue / total * 100).toFixed(1)}%</span>
						<span class="w-14 shrink-0 text-right text-xs font-medium {d.margin !== null && d.margin >= 20 ? 'text-primary' : d.margin !== null && d.margin >= 0 ? 'text-warning' : 'text-destructive'}">{d.margin !== null ? `${d.margin}%` : 'N/A'}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
