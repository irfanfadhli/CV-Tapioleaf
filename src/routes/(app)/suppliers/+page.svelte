<script lang="ts">
	import { Building2, Phone, MapPin, Trash2, Plus } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let showSupplierModal = $state(false);
	let deleteTargetId = $state<string | null>(null);
</script>

<svelte:head>
	<title>Supplier Singkong — CV TapioLeaf</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div class="flex items-center gap-3">
			<Building2 size={24} class="text-primary" />
			<h1 class="text-xl font-bold md:text-2xl">Daftar Supplier</h1>
		</div>
		<Button onclick={() => showSupplierModal = true} size="sm" class="md:default">
			<Plus size={16} class="mr-1" /> Supplier
		</Button>
	</div>

	{#if data.suppliers.length === 0}
		<div class="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">Belum ada supplier</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.suppliers as s}
				<div class="relative rounded-xl border bg-card p-5 shadow-sm">
					<div class="flex items-start justify-between">
						<div>
							<h3 class="font-semibold">{s.name}</h3>
							<div class="mt-2 space-y-1 text-sm text-muted-foreground">
								{#if s.phone}
									<p class="flex items-center gap-2"><Phone size={14} /> {s.phone}</p>
								{/if}
								{#if s.address}
									<p class="flex items-center gap-2"><MapPin size={14} /> {s.address}</p>
								{/if}
							</div>
						</div>
						<Button variant="ghost" size="sm" type="button" onclick={() => deleteTargetId = s.id} class="text-destructive hover:text-destructive" aria-label="Hapus supplier"><Trash2 size={16} /></Button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<Dialog open={deleteTargetId !== null} onOpenChange={(o) => { if (!o) deleteTargetId = null; }}>
	<DialogContent class="sm:max-w-sm">
		<DialogHeader>
			<DialogTitle>Hapus Supplier?</DialogTitle>
			<DialogDescription>Tindakan ini tidak bisa dibatalkan.</DialogDescription>
		</DialogHeader>
		<DialogFooter class="gap-2">
			<Button variant="outline" onclick={() => deleteTargetId = null}>Batal</Button>
			<form method="post" action="?/delete" use:enhance={() => {
				return async ({ result, update }) => {
					update();
					if (result.type === 'success') { deleteTargetId = null; toast.success('Supplier dihapus'); await invalidateAll(); }
					else if (result.type === 'failure') { const msg = (result.data as any)?.message; if (msg) toast.error(msg); }
				};
			}}>
				<input type="hidden" name="id" value={deleteTargetId ?? ''} />
				<Button variant="destructive" type="submit">Hapus</Button>
			</form>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- Add Supplier Modal -->
<Dialog open={showSupplierModal} onOpenChange={(o) => { if (!o) showSupplierModal = false; }}>
	<DialogContent class="sm:max-w-sm">
		<DialogHeader>
			<DialogTitle>Tambah Supplier</DialogTitle>
			<DialogDescription>Tambahkan supplier singkong baru</DialogDescription>
		</DialogHeader>
		<form method="post" action="?/addSupplier" use:enhance={() => {
			return async ({ result, update }) => {
				update();
				if (result.type === 'success') {
					showSupplierModal = false;
					toast.success('Supplier berhasil ditambahkan');
					await invalidateAll();
				} else if (result.type === 'failure') {
					const msg = (result.data as any)?.message;
					if (msg) toast.error(msg);
				}
			};
		}}>
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<label for="sup-name" class="text-sm font-medium">Nama Supplier *</label>
					<Input id="sup-name" name="name" required placeholder="Nama supplier" />
				</div>
				<div class="grid gap-2">
					<label for="sup-phone" class="text-sm font-medium">Telepon</label>
					<Input id="sup-phone" name="phone" placeholder="Opsional" />
				</div>
				<div class="grid gap-2">
					<label for="sup-addr" class="text-sm font-medium">Alamat</label>
					<textarea id="sup-addr" name="address" class="rounded-lg border bg-background px-3 py-2 text-sm" rows="2" placeholder="Opsional"></textarea>
				</div>
			</div>
			<DialogFooter>
				<Button type="button" variant="outline" onclick={() => showSupplierModal = false}>Batal</Button>
				<Button type="submit">Simpan</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
