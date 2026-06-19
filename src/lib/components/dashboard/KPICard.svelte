<script lang="ts">
	let {
		title,
		value,
		subtitle = '',
		change = null as number | null,
		icon = null as string | null,
		alert = false,
		loading = false
	}: {
		title: string;
		value: string;
		subtitle?: string;
		change?: number | null;
		icon?: string | null;
		alert?: boolean;
		loading?: boolean;
	} = $props();
</script>

<div class="rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md {alert ? 'border-red-300 bg-red-50' : ''}">
	{#if loading}
		<div class="animate-pulse space-y-3">
			<div class="h-4 w-20 rounded bg-gray-200"></div>
			<div class="h-8 w-32 rounded bg-gray-200"></div>
			<div class="h-3 w-24 rounded bg-gray-200"></div>
		</div>
	{:else}
		<div class="flex items-start justify-between">
			<p class="text-sm font-medium text-muted-foreground">{title}</p>
			{#if icon}<span class="text-lg">{icon}</span>{/if}
		</div>
		<p class="mt-1 text-2xl font-bold">{value}</p>
		<div class="mt-1 flex items-center gap-2">
			{#if subtitle}<p class="text-xs text-muted-foreground">{subtitle}</p>{/if}
			{#if change !== null}
				<span class="inline-flex items-center gap-0.5 text-xs font-medium {change >= 0 ? 'text-green-600' : 'text-red-600'}">
					{change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
				</span>
			{/if}
		</div>
	{/if}
</div>
