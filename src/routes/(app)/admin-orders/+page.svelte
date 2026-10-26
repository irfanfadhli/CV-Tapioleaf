<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog';
	import { ShoppingBag, Search, CheckCircle2, X, Clock, ChevronRight, Plus, Trash2, Loader2, Banknote, Package } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let { data, form } = $props();

	let searchQuery = $state((data.search as string) || '');
	let statusFilter = $state((data.status as string) || 'all');
	let limitValue = $state(data.limit ?? 25);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	// Offline order modal state
	let showCreateModal = $state(false);
	let creating = $state(false);
	let customerName = $state('');
	let customerPhone = $state('');
	let customerAddress = $state('');
	let notes = $state('');
	let items = $state<Array<{ productId: string; quantity: number }>>([
		{ productId: '', quantity: 1 }
	]);

	const activeProducts = $derived(data.activeProducts || []);

	const calculatedTotal = $derived(
		items.reduce((sum, item) => {
			if (!item.productId) return sum;
			const prod = activeProducts.find((p: any) => p.id === item.productId);
			if (!prod) return sum;
			return sum + Number(prod.price) * (Number(item.quantity) || 0);
		}, 0)
	);

	function openCreateModal() {
		customerName = '';
		customerPhone = '';
		customerAddress = '';
		notes = '';
		const firstProduct = activeProducts.length > 0 ? activeProducts[0].id : '';
		items = [{ productId: firstProduct, quantity: 1 }];
		showCreateModal = true;
	}

	function closeCreateModal() {
		showCreateModal = false;
	}

	function addItem() {
		const firstProduct = activeProducts.length > 0 ? activeProducts[0].id : '';
		items = [...items, { productId: firstProduct, quantity: 1 }];
	}

	function removeItem(index: number) {
		if (items.length > 1) {
			items = items.filter((_, i) => i !== index);
		}
	}

	const statusLabels: Record<string, string> = {
		PENDING: 'Menunggu Persetujuan',
		APPROVED: 'Menunggu Pembayaran',
		PAID: 'Lunas',
		PROCESSING: 'Diproses',
		SHIPPED: 'Dikirim',
		COMPLETED: 'Selesai',
		CANCELLED: 'Dibatalkan'
	};

	const statusColors: Record<string, string> = {
		PENDING: 'text-warning bg-warning/10',
		APPROVED: 'text-info bg-info/10',
		PAID: 'text-primary bg-primary/10',
		PROCESSING: 'text-secondary-foreground bg-secondary',
		SHIPPED: 'text-info bg-info/10',
		COMPLETED: 'text-primary bg-primary/10',
		CANCELLED: 'text-destructive bg-destructive/10'
	};

	const statusIcons: Record<string, any> = {
		PENDING: Clock,
		APPROVED: Clock,
		PAID: CheckCircle2,
		PROCESSING: Clock,
		SHIPPED: CheckCircle2,
		COMPLETED: CheckCircle2,
		CANCELLED: X
	};

	function buildUrl(params: Record<string, string | undefined>) {
		const url = new URL('/admin-orders', window.location.origin);
		const q = { search: searchQuery || undefined, status: statusFilter === 'all' ? undefined : statusFilter, limit: String(limitValue), ...params };
		for (const [k, v] of Object.entries(q)) {
			if (v) url.searchParams.set(k, v);
			else url.searchParams.delete(k);
		}
		return url.toString();
	}

	function handleSearch() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			window.location.href = buildUrl({});
		}, 400);
	}

	function handleStatusChange(e: Event) {
		statusFilter = (e.target as HTMLSelectElement).value;
		window.location.href = buildUrl({});
	}

	function handleLimitChange(e: Event) {
		limitValue = Number((e.target as HTMLSelectElement).value);
		window.location.href = buildUrl({});
	}

	function goNext() {
		if (data.nextCursor) window.location.href = buildUrl({ cursor: data.nextCursor, dir: 'next' });
	}

	function goPrev() {
		if (data.prevCursor) window.location.href = buildUrl({ cursor: data.prevCursor, dir: 'prev' });
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('id-ID', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	type AdminOrder = {
		id: string;
		userId: string | null;
		status: 'PENDING' | 'APPROVED' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
		totalAmount: string;
		customerName: string | null;
		customerPhone: string | null;
		createdAt: Date;
		items?: Array<{ count: number }>;
	};

	const orders = $derived(data.orders as unknown as AdminOrder[]);
</script>

<svelte:head>
	<title>Pesanan Pelanggan — CV TapioLeaf</title>
</svelte:head>

<div class="space-y-3">
	<!-- Header -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-2">
			<ShoppingBag size={20} class="text-primary" />
			<h1 class="text-base font-bold">Pesanan Pelanggan</h1>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<div class="relative w-full sm:w-60">
				<Search size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" />
				<input
					type="text"
					placeholder="Cari nama / ID pesanan..."
					bind:value={searchQuery}
					oninput={handleSearch}
					class="h-8 w-full rounded-lg border bg-background py-1.5 pr-1.5 pl-8 text-xs outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>
			<select
				bind:value={statusFilter}
				onchange={handleStatusChange}
				class="h-8 rounded-lg border bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring"
				aria-label="Filter status"
			>
				<option value="all">Semua Status</option>
				{#each Object.keys(statusLabels) as s}
					<option value={s}>{statusLabels[s]}</option>
				{/each}
			</select>
			<select
				bind:value={limitValue}
				onchange={handleLimitChange}
				class="h-8 rounded-lg border bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring"
				aria-label="Jumlah per halaman"
			>
				<option value="10">10</option>
				<option value="25">25</option>
				<option value="50">50</option>
				<option value="100">100</option>
			</select>
			<Button size="sm" onclick={openCreateModal} class="gap-1.5 h-8 text-xs whitespace-nowrap">
				<Plus size={14} /> Pesanan Offline (Tunai)
			</Button>
		</div>
	</div>

	<!-- Alerts -->
	{#if form?.success}
		<div class="flex items-center gap-1.5 rounded-sm border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-xs text-primary">
			<CheckCircle2 size={12} />
			{form.message}
		</div>
	{/if}
	{#if form && !form.success && form.message}
		<div class="flex items-center gap-1.5 rounded-sm border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 text-xs text-destructive">
			<X size={12} />
			{form.message}
		</div>
	{/if}

	<!-- Orders grid -->
	{#if data.orders.length === 0}
		<div class="flex flex-col items-center justify-center rounded-sm border bg-card p-6">
			<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2 text-muted-foreground/50"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>
			<p class="text-base font-medium text-muted-foreground">Belum ada pesanan</p>
			<Button variant="outline" size="sm" class="mt-3 gap-1.5" onclick={openCreateModal}>
				<Plus size={14} /> Buat Pesanan Offline
			</Button>
		</div>
	{:else}
		<!-- Section header -->
		<div class="flex items-center justify-between">
			<h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daftar Pesanan</h2>
			{#if data.total > 0}
				<span class="text-xs text-muted-foreground">{data.total} pesanan</span>
			{/if}
		</div>

		<div class="overflow-x-auto rounded-sm border bg-card">
			<table class="w-full text-sm">
				<thead class="bg-muted/50">
					<tr>
						<th class="px-3 py-2.5 text-left font-medium text-muted-foreground">ID Pesanan</th>
						<th class="px-3 py-2.5 text-left font-medium text-muted-foreground">Pelanggan</th>
						<th class="hidden md:table-cell px-3 py-2.5 text-left font-medium text-muted-foreground">Telepon</th>
						<th class="hidden lg:table-cell px-3 py-2.5 text-left font-medium text-muted-foreground">Tanggal</th>
						<th class="px-3 py-2.5 text-right font-medium text-muted-foreground">Total</th>
						<th class="px-3 py-2.5 text-center font-medium text-muted-foreground">Status</th>
						<th class="px-3 py-2.5 text-center font-medium text-muted-foreground">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each orders as order (order.id)}
						<tr class="border-t transition-colors hover:bg-muted/30">
							<td class="px-3 py-2.5 font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</td>
							<td class="px-3 py-2.5 font-semibold break-words">{order.customerName || '-'}</td>
							<td class="hidden md:table-cell px-3 py-2.5 text-xs text-muted-foreground break-all">{order.customerPhone || '-'}</td>
							<td class="hidden lg:table-cell px-3 py-2.5 text-xs text-muted-foreground">{formatDate(order.createdAt.toString())}</td>
							<td class="px-3 py-2.5 text-right">
								<span class="font-bold">Rp {Number(order.totalAmount).toLocaleString('id-ID')}</span>
								<span class="text-xs text-muted-foreground"> · {order.items?.length ?? 0} item</span>
							</td>
							<td class="px-3 py-2.5 text-center">
								<span class="inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-xs font-medium {statusColors[order.status] || 'bg-muted/50 text-muted-foreground'}">
									{#if statusIcons[order.status] && statusIcons[order.status] === Clock}
										<Clock size={8} />
									{:else if statusIcons[order.status] && statusIcons[order.status] === CheckCircle2}
										<CheckCircle2 size={8} />
									{:else if statusIcons[order.status] && statusIcons[order.status] === X}
										<X size={8} />
									{/if}
									{statusLabels[order.status] || order.status}
								</span>
							</td>
							<td class="px-3 py-2.5">
								<div class="flex justify-center">
									<Button variant="outline" class="text-xs px-2.5 py-1.5 h-7" href={`/admin-orders/${order.id}`}>
										<ChevronRight size={10} />
										<span class="sr-only">Detail</span>
										Detail
									</Button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		{#if data.totalPages > 1}
			<div class="flex items-center justify-between pt-3">
				<span class="text-xs text-muted-foreground">
					Menampilkan {(data.page - 1) * data.limit + 1}–{Math.min(data.page * data.limit, data.total)} dari {data.total} pesanan
				</span>
				<div class="flex items-center gap-1.5">
					<Button variant="outline" size="default" disabled={data.page <= 1} href={data.page > 1 ? `?page=${data.page - 1}${data.search ? `&search=${data.search}` : ''}` : undefined}>Sebelumnya</Button>
					<span class="text-xs text-muted-foreground">Halaman {data.page} dari {data.totalPages}</span>
					<Button variant="outline" size="default" disabled={data.page >= data.totalPages} href={data.page < data.totalPages ? `?page=${data.page + 1}${data.search ? `&search=${data.search}` : ''}` : undefined}>Berikutnya</Button>
				</div>
			</div>
		{/if}
	{/if}
</div>

<!-- Modal Dialog: Tambah Pesanan Offline (Tunai) -->
<Dialog open={showCreateModal} onOpenChange={(o) => { if (!o) closeCreateModal(); }}>
	<DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto">
		<DialogHeader>
		<div class="flex items-center gap-2">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
				<Banknote size={18} />
			</div>
				<div>
					<DialogTitle>Tambah Pesanan Offline (Tunai)</DialogTitle>
					<DialogDescription>Catat transaksi jual beli tunai langsung di toko / pabrik</DialogDescription>
				</div>
			</div>
		</DialogHeader>

		<form
			method="post"
			action="?/createOffline"
			use:enhance={() => {
				creating = true;
				return async ({ result, update }) => {
					creating = false;
					await update();
					if (result.type === 'success') {
						const msg = (result.data as Record<string, unknown>)?.message as string | undefined;
						toast.success(msg || 'Pesanan offline berhasil dibuat');
						closeCreateModal();
					} else if (result.type === 'failure') {
						const msg = (result.data as Record<string, unknown>)?.message as string | undefined;
						if (msg) toast.error(msg);
					}
				};
			}}
		>
			<input
				type="hidden"
				name="items"
				value={JSON.stringify(items.filter((i) => i.productId && Number(i.quantity) > 0))}
			/>

			<div class="space-y-4 py-3">
				<!-- Customer Info -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div class="space-y-1.5">
						<label for="offline-customer-name" class="text-xs font-medium text-foreground">Nama Pelanggan *</label>
						<Input
							id="offline-customer-name"
							name="customerName"
							placeholder="Contoh: Bpk. Joko / Toko Berkah"
							bind:value={customerName}
							required
							disabled={creating}
						/>
					</div>
					<div class="space-y-1.5">
						<label for="offline-customer-phone" class="text-xs font-medium text-foreground">No. Telepon (Opsional)</label>
						<Input
							id="offline-customer-phone"
							name="customerPhone"
							placeholder="08123456789"
							bind:value={customerPhone}
							disabled={creating}
						/>
					</div>
				</div>

				<div class="space-y-1.5">
					<label for="offline-customer-address" class="text-xs font-medium text-foreground">Lokasi / Alamat (Opsional)</label>
					<Input
						id="offline-customer-address"
						name="customerAddress"
						placeholder="Contoh: Ambil di Gudang / Jl. Raya No. 12"
						bind:value={customerAddress}
						disabled={creating}
					/>
				</div>

				<!-- Product Selection Items -->
				<div class="space-y-2 rounded-lg border bg-muted/20 p-3">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold text-foreground">Daftar Produk yang Dibeli</span>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={addItem}
							disabled={creating || activeProducts.length === 0}
							class="h-7 gap-1 text-[11px]"
						>
							<Plus size={12} /> Tambah Item
						</Button>
					</div>

					{#if activeProducts.length === 0}
						<div class="p-3 text-center text-xs text-muted-foreground">
							Belum ada produk aktif yang tersedia.
						</div>
					{:else}
						<div class="space-y-2.5">
							{#each items as item, index}
								<div class="flex items-center gap-2 rounded-md border bg-card p-2.5 shadow-2xs">
									<div class="min-w-0 flex-1">
										<label for={`offline-product-${index}`} class="sr-only">Pilih Produk</label>
										<select
											id={`offline-product-${index}`}
											bind:value={item.productId}
											class="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
											disabled={creating}
											required
										>
											<option value="" disabled>-- Pilih Produk --</option>
											{#each activeProducts as prod}
												<option value={prod.id}>
													{prod.name} (Rp {Number(prod.price).toLocaleString('id-ID')} / {prod.unit})
												</option>
											{/each}
										</select>
									</div>

									<div class="w-20 shrink-0">
										<label for={`offline-qty-${index}`} class="sr-only">Jumlah</label>
										<Input
											id={`offline-qty-${index}`}
											type="number"
											min="1"
											step="1"
											placeholder="Qty"
											bind:value={item.quantity}
											class="h-8 text-xs text-center"
											disabled={creating}
											required
										/>
									</div>

									{#if items.length > 1}
										<button
											type="button"
											class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
											onclick={() => removeItem(index)}
											disabled={creating}
											aria-label="Hapus produk"
										>
											<Trash2 size={14} />
										</button>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Notes -->
				<div class="space-y-1.5">
					<label for="offline-notes" class="text-xs font-medium text-foreground">Catatan Tambahan (Opsional)</label>
					<Input
						id="offline-notes"
						name="notes"
						placeholder="Misal: Pembayaran tunai diterima kasir / struk manual #012"
						bind:value={notes}
						disabled={creating}
					/>
				</div>

				<!-- Total & Payment Method Banner -->
				<div class="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3 text-primary">
					<div>
						<div class="flex items-center gap-1.5">
							<span class="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
								<CheckCircle2 size={10} /> Tunai (Lunas)
							</span>
						</div>
						<p class="mt-0.5 text-[11px] text-primary/80">Stok produk otomatis terpotong saat transaksi disimpan.</p>
					</div>
					<div class="text-right">
						<p class="text-[10px] uppercase font-semibold text-primary/80">Total Transaksi</p>
						<p class="text-base font-bold text-primary">
							Rp {calculatedTotal.toLocaleString('id-ID')}
						</p>
					</div>
				</div>
			</div>

			<DialogFooter class="gap-2 pt-2">
				<Button type="button" variant="outline" onclick={closeCreateModal} disabled={creating}>
					Batal
				</Button>
				<Button type="submit" disabled={creating || calculatedTotal <= 0} class="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground">
					{#if creating}
						<Loader2 size={14} class="animate-spin" />
					{:else}
						<Banknote size={14} />
					{/if}
					Simpan Transaksi Tunai
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>