<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '$lib/components/ui/dialog';
	import { Loader2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { parse } from 'devalue';

	let {
		open,
		product,
		categories,
		onClose
	}: {
		open: boolean;
		product: any | null;
		categories: Array<{ id: string; name: string }>;
		onClose: () => void;
	} = $props();

	let submitting = $state(false);
	let name = $state('');
	let code = $state('');
	let price = $state('');
	let unit = $state('KG');
	let categoryId = $state('');
	let minimumStock = $state('0');
	let description = $state('');
	let imagePreview = $state('');
	let imageFile = $state<File | null>(null);
	let wasOpen = $state(false);

	$effect(() => {
		if (open && !wasOpen) {
			name = product?.name || '';
			code = product?.code || '';
			price = product?.price?.toString() || '';
			unit = product?.unit || 'KG';
			categoryId = product?.categoryId || '';
			minimumStock = product?.minimumStock?.toString() || '0';
			description = product?.description || '';
			imagePreview = product?.imageUrl || '';
			imageFile = null;
		} else if (!open) {
			name = '';
			code = '';
			price = '';
			unit = 'KG';
			categoryId = '';
			minimumStock = '0';
			description = '';
			imagePreview = '';
			imageFile = null;
		}
		wasOpen = open;
	});

	function handleImageSelect(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		if (file.size > 2 * 1024 * 1024) {
			alert('Ukuran gambar maksimal 2MB');
			return;
		}
		imageFile = file;
		const reader = new FileReader();
		reader.onload = () => imagePreview = reader.result as string;
		reader.readAsDataURL(file);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		submitting = true;
		const form = e.currentTarget as HTMLFormElement;
		const formData = new FormData(form);

		try {
			const res = await fetch(form.action, { method: 'POST', body: formData });
			const json = await res.json();
			if (json.type === 'success') {
				handleClose();
				window.location.reload();
			} else if (json.type === 'failure') {
				const decoded = typeof json.data === 'string' ? parse(json.data) : json.data;
				const msg = (decoded as Record<string, unknown>)?.message as string | undefined;
				if (msg) toast.error(msg);
				submitting = false;
			} else {
				submitting = false;
			}
		} catch {
			submitting = false;
		}
	}

	function handleClose() {
		submitting = false;
		onClose();
	}
</script>

<Dialog {open} onOpenChange={(o) => { if (!o) handleClose(); }}>
	<DialogContent class="sm:max-w-lg">
		<DialogHeader>
			<DialogTitle>{product ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
			<DialogDescription>Isi data produk {product ? 'yang akan diperbarui' : 'baru'}</DialogDescription>
		</DialogHeader>
		<form
			method="post"
			action={product ? '?/update' : '?/create'}
			onsubmit={handleSubmit}
		>
			<input type="hidden" name="id" value={product?.id || ''} />
			<div class="flex flex-col gap-4 py-4">
				<div class="grid gap-2">
					<Label for="name">Nama Produk *</Label>
					<Input id="name" name="name" required bind:value={name} />
				</div>
				<div class="grid gap-2">
					<Label for="code">Kode Produk</Label>
					<Input id="code" name="code" placeholder="Auto-generate" bind:value={code} disabled={!!product} />
				</div>
				<div class="grid gap-2">
					<Label for="price">Harga *</Label>
					<Input id="price" name="price" type="number" required bind:value={price} />
				</div>
				<div class="grid gap-2">
					<Label for="unit">Satuan *</Label>
					<select id="unit" name="unit" class="rounded-lg border bg-background px-3 py-2 text-sm" bind:value={unit}>
						<option value="KG">Kg</option>
						<option value="TON">Ton</option>
						<option value="SAK">Sak</option>
						<option value="PCS">Pcs</option>
					</select>
				</div>
				<div class="grid gap-2">
					<Label for="categoryId">Kategori *</Label>
					<select id="categoryId" name="categoryId" class="rounded-lg border bg-background px-3 py-2 text-sm" bind:value={categoryId}>
						<option value="">Pilih kategori</option>
						{#each categories as cat}
							<option value={cat.id}>{cat.name}</option>
						{/each}
					</select>
				</div>
				<div class="grid gap-2">
					<Label for="minimumStock">Stok Minimum</Label>
					<Input id="minimumStock" name="minimumStock" type="number" bind:value={minimumStock} />
				</div>
				<div class="grid gap-2">
					<Label for="image">Gambar (opsional)</Label>
					<Input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" onchange={handleImageSelect} />
				</div>
				{#if imagePreview}
					<div class="flex justify-center">
						<img src={imagePreview} alt="Preview" class="h-24 w-24 rounded-lg object-cover" />
					</div>
				{/if}
				<div class="grid gap-2">
					<Label for="description">Deskripsi</Label>
					<textarea id="description" name="description" rows="2" class="rounded-lg border bg-background px-3 py-2 text-sm" bind:value={description}></textarea>
				</div>
			</div>
			<div class="flex justify-end gap-3">
				<Button type="button" variant="outline" onclick={handleClose}>Batal</Button>
				<Button type="submit" disabled={submitting}>
					{#if submitting}<Loader2 size={14} class="mr-1 animate-spin" />{/if}
					{product ? 'Perbarui' : 'Simpan'}
				</Button>
			</div>
		</form>
	</DialogContent>
</Dialog>
