<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Receipt, Check, User, Package, Calendar, Scale, FileDown } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { goto, invalidateAll } from '$app/navigation';

	let { data } = $props();
	const sale = $derived(data.sale);

	function fmtCurrency(val: string | number) {
		return 'Rp ' + Number(val).toLocaleString('id-ID');
	}
	function fmtDate(d: string | Date | null) {
		if (!d) return '-';
		return new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
	}
	function fmtWeight(val: string | number) {
		return Number(val).toLocaleString('id-ID', { minimumFractionDigits: 2 }) + ' kg';
	}
</script>

<svelte:head>
	<title>Detail Timbangan {sale.sale_number} — CV TapioLeaf</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div class="flex items-center gap-3">
			<a href="/sales"><Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button></a>
			<div>
				<h1 class="text-xl font-bold md:text-2xl">{sale.sale_number || 'Detail Timbangan'}</h1>
				<p class="text-sm text-muted-foreground">Timbangan Tepung</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<a href="/api/sales/{sale.id}/pdf" target="_blank" rel="noreferrer">
				<Button variant="outline" size="sm" class="gap-1.5">
					<FileDown size={16} /> Cetak Nota PDF
				</Button>
			</a>
			{#if sale.status === 'draft'}
				<span class="inline-flex items-center rounded-full bg-warning/10 px-3 py-1 text-sm font-medium text-warning">Draft</span>
			{:else if sale.status === 'confirmed'}
				<span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"><Check size={14} /> Confirmed</span>
			{:else}
				<span class="inline-flex items-center rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">Cancelled</span>
			{/if}
		</div>
	</div>

	<!-- Info Cards -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-xl border p-4 space-y-1">
			<div class="flex items-center gap-2 text-xs font-medium text-muted-foreground"><User size={14} /> Pembeli</div>
			<p class="text-lg font-semibold">{sale.buyer_name || '-'}</p>
			{#if sale.buyer_type}
				<span class="text-xs text-muted-foreground">{sale.buyer_type === 'umkm' ? 'UMKM / Retail' : 'Pengepul'}</span>
			{/if}
		</div>
		<div class="rounded-xl border p-4 space-y-1">
			<div class="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Package size={14} /> Produk</div>
			<p class="text-lg font-semibold">{sale.product_name || '-'}</p>
			<p class="text-xs text-muted-foreground">{sale.product_code || ''}</p>
		</div>
		<div class="rounded-xl border p-4 space-y-1">
			<div class="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Calendar size={14} /> Tanggal</div>
			<p class="text-lg font-semibold">{fmtDate(sale.sale_date)}</p>
		</div>
		<div class="rounded-xl border bg-primary/5 p-4 space-y-1">
			<div class="flex items-center gap-2 text-xs font-medium text-primary"><Receipt size={14} /> Total Bayar</div>
			<p class="text-2xl font-bold text-primary">{fmtCurrency(sale.total_payment || 0)}</p>
		</div>
	</div>

	<!-- Sack Weights Table -->
	<div class="rounded-lg border">
		<div class="border-b bg-muted/30 px-4 py-3">
			<h2 class="text-sm font-semibold flex items-center gap-2"><Scale size={16} /> Detail Timbangan Per Karung</h2>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-muted/50">
					<tr>
						<th class="px-4 py-3 text-center font-medium text-muted-foreground w-20">No.</th>
						<th class="px-4 py-3 text-right font-medium text-muted-foreground">Berat Kotor (kg)</th>
					</tr>
				</thead>
				<tbody>
					{#each sale.items as item}
						<tr class="border-t hover:bg-muted/20">
							<td class="px-4 py-2.5 text-center font-mono text-muted-foreground">{item.sack_index}</td>
							<td class="px-4 py-2.5 text-right font-medium">{fmtWeight(item.sack_weight)}</td>
						</tr>
					{:else}
						<tr><td colspan="2" class="px-4 py-6 text-center text-muted-foreground">Tidak ada data karung</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Calculation Summary -->
	<div class="rounded-lg border p-4 md:p-6">
		<h2 class="text-sm font-semibold mb-4">Rincian Perhitungan</h2>
		<div class="grid gap-3 text-sm max-w-md">
			<div class="flex justify-between"><span class="text-muted-foreground">Jumlah Karung</span><span class="font-medium">{sale.items.length} karung</span></div>
			<div class="flex justify-between"><span class="text-muted-foreground">Berat Kotor (Gross Weight)</span><span class="font-medium">{fmtWeight(sale.gross_weight || 0)}</span></div>
			<div class="flex justify-between"><span class="text-muted-foreground">Tara/Karung</span><span class="font-medium">{fmtWeight(sale.tara_per_sack || 0)}</span></div>
			<div class="flex justify-between"><span class="text-muted-foreground">Tara Total ({sale.items.length} × {Number(sale.tara_per_sack || 0)} kg)</span><span class="font-medium">-{fmtWeight(sale.items.length * Number(sale.tara_per_sack || 0))}</span></div>
			<div class="flex justify-between border-t pt-2"><span class="font-medium">Berat Bersih (Net Weight)</span><span class="font-bold">{fmtWeight(sale.net_weight || 0)}</span></div>

			<div class="flex justify-between mt-3"><span class="text-muted-foreground">Harga per Kg</span><span class="font-medium">{fmtCurrency(sale.price_per_kg || 0)}</span></div>
			<div class="flex justify-between"><span class="text-muted-foreground">Total Harga (Net × Harga/Kg)</span><span class="font-medium">{fmtCurrency(sale.total_cost || 0)}</span></div>
			<div class="flex justify-between"><span class="text-muted-foreground">Biaya Kuli/Karung</span><span class="font-medium">{fmtCurrency(sale.kuli_fee_per_sack || 0)}</span></div>
			<div class="flex justify-between"><span class="text-muted-foreground">Total Biaya Kuli ({sale.items.length} × {fmtCurrency(sale.kuli_fee_per_sack || 0)})</span><span class="font-medium text-destructive">-{fmtCurrency(sale.items.length * Number(sale.kuli_fee_per_sack || 0))}</span></div>
			<div class="flex justify-between border-t pt-2"><span class="text-lg font-bold">Total Bayar</span><span class="text-xl font-bold text-primary">{fmtCurrency(sale.total_payment || 0)}</span></div>
		</div>
	</div>

	<!-- Confirm Action (only for draft) -->
	{#if sale.status === 'draft'}
		<div class="flex justify-end gap-2">
			<form method="post" action="/sales?/confirm" use:enhance={() => {
				return async ({ result, update }) => {
					update();
					if (result.type === 'success') {
						toast.success('Transaksi berhasil dikonfirmasi');
						await invalidateAll();
					} else if (result.type === 'failure') {
						const msg = (result.data as any)?.message;
						if (msg) toast.error(msg);
					}
				};
			}}>
				<input type="hidden" name="saleId" value={sale.id} />
				<Button type="submit" size="lg"><Check size={16} class="mr-1" /> Konfirmasi Transaksi</Button>
			</form>
		</div>
	{/if}
</div>
