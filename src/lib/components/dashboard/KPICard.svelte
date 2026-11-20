<script lang="ts">
	let {
		title,
		value,
		subtitle = '',
		change = null as number | null,
		icon = null as any,
		alert = false,
		loading = false,
		compareLabel = '',
		accentColor = 'primary', // 'blue' | 'emerald' | 'amber' | 'purple' | 'primary'
		onclick = undefined as (() => void) | undefined
	}: {
		title: string;
		value: string;
		subtitle?: string;
		change?: number | null;
		icon?: any;
		alert?: boolean;
		loading?: boolean;
		compareLabel?: string;
		accentColor?: 'blue' | 'emerald' | 'amber' | 'purple' | 'primary' | 'rose';
		onclick?: () => void;
	} = $props();

	const colorStyles: Record<string, { badge: string; borderHover: string; gradient: string }> = {
		primary: {
			badge: 'bg-primary/10 text-primary border-primary/20',
			borderHover: 'hover:border-primary/50 group-hover:shadow-primary/5',
			gradient: 'from-primary/5 to-transparent'
		},
		blue: {
			badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
			borderHover: 'hover:border-blue-500/40 group-hover:shadow-blue-500/5',
			gradient: 'from-blue-500/5 to-transparent'
		},
		emerald: {
			badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
			borderHover: 'hover:border-emerald-500/40 group-hover:shadow-emerald-500/5',
			gradient: 'from-emerald-500/5 to-transparent'
		},
		amber: {
			badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
			borderHover: 'hover:border-amber-500/40 group-hover:shadow-amber-500/5',
			gradient: 'from-amber-500/5 to-transparent'
		},
		purple: {
			badge: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
			borderHover: 'hover:border-purple-500/40 group-hover:shadow-purple-500/5',
			gradient: 'from-purple-500/5 to-transparent'
		},
		rose: {
			badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
			borderHover: 'hover:border-rose-500/40 group-hover:shadow-rose-500/5',
			gradient: 'from-rose-500/5 to-transparent'
		}
	};

	let cfg = $derived(colorStyles[accentColor] || colorStyles.primary);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	onclick={onclick}
	class="group relative overflow-hidden rounded-2xl border bg-card/80 backdrop-blur-xs p-5 shadow-xs transition-all duration-300 {onclick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg ' + cfg.borderHover : 'hover:shadow-sm'} {alert ? 'border-destructive/30 bg-destructive/5 ring-1 ring-destructive/20' : 'border-border/70'}"
>
	<!-- Top subtle gradient accent -->
	<div class="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b {cfg.gradient}"></div>

	{#if loading}
		<div class="animate-pulse space-y-3 relative z-10">
			<div class="flex justify-between items-center">
				<div class="h-4 w-20 rounded-md bg-muted"></div>
				<div class="h-8 w-8 rounded-lg bg-muted"></div>
			</div>
			<div class="h-8 w-28 rounded-md bg-muted"></div>
			<div class="h-3 w-32 rounded-md bg-muted"></div>
		</div>
	{:else}
		<div class="relative z-10 flex flex-col justify-between h-full space-y-3">
			<div class="flex items-center justify-between">
				<span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">{title}</span>
				{#if icon}
					<div class="flex h-9 w-9 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110 {cfg.badge}">
						{#if typeof icon === 'string'}
							<span class="text-base">{icon}</span>
						{:else}
							{@const IconComponent = icon}
							<IconComponent size={18} strokeWidth={2.2} />
						{/if}
					</div>
				{/if}
			</div>

			<div>
				<p class="text-2xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-[26px]">
					{value}
				</p>
			</div>

			<div class="flex items-center justify-between border-t border-border/40 pt-2.5 text-xs">
				<div class="flex items-center gap-1.5 truncate text-muted-foreground">
					{#if subtitle}
						<span class="truncate font-medium">{subtitle}</span>
					{/if}
				</div>

				{#if change !== null}
					<span class="inline-flex items-center gap-0.5 font-semibold {change >= 0 ? 'text-emerald-600' : 'text-rose-600'} shrink-0 ml-1">
						{change >= 0 ? '↑' : '↓'}{Math.abs(change).toFixed(1)}%
						{#if compareLabel}
							<span class="text-[10px] font-normal text-muted-foreground/70">({compareLabel})</span>
						{/if}
					</span>
				{:else if onclick}
					<span class="shrink-0 text-[11px] font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex items-center gap-0.5">
						Buka →
					</span>
				{/if}
			</div>
		</div>
	{/if}
</div>
