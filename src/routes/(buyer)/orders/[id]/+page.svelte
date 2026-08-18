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
		FileText
	} from '@lucide/svelte';
	import BackButton from '$lib/components/ui/back-button.svelte';

	let { data } = $props();

	const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
		PENDING: { label: 'Menunggu Persetujuan', icon: Clock, color: 'text-warning' },
		APPROVED: { label: 'Menunggu Pembayaran', icon: Clock, color: 'text-primary' },
		PAID: { label: 'Lunas', icon: CheckCircle2, color: 'text-primary' },
		PROCESSING: { label: 'Diproses', icon: Clock, color: 'text-info' },
		SHIPPED: { label: 'Dikirim', icon: CheckCircle2, color: 'text-info' },
		COMPLETED: { label: 'Selesai', icon: CheckCircle2, color: 'text-primary' },
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

			{#if data.order.status === 'CANCELLED' && data.order.cancelledBy === 'ADMIN'}
				<div class="mt-3 rounded-lg bg-red-50 p-3 text-sm">
					<p class="font-medium text-red-600">Status Pesanan</p>
					<p class="text-red-600">🔴 Dibatalkan oleh Admin</p>
					<p class="text-sm text-red-500">Pesanan ini telah dibatalkan oleh Admin.</p>
				</div>
			{/if}

			<div class="flex items-center justify-between border-t pt-3">
				<span class="font-semibold">Total</span>
				<span class="text-lg font-bold"
					>Rp {Number(data.order.totalAmount).toLocaleString('id-ID')}</span
				>
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
					<span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
						Pembeli Online
					</span>
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

					<div class="flex items-start gap-2.5 rounded-lg border bg-card p-3 shadow-2xs sm:col-span-2">
						<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
							<MapPin size={14} />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-[11px] font-medium text-muted-foreground">Alamat Pengiriman</p>
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
