<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '$lib/components/ui/dialog';
	import { Loader2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { parse } from 'devalue';

	let {
		open,
		product,
		onClose
	}: {
		open: boolean;
		product: { id: string; name: string; code: string; price: string; unit: string; description: string | null } | null;
		onClose: () => void;
	} = $props();

	let quantity = $state('1');
	let customerName = $state('');
	let customerPhone = $state('');
	let customerAddress = $state('');
	let notes = $state('');
	let submitting = $state(false);

	let errorMessage = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!product) return;
		submitting = true;
		errorMessage = '';

		try {
			const formData = new FormData();
			formData.set('productId', product.id);
			formData.set('quantity', quantity);
			formData.set('customerName', customerName);
			formData.set('customerPhone', customerPhone);
			formData.set('customerAddress', customerAddress);
			formData.set('notes', notes);

			const res = await fetch('/orders?/checkout', { method: 'POST', body: formData });
			const body = await res.json();

			const data = typeof body.data === 'string' ? parse(body.data) : body.data;

			if (body.type === 'success' && data?.invoiceUrl) {
				window.location.href = data.invoiceUrl;
			} else {
				errorMessage = data?.message || 'Gagal membuat pesanan';
				toast.error(errorMessage);
				submitting = false;
			}
		} catch {
			errorMessage = 'Gagal membuat pesanan. Periksa koneksi internet Anda.';
			toast.error(errorMessage);
			submitting = false;
		}
	}
</script>

<Dialog {open} onOpenChange={(o) => { if (!o) onClose(); }}>
	<DialogContent class="sm:max-w-md">
		<DialogHeader>
			<DialogTitle>Buat Pesanan</DialogTitle>
			<DialogDescription>{product?.name} ({product?.code}) — Rp {Number(product?.price || 0).toLocaleString('id-ID')}/{product?.unit}</DialogDescription>
		</DialogHeader>
		<form onsubmit={handleSubmit} class="grid gap-4 py-4">
			{#if errorMessage}
				<div class="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 whitespace-pre-wrap">{errorMessage}</div>
			{/if}
			<div class="grid gap-2">
				<label for="chk-qty" class="text-sm font-medium">Jumlah ({product?.unit}) *</label>
				<Input id="chk-qty" type="number" step="0.01" min="0.01" bind:value={quantity} required disabled={submitting} />
			</div>
			<div class="grid gap-2">
				<label for="chk-name" class="text-sm font-medium">Nama *</label>
				<Input id="chk-name" bind:value={customerName} required disabled={submitting} />
			</div>
			<div class="grid gap-2">
				<label for="chk-phone" class="text-sm font-medium">No. Telepon *</label>
				<Input id="chk-phone" type="tel" bind:value={customerPhone} required disabled={submitting} />
			</div>
			<div class="grid gap-2">
				<label for="chk-addr" class="text-sm font-medium">Alamat *</label>
				<textarea id="chk-addr" class="rounded-lg border bg-background px-3 py-2 text-sm" rows="2" bind:value={customerAddress} required disabled={submitting}></textarea>
			</div>
			<div class="grid gap-2">
				<label for="chk-notes" class="text-sm font-medium">Catatan</label>
				<textarea id="chk-notes" class="rounded-lg border bg-background px-3 py-2 text-sm" rows="2" bind:value={notes} disabled={submitting}></textarea>
			</div>
			<div class="flex justify-end gap-3">
				<Button type="button" variant="outline" onclick={onClose} disabled={submitting}>Batal</Button>
				<Button type="submit" disabled={submitting}>
					{#if submitting}<Loader2 size={14} class="mr-1 animate-spin" />{/if}
					Bayar Sekarang
				</Button>
			</div>
		</form>
	</DialogContent>
</Dialog>
