<script lang="ts">
	let { active, onChange }: { active: string; onChange: (period: string) => void } = $props();

	const periods = [
		{ value: 'today', label: 'Hari Ini' },
		{ value: 'week', label: 'Minggu Ini' },
		{ value: 'month', label: 'Bulan Ini' },
	];
</script>

<div class="inline-flex items-center gap-1 p-1 rounded-xl border border-border/60 bg-muted/40 backdrop-blur-xs shadow-2xs">
	{#each periods as p}
		<button
			class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 {active === p.value ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-background/60'}"
			onclick={() => onChange(p.value)}
		>{p.label}</button>
	{/each}
</div>
