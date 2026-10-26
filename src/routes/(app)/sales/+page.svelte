<script lang="ts">
	import { page } from '$app/stores';
	import { goto, afterNavigate, invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog';
	import { Search, Plus, Loader2, Check, Trash2, Eye, Receipt, TrendingUp, FileText, Scale, X, FileDown, User, Package, Calendar } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';

	let { data } = $props();

	// --- Search & Filters ---
	let searchQuery = $state($page.url.searchParams.get('search') || '');
	let statusFilter = $state($page.url.searchParams.get('status') || 'all');
	let searchRef: HTMLInputElement | undefined;
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	afterNavigate(() => { searchRef?.focus(); });

	function handleSearch() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			const url = new URL($page.url);
			if (searchQuery) url.searchParams.set('search', searchQuery);
			else url.searchParams.delete('search');
			url.searchParams.set('page', '1');
			goto(url.toString(), { replaceState: true });
		}, 300);
	}

	function handleStatusFilter(e: Event) {
		const url = new URL($page.url);
		const v = (e.target as HTMLSelectElement).value;
		if (v && v !== 'all') url.searchParams.set('status', v);
		else url.searchParams.delete('status');
		url.searchParams.set('page', '1');
		goto(url.toString(), { replaceState: true });
	}

	// --- Create Sale Modal ---
	let showCreateModal = $state(false);
	let buyerName = $state('');
	let sackWeights = $state<number[]>([]);
	let currentSackInput = $state('');
	let productId = $state('');
	let taraPerSack = $state(2);
	let pricePerKg = $state(0);
	let kuliFeePerSack = $state(3000);
	let saleDate = $state(new Date().toISOString().slice(0, 10));
	let submitting = $state(false);

	function addSackWeightFromText(text: string) {
		// Normalisasikan: hanya pecah berdasarkan spasi, newline, atau tab
		const parts = text.trim().split(/[\s\r\n\t]+/).filter(Boolean);
		for (const part of parts) {
			// Konversikan desimal koma menjadi desimal titik (contoh: 10,9 -> 10.9)
			const clean = part.replace(/,/g, '.');
			const num = Number(clean);
			if (!isNaN(num) && num > 0) {
				sackWeights.push(num);
			}
		}
	}

	function handleSackInputKeydown(e: KeyboardEvent) {
		if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') {
			e.preventDefault();
			if (currentSackInput.trim()) {
				addSackWeightFromText(currentSackInput);
				currentSackInput = '';
			}
		} else if (e.key === 'Backspace' && !currentSackInput && sackWeights.length > 0) {
			sackWeights.pop();
		}
	}

	function handleSackInputChange(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		// Jika mengetik atau mem-paste yang mengandung spasi atau enter/newline
		if (val.includes(' ') || val.includes('\n') || val.includes('\t')) {
			addSackWeightFromText(val);
			currentSackInput = '';
		}
	}

	function removeSack(index: number) {
		sackWeights.splice(index, 1);
	}

	function onProductChange(e: Event) {
		const id = (e.target as HTMLSelectElement).value;
		productId = id;
		const p = data.products.find((prod: any) => prod.id === id);
		if (p) pricePerKg = Number(p.price || 0);
	}

	function openCreateModal() {
		buyerName = '';
		sackWeights = [];
		currentSackInput = '';
		productId = data.products.length > 0 ? data.products[0].id : '';
		taraPerSack = 2;
		pricePerKg = data.products.length > 0 ? Number(data.products[0].price || 0) : 0;
		kuliFeePerSack = 3000;
		saleDate = new Date().toISOString().slice(0, 10);
		showCreateModal = true;
	}

	function clearCalculator() {
		sackWeights = [];
		currentSackInput = '';
		const p = data.products.find((prod: any) => prod.id === productId);
		pricePerKg = p ? Number(p.price || 0) : (data.products.length > 0 ? Number(data.products[0].price || 0) : 0);
		kuliFeePerSack = 3000;
	}

	// --- Live Auto-Calculation (no button needed) ---
	let grossWeight = $derived(sackWeights.reduce((s, w) => s + (w || 0), 0));
	let sackCount = $derived(sackWeights.length);
	let totalTara = $derived(sackCount * taraPerSack);
	let netWeight = $derived(Math.round((grossWeight - totalTara) * 100) / 100);
	let totalCost = $derived(Math.round(netWeight * pricePerKg * 100) / 100);
	let kuliFee = $derived(Math.round(sackCount * kuliFeePerSack * 100) / 100);
	let totalPayment = $derived(Math.round((totalCost - kuliFee) * 100) / 100);
	let isNetWeightValid = $derived(netWeight > 0);

	// --- Confirm / Delete ---
	let confirmTargetId = $state<string | null>(null);
	let confirmTargetInfo = $state<{ saleNumber: string; buyerName: string; totalPayment: string } | null>(null);
	let deleteTargetId = $state<string | null>(null);

	function openConfirmDialog(item: any) {
		confirmTargetId = item.id;
		confirmTargetInfo = {
			saleNumber: item.sale_number || '',
			buyerName: item.buyer_name || '',
			totalPayment: item.total_payment || '0'
		};
	}

	// --- Formatters ---
	function fmtCurrency(val: string | number) {
		return 'Rp ' + Number(val).toLocaleString('id-ID');
	}
	function fmtDate(d: string | Date | null) {
		if (!d) return '-';
		return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
	}
	function fmtWeight(val: string | number) {
		return Number(val).toLocaleString('id-ID', { minimumFractionDigits: 2 }) + ' kg';
	}
</script>

<svelte:head>
	<title>Timbangan Tepung — CV TapioLeaf</title>
</svelte:head>

<div class="space-y-6">
	<!-- Toolbar (Paling Atas) -->
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="space-y-0.5">
			<h1 class="text-xl font-bold md:text-2xl flex items-center gap-2">
				<Scale class="text-primary" size={26} /> Timbangan Tepung
			</h1>
			<p class="text-xs text-muted-foreground">Pencatatan timbangan per karung & perhitungan otomatis nota penjualan tepung</p>
		</div>
		<div class="flex items-center gap-2">
			<a
				href="/api/sales/report?status={statusFilter}&search={encodeURIComponent(searchQuery)}"
				target="_blank"
				rel="noreferrer"
			>
				<Button variant="outline" size="sm" class="gap-1.5 shadow-sm">
					<FileDown size={16} /> Rekap PDF
				</Button>
			</a>
			<Button onclick={openCreateModal} size="sm" class="shadow-sm"><Plus size={16} class="mr-1" /> Timbang Karung Baru</Button>
		</div>
	</div>

	<!-- Summary Cards -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-xl border bg-primary/5 p-4 shadow-sm">
			<div class="flex items-center gap-2 text-xs font-medium text-primary"><TrendingUp size={14} /> Pendapatan Bulan Ini</div>
			<p class="mt-1 text-2xl font-bold text-primary">{fmtCurrency(data.summary.monthlyRevenue)}</p>
			<p class="text-xs text-primary/70">{data.summary.monthlyCount} transaksi</p>
		</div>
		<div class="rounded-xl border bg-info/10 p-4 shadow-sm">
			<div class="flex items-center gap-2 text-xs font-medium text-info"><Scale size={14} /> Berat Terjual</div>
			<p class="mt-1 text-2xl font-bold text-info">{fmtWeight(data.summary.monthlyWeight)}</p>
			<p class="text-xs text-info/70">bulan ini</p>
		</div>
		<div class="rounded-xl border bg-warning/10 p-4 shadow-sm">
			<div class="flex items-center gap-2 text-xs font-medium text-warning"><FileText size={14} /> Draft</div>
			<p class="mt-1 text-2xl font-bold text-warning">{data.summary.draftCount}</p>
			<p class="text-xs text-warning/70">belum dikonfirmasi</p>
		</div>
		<div class="rounded-xl border bg-muted p-4 shadow-sm">
			<div class="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Receipt size={14} /> Total Transaksi</div>
			<p class="mt-1 text-2xl font-bold">{data.pagination.total}</p>
			<p class="text-xs text-muted-foreground">seluruh waktu</p>
		</div>
	</div>

	<div class="flex flex-wrap gap-2 md:gap-4">
		<div class="relative flex-1">
			<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
			<input type="text" bind:this={searchRef} placeholder="Cari pembeli atau nomor nota..." class="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring" bind:value={searchQuery} oninput={handleSearch} />
		</div>
		<select class="rounded-lg border bg-background px-3 py-2 text-sm" bind:value={statusFilter} onchange={handleStatusFilter}>
			<option value="all">Semua Status</option>
			<option value="draft">Draft</option>
			<option value="confirmed">Confirmed</option>
			<option value="cancelled">Cancelled</option>
		</select>
	</div>

	<!-- Table -->
	<div class="rounded-lg border">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-muted/50">
					<tr>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">No. Nota</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Pembeli</th>
						<th class="hidden md:table-cell px-4 py-3 text-left font-medium text-muted-foreground">Produk</th>
						<th class="hidden lg:table-cell px-4 py-3 text-right font-medium text-muted-foreground">Berat Bersih</th>
						<th class="px-4 py-3 text-right font-medium text-muted-foreground">Total Bayar</th>
						<th class="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
						<th class="hidden sm:table-cell px-4 py-3 text-center font-medium text-muted-foreground">Tanggal</th>
						<th class="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each data.items as item}
						<tr class="border-t transition-colors hover:bg-muted/30">
							<td class="px-4 py-3 font-mono text-xs">{item.sale_number || '-'}</td>
							<td class="px-4 py-3">
								<p class="font-medium">{item.buyer_name || '-'}</p>
								{#if item.buyer_type}
									<span class="text-[10px] text-muted-foreground">{item.buyer_type === 'umkm' ? 'UMKM/Retail' : 'Pengepul'}</span>
								{/if}
							</td>
							<td class="hidden md:table-cell px-4 py-3 text-muted-foreground">{item.product_name || '-'}</td>
							<td class="hidden lg:table-cell px-4 py-3 text-right">{fmtWeight(item.net_weight || 0)}</td>
							<td class="px-4 py-3 text-right font-medium">{fmtCurrency(item.total_payment || 0)}</td>
							<td class="px-4 py-3 text-center">
								{#if item.status === 'draft'}
									<span class="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">Draft</span>
								{:else if item.status === 'confirmed'}
									<span class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Confirmed</span>
								{:else}
									<span class="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">Cancelled</span>
								{/if}
							</td>
							<td class="hidden sm:table-cell px-4 py-3 text-center text-muted-foreground">{fmtDate(item.sale_date)}</td>
							<td class="px-4 py-3">
								<div class="flex items-center justify-center gap-1">
									<a href="/sales/{item.id}">
										<Button variant="ghost" size="sm" aria-label="Lihat detail"><Eye size={14} /></Button>
									</a>
									{#if item.status === 'draft'}
										<Button variant="ghost" size="sm" onclick={() => openConfirmDialog(item)} class="text-primary hover:text-primary" aria-label="Konfirmasi"><Check size={14} /></Button>
										<Button variant="ghost" size="sm" onclick={() => deleteTargetId = item.id} class="text-destructive hover:text-destructive" aria-label="Hapus"><Trash2 size={14} /></Button>
									{/if}
								</div>
							</td>
						</tr>
					{:else}
						<tr><td colspan="8" class="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada transaksi penjualan</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Pagination -->
	{#if data.pagination.totalPages > 1}
		<div class="flex items-center justify-center gap-2">
			{#each Array(data.pagination.totalPages) as _, i}
				<a href="?page={i + 1}" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm" class:bg-primary={data.pagination.page === i + 1} class:text-primary-foreground={data.pagination.page === i + 1}>{i + 1}</a>
			{/each}
		</div>
	{/if}
</div>

<!-- CREATE SALE MODAL -->
<Dialog open={showCreateModal} onOpenChange={(o) => { if (!o) showCreateModal = false; }}>
	<DialogContent class="!p-0 sm:!p-6 w-full max-w-[calc(100%-2rem)] sm:max-w-2xl overflow-hidden">
		<div class="flex max-h-[90dvh] overflow-hidden flex-col">
			<DialogHeader class="px-4 pt-4 pb-0 sm:px-0 sm:pt-0">
				<DialogTitle class="flex items-center gap-2">
					<Scale class="text-primary" size={20} /> Timbangan Tepung
				</DialogTitle>
				<DialogDescription>Hitung akumulasi timbangan karung tepung dan kalkulasi nota bayar otomatis</DialogDescription>
			</DialogHeader>
			<form method="post" action="?/create" use:enhance={() => {
				submitting = true;
				return async ({ result, update }) => {
					submitting = false;
					update();
					if (result.type === 'success') {
						toast.success('Transaksi berhasil dibuat');
						showCreateModal = false;
					} else if (result.type === 'failure') {
						const msg = (result.data as Record<string, unknown>)?.message as string | undefined;
						if (msg) toast.error(msg);
					}
				};
			}} class="flex min-h-0 flex-1 flex-col">
				<input type="hidden" name="sackWeights" value={JSON.stringify(sackWeights)} />
				<div class="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-0">
					<!-- Header Section: Buyer Info, Product, Date -->
					<div class="space-y-3 rounded-xl border bg-muted/20 p-3.5 sm:p-4">
						<div class="grid gap-3 sm:grid-cols-2">
							<div class="grid gap-1.5">
								<label for="buyerName" class="text-sm font-medium flex items-center gap-1.5">
									<User size={15} class="text-muted-foreground" /> Nama Pembeli <span class="text-destructive">*</span>
								</label>
								<Input
									id="buyerName"
									name="buyerName"
									type="text"
									bind:value={buyerName}
									required
									placeholder="Masukkan nama pembeli..."
									class="bg-background text-[15px]"
								/>
							</div>

							<div class="grid gap-1.5">
								<label for="saleDate" class="text-sm font-medium flex items-center gap-1.5">
									<Calendar size={15} class="text-muted-foreground" /> Tanggal Penjualan
								</label>
								<Input
									id="saleDate"
									name="saleDate"
									type="date"
									bind:value={saleDate}
									class="bg-background text-[15px]"
								/>
							</div>
						</div>

						<!-- Jenis Produk di bawah Nama Pembeli -->
						<div class="grid gap-1.5">
							<label for="productId" class="text-sm font-medium flex items-center gap-1.5">
								<Package size={15} class="text-muted-foreground" /> Jenis Produk
							</label>
							<div class="relative">
								<select
									id="productId"
									name="productId"
									class="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring"
									bind:value={productId}
									onchange={onProductChange}
								>
									{#each data.products as p}
										<option value={p.id}>{p.code ? `[${p.code}] ` : ''}{p.name} {p.price ? `— Rp ${Number(p.price).toLocaleString('id-ID')}/kg` : ''}</option>
									{/each}
								</select>
							</div>
							<p class="text-[11px] text-muted-foreground">Harga/kg akan otomatis disesuaikan sesuai produk yang dipilih.</p>
						</div>
					</div>

					<!-- Sack Weights (Chips style with comma separation) -->
					<div class="grid gap-2">
						<div class="flex items-center justify-between">
							<span id="sackSectionLabel" class="text-sm font-medium">Berat Per Karung (kg) *</span>
							{#if sackWeights.length > 0}
								<Button type="button" variant="outline" size="sm" onclick={clearCalculator}><Trash2 size={14} class="mr-1" /> Clear All</Button>
							{/if}
						</div>

						<!-- Chip container box -->
						<label
							for="sackWeightInput"
							class="flex min-h-[96px] w-full cursor-text flex-wrap items-center content-start gap-2.5 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-background/50 p-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
						>
							{#each sackWeights as w, i}
								<div class="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-base font-semibold text-foreground shadow-sm transition hover:bg-primary/15 animate-in fade-in zoom-in-95">
									<span>{w}</span>
									<button
										type="button"
										onclick={(e) => { e.stopPropagation(); removeSack(i); }}
										class="rounded-full p-0.5 text-muted-foreground hover:bg-background/80 hover:text-destructive focus:outline-none"
										aria-label="Hapus berat {w} kg"
									>
										<X size={15} />
									</button>
								</div>
							{/each}

							<input
								id="sackWeightInput"
								type="text"
								inputmode="decimal"
								placeholder={sackWeights.length === 0 ? "Masukkan berat karung, pisahkan dengan spasi (cth: 52 11 49.5)" : "Ketik berat lalu tekan Spasi..."}
								bind:value={currentSackInput}
								onkeydown={handleSackInputKeydown}
								oninput={handleSackInputChange}
								onblur={() => {
									if (currentSackInput.trim()) {
										addSackWeightFromText(currentSackInput);
										currentSackInput = '';
									}
								}}
								class="min-w-[180px] flex-1 bg-transparent py-1.5 px-1 text-base outline-none placeholder:text-muted-foreground/60"
							/>
						</label>
						<p class="text-xs text-muted-foreground">
							Masukkan berat karung, pisahkan dengan <strong>spasi</strong> (contoh: <strong>52 11 49.5</strong>) atau tekan Enter. Terhitung: <strong>{sackCount}</strong> karung.
						</p>
					</div>

					<!-- Config fields -->
					<div class="grid gap-4 sm:grid-cols-3">
						<div class="grid gap-2">
							<label for="taraPerSack" class="text-sm font-medium">Tara/Karung (kg)</label>
							<Input id="taraPerSack" name="taraPerSack" type="number" step="0.01" bind:value={taraPerSack} class="text-[16px]" inputmode="decimal" />
						</div>
						<div class="grid gap-2">
							<label for="pricePerKg" class="text-sm font-medium">Harga/Kg (Rp) *</label>
							<Input id="pricePerKg" name="pricePerKg" type="number" step="1" bind:value={pricePerKg} required class="text-[16px]" inputmode="numeric" />
						</div>
						<div class="grid gap-2">
							<label for="kuliFeePerSack" class="text-sm font-medium">Biaya Kuli/Karung (Rp)</label>
							<Input id="kuliFeePerSack" name="kuliFeePerSack" type="number" step="1" bind:value={kuliFeePerSack} class="text-[16px]" inputmode="numeric" />
						</div>
					</div>

<!-- Live Calculation Preview -->
				<div class="rounded-lg border bg-muted/30 p-4 space-y-2">
					<p class="text-sm font-semibold mb-2">Ringkasan Kalkulasi</p>
					<div class="grid gap-1 text-sm">
						<div class="flex justify-between"><span class="text-muted-foreground">Jumlah Karung</span><span class="font-medium">{sackCount}</span></div>
						<div class="flex justify-between"><span class="text-muted-foreground">Berat Kotor (Gross)</span><span class="font-medium">{grossWeight.toLocaleString('id-ID', { minimumFractionDigits: 2 })} kg</span></div>
						<div class="flex justify-between"><span class="text-muted-foreground">Tara Total ({sackCount} × {taraPerSack} kg)</span><span class="font-medium">-{(sackCount * taraPerSack).toLocaleString('id-ID', { minimumFractionDigits: 2 })} kg</span></div>
						<div class="flex justify-between border-t pt-1"><span class="text-muted-foreground">Berat Bersih (Net)</span><span class="font-bold {netWeight <= 0 ? 'text-destructive' : ''}">{netWeight.toLocaleString('id-ID', { minimumFractionDigits: 2 })} kg</span></div>
						{#if netWeight <= 0 && grossWeight > 0}
							<p class="text-destructive text-xs font-medium">⚠ Berat bersih harus lebih dari 0. Kurangi tara atau tambah berat karung.</p>
						{/if}
						<div class="flex justify-between mt-2"><span class="text-muted-foreground">Total Harga ({netWeight.toLocaleString('id-ID', { minimumFractionDigits: 2 })} × {fmtCurrency(pricePerKg)})</span><span class="font-medium">{fmtCurrency(totalCost)}</span></div>
						<div class="flex justify-between"><span class="text-muted-foreground">Biaya Kuli ({sackCount} × {fmtCurrency(kuliFeePerSack)})</span><span class="font-medium text-destructive">-{fmtCurrency(kuliFee)}</span></div>
						<div class="flex justify-between border-t pt-1"><span class="font-semibold">Total Bayar</span><span class="font-bold text-lg text-primary">{fmtCurrency(totalPayment)}</span></div>
					</div>
				</div>
				</div>

				<!-- Footer Actions -->
				<div class="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t bg-popover px-4 py-4 sm:px-0 sm:pb-0 sm:pt-4">
					<Button type="button" variant="outline" onclick={() => showCreateModal = false}>Batal</Button>
					<input type="hidden" name="status" value="draft" />
					<Button type="submit" disabled={submitting || !buyerName.trim() || !isNetWeightValid}>
						{#if submitting}<Loader2 size={16} class="mr-1 animate-spin" />{/if}
						Simpan
					</Button>
				</div>
			</form>
		</div>
	</DialogContent>
</Dialog>

<!-- CONFIRM DIALOG -->
<Dialog open={confirmTargetId !== null} onOpenChange={(o) => { if (!o) confirmTargetId = null; }}>
	<DialogContent class="sm:max-w-sm">
		<DialogHeader>
			<DialogTitle>Konfirmasi Transaksi?</DialogTitle>
			<DialogDescription>
				Transaksi <strong>{confirmTargetInfo?.saleNumber}</strong> untuk <strong>{confirmTargetInfo?.buyerName}</strong> senilai <strong>{fmtCurrency(confirmTargetInfo?.totalPayment || 0)}</strong> akan dikonfirmasi. Stok gudang akan otomatis berkurang. Tindakan ini tidak dapat dibatalkan.
			</DialogDescription>
		</DialogHeader>
		<DialogFooter class="gap-2">
			<Button variant="outline" onclick={() => confirmTargetId = null}>Batal</Button>
			<form method="post" action="?/confirm" use:enhance={() => {
				return async ({ result, update }) => {
					update();
					if (result.type === 'success') {
						confirmTargetId = null;
						toast.success('Transaksi berhasil dikonfirmasi');
						await invalidateAll();
					} else if (result.type === 'failure') {
						const msg = (result.data as any)?.message;
						if (msg) toast.error(msg);
					}
				};
			}}>
				<input type="hidden" name="saleId" value={confirmTargetId ?? ''} />
				<Button type="submit"><Check size={14} class="mr-1" /> Konfirmasi</Button>
			</form>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- DELETE DIALOG -->
<Dialog open={deleteTargetId !== null} onOpenChange={(o) => { if (!o) deleteTargetId = null; }}>
	<DialogContent class="sm:max-w-sm">
		<DialogHeader>
			<DialogTitle>Hapus Transaksi Draft?</DialogTitle>
			<DialogDescription>Transaksi draft ini akan dihapus permanen.</DialogDescription>
		</DialogHeader>
		<DialogFooter class="gap-2">
			<Button variant="outline" onclick={() => deleteTargetId = null}>Batal</Button>
			<form method="post" action="?/delete" use:enhance={() => {
				return async ({ result, update }) => {
					update();
					if (result.type === 'success') {
						deleteTargetId = null;
						toast.success('Transaksi dihapus');
						await invalidateAll();
					} else if (result.type === 'failure') {
						const msg = (result.data as any)?.message;
						if (msg) toast.error(msg);
					}
				};
			}}>
				<input type="hidden" name="saleId" value={deleteTargetId ?? ''} />
				<Button variant="destructive" type="submit">Hapus</Button>
			</form>
		</DialogFooter>
	</DialogContent>
</Dialog>
