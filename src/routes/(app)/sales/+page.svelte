<script lang="ts">
	import { page } from '$app/stores';
	import { goto, afterNavigate, invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogFooter
	} from '$lib/components/ui/dialog';
	import {
		Search,
		Plus,
		Loader2,
		Check,
		Trash2,
		Eye,
		Pencil,
		Receipt,
		TrendingUp,
		FileText,
		Scale,
		X,
		FileDown,
		User,
		Package,
		Calendar
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';

	let { data } = $props();

	// --- Search & Filters ---
	let searchQuery = $state($page.url.searchParams.get('search') || '');
	let statusFilter = $state($page.url.searchParams.get('status') || 'all');
	let searchRef: HTMLInputElement | undefined;
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	afterNavigate(() => {
		searchRef?.focus();
	});

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
	let weigherName = $state('');
	let weigherAddress = $state('');
	let weigherPhone = $state('');
	let buyerName = $state('');
	let buyerPhone = $state('');
	let sackWeightsText = $state('');
	let sackWeights = $state<number[]>([]);
	let pricePerKg = $state(6000);
	let kuliFeePerSack = $state(3500);
	let submitting = $state(false);

	function parseSackWeights(text: string): number[] {
		const parts = text
			.trim()
			.split(/[\s\r\n\t]+/)
			.filter(Boolean);
		const result: number[] = [];
		for (const part of parts) {
			const clean = part.replace(/,/g, '.');
			const num = Number(clean);
			if (!isNaN(num) && num > 0) {
				result.push(num);
			}
		}
		return result;
	}

	function hitungKarung() {
		sackWeights = parseSackWeights(sackWeightsText);
	}

	function handleSackTextInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		// Hanya izinkan angka (0-9), titik (.), koma (,), spasi, dan baris baru (\n)
		const sanitized = target.value.replace(/[^0-9.,\s]/g, '');
		if (target.value !== sanitized) {
			target.value = sanitized;
		}
		sackWeightsText = sanitized;
		hitungKarung();
	}

	function handleSackTextKeydown(e: KeyboardEvent) {
		// Izinkan tombol kontrol/navigasi: Backspace, Delete, Arrow, Tab, Enter, dll
		const allowedKeys = [
			'Backspace',
			'Delete',
			'Tab',
			'Enter',
			'ArrowLeft',
			'ArrowRight',
			'ArrowUp',
			'ArrowDown',
			'Home',
			'End'
		];
		if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
			return;
		}
		// Hanya izinkan angka, spasi, titik, koma
		if (!/^[0-9., ]$/.test(e.key)) {
			e.preventDefault();
		}
	}

	function bersihkanSemua() {
		sackWeightsText = '';
		sackWeights = [];
	}

	let activeFlow = $state<'weighing' | 'sale'>('weighing');

	function openWeighingModal() {
		activeFlow = 'weighing';
		editingSaleId = null;
		weigherName = '';
		weigherAddress = '';
		weigherPhone = '';
		buyerName = '';
		buyerPhone = '';
		sackWeightsText = '';
		sackWeights = [];
		const defaultPrice =
			data.products.length > 0 && Number(data.products[0].price) > 0
				? Number(data.products[0].price)
				: 6000;
		pricePerKg = defaultPrice;
		kuliFeePerSack = 3500;
		showCreateModal = true;
	}

	function openSaleModal() {
		activeFlow = 'sale';
		editingSaleId = null;
		weigherName = '';
		weigherAddress = '';
		weigherPhone = '';
		buyerName = '';
		buyerPhone = '';
		sackWeightsText = '';
		sackWeights = [];
		const defaultPrice =
			data.products.length > 0 && Number(data.products[0].price) > 0
				? Number(data.products[0].price)
				: 6000;
		pricePerKg = defaultPrice;
		kuliFeePerSack = 3500;
		showCreateModal = true;
	}

	function loadFromWeighedItem(item: any) {
		selectedSourceId = item.id;
		weigherName = item.weigher_name || '';
		weigherPhone = item.weigher_phone || '';
		weigherAddress = item.weigher_address || '';
		// Muat karung dari transaksi tersebut
		fetch(`/api/sales/${item.id}`)
			.then((res) => res.json())
			.then((json) => {
				if (json.items && Array.isArray(json.items)) {
					const weights = json.items.map((i: any) => Number(i.sack_weight));
					sackWeights = weights;
					sackWeightsText = weights.join(' ');
				}
			})
			.catch(() => {});
	}

	let selectedSourceId = $state<string>('');
	let editingSaleId = $state<string | null>(null);

	async function openEditModal(item: any) {
		activeFlow = item.buyer_name && item.buyer_name !== item.weigher_name ? 'sale' : 'weighing';
		editingSaleId = item.id;
		selectedSourceId = '';
		weigherName = item.weigher_name || '';
		weigherAddress = item.weigher_address || '';
		weigherPhone = item.weigher_phone || '';
		buyerName = item.buyer_name || '';
		buyerPhone = item.buyer_phone || '';
		pricePerKg = Number(item.price_per_kg) || 6000;
		kuliFeePerSack = Number(item.kuli_fee_per_sack) || 3500;
		
		// Ambil data items karung dari API jika belum ada
		try {
			const res = await fetch(`/api/sales/${item.id}`);
			if (res.ok) {
				const json = await res.json();
				if (json.items && Array.isArray(json.items)) {
					const weights = json.items.map((i: any) => Number(i.sack_weight));
					sackWeights = weights;
					sackWeightsText = weights.join(' ');
				}
			} else {
				// Fallback jika tidak ada API
				sackWeights = [];
				sackWeightsText = '';
			}
		} catch {
			sackWeights = [];
			sackWeightsText = '';
		}

		showCreateModal = true;
	}

	// --- Live Calculation (Gambar 2 Business Flow) ---
	let grossWeight = $derived(sackWeights.reduce((s, w) => s + (w || 0), 0));
	let sackCount = $derived(sackWeights.length);
	// Rumus: Potongan (1/2 jumlah karung, dibulatkan ke atas bila ganjil)
	let totalTara = $derived(sackCount > 0 ? Math.ceil(sackCount / 2) : 0);
	let netWeight = $derived(Math.max(0, Math.round((grossWeight - totalTara) * 100) / 100));
	let totalCost = $derived(Math.round(netWeight * pricePerKg * 100) / 100);
	let kuliFee = $derived(Math.round(sackCount * kuliFeePerSack * 100) / 100);
	let totalPayment = $derived(Math.round((totalCost - kuliFee) * 100) / 100);
	let isNetWeightValid = $derived(netWeight > 0);

	// --- Confirm / Delete ---
	let confirmTargetId = $state<string | null>(null);
	let confirmTargetInfo = $state<{
		saleNumber: string;
		buyerName: string;
		totalPayment: string;
	} | null>(null);
	let deleteTargetId = $state<string | null>(null);

	function openConfirmDialog(item: any) {
		confirmTargetId = item.id;
		confirmTargetInfo = {
			saleNumber: item.sale_number || '',
			buyerName: item.weigher_name || item.buyer_name || 'Penimbangan',
			totalPayment: item.total_payment || '0'
		};
	}

	// --- Formatters ---
	function fmtCurrency(val: string | number) {
		return 'Rp ' + Number(val).toLocaleString('id-ID');
	}
	function fmtDate(d: string | Date | null) {
		if (!d) return '-';
		return new Date(d).toLocaleDateString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
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
			<h1 class="flex items-center gap-2 text-xl font-bold md:text-2xl">
				<Scale class="text-primary" size={26} /> Timbangan Tepung
			</h1>
			<p class="text-xs text-muted-foreground">
				Pencatatan timbangan per karung & perhitungan otomatis nota penjualan tepung
			</p>
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
			<Button onclick={openWeighingModal} size="sm" class="shadow-sm">
				<Scale size={16} class="mr-1" /> Timbangan Karung
			</Button>
			<Button onclick={openSaleModal} variant="outline" size="sm" class="border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 shadow-sm">
				<Receipt size={16} class="mr-1" /> 2. Buat Nota Penjualan
			</Button>
		</div>
	</div>

	<!-- Summary Cards -->
	<div class="flex flex-wrap gap-4">
		<div class="min-w-[180px] sm:w-56 rounded-xl border bg-warning/10 p-3.5 shadow-sm">
			<div class="flex items-center gap-1.5 text-xs font-medium text-warning">
				<FileText size={14} /> Draft
			</div>
			<p class="mt-1 text-2xl font-bold text-warning">{data.summary.draftCount}</p>
			<p class="text-[11px] text-warning/70">belum dikonfirmasi</p>
		</div>
		<div class="min-w-[180px] sm:w-56 rounded-xl border bg-muted/60 p-3.5 shadow-sm">
			<div class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
				<Receipt size={14} /> Total Transaksi
			</div>
			<p class="mt-1 text-2xl font-bold">{data.pagination.total}</p>
			<p class="text-[11px] text-muted-foreground">seluruh waktu</p>
		</div>
	</div>

	<div class="flex flex-wrap gap-2 md:gap-4">
		<div class="relative flex-1">
			<Search size={16} class="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
			<input
				type="text"
				bind:this={searchRef}
				placeholder="Cari nama penimbang atau nomor nota..."
				class="w-full rounded-lg border bg-background py-2 pr-4 pl-10 text-sm outline-none focus:ring-2 focus:ring-ring"
				bind:value={searchQuery}
				oninput={handleSearch}
			/>
		</div>
		<select
			class="rounded-lg border bg-background px-3 py-2 text-sm"
			bind:value={statusFilter}
			onchange={handleStatusFilter}
		>
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
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Penimbang</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Pembeli</th>
						<th class="hidden px-4 py-3 text-right font-medium text-muted-foreground lg:table-cell"
							>Berat Bersih</th
						>
						<th class="px-4 py-3 text-right font-medium text-muted-foreground">Total Bayar</th>
						<th class="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
						<th class="hidden px-4 py-3 text-center font-medium text-muted-foreground sm:table-cell"
							>Tanggal</th
						>
						<th class="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each data.items as item}
						<tr class="border-t transition-colors hover:bg-muted/30">
							<td class="px-4 py-3 font-mono text-xs">{item.sale_number || '-'}</td>
							<td class="px-4 py-3">
								<p class="font-medium">{item.weigher_name || '-'}</p>
								{#if item.weigher_phone}
									<p class="text-[11px] text-muted-foreground">{item.weigher_phone}</p>
								{/if}
							</td>
							<td class="px-4 py-3">
								<p class="font-medium text-foreground">{item.buyer_name && item.buyer_name !== item.weigher_name ? item.buyer_name : (item.buyer_phone ? 'Pembeli' : '-')}</p>
								{#if item.buyer_phone}
									<p class="text-[11px] text-muted-foreground">{item.buyer_phone}</p>
								{/if}
							</td>
							<td class="hidden px-4 py-3 text-right lg:table-cell"
								>{fmtWeight(item.net_weight || 0)}</td
							>
							<td class="px-4 py-3 text-right font-medium"
								>{fmtCurrency(item.total_payment || 0)}</td
							>
							<td class="px-4 py-3 text-center">
								{#if item.status === 'draft'}
									<span
										class="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning"
										>Draft</span
									>
								{:else if item.status === 'confirmed'}
									<span
										class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
										>Confirmed</span
									>
								{:else}
									<span
										class="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
										>Cancelled</span
									>
								{/if}
							</td>
							<td class="hidden px-4 py-3 text-center text-muted-foreground sm:table-cell"
								>{fmtDate(item.sale_date)}</td
							>
							<td class="px-4 py-3">
								<div class="flex items-center justify-center gap-1">
									<a
										href="/api/sales/{item.id}/pdf"
										target="_blank"
										rel="noreferrer"
										aria-label="Cetak Nota PDF"
										title="Cetak Nota PDF"
									>
										<Button
											variant="ghost"
											size="sm"
											class="text-primary hover:text-primary"
										>
											<FileDown size={14} />
										</Button>
									</a>
									<Button
										variant="ghost"
										size="sm"
										onclick={() => openEditModal(item)}
										aria-label="Edit Transaksi"
										title="Edit Data"
									>
										<Pencil size={14} />
									</Button>
									{#if item.status === 'draft'}
										<Button
											variant="ghost"
											size="sm"
											onclick={() => openConfirmDialog(item)}
											class="text-primary hover:text-primary"
											aria-label="Konfirmasi"
											title="Konfirmasi Transaksi"><Check size={14} /></Button
										>
									{/if}
									<Button
										variant="ghost"
										size="sm"
										onclick={() => (deleteTargetId = item.id)}
										class="text-destructive hover:text-destructive"
										aria-label="Hapus"
										title="Hapus Transaksi"><Trash2 size={14} /></Button
									>
								</div>
							</td>
						</tr>
					{:else}
						<tr
							><td colspan="8" class="px-4 py-8 text-center text-sm text-muted-foreground"
								>Belum ada transaksi penjualan</td
							></tr
						>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Pagination -->
	{#if data.pagination.totalPages > 1}
		<div class="flex items-center justify-center gap-2">
			{#each Array(data.pagination.totalPages) as _, i}
				<a
					href="?page={i + 1}"
					class="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm"
					class:bg-primary={data.pagination.page === i + 1}
					class:text-primary-foreground={data.pagination.page === i + 1}>{i + 1}</a
				>
			{/each}
		</div>
	{/if}
</div>

<!-- CREATE SALE MODAL (Kalkulator Timbangan Karung) -->
<Dialog
	open={showCreateModal}
	onOpenChange={(o) => {
		if (!o) showCreateModal = false;
	}}
>
	<DialogContent
		class="w-full max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl border-border bg-card !p-0 font-sans shadow-2xl sm:max-w-xl sm:!p-6"
	>
		<div class="flex max-h-[92dvh] flex-col overflow-hidden">
			<!-- Header bergaya aplikasi CV TapioLeaf -->
			<div
				class="flex items-center justify-between border-b border-border/70 bg-muted/20 px-5 py-4"
			>
				<div>
					<h2 class="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
						{#if activeFlow === 'weighing'}
							<Scale class="shrink-0 text-primary" size={22} />
							{editingSaleId ? 'Edit Timbangan Karung' : 'Timbangan Karung'}
						{:else}
							<Receipt class="shrink-0 text-primary" size={22} />
							{editingSaleId ? 'Edit Nota Penjualan' : 'Tahap 2: Buat Nota Penjualan Mitra'}
						{/if}
					</h2>
					<p class="mt-0.5 text-xs font-medium text-muted-foreground">
						{#if activeFlow === 'weighing'}
							Rekap berat karung &rarr; hitung berat bersih &rarr; otomatis masuk ke stok gudang
						{:else}
							Pilih hasil timbangan / isi karung &rarr; hitung harga &amp; ongkos kuli &rarr; nota penjualan
						{/if}
					</p>
				</div>
				<span
					class="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
				>
					{new Date().toLocaleDateString('id-ID', {
						day: '2-digit',
						month: 'short',
						year: 'numeric'
					})}
				</span>
			</div>

			<form
				method="post"
				action={editingSaleId ? '?/update' : '?/create'}
				use:enhance={() => {
					submitting = true;
					return async ({ result, update }) => {
						submitting = false;
						update();
						if (result.type === 'success') {
							toast.success(
								editingSaleId
									? 'Data timbangan berhasil diperbarui'
									: 'Transaksi timbangan berhasil disimpan'
							);
							showCreateModal = false;
							editingSaleId = null;
						} else if (result.type === 'failure') {
							const msg = (result.data as Record<string, unknown>)?.message as string | undefined;
							if (msg) toast.error(msg);
						}
					};
				}}
				class="flex min-h-0 flex-1 flex-col"
			>
				<input type="hidden" name="entryType" value={activeFlow} />
				{#if editingSaleId}
					<input type="hidden" name="saleId" value={editingSaleId} />
				{/if}
				<input type="hidden" name="sackWeights" value={JSON.stringify(sackWeights)} />
				<input type="hidden" name="taraPerSack" value={totalTara} />
				<input type="hidden" name="totalTaraCalculated" value={totalTara} />
				<input type="hidden" name="status" value="confirmed" />

				<div class="flex-1 space-y-4 overflow-y-auto px-5 py-4">
					{#if activeFlow === 'sale' && data.items.filter(i => i.status === 'confirmed').length > 0 && !editingSaleId}
						<!-- Pilihan ambil dari timbangan yang sudah ada -->
						<div class="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2">
							<p class="text-xs font-semibold text-primary flex items-center gap-1.5">
								<Scale size={14} /> Ambil Data dari Penimbangan yang Tersimpan (Opsional):
							</p>
							<select
								class="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
								value={selectedSourceId}
								onchange={(e) => {
									const val = (e.target as HTMLSelectElement).value;
									if (val) {
										const found = data.items.find(i => i.id === val);
										if (found) loadFromWeighedItem(found);
									}
								}}
							>
								<option value="">-- Input manual / tidak memilih riwayat timbang --</option>
								{#each data.items.filter(i => i.status === 'confirmed') as itm}
									<option value={itm.id}>
										{itm.sale_number} - {itm.weigher_name || 'Petugas'} ({fmtWeight(itm.net_weight || 0)})
									</option>
								{/each}
							</select>
						</div>
					{/if}

					<!-- Informasi Penimbang (untuk Button 1) ATAU Informasi Pembeli (untuk Button 2) -->
					{#if activeFlow === 'weighing'}
						<div class="space-y-4 rounded-xl border border-border/80 bg-muted/15 p-4">
							<div class="space-y-3">
								<p class="flex items-center gap-2 text-sm font-bold text-foreground">
									<User size={16} class="text-primary" />
									Identitas Penimbang
								</p>

								<div class="grid gap-3 sm:grid-cols-2">
									<div class="space-y-1">
										<label for="weigherName" class="block text-xs font-medium text-muted-foreground">
											Nama Penimbang <span class="text-destructive">*</span>
										</label>
										<Input
											id="weigherName"
											name="weigherName"
											type="text"
											required
											placeholder="Contoh: Budi Santoso"
											bind:value={weigherName}
											class="h-9 bg-background text-sm"
										/>
									</div>

									<div class="space-y-1">
										<label for="weigherPhone" class="block text-xs font-medium text-muted-foreground">
											Nomor HP Penimbang
										</label>
										<Input
											id="weigherPhone"
											name="weigherPhone"
											type="tel"
											inputmode="numeric"
											pattern="[0-9]*"
											placeholder="Contoh: 08123456789"
											bind:value={weigherPhone}
											oninput={(e) => {
												weigherPhone = (e.currentTarget.value || '').replace(/\D/g, '');
											}}
											class="h-9 bg-background text-sm"
										/>
									</div>
								</div>

								<div class="space-y-1">
									<label for="weigherAddress" class="block text-xs font-medium text-muted-foreground">
										Alamat / Catatan Penimbang
									</label>
									<Input
										id="weigherAddress"
										name="weigherAddress"
										type="text"
										placeholder="Contoh: Gudang Barat / Shift Pagi"
										bind:value={weigherAddress}
										class="h-9 bg-background text-sm"
									/>
								</div>
							</div>
						</div>
					{:else}
						<div class="space-y-4 rounded-xl border border-border/80 bg-muted/15 p-4">
							<div class="space-y-3">
								<p class="flex items-center gap-2 text-sm font-bold text-foreground">
									<User size={16} class="text-primary" />
									Identitas Pembeli (Mitra)
								</p>

								<div class="grid gap-3 sm:grid-cols-2">
									<div class="space-y-1">
										<label for="buyerName" class="block text-xs font-medium text-muted-foreground">
											Nama Pembeli <span class="text-destructive">*</span>
										</label>
										<Input
											id="buyerName"
											name="buyerName"
											type="text"
											required
											placeholder="Contoh: Toko Berkah / Pak Joko"
											bind:value={buyerName}
											class="h-9 bg-background text-sm"
										/>
									</div>

									<div class="space-y-1">
										<label for="buyerPhone" class="block text-xs font-medium text-muted-foreground">
											Nomor HP Pembeli
										</label>
										<Input
											id="buyerPhone"
											name="buyerPhone"
											type="tel"
											inputmode="numeric"
											pattern="[0-9]*"
											placeholder="Contoh: 08987654321"
											bind:value={buyerPhone}
											oninput={(e) => {
												buyerPhone = (e.currentTarget.value || '').replace(/\D/g, '');
											}}
											class="h-9 bg-background text-sm"
										/>
									</div>
								</div>

								{#if weigherName}
									<div class="rounded-lg bg-background/80 p-2.5 text-xs text-muted-foreground border">
										<span class="font-semibold text-foreground">Asal Penimbang:</span> {weigherName} {weigherPhone ? `(${weigherPhone})` : ''}
										<input type="hidden" name="weigherName" value={weigherName} />
										<input type="hidden" name="weigherPhone" value={weigherPhone} />
										<input type="hidden" name="weigherAddress" value={weigherAddress} />
									</div>
								{/if}
							</div>
						</div>
					{/if}

					<!-- 1 · Berat Tiap Karung (kg) -->
					<div class="space-y-3 rounded-xl border border-border/80 bg-muted/15 p-4">
						<div class="flex items-center justify-between">
							<p class="flex items-center gap-2 text-sm font-bold text-foreground">
								<span
									class="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary"
									>1</span
								>
								Berat Tiap Karung (kg)
							</p>
							{#if sackCount > 0}
								<span
									class="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary"
								>
									{sackCount} karung terhitung
								</span>
							{/if}
						</div>

						<textarea
							id="sackWeightsText"
							rows={3}
							placeholder="Masukkan berat karung per baris atau spasi (contoh: 100 100 100)"
							bind:value={sackWeightsText}
							oninput={handleSackTextInput}
							onkeydown={handleSackTextKeydown}
							inputmode="decimal"
							class="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm leading-relaxed font-medium text-foreground shadow-2xs transition outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
						></textarea>

						<div class="flex items-center gap-2">
							<Button
								type="button"
								size="sm"
								onclick={hitungKarung}
								class="gap-1.5 font-medium shadow-xs"
							>
								Hitung
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onclick={bersihkanSemua}
								class="font-medium shadow-xs"
							>
								Bersihkan Semua
							</Button>
						</div>
					</div>

					<!-- 2 · Ringkasan Berat -->
					<div
						class="space-y-2.5 rounded-xl border border-border/80 bg-muted/15 p-4 text-xs sm:text-sm"
					>
						<p class="mb-2 flex items-center gap-2 font-bold text-foreground">
							<span
								class="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary"
								>2</span
							>
							Ringkasan Berat Bersih
						</p>

						<div class="flex items-center justify-between border-b border-border/50 py-1.5">
							<span class="text-muted-foreground">Jumlah Karung</span>
							<span class="font-bold text-foreground">{sackCount}</span>
						</div>

						<div class="flex items-center justify-between border-b border-border/50 py-1.5">
							<span class="text-muted-foreground">Total Berat Kotor</span>
							<span class="font-bold text-foreground">{grossWeight.toLocaleString('id-ID')} kg</span
							>
						</div>

						<div class="flex items-center justify-between border-b border-border/50 py-1.5">
							<span class="text-muted-foreground">
								Potongan (&frac12; jumlah karung, dibulatkan ke atas bila ganjil)
							</span>
							<span class="font-bold text-destructive">- {totalTara} kg</span>
						</div>

						<div class="flex items-center justify-between pt-1">
							<span class="font-semibold text-foreground">Berat Bersih (Siap Jual)</span>
							<span class="text-sm font-bold text-primary sm:text-base"
								>{netWeight.toLocaleString('id-ID')} kg</span
							>
						</div>
					</div>

					<!-- 3 · Harga & Ongkos (HANYA DITAMPILKAN DI TAHAP 2 PENJUALAN) -->
					{#if activeFlow === 'sale'}
						<div
							class="space-y-3 rounded-xl border border-border/80 bg-muted/15 p-4 text-xs sm:text-sm"
						>
							<p class="flex items-center gap-2 font-bold text-foreground">
								<span
									class="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary"
									>3</span
								>
								Harga &amp; Ongkos Kuli
							</p>

							<div class="grid gap-3 sm:grid-cols-2">
								<div class="space-y-1">
									<label for="pricePerKg" class="block text-xs font-medium text-muted-foreground">
										Harga Tepung per Kg (Rp)
									</label>
									<Input
										id="pricePerKg"
										name="pricePerKg"
										type="number"
										step="1"
										bind:value={pricePerKg}
										required
										class="h-9 bg-background text-sm font-semibold"
									/>
								</div>

								<div class="space-y-1">
									<label for="kuliFeePerSack" class="block text-xs font-medium text-muted-foreground">
										Ongkos Kuli Angkut per Karung (Rp)
									</label>
									<Input
										id="kuliFeePerSack"
										name="kuliFeePerSack"
										type="number"
										step="1"
										bind:value={kuliFeePerSack}
										class="h-9 bg-background text-sm font-semibold"
									/>
								</div>
							</div>

							<div class="space-y-2 border-t border-border/60 pt-2">
								<div class="flex items-center justify-between">
									<span class="text-muted-foreground">Jumlah Harga ({netWeight.toLocaleString('id-ID')} kg &times; Rp {pricePerKg.toLocaleString('id-ID')})</span>
									<span class="font-bold text-foreground">Rp {totalCost.toLocaleString('id-ID')}</span
									>
								</div>

								<div class="flex items-center justify-between">
									<span class="text-muted-foreground"
										>Ongkos Kuli Angkut ({sackCount} karung &times; Rp {kuliFeePerSack.toLocaleString('id-ID')})</span
									>
									<span class="font-bold text-destructive"
										>- Rp {kuliFee.toLocaleString('id-ID')}</span
									>
								</div>
							</div>

							<!-- Total Bayar Banner (Primary Palette CV TapioLeaf) -->
							<div
								class="mt-3 flex items-center justify-between rounded-xl bg-primary px-4 py-3.5 text-primary-foreground shadow-sm"
							>
								<span class="text-sm font-bold tracking-wide sm:text-base">Total Bayar Nota</span>
								<span class="text-lg font-extrabold tracking-tight sm:text-xl"
									>Rp {totalPayment.toLocaleString('id-ID')}</span
								>
							</div>
						</div>
					{/if}
				</div>

				<!-- Footer Actions -->
				<div
					class="sticky bottom-0 flex flex-wrap justify-end gap-2.5 border-t border-border/70 bg-popover px-5 py-3.5"
				>
					<Button type="button" variant="outline" onclick={() => (showCreateModal = false)}>
						Batal
					</Button>
					<Button
						type="submit"
						class="font-semibold shadow-xs"
						disabled={submitting || sackCount === 0 || !isNetWeightValid}
					>
						{#if submitting}<Loader2 size={15} class="mr-1.5 animate-spin" />{/if}
						{#if editingSaleId}
							Simpan Perubahan
						{:else if activeFlow === 'weighing'}
							<Scale size={15} class="mr-1.5" /> Simpan & Masukkan ke Stok Gudang
						{:else}
							<Receipt size={15} class="mr-1.5" /> Buat & Konfirmasi Nota Penjualan
						{/if}
					</Button>
				</div>
			</form>
		</div>
	</DialogContent>
</Dialog>

<!-- CONFIRM DIALOG -->
<Dialog
	open={confirmTargetId !== null}
	onOpenChange={(o) => {
		if (!o) confirmTargetId = null;
	}}
>
	<DialogContent class="sm:max-w-sm">
		<DialogHeader>
			<DialogTitle>Konfirmasi Transaksi?</DialogTitle>
			<DialogDescription>
				Transaksi <strong>{confirmTargetInfo?.saleNumber}</strong>
				{#if confirmTargetInfo?.buyerName && confirmTargetInfo?.buyerName !== 'Pelanggan'}
					atas nama <strong>{confirmTargetInfo?.buyerName}</strong>
				{/if}
				senilai <strong>{fmtCurrency(confirmTargetInfo?.totalPayment || 0)}</strong> akan dikonfirmasi.
				Stok tepung di gudang akan otomatis dipotong sesuai berat bersih. Tindakan ini tidak dapat dibatalkan.
			</DialogDescription>
		</DialogHeader>
		<DialogFooter class="gap-2">
			<Button variant="outline" onclick={() => (confirmTargetId = null)}>Batal</Button>
			<form
				method="post"
				action="?/confirm"
				use:enhance={() => {
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
				}}
			>
				<input type="hidden" name="saleId" value={confirmTargetId ?? ''} />
				<Button type="submit"><Check size={14} class="mr-1" /> Konfirmasi</Button>
			</form>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- DELETE DIALOG -->
<Dialog
	open={deleteTargetId !== null}
	onOpenChange={(o) => {
		if (!o) deleteTargetId = null;
	}}
>
	<DialogContent class="sm:max-w-sm">
		<DialogHeader>
			<DialogTitle>Hapus Transaksi?</DialogTitle>
			<DialogDescription>Transaksi ini akan dihapus permanen.</DialogDescription>
		</DialogHeader>
		<DialogFooter class="gap-2">
			<Button variant="outline" onclick={() => (deleteTargetId = null)}>Batal</Button>
			<form
				method="post"
				action="?/delete"
				use:enhance={() => {
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
				}}
			>
				<input type="hidden" name="saleId" value={deleteTargetId ?? ''} />
				<Button variant="destructive" type="submit">Hapus</Button>
			</form>
		</DialogFooter>
	</DialogContent>
</Dialog>
