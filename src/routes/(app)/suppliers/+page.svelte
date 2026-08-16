<script lang="ts">
	import { Building2, Phone, MapPin, Trash2 } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let deleteTargetId = $state<string | null>(null);
</script>

<svelte:head>
	<title>Supplier Singkong — CV TapioLeaf</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center gap-3">
		<Building2 size={24} class="text-primary" />
		<h1 class="text-xl font-bold md:text-2xl">Daftar Supplier</h1>
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
