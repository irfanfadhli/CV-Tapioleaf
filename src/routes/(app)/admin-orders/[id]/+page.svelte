<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { CheckCircle2, XCircle, Clock, TriangleAlert, Loader2, User, Mail, Phone, MapPin, FileText, CalendarDays, Truck, ExternalLink } from '@lucide/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
		PENDING: { label: 'Menunggu Persetujuan', icon: Clock, color: 'text-warning' },
		APPROVED: { label: 'Menunggu Pembayaran', icon: Clock, color: 'text-primary' },
		PAID: { label: 'Lunas', icon: CheckCircle2, color: 'text-primary' },
		CANCELLED: { label: 'Dibatalkan', icon: XCircle, color: 'text-destructive' }
	};

	let cfg = $derived(statusConfig[data.order.status] || { label: data.order.status, icon: Clock, color: 'text-muted-foreground' });

	let isCancelModalOpen = $state(false);
	let isCancelling = $state(false);
	let cancelReason = $state('');
	const cancelPresets = [
		'Stok produk habis / tidak mencukupi',
		'Jadwal pengambilan di tempat tidak tersedia',
		'Pelanggan tidak dapat dihubungi',
		'Kendala operasional pabrik'
	];

	// Deteksi apakah pesanan ini "Ambil di Tempat"
	const isPickup = $derived(
		data.order.customerAddress?.includes('Ambil di Tempat') || data.order.notes?.includes('Ambil di Tempat')
	);
	const isDelivery = $derived(!isPickup);

	// Hitung Subtotal Produk
	const productSubtotal = $derived(
		(data.order.items || []).reduce(
			(sum: number, item: any) => sum + Number(item.quantity) * Number(item.unitPrice),
			0
		)
	);

	// Total dinamis
	const displayedTotal = $derived(
		isDelivery
			? productSubtotal + Number(data.order.shippingFee || 0)
			: productSubtotal
	);

	// Parse info pengambilan dari notes & customerAddress
	const pickupInfo = $derived.by(() => {
		if (!isPickup) return null;

		let tanggal = '';
		let jam = '';
		let catatan = '';

		const notesStr = data.order.notes || '';

		// Format baru: "Ambil di Tempat\nTanggal: Senin, 15 Nov 2026\nJam: 09:00 WIB"
		const tanggalMatch = notesStr.match(/Tanggal:\s*(.+)/);
		const jamMatchNotes = notesStr.match(/Jam:\s*(\d{2}:\d{2})\s*WIB/);

		if (tanggalMatch) {
			tanggal = tanggalMatch[1].trim();
		}

		if (jamMatchNotes) {
			jam = jamMatchNotes[1];
		}

		// Fallback: parse dari customerAddress format lama "Ambil di Tempat (Pukul 09:00 WIB)"
		if (!jam) {
			const addrMatch = (data.order.customerAddress || '').match(/Pukul\s*(\d{2}:\d{2})\s*WIB/);
			if (addrMatch) jam = addrMatch[1];
		}

		// Fallback: parse jam dari notes format lama "Ambil di Tempat (Jam: 09:00 WIB)"
		if (!jam) {
			const oldJamMatch = notesStr.match(/\(Jam:\s*(\d{2}:\d{2})\s*WIB\)/);
			if (oldJamMatch) jam = oldJamMatch[1];
		}

		// Ambil catatan tambahan setelah "Catatan:"
		const catatanMatch = notesStr.match(/Catatan:\s*([\s\S]+?)$/);
		if (catatanMatch) catatan = catatanMatch[1].trim();

		return { tanggal, jam, catatan };
	});
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

			<div class="border-t pt-3.5 space-y-2.5">
				{#if isDelivery}
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Subtotal Produk</span>
						<span class="font-semibold text-foreground">Rp {productSubtotal.toLocaleString('id-ID')}</span>
					</div>

					<div class="flex items-center justify-between text-sm">
						<span class="flex items-center gap-1.5 text-muted-foreground">
							<Truck size={15} class="text-primary" />
							<span>Ongkir (Biaya Pengiriman)</span>
						</span>
						<span class="font-semibold text-foreground">Rp {Number(data.order.shippingFee || 0).toLocaleString('id-ID')}</span>
					</div>
				{/if}

				<div class="flex items-center justify-between {isDelivery ? 'border-t pt-2.5' : ''}">
					<div>
						<span class="text-base font-bold text-foreground">Total</span>
						{#if isDelivery}
							<p class="text-xs text-muted-foreground font-normal">Subtotal Produk + Ongkir</p>
						{/if}
					</div>
					<span class="text-xl font-extrabold text-foreground tracking-tight">Rp {displayedTotal.toLocaleString('id-ID')}</span>
				</div>
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
			{:else if data.order.status === 'CANCELLED'}
				<div class="mt-2 rounded-xl border border-destructive/25 bg-destructive/5 p-4 space-y-3">
					<div class="flex items-center gap-2 text-destructive font-bold text-sm">
						<XCircle size={18} class="shrink-0" />
						<span>Pesanan Dibatalkan {data.order.cancelledBy === 'ADMIN' ? 'oleh Admin' : 'oleh Pelanggan'}</span>
					</div>
					{#if data.order.cancellationReason}
						<div class="rounded-lg border border-destructive/20 bg-background/95 p-3.5 shadow-2xs space-y-1.5">
							<p class="text-[11px] font-bold uppercase tracking-wider text-destructive flex items-center gap-1.5">
								<span>Alasan Pembatalan:</span>
							</p>
							<p class="text-sm font-semibold text-foreground whitespace-pre-wrap leading-relaxed">
								{data.order.cancellationReason}
							</p>
						</div>
					{/if}
				</div>
			{/if}

				<!-- Informasi Pembeli Section -->
				<div class="rounded-xl border border-border/70 bg-card p-4 space-y-3.5 shadow-2xs">
					<div class="flex items-center justify-between border-b border-border/60 pb-3">
						<div class="flex items-center gap-2.5">
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
								<User size={16} />
							</div>
							<h3 class="text-xs font-bold uppercase tracking-wider text-foreground">Informasi Pembeli</h3>
						</div>
						<div class="flex items-center gap-1.5 flex-wrap justify-end">
							{#if !data.order.userId}
								<span class="inline-flex items-center gap-1 rounded-full bg-warning/10 border border-warning/20 px-2.5 py-0.5 text-[11px] font-semibold text-warning">
									Transaksi Tunai (Offline)
								</span>
							{:else if isPickup}
								<span class="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
									📦 Ambil di Tempat
								</span>
							{:else}
								<span class="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
									🚚 Pengiriman
								</span>
							{/if}
						</div>
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

						{#if !isPickup}
							<div class="flex items-start gap-2.5 rounded-lg border bg-card p-3 shadow-2xs">
								<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
									<MapPin size={14} />
								</div>
								<div class="min-w-0 flex-1">
									<p class="text-[11px] font-medium text-muted-foreground">Alamat Pengiriman</p>
									<p class="text-xs sm:text-sm font-medium text-foreground break-words">{data.order.customerAddress || '-'}</p>
								</div>
							</div>
						{/if}
					</div>

					<!-- Jadwal Pengambilan (Ambil di Tempat) -->
					{#if isPickup && pickupInfo}
						<div class="rounded-xl border border-emerald-300/40 bg-emerald-500/5 p-3.5 space-y-2.5">
							<div class="flex items-center gap-2">
								<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-700">
									<CalendarDays size={15} />
								</div>
								<p class="text-xs font-bold text-emerald-900 uppercase tracking-wide">Jadwal Pengambilan</p>
							</div>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
								{#if pickupInfo.tanggal}
									<div class="flex items-start gap-2.5 rounded-lg border border-emerald-200/50 bg-card p-3 shadow-2xs">
										<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
											<CalendarDays size={14} />
										</div>
										<div class="min-w-0 flex-1">
											<p class="text-[11px] font-medium text-muted-foreground">Tanggal & Hari</p>
											<p class="text-xs sm:text-sm font-semibold text-foreground">{pickupInfo.tanggal}</p>
										</div>
									</div>
								{/if}
								{#if pickupInfo.jam}
									<div class="flex items-start gap-2.5 rounded-lg border border-emerald-200/50 bg-card p-3 shadow-2xs">
										<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
											<Clock size={14} />
										</div>
										<div class="min-w-0 flex-1">
											<p class="text-[11px] font-medium text-muted-foreground">Jam Pengambilan</p>
											<p class="text-xs sm:text-sm font-semibold text-foreground">{pickupInfo.jam} WIB</p>
										</div>
									</div>
								{/if}
							</div>
							<p class="text-[11px] text-muted-foreground border-t border-emerald-200/30 pt-2">
								📍 <strong>Lokasi:</strong> Gudang / Pabrik CV TapioLeaf
							</p>
						</div>
					{/if}

					<!-- Catatan -->
					{#if isPickup && pickupInfo?.catatan}
						<div class="flex items-start gap-2.5 rounded-xl border border-amber-300/40 bg-amber-500/10 p-3.5 shadow-2xs">
							<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-700">
								<FileText size={15} />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-xs font-bold text-amber-900 uppercase tracking-wide">Catatan Tambahan dari Pembeli:</p>
								<p class="mt-1 text-xs sm:text-sm font-medium text-foreground whitespace-pre-wrap leading-relaxed">{pickupInfo.catatan}</p>
							</div>
						</div>
					{:else if !isPickup && data.order.notes}
						<div class="flex items-start gap-2.5 rounded-xl border border-amber-300/40 bg-amber-500/10 p-3.5 shadow-2xs">
							<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-700">
								<FileText size={15} />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-xs font-bold text-amber-900 uppercase tracking-wide">Catatan dari Pembeli:</p>
								<p class="mt-1 text-xs sm:text-sm font-medium text-foreground whitespace-pre-wrap leading-relaxed">{data.order.notes}</p>
							</div>
						</div>
					{:else if !isPickup && !data.order.notes}
						<div class="flex items-center gap-2 rounded-lg border bg-card/60 p-3 text-xs text-muted-foreground">
							<FileText size={14} class="shrink-0 text-muted-foreground/70" />
							<span>Tidak ada catatan khusus pada pesanan ini.</span>
						</div>
					{/if}

					<!-- Tombol Cek Ekspedisi / Hitung Ongkir untuk Pesanan Pengiriman -->
					{#if false}
						<div class="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
							<div class="space-y-1">
								<p class="text-sm font-semibold text-foreground flex items-center gap-2">
									<Truck size={16} class="text-primary" />
									<span>Cek Tarif &amp; Estimasi Ongkir</span>
								</p>
								<p class="text-xs text-muted-foreground leading-relaxed">
									Gunakan kalkulator tarif ekspedisi resmi J&amp;T Express untuk mengecek biaya pengiriman ke alamat tujuan pembeli.
								</p>
							</div>
							<a
								href="https://jet.co.id/rates"
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all active:scale-98"
							>
								<span>Buka J&amp;T Rates</span>
								<ExternalLink size={13} />
							</a>
						</div>
					{/if}
				</div>
		</CardContent>
	</Card>
</div>

<!-- Modal Konfirmasi Pembatalan Pesanan -->
<Dialog.Root bind:open={isCancelModalOpen}>
	<Dialog.Content class="sm:max-w-md">
		<div class="flex flex-col items-center gap-3 text-center py-2">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
				<TriangleAlert size={26} />
			</div>
			<div class="space-y-1">
				<Dialog.Title class="text-lg font-bold">Batalkan Pesanan?</Dialog.Title>
				<Dialog.Description class="text-xs text-muted-foreground max-w-sm">
					Pesanan <span class="font-medium text-foreground">#{data.order.id.slice(0, 8)}</span> untuk <span class="font-medium text-foreground">{data.order.customerName}</span> akan dibatalkan. Berikan alasan pembatalan agar pembeli mendapat kejelasan.
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
					if (result.type === 'success') {
						isCancelModalOpen = false;
						cancelReason = '';
						toast.success('Pesanan berhasil dibatalkan dan notifikasi telah dikirim ke pelanggan');
					} else if (result.type === 'failure') {
						toast.error((result.data as any)?.message || 'Gagal membatalkan');
					}
				};
			}}
			class="space-y-4 pt-1"
		>
			<input type="hidden" name="orderId" value={data.order.id} />

			<div class="space-y-2 text-left">
				<label for="cancellation-reason" class="text-xs font-semibold text-foreground flex items-center justify-between">
					<span>Alasan Pembatalan <span class="text-destructive">*</span></span>
					<span class="text-[10px] text-muted-foreground font-normal">Akan terlihat oleh pembeli</span>
				</label>
				
				<div class="flex flex-wrap gap-1.5">
					{#each cancelPresets as preset}
						<button
							type="button"
							class="rounded-full border border-border/80 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all text-left"
							onclick={() => { cancelReason = preset; }}
						>
							{preset}
						</button>
					{/each}
				</div>

				<textarea
					id="cancellation-reason"
					name="cancellationReason"
					bind:value={cancelReason}
					rows="3"
					required
					placeholder="Tulis alasan mengapa pesanan ini dibatalkan..."
					class="w-full rounded-xl border border-border bg-background p-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-ring"
				></textarea>
			</div>

			<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2 border-t">
				<Button
					type="button"
					variant="outline"
					disabled={isCancelling}
					onclick={() => { isCancelModalOpen = false; cancelReason = ''; }}
				>
					Kembali
				</Button>
				<Button
					type="submit"
					variant="destructive"
					disabled={isCancelling || !cancelReason.trim()}
				>
					{#if isCancelling}<Loader2 size={14} class="mr-1.5 animate-spin" />{/if}
					Batalkan Pesanan
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
