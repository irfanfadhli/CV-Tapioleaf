<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog';
	import { Pencil, ToggleLeft, ToggleRight, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from '@lucide/svelte';

	let {
		products = [],
		sort = 'name',
		order = 'asc',
		onSort,
		onEdit
	}: {
		products: Array<{ id: string; code: string; name: string; price: string; unit: string; imageUrl: string | null; isActive: boolean; minimumStock: number; categoryId: string | null; description: string | null }>;
		sort?: string;
		order?: string;
		onSort?: (column: string) => void;
		onEdit: (product: any) => void;
	} = $props();

	let deleteId = $state<string | null>(null);
	let deleteName = $state('');
</script>

<div class="overflow-x-auto rounded-lg border">
	<table class="w-full text-sm">
		<thead class="bg-muted/50">
			<tr>
				<th class="px-4 py-3 text-left font-medium text-muted-foreground">
					<button onclick={() => onSort?.('code')} class="inline-flex items-center gap-1 hover:text-foreground">
						Kode
						{#if sort === 'code' && order === 'asc'}<ArrowUp size={14} />{:else if sort === 'code' && order === 'desc'}<ArrowDown size={14} />{:else}<ArrowUpDown size={14} />{/if}
					</button>
				</th>
				<th class="px-4 py-3 text-left font-medium text-muted-foreground">
					<button onclick={() => onSort?.('name')} class="inline-flex items-center gap-1 hover:text-foreground">
						Nama
						{#if sort === 'name' && order === 'asc'}<ArrowUp size={14} />{:else if sort === 'name' && order === 'desc'}<ArrowDown size={14} />{:else}<ArrowUpDown size={14} />{/if}
					</button>
				</th>
				<th class="px-4 py-3 text-right font-medium text-muted-foreground">
					<button onclick={() => onSort?.('price')} class="inline-flex items-center gap-1 hover:text-foreground">
						Harga
						{#if sort === 'price' && order === 'asc'}<ArrowUp size={14} />{:else if sort === 'price' && order === 'desc'}<ArrowDown size={14} />{:else}<ArrowUpDown size={14} />{/if}
					</button>
				</th>
				<th class="hidden md:table-cell px-4 py-3 text-right font-medium text-muted-foreground">Stok Min</th>
				<th class="hidden sm:table-cell px-4 py-3 text-center font-medium text-muted-foreground">Gambar</th>
				<th class="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
			</tr>
		</thead>
		<tbody>
			{#each products as product (product.id)}
				<tr class="border-t transition-colors hover:bg-muted/30">
					<td class="px-4 py-3 font-mono text-xs">{product.code}</td>
					<td class="px-4 py-3">
						<div class="font-medium">{product.name}</div>
						<span class="text-xs text-muted-foreground">{product.description || ''}</span>
					</td>
					<td class="px-4 py-3 text-right">Rp {Number(product.price).toLocaleString('id-ID')}</td>
					<td class="hidden md:table-cell px-4 py-3 text-right">{product.minimumStock} {product.unit}</td>
					<td class="hidden sm:table-cell px-4 py-3 text-center">
						{#if product.imageUrl}
							<img src={product.imageUrl} alt={product.name} class="mx-auto h-10 w-10 rounded object-cover" onerror={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
						{:else}
							<span class="text-xs text-muted-foreground">—</span>
						{/if}
					</td>
					<td class="px-4 py-3">
						<div class="flex items-center justify-center gap-1">
							<Button variant="ghost" size="sm" onclick={() => onEdit(product)}>
								<Pencil size={14} />
							</Button>
							<form method="post" action="?/toggleStatus">
								<input type="hidden" name="id" value={product.id} />
								<Button variant="ghost" size="sm" type="submit">
									{#if product.isActive}
										<ToggleRight size={14} class="text-green-600" />
									{:else}
										<ToggleLeft size={14} class="text-muted-foreground" />
									{/if}
								</Button>
							</form>
							<Button variant="ghost" size="sm" onclick={() => { deleteId = product.id; deleteName = product.name; }}>
								<Trash2 size={14} class="text-destructive" />
							</Button>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
	{#if products.length === 0}
		<div class="py-12 text-center text-sm text-muted-foreground">Belum ada produk</div>
	{/if}
</div>

<Dialog open={deleteId !== null} onOpenChange={(o) => { if (!o) deleteId = null; }}>
	<DialogContent class="sm:max-w-sm">
		<DialogHeader>
			<DialogTitle>Hapus Produk</DialogTitle>
			<DialogDescription>Yakin ingin menghapus "{deleteName}"? Produk akan dinonaktifkan permanen.</DialogDescription>
		</DialogHeader>
		<DialogFooter class="gap-2">
			<Button variant="outline" onclick={() => deleteId = null}>Batal</Button>
			<form method="post" action="?/delete">
				<input type="hidden" name="id" value={deleteId || ''} />
				<Button variant="destructive" type="submit">Hapus</Button>
			</form>
		</DialogFooter>
	</DialogContent>
</Dialog>
