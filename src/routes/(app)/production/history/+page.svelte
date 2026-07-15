<script lang="ts">
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Search, ArrowLeft, ArrowUp, ArrowDown, ArrowUpDown, Pencil, Trash2, CheckCircle2 } from '@lucide/svelte';
import { toast } from 'svelte-sonner';
import { enhance } from '$app/forms';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog';

let { data } = $props();

let deleteTargetId = $state<string | null>(null);

	let searchRef: HTMLInputElement | undefined;
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let search = $state($page.url.searchParams.get('search') || '');
	let statusFilter = $state($page.url.searchParams.get('status') || 'all');

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

	function toggleSort(col: string) {
		const url = new URL($page.url);
		const newOrder = data.sort === col && data.order === 'asc' ? 'desc' : 'asc';
		url.searchParams.set('sort', col);
		url.searchParams.set('order', newOrder);
		url.searchParams.set('page', '1');
		goto(url.toString(), { replaceState: true });
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a href="/production"><Button variant="ghost" size="sm"><ArrowLeft size={16} /></Button></a>
			<h1 class="text-2xl font-bold">Riwayat Produksi</h1>
		</div>
	</div>

	<div class="flex gap-4">
		<div class="relative flex-1">
			<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
			<input type="text" bind:this={searchRef} placeholder="Cari..." class="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring" bind:value={search} oninput={handleSearch} />
		</div>
		<select class="rounded-lg border bg-background px-3 py-2 text-sm" bind:value={statusFilter}
			onchange={(e) => { const url=new URL($page.url); const v=(e.target as HTMLSelectElement).value; if(v && v!=='all') url.searchParams.set('status', v); else url.searchParams.delete('status'); goto(url.toString(), { replaceState: true }); }}>
			<option value="all">Semua</option>
			<option value="DRAFT">DRAFT</option>
			<option value="CONFIRMED">CONFIRMED</option>
		</select>
	</div>

	<div class="rounded-lg border">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-muted/50">
					<tr>
					<th class="hidden sm:table-cell px-4 py-3 text-left font-medium text-muted-foreground">
						<button onclick={() => toggleSort('productionDate')} class="inline-flex items-center gap-1 hover:text-foreground">
							Tanggal
							{#if data.sort === 'productionDate' && data.order === 'asc'}<ArrowUp size={14} />{:else if data.sort === 'productionDate' && data.order === 'desc'}<ArrowDown size={14} />{:else}<ArrowUpDown size={14} />{/if}
						</button>
					</th>
					<th class="px-4 py-3 text-left font-medium text-muted-foreground">Produk</th>
					<th class="px-4 py-3 text-right font-medium text-muted-foreground">
						<button onclick={() => toggleSort('quantityKg')} class="inline-flex items-center gap-1 hover:text-foreground">
							Tepung
							{#if data.sort === 'quantityKg' && data.order === 'asc'}<ArrowUp size={14} />{:else if data.sort === 'quantityKg' && data.order === 'desc'}<ArrowDown size={14} />{:else}<ArrowUpDown size={14} />{/if}
						</button>
					</th>
					<th class="hidden md:table-cell px-4 py-3 text-right font-medium text-muted-foreground">Singkong</th>
					<th class="hidden md:table-cell px-4 py-3 text-right font-medium text-muted-foreground">Yield</th>
					<th class="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
					<th class="hidden lg:table-cell px-4 py-3 text-left font-medium text-muted-foreground">Keterangan</th>
					<th class="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each data.items as item}
							<tr class="border-t transition-colors hover:bg-muted/30">
								<td class="hidden sm:table-cell px-4 py-3 text-xs text-muted-foreground">{new Date(item.productionDate).toLocaleDateString('id-ID')}</td>
								<td class="px-4 py-3">
									<div class="font-medium">{item.productName}</div>
									<div class="text-xs text-muted-foreground">{item.productCode}</div>
								</td>
								<td class="px-4 py-3 text-right font-medium">{item.quantityKg.toLocaleString('id-ID')}</td>
								<td class="hidden md:table-cell px-4 py-3 text-right">{item.cassavaUsedKg?.toLocaleString('id-ID') || '—'}</td>
								<td class="hidden md:table-cell px-4 py-3 text-right text-xs text-muted-foreground">{item.yieldPercentage ? `${item.yieldPercentage}%` : '—'}</td>
								<td class="px-4 py-3 text-center">
									{#if item.status === 'CONFIRMED'}
										<span class="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"><CheckCircle2 size={12} /> CONFIRMED</span>
									{:else}
										<span class="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">DRAFT</span>
									{/if}
								</td>
								<td class="hidden lg:table-cell px-4 py-3 text-xs text-muted-foreground">{item.notes || '—'}</td>
								<td class="px-4 py-3 text-center">
									<Button variant="ghost" size="sm" type="button" onclick={() => deleteTargetId = item.id} class="text-red-500 hover:text-red-700" aria-label="Hapus"><Trash2 size={14} /></Button>
								</td>
							</tr>
						{:else}
							<tr><td colspan="8" class="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada produksi</td></tr>
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

<Dialog open={deleteTargetId !== null} onOpenChange={(o) => { if (!o) deleteTargetId = null; }}>
	<DialogContent class="sm:max-w-sm">
		<DialogHeader>
			<DialogTitle>Hapus Entry Produksi?</DialogTitle>
			<DialogDescription>Tindakan ini tidak bisa dibatalkan.</DialogDescription>
		</DialogHeader>
		<DialogFooter class="gap-2">
			<Button variant="outline" onclick={() => deleteTargetId = null}>Batal</Button>
			<form method="post" action="?/delete" use:enhance={() => {
				return async ({ result, update }) => {
					update();
					if (result.type === 'success') { deleteTargetId = null; toast.success('Produksi dihapus'); await invalidateAll(); }
					else if (result.type === 'failure') { const msg = (result.data as any)?.message; if (msg) toast.error(msg); }
				};
			}}>
				<input type="hidden" name="id" value={deleteTargetId ?? ''} />
				<Button variant="destructive" type="submit">Hapus</Button>
			</form>
		</DialogFooter>
	</DialogContent>
</Dialog>
