<script lang="ts">
	let { active, onChange }: { active: string; onChange: (period: string) => void } = $props();

	const periods = [
		{ value: 'today', label: 'Hari Ini' },
		{ value: 'week', label: 'Minggu Ini' },
		{ value: 'month', label: 'Bulan Ini' },
	];
</script>

<div class="inline-flex overflow-hidden rounded-lg border bg-card">
	{#each periods as p}
		<button
			class="px-4 py-2 text-sm font-medium transition-colors {active === p.value ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted/50'}"
			onclick={() => onChange(p.value)}
		>{p.label}</button>
	{/each}
</div>
