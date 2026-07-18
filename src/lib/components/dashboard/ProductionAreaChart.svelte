<script lang="ts">
	import SkeletonWidget from './SkeletonWidget.svelte';

	let { data = [] as Array<{ date: string; totalKg: number }>, loading = false, targetKg = 4000 }: {
		data?: Array<{ date: string; totalKg: number }>;
		loading?: boolean;
		targetKg?: number;
	} = $props();

	let dataMax = $derived(Math.max(...data.map(d => d.totalKg), 1));
	let maxVal = $derived(dataMax * 1.3);
	let points = $derived(data.map((d, i) => `${(i / (data.length - 1 || 1)) * 100},${100 - (d.totalKg / maxVal) * 100}`).join(' '));
	let areaPoints = $derived(`0,100 ${points} 100,100`);
	let targetY = $derived(100 - (targetKg / maxVal) * 100);
</script>

<div class="rounded-xl border bg-card p-5 shadow-sm">
	<h3 class="mb-3 text-sm font-semibold text-muted-foreground">🏭 Tren Produksi</h3>
	{#if loading}
		<SkeletonWidget height="h-48" />
	{:else if data.length === 0}
		<div class="flex h-48 items-center justify-center text-sm text-muted-foreground">Belum ada data produksi</div>
	{:else}
		<div class="relative h-48 w-full overflow-hidden">
			<svg viewBox="0 0 100 100" class="h-full w-full" preserveAspectRatio="none">
		<defs>
				<linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="var(--info)" stop-opacity="0.2" />
					<stop offset="100%" stop-color="var(--info)" stop-opacity="0.02" />
				</linearGradient>
			</defs>
			{#if targetKg > 0}
				<line x1="0" y1={targetY} x2="100" y2={targetY} stroke="var(--destructive)" stroke-width="1.5" stroke-dasharray="4,3" />
				<text x="100" y={Math.max(targetY, -4)} fill="var(--destructive)" font-size="6" text-anchor="end" dominant-baseline="auto">{targetKg}kg</text>
			{/if}
				<polyline fill="url(#prodGrad)" stroke="none" points={areaPoints} />
				<polyline fill="none" stroke="var(--info)" stroke-width="2" points={points} vector-effect="non-scaling-stroke" />
			</svg>
			<div class="absolute inset-x-0 bottom-0 flex justify-between px-1">
				{#each data as d}
					<span class="text-xs text-muted-foreground">{d.date.slice(5)}</span>
				{/each}
			</div>
		</div>
	{/if}
</div>
