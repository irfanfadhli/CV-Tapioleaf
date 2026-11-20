<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';
	import Loader2 from '@lucide/svelte/icons/loader-2';

	let {
		id = '',
		label = '',
		placeholder = 'Pilih opsi...',
		searchPlaceholder = 'Ketik pencarian...',
		items = [],
		value = $bindable(''),
		disabled = false,
		loading = false,
		required = false,
		onchange
	}: {
		id?: string;
		label?: string;
		placeholder?: string;
		searchPlaceholder?: string;
		items: Array<{ kode: string; nama: string }>;
		value?: string;
		disabled?: boolean;
		loading?: boolean;
		required?: boolean;
		onchange?: (selectedKode: string) => void;
	} = $props();

	let isOpen = $state(false);
	let searchQuery = $state('');
	let containerRef: HTMLDivElement | null = $state(null);

	const selectedItem = $derived(items.find((item) => item.kode === value));
	const filteredItems = $derived(
		searchQuery.trim() === ''
			? items
			: items.filter((item) => item.nama.toLowerCase().includes(searchQuery.toLowerCase().trim()))
	);

	function toggleOpen() {
		if (disabled || loading) return;
		isOpen = !isOpen;
		if (isOpen) {
			searchQuery = '';
		}
	}

	function handleSelect(kode: string) {
		value = kode;
		isOpen = false;
		searchQuery = '';
		if (onchange) {
			onchange(kode);
		}
	}

	function clearSelection(e: MouseEvent) {
		e.stopPropagation();
		value = '';
		isOpen = false;
		searchQuery = '';
		if (onchange) {
			onchange('');
		}
	}

	function handleClickOutside(e: MouseEvent) {
		if (containerRef && !containerRef.contains(e.target as Node)) {
			isOpen = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="relative grid gap-1.5" bind:this={containerRef}>
	{#if label}
		<div class="flex items-center justify-between">
			<label for={id} class="text-xs font-semibold text-foreground">
				{label} {#if required}<span class="text-destructive">*</span>{/if}
			</label>
			{#if loading}
				<Loader2 size={12} class="animate-spin text-primary" />
			{/if}
		</div>
	{/if}

	<!-- Trigger Button (Tampilan mirip input select yang elegan) -->
	<button
		{id}
		type="button"
		class="flex h-9 w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-1.5 text-xs sm:text-sm text-foreground transition-all hover:bg-muted/30 focus:border-primary focus:ring-1 focus:ring-primary outline-hidden disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-muted-foreground {isOpen ? 'border-primary ring-1 ring-primary' : ''}"
		onclick={toggleOpen}
		{disabled}
	>
		<span class="truncate {selectedItem ? 'font-medium text-foreground' : 'text-muted-foreground'}">
			{selectedItem ? selectedItem.nama : placeholder}
		</span>

		<div class="flex items-center gap-1.5 text-muted-foreground shrink-0 pl-1">
			{#if selectedItem && !disabled}
				<span
					role="button"
					tabindex="0"
					class="p-0.5 rounded-full hover:bg-muted hover:text-foreground cursor-pointer"
					onclick={clearSelection}
					onkeydown={(e) => { if (e.key === 'Enter') clearSelection(e as any); }}
				>
					<X size={12} />
				</span>
			{/if}
			<ChevronDown size={14} class="transition-transform duration-200 {isOpen ? 'rotate-180 text-primary' : ''}" />
		</div>
	</button>

	<!-- Dropdown Menu dengan Search Box -->
	{#if isOpen}
		<div class="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-xl animate-in fade-in-0 zoom-in-95 duration-100 flex flex-col">
			<!-- Search Input di dalam dropdown -->
			<div class="relative mb-1 shrink-0 px-0.5">
				<Search size={13} class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
				<input
					type="text"
					class="h-8 w-full rounded-lg border border-border bg-background pl-7 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
					placeholder={searchPlaceholder}
					bind:value={searchQuery}
					onclick={(e) => e.stopPropagation()}
				/>
			</div>

			<!-- List Opsi -->
			<div class="overflow-y-auto max-h-48 space-y-0.5 pr-0.5">
				{#if filteredItems.length > 0}
					{#each filteredItems as item}
						<button
							type="button"
							class="w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground flex items-center justify-between {item.kode === value ? 'bg-primary/10 font-bold text-primary' : 'text-foreground'}"
							onclick={() => handleSelect(item.kode)}
						>
							<span class="truncate">{item.nama}</span>
							{#if item.kode === value}
								<span class="text-primary text-[11px] font-semibold">✓</span>
							{/if}
						</button>
					{/each}
				{:else}
					<div class="p-3 text-center text-xs text-muted-foreground italic">
						Tidak ada hasil "{searchQuery}"
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
