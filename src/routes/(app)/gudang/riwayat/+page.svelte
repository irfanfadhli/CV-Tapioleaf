<script lang="ts">
	import { page } from '$app/stores';
	import { goto, afterNavigate } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog';
	import { Search, ArrowLeft, Pencil, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';

	let { data } = $props();

	let searchRef: HTMLInputElement | undefined;
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let search = $state($page.url.searchParams.get('search') || '');
	let typeFilter = $state($page.url.searchParams.get('type') || '');

	function toggleSort(column: string) {
		const url = new URL($page.url);
		const newOrder = data.sort === column && data.order === 'asc' ? 'desc' : 'asc';
		url.searchParams.set('sort', column);
		url.searchParams.set('order', newOrder);
		url.searchParams.set('page', '1');
		goto(url.toString(), { replaceState: true });
	}

	afterNavigate(() => { searchRef?.focus(); });

	let editingId = $state<string | null>(null);
	let editNote = $state('');
	let editReason = $state('');
	let editDate = $state('');
	let deleteId = $state<string | null>(null);

	function handleSearch() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			const url = new URL($page.url);
			if (search) url.searchParams.set('search', search);
			else url.searchParams.delete('search');
			url.searchParams.set('page', '1');
			goto(url.toString(), { replaceState: true });
		}, 300);
	}

	function openEdit(m: any) {
		editingId = m.id;
		editNote = m.note || '';
		editReason = m.reason || '';
		editDate = new Date(m.movementDate).toISOString().slice(0, 10);
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a href="/gudang"><Button variant="ghost" size="sm"><ArrowLeft size={16} /></Button></a>
			<h1 class="text-2xl font-bold">Riwayat Stok</h1>
		</div>
	</div>

	<div class="flex gap-4">
		<div class="relative flex-1">
			<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
			<input type="text" bind:this={searchRef} placeholder="Cari produk..." class="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring" bind:value={search} oninput={handleSearch} />
		</div>
		<select class="rounded-lg border bg-background px-3 py-2 text-sm" bind:value={typeFilter}
			onchange={(e) => { const url=new URL($page.url); const v=(e.target as HTMLSelectElement).value; if(v) url.searchParams.set('type', v); else url.searchParams.delete('type'); goto(url.toString(), { replaceState: true }); }}>
			<option value="">Semua Tipe</option>
			<option value="PURCHASE_IN">Pembelian</option>
			<option value="MANUAL_IN">Stok Masuk</option>
			<option value="MANUAL_OUT">Stok Keluar</option>
			<option value="ADJUSTMENT">Penyesuaian</option>
		</select>
	</div>

	<div class="rounded-lg border">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-muted/50">
					<tr>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">
							<button onclick={() => toggleSort('movementDate')} class="inline-flex items-center gap-1 hover:text-foreground">
								Tanggal
								{#if data.sort === 'movementDate' && data.order === 'asc'}<ArrowUp size={14} />{:else if data.sort === 'movementDate' && data.order === 'desc'}<ArrowDown size={14} />{:else}<ArrowUpDown size={14} />{/if}
							</button>
						</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Produk</th>
						<th class="px-4 py-3 text-center font-medium text-muted-foreground">Tipe</th>
						<th class="px-4 py-3 text-right font-medium text-muted-foreground">
							<button onclick={() => toggleSort('quantityChange')} class="inline-flex items-center gap-1 hover:text-foreground">
								Qty
								{#if data.sort === 'quantityChange' && data.order === 'asc'}<ArrowUp size={14} />{:else if data.sort === 'quantityChange' && data.order === 'desc'}<ArrowDown size={14} />{:else}<ArrowUpDown size={14} />{/if}
							</button>
						</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Keterangan</th>
						<th class="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each data.movements as m}
						<tr class="border-t transition-colors hover:bg-muted/30">
							<td class="px-4 py-3 text-xs text-muted-foreground">{new Date(m.movementDate).toLocaleDateString('id-ID')}</td>
							<td class="px-4 py-3">
								<div class="font-medium">{m.productName}</div>
								<div class="text-xs text-muted-foreground">{m.productCode}</div>
							</td>
							<td class="px-4 py-3 text-center">
								<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
									class:bg-blue-100={m.movementType === 'PURCHASE_IN'}
									class:bg-green-100={m.movementType === 'MANUAL_IN'}
									class:bg-orange-100={m.movementType === 'MANUAL_OUT'}
									class:bg-purple-100={m.movementType === 'ADJUSTMENT'}
									class:text-blue-700={m.movementType === 'PURCHASE_IN'}
									class:text-green-700={m.movementType === 'MANUAL_IN'}
									class:text-orange-700={m.movementType === 'MANUAL_OUT'}
									class:text-purple-700={m.movementType === 'ADJUSTMENT'}
								>
									{m.movementType === 'PURCHASE_IN' ? 'Pembelian' :
									m.movementType === 'MANUAL_IN' ? 'Stok Masuk' :
									m.movementType === 'MANUAL_OUT' ? 'Stok Keluar' :
									m.movementType === 'ADJUSTMENT' ? 'Penyesuaian' : m.movementType}
								</span>
							</td>
							<td class="px-4 py-3 text-right font-medium" class:text-green-600={m.quantityChange > 0} class:text-red-600={m.quantityChange < 0}>
								{m.quantityChange > 0 ? '+' : ''}{m.quantityChange}
							</td>
							<td class="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{m.reason || m.note || '—'}</td>
							<td class="px-4 py-3">
								<div class="flex items-center justify-center gap-1">
									<Button variant="ghost" size="sm" onclick={() => openEdit(m)}>
										<Pencil size={14} />
									</Button>
									<Button variant="ghost" size="sm" onclick={() => deleteId = m.id}>
										<Trash2 size={14} class="text-destructive" />
									</Button>
								</div>
							</td>
						</tr>
					{:else}
						<tr><td colspan="6" class="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada pergerakan stok</td></tr>
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

<Dialog open={editingId !== null} onOpenChange={(o) => { if (!o) editingId = null; }}>
	<DialogContent class="sm:max-w-sm">
		<DialogHeader>
			<DialogTitle>Edit Pergerakan Stok</DialogTitle>
			<DialogDescription>Ubah keterangan pergerakan stok</DialogDescription>
		</DialogHeader>
		<form method="post" action="?/edit" use:enhance={() => {
			return async ({ result, update }) => {
				update();
				if (result.type === 'success') { toast.success('Pergerakan stok diubah'); editingId = null; }
				else if (result.type === 'failure') { const msg = (result.data as any)?.message; if (msg) toast.error(msg); }
			};
		}}>
			<input type="hidden" name="id" value={editingId || ''} />
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<label for="edit-movementDate" class="text-sm font-medium">Tanggal</label>
					<Input id="edit-movementDate" name="movementDate" type="date" bind:value={editDate} />
				</div>
				<div class="grid gap-2">
					<label for="edit-note" class="text-sm font-medium">Keterangan</label>
					<textarea id="edit-note" name="note" class="rounded-lg border bg-background px-3 py-2 text-sm" rows="2" bind:value={editNote}></textarea>
				</div>
				<div class="grid gap-2">
					<label for="edit-reason" class="text-sm font-medium">Alasan</label>
					<textarea id="edit-reason" name="reason" class="rounded-lg border bg-background px-3 py-2 text-sm" rows="2" bind:value={editReason}></textarea>
				</div>
			</div>
			<DialogFooter>
				<Button type="button" variant="outline" onclick={() => editingId = null}>Batal</Button>
				<Button type="submit">Simpan</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>

<Dialog open={deleteId !== null} onOpenChange={(o) => { if (!o) deleteId = null; }}>
	<DialogContent class="sm:max-w-sm">
		<DialogHeader>
			<DialogTitle>Hapus Pergerakan Stok</DialogTitle>
			<DialogDescription>Yakin ingin menghapus pergerakan stok ini?</DialogDescription>
		</DialogHeader>
		<DialogFooter class="gap-2">
			<Button variant="outline" onclick={() => deleteId = null}>Batal</Button>
			<form method="post" action="?/delete" use:enhance={() => {
				return async ({ result, update }) => {
					update();
					deleteId = null;
					if (result.type === 'success') toast.success('Pergerakan stok dihapus');
					else if (result.type === 'failure') { const msg = (result.data as any)?.message; if (msg) toast.error(msg); }
				};
			}}>
				<input type="hidden" name="id" value={deleteId || ''} />
				<Button variant="destructive" type="submit">Hapus</Button>
			</form>
		</DialogFooter>
	</DialogContent>
</Dialog>
