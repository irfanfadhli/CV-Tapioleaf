<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Download, FileText, RefreshCw, Scale, ShoppingBag, Factory, TriangleAlert, Pencil } from '@lucide/svelte';
	import { reportStatusLabel, reportTypeLabel } from '$lib/utils';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog';

	let { data } = $props();

	const query = $derived(data.query);
	const role = $derived(data.role as string);
	let pdfLoading = $state(false);

	// Custom date modal state
	let showCustomModal = $state(false);
	let modalStart = $state('');
	let modalEnd = $state('');
	let modalError = $state('');
	let customTrigger = $state<HTMLElement | undefined>(undefined);
	let customInputStart = $state<HTMLInputElement | undefined>(undefined);
	let customTriggerChip = $state<HTMLElement | undefined>(undefined);

	function fmtCurrency(v: string | number) {
		return 'Rp ' + Number(v || 0).toLocaleString('id-ID');
	}
	function fmtNumber(v: string | number) {
		return Number(v || 0).toLocaleString('id-ID');
	}
	function fmtDate(d: string | Date | null) {
		if (!d) return '-';
		return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
	}

	function setTab(tab: string) {
		const url = new URL($page.url);
		url.searchParams.set('tab', tab);
		url.searchParams.set('period', query.period);
		for (const k of ['month', 'startDate', 'endDate'] as const) {
			const v = (data.query as Record<string, unknown>)[k];
			if (typeof v === 'string' && v) url.searchParams.set(k, v);
		}
		url.searchParams.delete('page');
		goto(url.toString(), { replaceState: true });
	}

	function setPeriod(period: string, e?: Event) {
		if (period === 'custom') {
			customTrigger = (e?.currentTarget as HTMLElement) ?? undefined;
			openCustomModal();
			return;
		}
		const url = new URL($page.url);
		url.searchParams.set('tab', query.tab);
		url.searchParams.set('period', period);
		for (const k of ['month', 'startDate', 'endDate'] as const) url.searchParams.delete(k);
		if (period === 'month-pick') {
			const d = new Date();
			url.searchParams.set('month', query.month || `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
		}
		url.searchParams.delete('page');
		goto(url.toString(), { replaceState: true });
	}

	function openCustomModal(trigger?: HTMLElement) {
		if (trigger) customTrigger = trigger;
		modalStart = query.startDate ?? '';
		modalEnd = query.endDate ?? '';
		modalError = !modalStart || !modalEnd ? 'Pilih rentang tanggal' : '';
		showCustomModal = true;
	}

	function closeCustomModal() {
		showCustomModal = false;
		modalError = '';
		// Kembalikan fokus ke tombol Kustom atau chip yang membuka modal
		setTimeout(() => (customTriggerChip ?? customTrigger)?.focus(), 0);
	}

	function applyCustom() {
		if (!modalStart || !modalEnd) {
			modalError = 'Pilih rentang tanggal';
			return;
		}
		if (modalEnd < modalStart) {
			modalError = 'Tanggal akhir tidak boleh sebelum tanggal awal';
			return;
		}
		const url = new URL($page.url);
		url.searchParams.set('tab', query.tab);
		url.searchParams.set('period', 'custom');
		url.searchParams.set('startDate', modalStart);
		url.searchParams.set('endDate', modalEnd);
		url.searchParams.delete('month');
		url.searchParams.delete('page');
		showCustomModal = false;
		modalError = '';
		goto(url.toString(), { replaceState: true });
	}

	// Auto-open modal saat halaman dimuat dengan period=custom tanpa rentang (mis. tautan langsung)
	$effect(() => {
		if (query.period === 'custom' && !query.startDate && !query.endDate) {
			showCustomModal = true;
		}
	});

	// Fokus ke input pertama saat modal dibuka
	$effect(() => {
		if (showCustomModal) {
			setTimeout(() => customInputStart?.focus(), 0);
		}
	});

	const customChipLabel = $derived.by(() => {
		if (query.period !== 'custom' || !query.startDate || !query.endDate) return '';
		const fmt = (s: string) => new Date(s + 'T00:00:00+07:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
		return `${fmt(query.startDate!)} - ${fmt(query.endDate!)}`;
	});

	function onPickMonth(e: Event) {
		const v = (e.target as HTMLInputElement).value;
		const url = new URL($page.url);
		url.searchParams.set('period', 'month-pick');
		if (v) url.searchParams.set('month', v);
		url.searchParams.delete('startDate');
		url.searchParams.delete('endDate');
		url.searchParams.delete('page');
		goto(url.toString(), { replaceState: true });
	}

	function stepMonth(delta: number) {
		const raw = query.month ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
		const [yRaw, mRaw] = raw.split('-');
		const d = new Date(Number(yRaw), Number(mRaw) - 1 + delta, 1);
		const url = new URL($page.url);
		url.searchParams.set('period', 'month-pick');
		url.searchParams.set('month', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
		url.searchParams.delete('startDate');
		url.searchParams.delete('endDate');
		url.searchParams.delete('page');
		goto(url.toString(), { replaceState: true });
	}

	function stepWeek(delta: number) {
		// Deprecated period removed — kept as no-op for URL backward compatibility
	}

	async function exportPDF() {
		if (pdfLoading) return;
		pdfLoading = true;
		const url = new URL($page.url);
		url.pathname = '/laporan/export';
		try {
			const res = await fetch(url.toString(), { method: 'GET', credentials: 'include' });
			if (!res.ok) throw new Error('Gagal mengekspor PDF');
			const blob = await res.blob();
			const blobUrl = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = blobUrl;
			const startLabel = query.startDate ?? '';
			const endLabel = query.endDate ?? '';
			const typeLabels: Record<string, string> = { sales: 'penjualan', stock: 'stok', production: 'produksi' };
			if (query.period === 'all') {
				a.download = `laporan-${typeLabels[query.tab]}-semua.pdf`;
			} else if (query.period === 'month-pick' && query.month) {
				a.download = `laporan-${typeLabels[query.tab]}-${query.month}.pdf`;
			} else if (startLabel && endLabel) {
				a.download = `laporan-${typeLabels[query.tab]}-${startLabel}-${endLabel}.pdf`;
			} else {
				a.download = `laporan-${typeLabels[query.tab]}.pdf`;
			}
			a.click();
			URL.revokeObjectURL(blobUrl);
		} catch (e) {
			alert('Gagal mengekspor PDF: ' + (e instanceof Error ? e.message : 'Unknown error'));
		} finally {
			pdfLoading = false;
		}
	}

	const tabs = $derived.by(() => {
		const list = [];
		if (role === 'owner' || role === 'admin_penjualan') list.push({ id: 'sales', label: 'Penjualan', icon: ShoppingBag });
		if (role === 'owner' || role === 'petugas_gudang') list.push({ id: 'stock', label: 'Stok', icon: Scale });
		if (role === 'owner' || role === 'bagian_produksi') list.push({ id: 'production', label: 'Produksi', icon: Factory });
		return list;
	});

	const activeTab = $derived(tabs.find((t) => t.id === query.tab) ? query.tab : (tabs[0]?.id ?? 'sales'));
	const periodLabels: Record<string, string> = {
		all: 'Semua',
		'month-pick': 'Per Bulan',
		custom: 'Kustom'
	};
	function goPage(p: number) {
		const url = new URL($page.url);
		url.searchParams.set('page', String(p));
		goto(url.toString(), { replaceState: true });
	}

	const monthLabel = $derived.by(() => {
		const raw = query.month;
		if (!raw) return '';
		const [yRaw, mRaw] = raw.split('-');
		const d = new Date(Number(yRaw), Number(mRaw) - 1, 1);
		return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
	});
</script>

<svelte:head>
	<title>Laporan — CV TapioLeaf</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-xl font-bold md:text-2xl">Laporan</h1>
			<p class="text-sm text-muted-foreground">Ringkasan penjualan, stok, dan produksi per periode</p>
		</div>
		<div class="flex gap-2">
			<button onclick={exportPDF} disabled={pdfLoading} class="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50">
				{#if pdfLoading}
					<span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
				{:else}
					<FileText size={16} />
				{/if}
				{pdfLoading ? 'Membuat PDF...' : 'Export PDF'}
			</button>
			<button onclick={() => location.reload()} class="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
				<RefreshCw size={16} /> Muat Ulang
			</button>
		</div>
	</div>

	<!-- Tabs: kiri + Period Filters: kanan, satu baris -->
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex flex-wrap gap-2">
			{#each tabs as t}
				<button
					onclick={() => setTab(t.id)}
					class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
					class:bg-primary={activeTab === t.id}
					class:text-primary-foreground={activeTab === t.id}
					class:bg-muted={activeTab !== t.id}
				>
					<t.icon size={16} /> {t.label}
				</button>
			{/each}
		</div>

		<div class="flex flex-wrap items-center justify-end gap-2">
			{#each ['all', 'month-pick', 'custom'] as p}
				<button
					onclick={(e) => setPeriod(p, e)}
					class="rounded-full px-3 py-1 text-xs font-medium transition-colors"
					class:bg-primary={query.period === p}
					class:text-primary-foreground={query.period === p}
					class:bg-muted={query.period !== p}
				>
					{periodLabels[p]}
				</button>
			{/each}
		</div>
	</div>

	<!-- Kontrol Per Bulan / Chip Kustom: rata kanan, baris berikutnya -->
	<div class="flex flex-wrap items-center justify-end gap-2">
		{#if query.period === 'month-pick'}
			<div class="flex items-center gap-2">
				<button onclick={() => stepMonth(-1)} class="rounded border px-2 py-1 text-sm" title="Bulan sebelumnya" aria-label="Bulan sebelumnya">‹</button>
				<input
					type="month"
					value={query.month ?? ''}
					onchange={onPickMonth}
					class="rounded-lg border bg-background px-2 py-1 text-sm"
				/>
				<button onclick={() => stepMonth(1)} class="rounded border px-2 py-1 text-sm" title="Bulan berikutnya" aria-label="Bulan berikutnya">›</button>
				<span class="text-xs font-medium text-foreground">{monthLabel}</span>
			</div>
		{/if}

		{#if query.period === 'custom' && customChipLabel}
			<button
				bind:this={customTriggerChip}
				onclick={(e) => openCustomModal(e.currentTarget)}
				class="inline-flex items-center gap-1.5 rounded-full border border-input bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
				title="Ubah rentang tanggal"
			>
				<span class="text-muted-foreground">Rentang:</span>
				<span>{customChipLabel}</span>
				<Pencil size={12} class="text-muted-foreground" />
			</button>
		{/if}
	</div>

	{#if activeTab === 'sales'}
		<!-- Sales Tab -->
		{#if data.data.summary}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div class="rounded-xl border bg-primary/5 p-4">
					<p class="text-xs font-medium text-primary">Total Transaksi</p>
					<p class="mt-1 text-2xl font-bold">{fmtNumber(data.data.summary.totalTransactions)}</p>
				</div>
				<div class="rounded-xl border bg-primary/5 p-4">
					<p class="text-xs font-medium text-primary">Total Nilai</p>
					<p class="mt-1 text-2xl font-bold">{fmtCurrency(data.data.summary.totalValue)}</p>
				</div>
				<div class="rounded-xl border bg-primary/5 p-4">
					<p class="text-xs font-medium text-primary">Lunas</p>
					<p class="mt-1 text-2xl font-bold">{fmtNumber(data.data.summary.paidCount)}</p>
				</div>
				<div class="rounded-xl border bg-info/10 p-4">
					<p class="text-xs font-medium text-info">Menunggu Pembayaran</p>
					<p class="mt-1 text-2xl font-bold">{fmtNumber(data.data.summary.awaitingCount)}</p>
				</div>
			</div>

			{#if data.data.summary.draftCount > 0}
				<p class="text-xs text-muted-foreground">Note: {fmtNumber(data.data.summary.draftCount)} draft nota ({fmtCurrency(data.data.summary.draftValue)}) belum dikonfirmasi dan tidak termasuk dalam total.</p>
			{/if}

			<div class="overflow-x-auto rounded-lg border">
				<table class="w-full text-sm">
					<thead class="bg-muted/50">
						<tr>
							<th class="px-4 py-3 text-left font-medium text-muted-foreground">Tanggal</th>
							<th class="px-4 py-3 text-left font-medium text-muted-foreground">Pembeli</th>
							<th class="px-4 py-3 text-left font-medium text-muted-foreground">Tipe</th>
							<th class="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
							<th class="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
						</tr>
					</thead>
					<tbody>
						{#each data.data.rows || [] as r}
							<tr class="border-t {r.excluded ? 'opacity-50' : ''}">
								<td class="px-4 py-2.5">{fmtDate(r.date)}</td>
								<td class="px-4 py-2.5 font-medium">{r.buyerName}</td>
								<td class="px-4 py-2.5">{r.type === 'sale' ? 'Penjualan Timbangan' : 'Pesanan Katalog'}</td>
								<td class="px-4 py-2.5 text-right">{fmtCurrency(r.total)}</td>
								<td class="px-4 py-2.5 text-center">
									{#if r.isDraft}
										<span class="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Draft</span>
									{:else if r.excluded}
										<span class="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
											{r.type === 'sale' && r.status === 'cancelled' ? 'Dibatalkan' : r.status}
										</span>
									{:else if r.status === 'APPROVED' || r.status === 'PENDING'}
										<span class="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
											{r.status === 'APPROVED' ? 'Disetujui' : 'Menunggu'}
										</span>
									{:else}
										<span class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
											{r.status === 'PAID' || r.status === 'PROCESSING' || r.status === 'SHIPPED' || r.status === 'COMPLETED' ? 'Lunas' : r.status === 'confirmed' ? 'Terkonfirmasi' : r.status}
										</span>
									{/if}
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="5" class="px-4 py-8 text-center text-sm text-muted-foreground">Tidak ada data untuk periode ini</td>
							</tr>
						{/each}
						{#if (data.data.rows || []).length > 0}
							<tr class="border-t bg-muted/30 font-semibold">
								<td class="px-4 py-2.5" colspan="2">Total</td>
								<td class="px-4 py-2.5">{fmtNumber(data.data.totalRow.count)} transaksi</td>
								<td class="px-4 py-2.5 text-right">{fmtCurrency(data.data.totalRow.value)}</td>
								<td></td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>

			{#if data.data.pagination && data.data.pagination.totalPages > 1}
				<div class="flex items-center justify-center gap-1.5 mt-4">
					<button onclick={() => goPage(1)} disabled={data.data.pagination.page === 1} class="rounded border px-2 py-1 text-xs disabled:opacity-50">««</button>
					<button onclick={() => goPage(data.data.pagination.page - 1)} disabled={data.data.pagination.page === 1} class="rounded border px-2 py-1 text-xs disabled:opacity-50">«</button>
					{#each Array(data.data.pagination.totalPages).map((_, i) => i + 1) as p}
						<button onclick={() => goPage(p)} class="rounded w-8 h-8 text-xs font-medium {data.data.pagination.page === p ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/50'}">{p}</button>
					{/each}
					<button onclick={() => goPage(data.data.pagination.page + 1)} disabled={data.data.pagination.page === data.data.pagination.totalPages} class="rounded border px-2 py-1 text-xs disabled:opacity-50">»</button>
					<button onclick={() => goPage(data.data.pagination.totalPages)} disabled={data.data.pagination.page === data.data.pagination.totalPages} class="rounded border px-2 py-1 text-xs disabled:opacity-50">»»</button>
				</div>
			{/if}
		{/if}

	{:else if activeTab === 'stock'}
		<!-- Stock Tab -->
		{#if data.data.rows}
			<div class="overflow-x-auto rounded-lg border">
				<table class="w-full text-sm">
					<thead class="bg-muted/50">
						<tr>
							<th class="px-4 py-3 text-left font-medium text-muted-foreground">Produk</th>
							<th class="px-4 py-3 text-right font-medium text-muted-foreground">Saldo Awal</th>
							<th class="px-4 py-3 text-right font-medium text-muted-foreground">Masuk</th>
							<th class="px-4 py-3 text-right font-medium text-muted-foreground">Keluar</th>
							<th class="px-4 py-3 text-right font-medium text-muted-foreground">Saldo Akhir</th>
							<th class="px-4 py-3 text-center font-medium text-muted-foreground">Indikator</th>
						</tr>
					</thead>
					<tbody>
						{#each data.data.rows as r}
							<tr class="border-t">
								<td class="px-4 py-2.5">
									<p class="font-medium">{r.name}</p>
									<p class="text-xs text-muted-foreground">{r.code} / {r.unit}</p>
								</td>
								<td class="px-4 py-2.5 text-right">{fmtNumber(r.opening)}</td>
								<td class="px-4 py-2.5 text-right text-primary">{fmtNumber(r.inQty)}</td>
								<td class="px-4 py-2.5 text-right text-destructive">{fmtNumber(r.outQty)}</td>
								<td class="px-4 py-2.5 text-right font-bold">{fmtNumber(r.closing)}</td>
								<td class="px-4 py-2.5 text-center">
									{#if r.isLow}
										<span class="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
											<TriangleAlert size={12} /> Di Bawah Minimum
										</span>
									{:else}
										<span class="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Normal</span>
									{/if}
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="6" class="px-4 py-8 text-center text-sm text-muted-foreground">Tidak ada data untuk periode ini</td>
							</tr>
						{/each}
						{#if (data.data.rows || []).length > 0}
							<tr class="border-t bg-muted/30 font-semibold">
								<td class="px-4 py-2.5">Total</td>
								<td class="px-4 py-2.5 text-right">{fmtNumber(data.data.totalRow.opening)}</td>
								<td class="px-4 py-2.5 text-right">{fmtNumber(data.data.totalRow.inQty)}</td>
								<td class="px-4 py-2.5 text-right">{fmtNumber(data.data.totalRow.outQty)}</td>
								<td class="px-4 py-2.5 text-right">{fmtNumber(data.data.totalRow.closing)}</td>
								<td></td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>

			{#if data.data.pagination && data.data.pagination.totalPages > 1}
				<div class="flex items-center justify-center gap-1.5 mt-4">
					<button onclick={() => goPage(1)} disabled={data.data.pagination.page === 1} class="rounded border px-2 py-1 text-xs disabled:opacity-50">««</button>
					<button onclick={() => goPage(data.data.pagination.page - 1)} disabled={data.data.pagination.page === 1} class="rounded border px-2 py-1 text-xs disabled:opacity-50">«</button>
					{#each Array(data.data.pagination.totalPages).map((_, i) => i + 1) as p}
						<button onclick={() => goPage(p)} class="rounded w-8 h-8 text-xs font-medium {data.data.pagination.page === p ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/50'}">{p}</button>
					{/each}
					<button onclick={() => goPage(data.data.pagination.page + 1)} disabled={data.data.pagination.page === data.data.pagination.totalPages} class="rounded border px-2 py-1 text-xs disabled:opacity-50">»</button>
					<button onclick={() => goPage(data.data.pagination.totalPages)} disabled={data.data.pagination.page === data.data.pagination.totalPages} class="rounded border px-2 py-1 text-xs disabled:opacity-50">»»</button>
				</div>
			{/if}
		{/if}

	{:else if activeTab === 'production'}
		<!-- Production Tab -->
		{#if data.data.summary}
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="rounded-xl border bg-primary/5 p-4">
					<p class="text-xs font-medium text-primary">Total Produksi (kg)</p>
					<p class="mt-1 text-2xl font-bold">{fmtNumber(data.data.summary.totalKg)} kg</p>
				</div>
				<div class="rounded-xl border bg-primary/5 p-4">
					<p class="text-xs font-medium text-primary">Jumlah Batch</p>
					<p class="mt-1 text-2xl font-bold">{fmtNumber(data.data.summary.totalBatches)}</p>
				</div>
			</div>

			<div class="overflow-x-auto rounded-lg border">
				<table class="w-full text-sm">
					<thead class="bg-muted/50">
						<tr>
							<th class="px-4 py-3 text-left font-medium text-muted-foreground">Tanggal</th>
							<th class="px-4 py-3 text-left font-medium text-muted-foreground">Produk</th>
							<th class="px-4 py-3 text-right font-medium text-muted-foreground">Quantity (kg)</th>
							<th class="px-4 py-3 text-left font-medium text-muted-foreground">Batch</th>
						</tr>
					</thead>
					<tbody>
						{#each data.data.rows || [] as r}
							<tr class="border-t">
								<td class="px-4 py-2.5">{fmtDate(r.date)}</td>
								<td class="px-4 py-2.5 font-medium">{r.productName}</td>
								<td class="px-4 py-2.5 text-right">{fmtNumber(r.quantityKg)}</td>
								<td class="px-4 py-2.5">{r.batch}</td>
							</tr>
						{:else}
							<tr>
								<td colspan="4" class="px-4 py-8 text-center text-sm text-muted-foreground">Tidak ada data untuk periode ini</td>
							</tr>
						{/each}
						{#if (data.data.rows || []).length > 0}
							<tr class="border-t bg-muted/30 font-semibold">
								<td class="px-4 py-2.5" colspan="2">Total</td>
								<td class="px-4 py-2.5 text-right">{fmtNumber(data.data.totalRow.totalKg)} kg</td>
								<td class="px-4 py-2.5">{fmtNumber(data.data.totalRow.totalBatches)} batch</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>

			{#if data.data.pagination && data.data.pagination.totalPages > 1}
				<div class="flex items-center justify-center gap-1.5 mt-4">
					<button onclick={() => goPage(1)} disabled={data.data.pagination.page === 1} class="rounded border px-2 py-1 text-xs disabled:opacity-50">««</button>
					<button onclick={() => goPage(data.data.pagination.page - 1)} disabled={data.data.pagination.page === 1} class="rounded border px-2 py-1 text-xs disabled:opacity-50">«</button>
					{#each Array(data.data.pagination.totalPages).map((_, i) => i + 1) as p}
						<button onclick={() => goPage(p)} class="rounded w-8 h-8 text-xs font-medium {data.data.pagination.page === p ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/50'}">{p}</button>
					{/each}
					<button onclick={() => goPage(data.data.pagination.page + 1)} disabled={data.data.pagination.page === data.data.pagination.totalPages} class="rounded border px-2 py-1 text-xs disabled:opacity-50">»</button>
					<button onclick={() => goPage(data.data.pagination.totalPages)} disabled={data.data.pagination.page === data.data.pagination.totalPages} class="rounded border px-2 py-1 text-xs disabled:opacity-50">»»</button>
				</div>
			{/if}
		{/if}
	{/if}
</div>

<!-- Modal: Pilih Rentang Tanggal (Kustom) -->
<Dialog
	open={showCustomModal}
	onOpenChange={(open) => {
		if (!open) closeCustomModal();
	}}
>
	<DialogContent class="sm:max-w-[520px]">
		<DialogHeader>
			<DialogTitle>Pilih Rentang Tanggal</DialogTitle>
			<DialogDescription>Pilih rentang tanggal untuk filter laporan kustom.</DialogDescription>
		</DialogHeader>
		<div class="grid gap-4 py-2">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<label class="grid gap-1.5">
					<span class="text-sm font-medium">Dari</span>
					<input
						bind:this={customInputStart}
						type="date"
						bind:value={modalStart}
						class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
					/>
				</label>
				<label class="grid gap-1.5">
					<span class="text-sm font-medium">Sampai</span>
					<input
						type="date"
						bind:value={modalEnd}
						class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
					/>
				</label>
			</div>
			{#if modalError}
				<p class="text-sm font-medium text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2" role="alert">{modalError}</p>
			{/if}
		</div>
		<DialogFooter class="gap-2 sm:gap-2">
			<Button type="button" variant="outline" onclick={closeCustomModal}>Batal</Button>
			<Button type="button" onclick={applyCustom}>Terapkan</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
