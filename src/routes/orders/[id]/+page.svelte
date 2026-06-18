<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { ArrowLeft, ExternalLink, CheckCircle2, Clock, XCircle } from '@lucide/svelte';

	let { data } = $props();

	const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
		PENDING: { label: 'Menunggu Pembayaran', icon: Clock, color: 'text-yellow-600' },
		PAID: { label: 'Lunas', icon: CheckCircle2, color: 'text-green-600' },
		PROCESSING: { label: 'Diproses', icon: Clock, color: 'text-blue-600' },
		SHIPPED: { label: 'Dikirim', icon: CheckCircle2, color: 'text-purple-600' },
		COMPLETED: { label: 'Selesai', icon: CheckCircle2, color: 'text-emerald-600' },
		CANCELLED: { label: 'Dibatalkan', icon: XCircle, color: 'text-red-600' }
	};

	const cfg = statusConfig[data.order.status] || { label: data.order.status, icon: Clock, color: 'text-gray-600' };
</script>

<div class="mx-auto max-w-2xl px-4 py-8">
	<a href="/orders" class="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={14} /> Kembali</a>

	<Card>
		<CardHeader class="flex flex-row items-center justify-between">
			<div>
				<CardTitle>Pesanan #{data.order.id.slice(0, 8)}</CardTitle>
				<p class="text-sm text-muted-foreground">{new Date(data.order.createdAt).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
			</div>
			<div class="flex items-center gap-2 {cfg.color}">
				<svelte:component this={cfg.icon} size={18} />
				<span class="text-sm font-medium">{cfg.label}</span>
			</div>
		</CardHeader>
		<CardContent class="space-y-4">
			{#each data.order.items as item}
				<div class="flex items-center justify-between rounded-lg border p-3">
					<div>
						<p class="font-medium">{item.productName}</p>
						<p class="text-xs text-muted-foreground">{item.productCode}</p>
					</div>
					<div class="text-right">
						<p class="text-sm">{item.quantity} {item.unit} × Rp {Number(item.unitPrice).toLocaleString('id-ID')}</p>
						<p class="font-medium">Rp {(Number(item.quantity) * Number(item.unitPrice)).toLocaleString('id-ID')}</p>
					</div>
				</div>
			{/each}

			<div class="flex items-center justify-between border-t pt-3">
				<span class="font-semibold">Total</span>
				<span class="text-lg font-bold">Rp {Number(data.order.totalAmount).toLocaleString('id-ID')}</span>
			</div>

			{#if data.order.status === 'PENDING' && data.order.xenditInvoiceUrl}
				<a href={data.order.xenditInvoiceUrl} target="_blank" rel="noopener noreferrer" class="mt-2 block">
					<Button class="w-full gap-2"><ExternalLink size={16} /> Bayar Sekarang</Button>
				</a>
			{/if}

			<div class="rounded-lg bg-gray-50 p-3 text-sm">
				<p class="font-medium">Data Pembeli</p>
				<p class="text-muted-foreground">{data.order.customerName}</p>
				<p class="text-muted-foreground">{data.order.customerPhone}</p>
				<p class="text-muted-foreground">{data.order.customerAddress}</p>
				{#if data.order.notes}<p class="mt-1 text-muted-foreground">Catatan: {data.order.notes}</p>{/if}
			</div>
		</CardContent>
	</Card>
</div>
