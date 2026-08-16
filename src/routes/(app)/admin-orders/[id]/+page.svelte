<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { CheckCircle2, XCircle, Clock, TriangleAlert, Loader2, User, Mail, Phone, MapPin, FileText } from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
		PENDING: { label: 'Menunggu Persetujuan', icon: Clock, color: 'text-warning' },
		APPROVED: { label: 'Menunggu Pembayaran', icon: Clock, color: 'text-primary' },
		PAID: { label: 'Lunas', icon: CheckCircle2, color: 'text-primary' },
		PROCESSING: { label: 'Diproses', icon: Clock, color: 'text-info' },
		SHIPPED: { label: 'Dikirim', icon: CheckCircle2, color: 'text-info' },
		COMPLETED: { label: 'Selesai', icon: CheckCircle2, color: 'text-primary' },
		CANCELLED: { label: 'Dibatalkan', icon: XCircle, color: 'text-destructive' }
	};

	let cfg = $derived(statusConfig[data.order.status] || { label: data.order.status, icon: Clock, color: 'text-muted-foreground' });

	let isCancelModalOpen = $state(false);
	let isCancelling = $state(false);
</script>

<svelte:head>
	<title>Detail Pesanan #{data.order.id.slice(0, 8)} — CV TapioLeaf</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	<div class="mb-4">
		<a href="/admin-orders" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
			Kembali ke Pesanan
		</a>
	</div>

	{#if form?.success}
		<div class="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
			<CheckCircle2 size={16} /> {form.message}
		</div>
	{/if}
	{#if form && !form.success && form.message}
		<div class="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
			<XCircle size={16} /> {form.message}
		</div>
	{/if}

	<Card>
		<CardHeader class="flex flex-row items-center justify-between">
			<div>
				<CardTitle>Pesanan #{data.order.id.slice(0, 8)}</CardTitle>
				<p class="text-sm text-muted-foreground">{new Date(data.order.createdAt).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
			</div>
			<div class="flex items-center gap-2 {cfg.color}">
				<cfg.icon size={18} />
				<span class="text-sm font-medium">{cfg.label}</span>
			</div>
		</CardHeader>
		<CardContent class="space-y-4">
			{#each data.order.items as item}
				<div class="flex items-center justify-between gap-2 rounded-lg border p-3">
					<div class="min-w-0 flex-1">
						<p class="truncate font-medium">{item.productName}</p>
						<p class="text-xs text-muted-foreground">{item.productCode}</p>
					</div>
					<div class="shrink-0 text-right">
						<p class="text-sm">{item.quantity} {item.unit} × Rp {Number(item.unitPrice).toLocaleString('id-ID')}</p>
						<p class="font-medium">Rp {(Number(item.quantity) * Number(item.unitPrice)).toLocaleString('id-ID')}</p>
					</div>
				</div>
			{/each}

			<div class="flex items-center justify-between border-t pt-3">
				<span class="font-semibold">Total</span>
				<span class="text-lg font-bold">Rp {Number(data.order.totalAmount).toLocaleString('id-ID')}</span>
			</div>

			{#if data.order.status === 'PENDING'}
				<div class="flex gap-2 pt-2">
					<form method="POST" action="?/approve" use:enhance={() => {
						return async ({ result, update }) => {
							await update();
							if (result.type === 'success') toast.success('Pesanan disetujui, invoice dibuat');
							else if (result.type === 'failure') toast.error((result.data as any)?.message || 'Gagal menyetujui');
						};
					}} class="flex-1">
						<input type="hidden" name="orderId" value={data.order.id} />
						<Button type="submit" class="w-full gap-2"><CheckCircle2 size={16} /> Setujui Pesanan</Button>
					</form>
					<Button
						type="button"
						variant="destructive"
						onclick={() => (isCancelModalOpen = true)}
					>
						Batalkan
					</Button>
				</div>
			{:else if data.order.status === 'APPROVED'}
				<Button
					type="button"
					variant="destructive"
					onclick={() => (isCancelModalOpen = true)}
					class="mt-2 w-full"
				>
					Batalkan Pesanan
				</Button>
			{/if}

			<!-- Informasi Pembeli Section -->
			<div class="rounded-xl border bg-muted/20 p-4 space-y-3">
				<div class="flex items-center justify-between border-b pb-2.5">
					<div class="flex items-center gap-2">
						<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<User size={15} />
						</div>
						<h3 class="text-xs font-semibold uppercase tracking-wider text-foreground">Informasi Pembeli</h3>
					</div>
					{#if data.order.userId}
						<span class="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
							Pesanan Online
						</span>
					{:else}
						<span class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
							Transaksi Tunai (Offline)
						</span>
					{/if}
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
					<div class="flex items-start gap-2.5 rounded-lg border bg-card p-3 shadow-2xs">
						<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
							<User size={14} />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-[11px] font-medium text-muted-foreground">Nama Pelanggan</p>
							<p class="text-xs sm:text-sm font-semibold text-foreground truncate">{data.order.customerName || '-'}</p>
						</div>
					</div>

					<div class="flex items-start gap-2.5 rounded-lg border bg-card p-3 shadow-2xs">
						<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
							<Mail size={14} />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-[11px] font-medium text-muted-foreground">Email Akun</p>
							<p class="text-xs sm:text-sm font-medium text-foreground break-all">
								{(data.order as any).userEmail || 'Tidak ada akun (Offline)'}
							</p>
						</div>
					</div>

					<div class="flex items-start gap-2.5 rounded-lg border bg-card p-3 shadow-2xs">
						<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
							<Phone size={14} />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-[11px] font-medium text-muted-foreground">Nomor Telepon</p>
							<p class="text-xs sm:text-sm font-medium text-foreground">{data.order.customerPhone || '-'}</p>
						</div>
					</div>

					<div class="flex items-start gap-2.5 rounded-lg border bg-card p-3 shadow-2xs">
						<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
							<MapPin size={14} />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-[11px] font-medium text-muted-foreground">Alamat / Lokasi</p>
							<p class="text-xs sm:text-sm font-medium text-foreground break-words">{data.order.customerAddress || '-'}</p>
						</div>
					</div>
				</div>

				{#if data.order.notes}
					<div class="flex items-start gap-2.5 rounded-lg border bg-card p-3 shadow-2xs">
						<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
							<FileText size={14} />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-[11px] font-medium text-muted-foreground">Catatan Pesanan</p>
							<p class="text-xs sm:text-sm text-foreground">{data.order.notes}</p>
						</div>
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>
</div>

<!-- Modal Konfirmasi Pembatalan Pesanan -->
<Dialog.Root bind:open={isCancelModalOpen}>
	<Dialog.Content class="sm:max-w-md">
		<div class="flex flex-col items-center gap-4 text-center py-2">
			<div class="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
				<TriangleAlert size={28} />
			</div>
			<div class="space-y-2">
				<Dialog.Title class="text-xl font-bold">Batalkan Pesanan?</Dialog.Title>
				<Dialog.Description class="text-sm text-muted-foreground max-w-sm">
					Apakah Anda yakin ingin membatalkan pesanan <span class="font-medium text-foreground">#{data.order.id.slice(0, 8)}</span> untuk <span class="font-medium text-foreground">{data.order.customerName}</span>? Tindakan ini tidak dapat diurungkan.
				</Dialog.Description>
			</div>
		</div>

		<form
			method="POST"
			action="?/cancel"
			use:enhance={() => {
				isCancelling = true;
				return async ({ result, update }) => {
					await update();
					isCancelling = false;
					isCancelModalOpen = false;
					if (result.type === 'success') {
						toast.success('Pesanan berhasil dibatalkan');
					} else if (result.type === 'failure') {
						toast.error((result.data as any)?.message || 'Gagal membatalkan');
					}
				};
			}}
			class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
		>
			<input type="hidden" name="orderId" value={data.order.id} />
			<Button
				type="button"
				variant="outline"
				disabled={isCancelling}
				onclick={() => (isCancelModalOpen = false)}
			>
				Kembali
			</Button>
			<Button
				type="submit"
				variant="destructive"
				disabled={isCancelling}
			>
				{isCancelling ? 'Membatalkan...' : 'Ya, Batalkan Pesanan'}
			</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>
