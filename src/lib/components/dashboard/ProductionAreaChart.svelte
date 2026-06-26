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
	let targetY = $derived(Math.min(100 - (targetKg / maxVal) * 100, 0));
</script>

<div class="rounded-xl border bg-white p-5 shadow-sm">
	<h3 class="mb-3 text-sm font-semibold text-muted-foreground">🏭 Tren Produksi</h3>
	{#if loading}
		<SkeletonWidget height="h-48" />
	{:else if data.length === 0}
		<div class="flex h-48 items-center justify-center text-sm text-muted-foreground">Belum ada data produksi</div>
	{:else}
		<div class="relative h-48 w-full">
			<!-- Target line -->
			<div class="absolute left-0 right-0 border-t-2 border-dashed border-red-400" style="top: {targetY}%;">
				<span class="absolute -top-4 right-0 text-xs text-red-500">{targetKg}kg</span>
			</div>
			<svg viewBox="0 0 100 100" class="h-full w-full overflow-visible" preserveAspectRatio="none">
				<defs>
					<linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="#2563eb" stop-opacity="0.2" />
						<stop offset="100%" stop-color="#2563eb" stop-opacity="0.02" />
					</linearGradient>
				</defs>
				<polyline fill="url(#prodGrad)" stroke="none" points={areaPoints} />
				<polyline fill="none" stroke="#2563eb" stroke-width="2" points={points} vector-effect="non-scaling-stroke" />
			</svg>
			<div class="absolute inset-x-0 bottom-0 flex justify-between px-1">
				{#each data as d}
					<span class="text-xs text-muted-foreground">{d.date.slice(5)}</span>
				{/each}
			</div>
		</div>
	{/if}
</div>
