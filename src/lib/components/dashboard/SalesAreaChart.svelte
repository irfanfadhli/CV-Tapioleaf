<script lang="ts">
	import SkeletonWidget from './SkeletonWidget.svelte';

	let { data = [] as Array<{ date: string; total: number }>, loading = false, 	color = 'var(--primary)', label = 'Penjualan' }: {
		data?: Array<{ date: string; total: number }>;
		loading?: boolean;
		color?: string;
		label?: string;
	} = $props();

	let maxVal = $derived(Math.max(...data.map(d => d.total), 1));
	let points = $derived(data.map((d, i) => `${(i / (data.length - 1 || 1)) * 100},${100 - (d.total / maxVal) * 100}`).join(' '));
	let areaPoints = $derived(`0,100 ${points} 100,100`);
</script>

<div class="rounded-xl border bg-card p-5 shadow-sm">
	<h3 class="mb-3 text-sm font-semibold text-muted-foreground">📈 {label}</h3>
	{#if loading}
		<SkeletonWidget height="h-48" />
	{:else if data.length === 0}
		<div class="flex h-48 items-center justify-center text-sm text-muted-foreground">Belum ada data</div>
	{:else}
		<div class="relative h-48 w-full">
			<svg viewBox="0 0 100 100" class="h-full w-full overflow-visible" preserveAspectRatio="none">
				<defs>
					<linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color={color} stop-opacity="0.2" />
						<stop offset="100%" stop-color={color} stop-opacity="0.02" />
					</linearGradient>
				</defs>
				<polyline fill="url(#areaGrad)" stroke="none" points={areaPoints} />
				<polyline fill="none" stroke={color} stroke-width="2" points={points} vector-effect="non-scaling-stroke" />
			</svg>
			<div class="absolute inset-x-0 bottom-0 flex justify-between px-1">
				{#each data as d}
					<span class="text-xs text-muted-foreground">{d.date.slice(5)}</span>
				{/each}
			</div>
		</div>
	{/if}
</div>
