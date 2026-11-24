<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import {
		ExternalLink,
		CheckCircle2,
		Clock,
		XCircle,
		User,
		Phone,
		MapPin,
		FileText,
		CalendarDays,
		Truck
	} from '@lucide/svelte';
	import BackButton from '$lib/components/ui/back-button.svelte';

	let { data } = $props();

	const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
		PENDING: { label: 'Menunggu Persetujuan', icon: Clock, color: 'text-warning' },
		APPROVED: { label: 'Menunggu Pembayaran', icon: Clock, color: 'text-primary' },
		PAID: { label: 'Lunas', icon: CheckCircle2, color: 'text-primary' },
		CANCELLED: { label: 'Dibatalkan', icon: XCircle, color: 'text-destructive' }
	};

	let cfg = $derived(
		statusConfig[data.order.status] || {
			label: data.order.status,
			icon: Clock,
			color: 'text-muted-foreground'
		}
	);

	let isCancelModalOpen = $state(false);
	let isCancelling = $state(false);

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

	const shippingFee = $derived(Number(data.order.shippingFee || 0));

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
		<BackButton fallbackHref="/orders" label="Kembali ke Pesanan" variant="ghost" />
	</div>

	<Card>
		<CardHeader class="flex flex-row items-center justify-between">
			<div>
				<CardTitle>Pesanan #{data.order.id.slice(0, 8)}</CardTitle>
				<p class="text-sm text-muted-foreground">
					{new Date(data.order.createdAt).toLocaleDateString('id-ID', {
						weekday: 'long',
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</p>
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
						<p class="text-sm">
							{item.quantity}
							{item.unit} × Rp {Number(item.unitPrice).toLocaleString('id-ID')}
						</p>
						<p class="font-medium">
							Rp {(Number(item.quantity) * Number(item.unitPrice)).toLocaleString('id-ID')}
						</p>
					</div>
				</div>
			{/each}

			{#if data.order.status === 'CANCELLED'}
				<div class="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2.5">
					<div class="flex items-center gap-2 text-destructive">
						<XCircle size={18} class="shrink-0" />
						<p class="font-bold text-sm">
							Pesanan Dibatalkan {data.order.cancelledBy === 'ADMIN' ? 'oleh Admin' : 'oleh Pelanggan'}
						</p>
					</div>

					{#if data.order.cancellationReason}
						<div class="rounded-lg border border-destructive/20 bg-background/90 p-3 space-y-1">
							<p class="text-[11px] font-bold uppercase tracking-wider text-destructive">
								Alasan Pembatalan:
							</p>
							<p class="text-xs sm:text-sm font-semibold text-foreground whitespace-pre-wrap leading-relaxed">
								{data.order.cancellationReason}
							</p>
						</div>
					{:else}
						<p class="text-xs text-destructive/90">
							Pesanan ini telah dibatalkan oleh Admin. Silakan hubungi pihak CV TapioLeaf atau buat pesanan baru melalui katalog.
						</p>
					{/if}

					<p class="text-[11px] text-muted-foreground">
						Apabila Anda membutuhkan bantuan atau klarifikasi lebih lanjut, silakan hubungi kami via WhatsApp atau lakukan pemesanan ulang melalui katalog.
					</p>
				</div>
			{/if}

			<div class="border-t pt-3 space-y-2">
				{#if isDelivery}
					<div class="flex items-center justify-between text-sm text-muted-foreground">
						<span>Subtotal Produk</span>
						<span class="font-medium text-foreground">Rp {productSubtotal.toLocaleString('id-ID')}</span>
					</div>

					<div class="flex items-center justify-between text-sm text-muted-foreground">
						<span class="flex items-center gap-1.5">
							<Truck size={14} class="text-blue-600" />
							<span>Ongkir (Biaya Pengiriman)</span>
						</span>
						{#if data.order.status === 'PENDING' && shippingFee === 0}
							<span class="text-xs italic text-amber-600 font-medium">Menunggu penentuan admin</span>
						{:else}
							<span class="font-medium text-foreground">Rp {shippingFee.toLocaleString('id-ID')}</span>
						{/if}
					</div>
				{/if}

				<div class="flex items-center justify-between {isDelivery ? 'border-t pt-2' : ''}">
					<div>
						<span class="font-semibold">Total</span>
						{#if isDelivery}
							<p class="text-[11px] text-muted-foreground">Total = Subtotal Produk + Ongkir</p>
						{/if}
					</div>
					<span class="text-lg font-bold">Rp {Number(data.order.totalAmount).toLocaleString('id-ID')}</span>
				</div>
			</div>

			{#if data.order.status === 'PENDING'}
				<div class="mt-2 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
					<Clock size={16} class="text-amber-600 shrink-0" />
					<p class="text-xs sm:text-sm text-amber-700">Pesanan Anda sedang menunggu persetujuan admin.</p>
				</div>
			{:else if data.order.status === 'APPROVED'}
				{#if data.order.xenditInvoiceUrl}
					<a
						href={data.order.xenditInvoiceUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="mt-2 block"
					>
						<Button class="w-full gap-2"><ExternalLink size={16} /> Bayar Sekarang</Button>
					</a>
				{:else}
					<p class="text-sm text-destructive">Invoice belum tersedia, silakan hubungi admin</p>
				{/if}
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
					<div class="flex items-center gap-1.5 flex-wrap justify-end">
						{#if isPickup}
							<span class="inline-flex items-center gap-1 rounded-full bg-emerald-600/15 border border-emerald-600/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
								📦 Ambil di Tempat
							</span>
						{:else}
							<span class="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
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
							<Phone size={14} />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-[11px] font-medium text-muted-foreground">Nomor Telepon</p>
							<p class="text-xs sm:text-sm font-medium text-foreground">{data.order.customerPhone || '-'}</p>
						</div>
					</div>

					{#if !isPickup}
						<div class="flex items-start gap-2.5 rounded-lg border bg-card p-3 shadow-2xs sm:col-span-2">
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
					<div class="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3.5 shadow-2xs">
						<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/20 text-primary">
							<FileText size={15} />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-xs font-bold text-primary uppercase tracking-wide">Catatan Tambahan:</p>
							<p class="mt-1 text-xs sm:text-sm font-medium text-foreground whitespace-pre-wrap leading-relaxed">{pickupInfo.catatan}</p>
						</div>
					</div>
				{:else if !isPickup && data.order.notes}
					<div class="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3.5 shadow-2xs">
						<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/20 text-primary">
							<FileText size={15} />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-xs font-bold text-primary uppercase tracking-wide">Catatan & Rincian Pengambilan:</p>
							<p class="mt-1 text-xs sm:text-sm font-medium text-foreground whitespace-pre-wrap leading-relaxed">{data.order.notes}</p>
						</div>
					</div>
				{/if}

				<!-- Tombol Cek Ekspedisi / Hitung Ongkir untuk Pesanan Pengiriman -->
				{#if false}
					<div class="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div class="space-y-0.5">
							<p class="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
								<Truck size={15} class="text-blue-600" />
								<span>Cek Tarif & Estimasi Ongkir</span>
							</p>
							<p class="text-[11px] text-blue-700">
								Ingin mengetahui estimasi ongkir pesanan Anda? Cek tarif resmi ekspedisi J&T Express.
							</p>
						</div>
						<a
							href="https://jet.co.id/rates"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white shadow-xs hover:bg-blue-700 transition-colors"
						>
							<span>Buka J&T Rates</span>
							<ExternalLink size={13} />
						</a>
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>
</div>
