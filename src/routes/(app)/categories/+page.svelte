<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog';
	import { Plus, Trash2, Pencil, Loader2, Tags, Search, ArrowUpDown, ArrowUp, ArrowDown, ToggleLeft, ToggleRight } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	import { page } from '$app/stores';
	import { goto, afterNavigate } from '$app/navigation';

	let { data, form } = $props();

	onMount(() => {
		if (form?.message) {
			if (form.success) toast.success(form.message);
			else toast.error(form.message);
		}
	});

	let searchRef: HTMLInputElement | undefined;
	let searchQuery = $state(data.search || '');
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	afterNavigate(() => {
		searchRef?.focus();
	});
	let showCreateModal = $state(false);
	let createName = $state('');
	let creating = $state(false);
	let deleteTarget = $state<{ id: string; name: string } | null>(null);
	let showEditModal = $state(false);
	let editingCategory = $state<{ id: string; name: string } | null>(null);
	let editName = $state('');

	function toggleSort() {
		const url = new URL($page.url);
		const newOrder = data.order === 'asc' ? 'desc' : 'asc';
		url.searchParams.set('order', newOrder);
		url.searchParams.set('sort', 'name');
		url.searchParams.set('page', '1');
		goto(url.toString(), { replaceState: true });
	}

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

	function openCreate() {
		createName = '';
		showCreateModal = true;
	}

	function closeCreate() {
		showCreateModal = false;
		creating = false;
	}

	function openEdit(cat: { id: string; name: string }) {
		editingCategory = cat;
		editName = cat.name;
		showEditModal = true;
	}

	function closeEdit() {
		showEditModal = false;
		editingCategory = null;
	}
</script>

<div class="space-y-6">
	<div class="flex flex-wrap items-center gap-2">
		<div class="flex items-center gap-3">
			<Tags size={24} class="text-primary" />
			<h1 class="text-xl font-bold md:text-2xl">Kategori Produk</h1>
		</div>
		<Button onclick={openCreate} size="sm" class="md:default"><Plus size={16} class="mr-1" /> Tambah Kategori</Button>
	</div>

	<div class="flex flex-wrap gap-2 md:gap-4">
		<div class="relative min-w-[200px] flex-1">
			<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
			<input
				type="text"
				bind:this={searchRef}
				placeholder="Cari nama kategori..."
				class="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
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
			<option value="active" selected={data.status === 'active'}>Aktif</option>
			<option value="all" selected={data.status === 'all'}>Semua</option>
			<option value="inactive" selected={data.status === 'inactive'}>Nonaktif</option>
		</select>
	</div>

	<div class="rounded-lg border">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-muted/50">
					<tr>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">
							<button onclick={toggleSort} class="inline-flex items-center gap-1 hover:text-foreground">
								Nama Kategori
								{#if data.sort === 'name' && data.order === 'asc'}
									<ArrowUp size={14} />
								{:else if data.sort === 'name' && data.order === 'desc'}
									<ArrowDown size={14} />
								{:else}
									<ArrowUpDown size={14} />
								{/if}
							</button>
						</th>
						<th class="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
						<th class="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
					</tr>
				</thead>
				<tbody>
				{#each data.categories as cat}
						<tr class="border-t transition-colors hover:bg-muted/30">
							<td class="px-4 py-3 font-medium">{cat.name}</td>
							<td class="px-4 py-3 text-center">
								{#if cat.isActive}
									<span class="text-xs font-medium text-primary">Aktif</span>
								{:else}
									<span class="text-xs font-medium text-muted-foreground">Nonaktif</span>
								{/if}
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center justify-center gap-1">
									<form method="post" action="?/toggleStatus">
										<input type="hidden" name="id" value={cat.id} />
										<Button variant="ghost" size="sm" type="submit">
											{#if cat.isActive}
												<ToggleRight size={14} class="text-primary" />
											{:else}
												<ToggleLeft size={14} class="text-muted-foreground" />
											{/if}
										</Button>
									</form>
									<Button variant="ghost" size="sm" onclick={() => openEdit(cat)}>
										<Pencil size={14} />
									</Button>
									<Button variant="ghost" size="sm" onclick={() => deleteTarget = { id: cat.id, name: cat.name }} aria-label="Hapus kategori">
										<Trash2 size={14} class="text-destructive" />
									</Button>
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="3" class="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada kategori</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	{#if data.pagination.totalPages > 1}
		<div class="flex items-center justify-center gap-2">
			{#each Array(data.pagination.totalPages) as _, i}
				<a
					href="?page={i + 1}"
					class="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm"
					class:bg-primary={data.pagination.page === i + 1}
					class:text-primary-foreground={data.pagination.page === i + 1}
					class:hover:bg-muted={data.pagination.page !== i + 1}
				>{i + 1}</a>
			{/each}
		</div>
	{/if}
</div>

<Dialog open={deleteTarget !== null} onOpenChange={(o) => { if (!o) deleteTarget = null; }}>
	<DialogContent class="sm:max-w-sm">
		<DialogHeader>
			<DialogTitle>Hapus Kategori</DialogTitle>
			<DialogDescription>Yakin ingin menghapus kategori "{deleteTarget?.name}"?</DialogDescription>
		</DialogHeader>
		<DialogFooter class="gap-2">
			<Button variant="outline" onclick={() => deleteTarget = null}>Batal</Button>
			<form method="post" action="?/delete">
				<input type="hidden" name="id" value={deleteTarget?.id || ''} />
				<Button variant="destructive" type="submit">Hapus</Button>
			</form>
		</DialogFooter>
	</DialogContent>
</Dialog>

<Dialog open={showCreateModal} onOpenChange={(o) => { if (!o) closeCreate(); }}>
	<DialogContent class="sm:max-w-sm">
		<DialogHeader>
			<DialogTitle>Tambah Kategori</DialogTitle>
			<DialogDescription>Masukkan nama kategori baru</DialogDescription>
		</DialogHeader>
		<form method="post" action="?/create" use:enhance={() => {
			creating = true;
			return async ({ result, update }) => {
				creating = false;
				update();
				if (result.type === 'success') {
					toast.success('Kategori ditambahkan');
					closeCreate();
				} else if (result.type === 'failure') {
					const msg = (result.data as Record<string, unknown>)?.message as string | undefined;
					if (msg) toast.error(msg);
				}
			};
		}}>
			<div class="grid gap-4 py-4">
				<Input name="name" placeholder="Nama kategori" bind:value={createName} required disabled={creating} />
			</div>
			<div class="flex justify-end gap-3">
				<Button type="button" variant="outline" onclick={closeCreate} disabled={creating}>Batal</Button>
				<Button type="submit" disabled={creating}>
					{#if creating}<Loader2 size={14} class="mr-1 animate-spin" />{/if}
					Simpan
				</Button>
			</div>
		</form>
	</DialogContent>
</Dialog>

<Dialog open={showEditModal} onOpenChange={(o) => { if (!o) closeEdit(); }}>
	<DialogContent class="sm:max-w-sm">
		<DialogHeader>
			<DialogTitle>Edit Kategori</DialogTitle>
			<DialogDescription>Ubah nama kategori</DialogDescription>
		</DialogHeader>
		<form method="post" action="?/edit" use:enhance={() => {
			return async ({ result, update }) => {
				update();
				if (result.type === 'success') {
					toast.success('Kategori diubah');
					closeEdit();
				} else if (result.type === 'failure') {
					const msg = (result.data as Record<string, unknown>)?.message as string | undefined;
					if (msg) toast.error(msg);
				}
			};
		}}>
			<input type="hidden" name="id" value={editingCategory?.id || ''} />
			<div class="grid gap-4 py-4">
				<Input name="name" placeholder="Nama kategori" bind:value={editName} required />
			</div>
			<div class="flex justify-end gap-3">
				<Button type="button" variant="outline" onclick={closeEdit}>Batal</Button>
				<Button type="submit">Simpan</Button>
			</div>
		</form>
	</DialogContent>
</Dialog>
