<script lang="ts">
	import SkeletonWidget from './SkeletonWidget.svelte';

	let { data = [] as Array<{ date: string; totalKg: number }>, loading = false }: {
		data?: Array<{ date: string; totalKg: number }>;
		loading?: boolean;
	} = $props();

	let dataMax = $derived(Math.max(...data.map(d => d.totalKg), 100));
	let maxVal = $derived(dataMax * 1.25);
	let points = $derived(
		data.length === 1
			? `0,${100 - (data[0].totalKg / maxVal) * 100} 100,${100 - (data[0].totalKg / maxVal) * 100}`
			: data.map((d, i) => `${(i / (data.length - 1 || 1)) * 100},${100 - (d.totalKg / maxVal) * 100}`).join(' ')
	);
	let areaPoints = $derived(`0,100 ${points} 100,100`);
</script>

<div class="rounded-xl border bg-card p-5 shadow-sm">
	<div class="mb-3">
		<h3 class="text-sm font-semibold text-muted-foreground">🏭 Tren Produksi</h3>
	</div>
	{#if loading}
		<SkeletonWidget height="h-48" />
	{:else if data.length === 0}
		<div class="flex h-48 items-center justify-center text-sm text-muted-foreground">Belum ada data produksi</div>
	{:else}
		<div class="relative h-48 w-full">
			<svg viewBox="0 0 100 100" class="h-full w-full overflow-visible" preserveAspectRatio="none">
				<defs>
					<linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="var(--info)" stop-opacity="0.25" />
						<stop offset="100%" stop-color="var(--info)" stop-opacity="0.02" />
					</linearGradient>
				</defs>
				<polyline fill="url(#prodGrad)" stroke="none" points={areaPoints} />
				<polyline fill="none" stroke="var(--info)" stroke-width="2" points={points} vector-effect="non-scaling-stroke" />
			</svg>
			<div class="absolute inset-x-0 bottom-0 flex justify-between px-1">
				{#each data as d}
					<span class="text-[11px] text-muted-foreground">{d.date.slice(5)}</span>
				{/each}
			</div>
		</div>
	{/if}
</div>
