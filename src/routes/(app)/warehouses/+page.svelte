<script lang="ts">
	import { page } from '$app/stores';
	import { goto, afterNavigate, invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog';
	import { Search, Plus, Loader2, AlertTriangle, History, ArrowUp, ArrowDown, ArrowUpDown, Pencil, Trash2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
let { data } = $props();

let searchQuery = $state($page.url.searchParams.get('search') || '');
	let statusFilter = $state($page.url.searchParams.get('status') || 'all');
	let searchRef: HTMLInputElement | undefined;
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	afterNavigate(() => { searchRef?.focus(); });

	let showModal = $state(false);
	let modalType = $state<'in' | 'out'>('in');

	function openModal(type: 'in' | 'out') {
		modalType = type;
		productId = '';
		quantityChange = '';
		movementDate = new Date().toISOString().slice(0, 10);
		note = '';
		reason = '';
		showModal = true;
	}
	let productId = $state('');
	let quantityChange = $state('');
	let movementDate = $state(new Date().toISOString().slice(0, 10));
	let note = $state('');
	let reason = $state('');

	let submitting = $state(false);
	let deleteTargetId = $state<string | null>(null);

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
		const newOrder = data.sort === column && data.order === 'asc' ? 'desc' : 'asc';
		url.searchParams.set('sort', column);
		url.searchParams.set('order', newOrder);
		url.searchParams.set('page', '1');
		goto(url.toString(), { replaceState: true });
	}

</script>

<div class="space-y-6">
	<!-- Stock Summary -->
	<div class="grid gap-4 sm:grid-cols-2">
		<div class="rounded-xl border bg-emerald-50 p-4 shadow-sm">
			<p class="text-xs font-medium text-emerald-700">Stok Singkong (Bahan Baku)</p>
			<p class="text-2xl font-bold text-emerald-800">{Math.max(0, data.cassavaStock).toLocaleString('id-ID')} kg</p>
			<p class="text-xs text-emerald-600">Dari penerimaan singkong</p>
		</div>
		<div class="rounded-xl border bg-blue-50 p-4 shadow-sm">
			<p class="text-xs font-medium text-blue-700">Stok Produk Jadi</p>
			<p class="text-2xl font-bold text-blue-800">{data.items.length} SKU</p>
			<p class="text-xs text-blue-600">{data.items.filter((i: any) => i.stockStatus === 'CRITICAL').length} kritis</p>
		</div>
	</div>

	<div class="flex flex-wrap items-center gap-2">
		<h1 class="text-xl font-bold md:text-2xl">Manajemen Stok Gudang</h1>
		<div class="flex gap-2">
			<Button onclick={() => openModal('in')} size="sm" class="md:default"><Plus size={16} class="mr-1" /> Stok Masuk</Button>
			<Button variant="outline" onclick={() => openModal('out')} size="sm" class="md:default">Stok Keluar</Button>
		</div>
	</div>

	<div class="flex flex-wrap gap-2 md:gap-4">
		<div class="relative flex-1">
			<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
			<input type="text" bind:this={searchRef} placeholder="Cari produk..." class="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring" bind:value={searchQuery} oninput={handleSearch} />
		</div>
		<select class="rounded-lg border bg-background px-3 py-2 text-sm" bind:value={statusFilter}
			onchange={(e) => { const url=new URL($page.url); const v=(e.target as HTMLSelectElement).value; if(v && v!=='all') url.searchParams.set('status', v); else url.searchParams.delete('status'); goto(url.toString(), { replaceState: true }); }}>
			<option value="all">Semua</option>
			<option value="critical">Stok Kritis</option>
		</select>
		<a href="/warehouses/history"><Button variant="outline"><History size={16} class="mr-1" /> Riwayat</Button></a>
	</div>

	<div class="rounded-lg border">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-muted/50">
					<tr>
					<th class="hidden sm:table-cell px-4 py-3 text-left font-medium text-muted-foreground">
						<button onclick={() => toggleSort('code')} class="inline-flex items-center gap-1 hover:text-foreground">
							Kode
							{#if data.sort === 'code' && data.order === 'asc'}<ArrowUp size={14} />{:else if data.sort === 'code' && data.order === 'desc'}<ArrowDown size={14} />{:else}<ArrowUpDown size={14} />{/if}
						</button>
					</th>
					<th class="px-4 py-3 text-left font-medium text-muted-foreground">
						<button onclick={() => toggleSort('name')} class="inline-flex items-center gap-1 hover:text-foreground">
							Produk
							{#if data.sort === 'name' && data.order === 'asc'}<ArrowUp size={14} />{:else if data.sort === 'name' && data.order === 'desc'}<ArrowDown size={14} />{:else}<ArrowUpDown size={14} />{/if}
						</button>
					</th>
					<th class="px-4 py-3 text-right font-medium text-muted-foreground">Stok</th>
					<th class="hidden lg:table-cell px-4 py-3 text-right font-medium text-muted-foreground">Harga</th>
					<th class="hidden md:table-cell px-4 py-3 text-right font-medium text-muted-foreground">Min</th>
					<th class="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
					<th class="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each data.items as item}
						<tr class="border-t transition-colors hover:bg-muted/30" class:bg-red-50={item.stockStatus === 'CRITICAL'}>
							<td class="hidden sm:table-cell px-4 py-3 font-mono text-xs">{item.code}</td>
							<td class="px-4 py-3 font-medium">{item.name}</td>
							<td class="px-4 py-3 text-right font-medium" class:text-red-600={item.stockStatus === 'CRITICAL'}>{item.currentStock} {item.unit}</td>
							<td class="hidden lg:table-cell px-4 py-3 text-right font-medium">Rp {Number(item.price).toLocaleString('id-ID')}</td>
							<td class="hidden md:table-cell px-4 py-3 text-right text-muted-foreground">{item.minimumStock}</td>
							<td class="px-4 py-3 text-center">
								{#if item.stockStatus === 'CRITICAL'}
									<span class="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"><AlertTriangle size={12} /> Kritis</span>
								{:else}
									<span class="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Normal</span>
								{/if}
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center justify-center gap-1">
									<Button variant="ghost" size="sm" type="button" onclick={() => deleteTargetId = item.id} class="text-red-500 hover:text-red-700"><Trash2 size={14} /></Button>
								</div>
							</td>
						</tr>
					{:else}
						<tr><td colspan="6" class="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada produk</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	{#if data.pagination.totalPages > 1}
		<div class="flex items-center justify-center gap-2">
			{#each Array(data.pagination.totalPages) as _, i}
				<a href="?page={i + 1}" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm" class:bg-primary={data.pagination.page === i + 1} class:text-primary-foreground={data.pagination.page === i + 1}>{i + 1}</a>
			{/each}
		</div>
	{/if}
</div>

<Dialog open={showModal} onOpenChange={(o) => { if (!o) showModal = false; }}>
	<DialogContent class="sm:max-w-md">
		<DialogHeader>
			<DialogTitle>
				{modalType === 'in' ? 'Stok Masuk' : 'Stok Keluar'}
			</DialogTitle>
			<DialogDescription>Catat pergerakan stok</DialogDescription>
		</DialogHeader>
		<form method="post" action="?/create" use:enhance={() => {
		return async ({ result, update }) => {
			update();
			if (result.type === 'success') {
				toast.success('Pergerakan stok berhasil dicatat');
				showModal = false;
			} else if (result.type === 'failure') {
				const msg = (result.data as Record<string, unknown>)?.message as string | undefined;
				if (msg) toast.error(msg);
			}
		};
	}}>
			<input type="hidden" name="movementType" value={modalType === 'in' ? 'MANUAL_IN' : modalType === 'out' ? 'MANUAL_OUT' : 'ADJUSTMENT'} />
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<label for="productId" class="text-sm font-medium">Produk *</label>
					<select id="productId" name="productId" class="rounded-lg border bg-background px-3 py-2 text-sm" required>
						<option value="">Pilih produk</option>
						{#each data.products as p}
							<option value={p.id}>{p.code} — {p.name}</option>
						{/each}
					</select>
				</div>
				<div class="grid gap-2">
					<label for="quantityChange" class="text-sm font-medium">Quantity *</label>
					<Input id="quantityChange" name="quantityChange" type="number" step="0.01" required placeholder="Nilai positif" />
				</div>
				<div class="grid gap-2">
					<label for="movementDate" class="text-sm font-medium">Tanggal</label>
					<Input id="movementDate" name="movementDate" type="date" bind:value={movementDate} />
				</div>

				<div class="grid gap-2">
					<label for="note" class="text-sm font-medium">Keterangan</label>
					<textarea id="note" name="note" class="rounded-lg border bg-background px-3 py-2 text-sm" rows="2"></textarea>
				</div>
			</div>
			<DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
		</form>
	</DialogContent>
</Dialog>

<Dialog open={deleteTargetId !== null} onOpenChange={(o) => { if (!o) deleteTargetId = null; }}>
	<DialogContent class="sm:max-w-sm">
		<DialogHeader>
			<DialogTitle>Hapus Stok Produk?</DialogTitle>
			<DialogDescription>Produk akan dihapus dan tidak muncul lagi di daftar stok.</DialogDescription>
		</DialogHeader>
		<DialogFooter class="gap-2">
			<Button variant="outline" onclick={() => deleteTargetId = null}>Batal</Button>
			<form method="post" action="?/deleteStock" use:enhance={() => {
				return async ({ result, update }) => {
					update();
					if (result.type === 'success') { deleteTargetId = null; toast.success('Produk dihapus dari gudang'); await invalidateAll(); }
					else if (result.type === 'failure') { const msg = (result.data as any)?.message; if (msg) toast.error(msg); }
				};
			}}>
				<input type="hidden" name="productId" value={deleteTargetId ?? ''} />
				<Button variant="destructive" type="submit">Hapus</Button>
			</form>
		</DialogFooter>
	</DialogContent>
</Dialog>
