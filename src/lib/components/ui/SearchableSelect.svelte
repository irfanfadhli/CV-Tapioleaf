<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Search from '@lucide/svelte/icons/search';
	import Check from '@lucide/svelte/icons/check';

	let {
		id = '',
		label = '',
		placeholder = 'Pilih...',
		searchPlaceholder = 'Cari...',
		items = [],
		value = '',
		disabled = false,
		required = false,
		onSelect = (item: { kode: string; nama: string }) => {}
	}: {
		id?: string;
		label?: string;
		placeholder?: string;
		searchPlaceholder?: string;
		items: Array<{ kode: string; nama: string }>;
		value?: string;
		disabled?: boolean;
		required?: boolean;
		onSelect?: (item: { kode: string; nama: string }) => void;
	} = $props();

	let isOpen = $state(false);
	let searchQuery = $state('');
	let containerRef: HTMLDivElement | undefined;

	const selectedItem = $derived(items.find((item) => item.kode === value));

	const filteredItems = $derived.by(() => {
		const q = searchQuery.toLowerCase().trim();
		if (!q) return items;
		return items.filter((item) => item.nama.toLowerCase().includes(q));
	});

	function toggleOpen() {
		if (disabled) return;
		isOpen = !isOpen;
		if (isOpen) {
			searchQuery = '';
		}
	}

	function handleChoose(item: { kode: string; nama: string }) {
		onSelect(item);
		isOpen = false;
		searchQuery = '';
	}

	function handleClickOutside(event: MouseEvent) {
		if (containerRef && !containerRef.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div class="relative w-full min-w-0" bind:this={containerRef}>
	<!-- Trigger Button (Tampilan Mirip Select/Input Modern) -->
	<button
		type="button"
		{id}
		onclick={toggleOpen}
		{disabled}
		class="h-10 w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm text-foreground flex items-center justify-between gap-1.5 text-left transition-all hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary outline-hidden disabled:bg-muted/50 disabled:cursor-not-allowed disabled:text-muted-foreground shadow-2xs overflow-hidden"
	>
		<span class="truncate block flex-1 min-w-0 {selectedItem ? 'font-medium text-foreground' : 'text-muted-foreground'}">
			{selectedItem ? selectedItem.nama : placeholder}
		</span>
		<ChevronDown size={14} class="shrink-0 text-muted-foreground transition-transform duration-200 {isOpen ? 'rotate-180 text-primary' : ''}" />
	</button>

	<!-- Dropdown Menu dengan Search Bar -->
	{#if isOpen}
		<div class="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[200px] max-h-64 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-100 flex flex-col">
			<!-- Kolom Search di dalam Dropdown -->
			<div class="p-2 border-b border-border/60 bg-muted/20">
				<div class="relative flex items-center">
					<Search size={13} class="absolute left-2.5 text-muted-foreground pointer-events-none" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder={searchPlaceholder}
						class="w-full h-8 pl-8 pr-2.5 text-xs bg-background border border-border/80 rounded-lg focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
					/>
				</div>
			</div>

			<!-- List Items -->
			<div class="overflow-y-auto max-h-52 p-1 divide-y divide-border/20">
				{#if filteredItems.length === 0}
					<div class="py-3 px-2 text-center text-xs text-muted-foreground italic">
						Tidak ada hasil "{searchQuery}"
					</div>
				{:else}
					{#each filteredItems as item}
						<button
							type="button"
							onclick={() => handleChoose(item)}
							class="w-full px-2.5 py-2 text-left text-xs rounded-lg flex items-center justify-between gap-2 transition-colors hover:bg-primary/10 hover:text-primary {item.kode === value ? 'bg-primary/15 font-semibold text-primary' : 'text-foreground'}"
						>
							<span class="truncate flex-1">{item.nama}</span>
							{#if item.kode === value}
								<Check size={12} class="shrink-0 text-primary" />
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
