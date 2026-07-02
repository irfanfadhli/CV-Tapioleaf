<script lang="ts">
	import { page } from '$app/stores';
	import { goto, afterNavigate } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Plus, Search, ArrowUpDown, ArrowUp, ArrowDown } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
import ProductTable from '$lib/components/products/ProductTable.svelte';
import ProductFormModal from '$lib/components/products/ProductFormModal.svelte';

	let { data, form } = $props();

	let searchRef: HTMLInputElement | undefined;
	let searchQuery = $state($page.url.searchParams.get('search') || '');
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	afterNavigate(() => {
		searchRef?.focus();
	});
	let showModal = $state(false);
	let editingProduct = $state<any>(null);

	function handleSearch() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			const url = new URL($page.url);
			if (searchQuery) url.searchParams.set('search', searchQuery);
			else url.searchParams.delete('search');
			url.searchParams.set('page', '1');
			goto(url.toString(), { replaceState: true });
		}, 300);
	}

	function toggleSort(column: string) {
		const url = new URL($page.url);
		const currentSort = data.sort;
		const currentOrder = data.order;
		let newOrder = 'asc';
		if (currentSort === column) {
			newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
		}
		url.searchParams.set('sort', column);
		url.searchParams.set('order', newOrder);
		url.searchParams.set('page', '1');
		goto(url.toString(), { replaceState: true });
	}

	function openCreate() {
		editingProduct = null;
		showModal = true;
	}

	function openEdit(product: any) {
		editingProduct = product;
		showModal = true;
	}

	onMount(() => {
		if (form?.message) {
			toast.success(form.message);
		}
	});
</script>

<div class="space-y-6">
	<div class="flex flex-wrap items-center gap-2">
		<h1 class="text-xl font-bold md:text-2xl">Manajemen Produk</h1>
		<Button onclick={openCreate} size="sm" class="md:default"><Plus size={16} class="mr-1" /> Tambah Produk</Button>
	</div>

	<div class="flex flex-wrap gap-2 md:gap-4">
		<div class="relative flex-1">
			<Search size={16} class="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
			<input
				type="text"
				bind:this={searchRef}
				placeholder="Cari nama atau kode produk..."
				class="w-full rounded-lg border bg-background py-2 pr-4 pl-10 text-sm outline-none focus:ring-2 focus:ring-ring"
				bind:value={searchQuery}
				oninput={handleSearch}
			/>
		</div>
		<select
			class="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
			onchange={(e) => {
				const url = new URL($page.url);
				const val = (e.target as HTMLSelectElement).value;
				if (val) url.searchParams.set('status', val);
				else url.searchParams.delete('status');
				goto(url.toString(), { replaceState: true });
			}}
		>
			<option
				value="active"
				selected={!$page.url.searchParams.get('status') ||
					$page.url.searchParams.get('status') === 'active'}>Aktif</option
			>
			<option value="all" selected={$page.url.searchParams.get('status') === 'all'}>Semua</option>
			<option value="inactive" selected={$page.url.searchParams.get('status') === 'inactive'}
				>Nonaktif</option
			>
		</select>
	</div>

	<ProductTable
		products={data.products}
		sort={data.sort}
		order={data.order}
		onSort={toggleSort}
		onEdit={openEdit}
	/>

	{#if data.pagination.totalPages > 1}
		<div class="flex items-center justify-center gap-2">
			{#each Array(data.pagination.totalPages) as _, i}
				<a
					href="?page={i + 1}"
					class="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm"
					class:bg-primary={data.pagination.page === i + 1}
					class:text-primary-foreground={data.pagination.page === i + 1}
					class:hover:bg-muted={data.pagination.page !== i + 1}>{i + 1}</a
				>
			{/each}
		</div>
	{/if}
</div>

<ProductFormModal
	open={showModal}
	product={editingProduct}
	categories={data.categories}
	onClose={() => {
		showModal = false;
		editingProduct = null;
	}}
/>
