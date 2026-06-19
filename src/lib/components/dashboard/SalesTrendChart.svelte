<script lang="ts">
	import SkeletonWidget from './SkeletonWidget.svelte';

	let { data = [] as Array<{ date: string; total: number; count: number }>, loading = false }: {
		data?: Array<{ date: string; total: number; count: number }>;
		loading?: boolean;
	} = $props();

	let max = $derived(Math.max(...data.map(d => d.total), 1));
</script>

<div class="rounded-xl border bg-white p-5 shadow-sm">
	<h3 class="mb-3 text-sm font-semibold text-muted-foreground">📊 Tren Penjualan 7 Hari</h3>
	{#if loading}
		<SkeletonWidget height="h-48" />
	{:else if data.length === 0}
		<div class="flex h-48 items-center justify-center text-sm text-muted-foreground">Belum ada data</div>
	{:else}
		<div class="flex h-48 items-end gap-2">
			{#each data as d}
				<div class="flex flex-1 flex-col items-center justify-end gap-1">
					<span class="text-xs text-muted-foreground">Rp {(d.total / 1000).toFixed(0)}k</span>
					<div
						class="w-full rounded-t bg-emerald-500 transition-all hover:bg-emerald-600"
						style="height: {(d.total / max) * 160}px; min-height: 4px;"
						title="{d.date}: Rp {d.total.toLocaleString('id-ID')} ({d.count} transaksi)"
					></div>
					<span class="text-xs text-muted-foreground">{d.date.slice(5)}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
