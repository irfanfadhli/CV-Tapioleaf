<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '$lib/components/ui/dialog';
	import { Plus, Trash2, Loader2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	let {
		open,
		categories,
		onClose
	}: {
		open: boolean;
		categories: Array<{ id: string; name: string }>;
		onClose: () => void;
	} = $props();

	let newCategoryName = $state('');
	let submitting = $state(false);
</script>

<Dialog {open} onOpenChange={(o) => { if (!o) onClose(); }}>
	<DialogContent class="sm:max-w-md">
		<DialogHeader>
			<DialogTitle>Kelola Kategori</DialogTitle>
			<DialogDescription>Tambah atau hapus kategori produk</DialogDescription>
		</DialogHeader>
		<div class="space-y-4">
			<form method="post" action="?/createCategory" use:enhance={() => {
				submitting = true;
				return async ({ result, update }) => {
					submitting = false;
					update();
					if (result.type === 'failure') {
						toast.error((result.data as { message?: string })?.message || 'Gagal');
					} else {
						newCategoryName = '';
						toast.success('Kategori ditambahkan');
					}
				};
			}} class="flex gap-2">
				<Input name="name" placeholder="Nama kategori baru" bind:value={newCategoryName} required disabled={submitting} />
				<Button type="submit" size="sm" disabled={submitting}>
					{#if submitting}<Loader2 size={14} class="animate-spin" />{:else}<Plus size={14} />{/if}
				</Button>
			</form>
			<div class="space-y-1">
				{#each categories as cat}
					<div class="flex items-center justify-between rounded-lg border px-3 py-2">
						<span class="text-sm">{cat.name}</span>
						<form method="post" action="?/deleteCategory">
							<input type="hidden" name="id" value={cat.id} />
							<Button variant="ghost" size="sm" type="submit">
								<Trash2 size={14} class="text-destructive" />
							</Button>
						</form>
					</div>
				{/each}
			</div>
		</div>
	</DialogContent>
</Dialog>
