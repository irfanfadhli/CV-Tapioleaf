<script lang="ts">
	import SkeletonWidget from './SkeletonWidget.svelte';

	let { data = [] as Array<{ date: string; totalKg: number }>, loading = false, targetKg = 4000 }: {
		data?: Array<{ date: string; totalKg: number }>;
		loading?: boolean;
		targetKg?: number;
	} = $props();

	let max = $derived(Math.max(...data.map(d => d.totalKg), targetKg, 1));
</script>

<div class="rounded-xl border bg-card p-5 shadow-sm">
	<h3 class="mb-3 text-sm font-semibold text-muted-foreground">🏭 Tren Produksi</h3>
	{#if loading}
		<SkeletonWidget height="h-48" />
	{:else if data.length === 0}
		<div class="flex h-48 items-center justify-center text-sm text-muted-foreground">Belum ada data</div>
	{:else}
		<div class="relative h-48">
			<div class="absolute left-0 right-0 border-t-2 border-dashed border-destructive/50" style="bottom: {(targetKg / max) * 100}%;">
				<span class="absolute -top-4 right-0 text-xs text-destructive">Target {targetKg}kg</span>
			</div>
			<div class="flex h-full items-end gap-2 pt-4">
				{#each data as d}
					<div class="flex flex-1 flex-col items-center justify-end gap-1">
						{#if d.totalKg > targetKg * 0.8}
							<span class="text-xs text-primary">{(d.totalKg / 1000).toFixed(1)}t</span>
						{/if}
						<div
							class="w-full rounded-t {d.totalKg >= targetKg ? 'bg-primary' : 'bg-warning'} transition-all hover:opacity-80"
							style="height: {(d.totalKg / max) * 160}px; min-height: 4px;"
							title="{d.date}: {d.totalKg}kg"
						></div>
						<span class="text-xs text-muted-foreground">{d.date.slice(5)}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
