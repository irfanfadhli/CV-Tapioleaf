<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog';
	import { ShoppingBag, Search, CheckCircle2, X, Clock, ChevronRight, Plus, Trash2, Loader2, Banknote, Package } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let { data, form } = $props();

	let searchQuery = $state((data.search as string) || '');
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
		PENDING: 'text-amber-700 bg-amber-100',
		APPROVED: 'text-blue-700 bg-blue-100',
		PAID: 'text-emerald-700 bg-emerald-100',
		PROCESSING: 'text-blue-700 bg-blue-100',
		SHIPPED: 'text-purple-700 bg-purple-100',
		COMPLETED: 'text-emerald-700 bg-emerald-100',
		CANCELLED: 'text-red-700 bg-red-100'
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

	function handleSearch() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			const section = data.section === 'all' ? 'all' : null;
			const url = new URL('/admin-orders', window.location.origin);
			if (section) url.searchParams.set('section', 'all');
			if (searchQuery) url.searchParams.set('search', searchQuery);
			else url.searchParams.delete('search');
			url.searchParams.set('page', '1');
			window.location.href = url.toString();
		}, 400);
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
			<Button size="sm" onclick={openCreateModal} class="gap-1.5 h-8 text-xs whitespace-nowrap">
				<Plus size={14} /> Pesanan Offline (Tunai)
			</Button>
		</div>
	</div>

	<!-- Alerts -->
	{#if form?.success}
		<div class="flex items-center gap-1.5 rounded-sm border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700">
			<CheckCircle2 size={12} />
			{form.message}
		</div>
	{/if}
	{#if form && !form.success && form.message}
		<div class="flex items-center gap-1.5 rounded-sm border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
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
		<!-- Section header for "all" view -->
		{#if data.section === 'all'}
			<div class="flex items-center justify-between">
				<h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daftar Pesanan</h2>
				{#if data.total > 0}
					<span class="text-xs text-muted-foreground">{data.total} pesanan</span>
				{/if}
			</div>
		{/if}

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
			{#each orders as order (order.id)}
				<div class="flex flex-col rounded-sm border bg-card p-3.5 shadow-xs min-h-[160px] transition-colors hover:border-muted-foreground/20">
					<!-- Top row: ID + Status badge -->
					<div class="flex items-center justify-between">
						<span class="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</span>
						<span class="inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-xs font-medium {statusColors[order.status] || 'bg-muted/50 text-muted-foreground'}">
							{#if statusIcons[order.status]}
								<svelte:component this={statusIcons[order.status]} size={8} />
							{/if}
							{statusLabels[order.status] || order.status}
						</span>
					</div>

					<!-- Customer name -->
					<p class="mt-1 text-sm font-semibold break-words">{order.customerName || '-'}</p>

					<!-- Phone -->
					<p class="mt-0.5 text-xs text-muted-foreground break-all">{order.customerPhone || '-'}</p>

					<!-- Date -->
					<p class="mt-0.5 text-xs text-muted-foreground">{formatDate(order.createdAt.toString())}</p>

					<!-- Total + items row -->
					<div class="mt-1 flex items-baseline gap-1 text-xs">
						<span class="font-bold">Rp {Number(order.totalAmount).toLocaleString('id-ID')}</span>
						<span class="text-muted-foreground/50">·</span>
						<span>{order.items?.length ?? 0} item</span>
					</div>

					<!-- Detail button at bottom-right -->
					<div class="mt-2 flex justify-end">
						<Button variant="outline" class="text-xs px-2.5 py-1.5 h-7" href={`/admin-orders/${order.id}`}>
							<ChevronRight size={10} />
							<span class="sr-only">Detail</span>
							Detail
						</Button>
					</div>
				</div>
			{/each}
		</div>

		<!-- "Lihat Semua Pesanan" button on main page (latest section only) -->
		{#if data.section === 'latest' && data.total > 6}
			<div class="flex justify-center pt-2">
				<a href="/admin-orders?section=all" class="inline-flex items-center gap-1.5 rounded-sm border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
					Lihat Semua Pesanan
					<ChevronRight size={14} />
				</a>
			</div>
		{/if}

		<!-- Pagination only on "all" section -->
		{#if data.section === 'all'}
			<div class="flex items-center justify-between pt-3">
				<span class="text-xs text-muted-foreground">
					Menampilkan {(data.page - 1) * data.limit + 1}–{Math.min(data.page * data.limit, data.total)} dari {data.total} pesanan
				</span>
				{#if data.totalPages > 1}
					<div class="flex items-center gap-1.5">
						<Button variant="outline" size="default" disabled={data.page <= 1} href={data.page > 1 ? `?section=all&page=${data.page - 1}${data.search ? `&search=${data.search}` : ''}` : undefined}>Sebelumnya</Button>
						<span class="text-xs text-muted-foreground">Halaman {data.page} dari {data.totalPages}</span>
						<Button variant="outline" size="default" disabled={data.page >= data.totalPages} href={data.page < data.totalPages ? `?section=all&page=${data.page + 1}${data.search ? `&search=${data.search}` : ''}` : undefined}>Berikutnya</Button>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<!-- Modal Dialog: Tambah Pesanan Offline (Tunai) -->
<Dialog open={showCreateModal} onOpenChange={(o) => { if (!o) closeCreateModal(); }}>
	<DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto">
		<DialogHeader>
			<div class="flex items-center gap-2">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
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
				<div class="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 text-emerald-900">
					<div>
						<div class="flex items-center gap-1.5">
							<span class="inline-flex items-center gap-1 rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
								<CheckCircle2 size={10} /> Tunai (Lunas)
							</span>
						</div>
						<p class="mt-0.5 text-[11px] text-emerald-700">Stok produk otomatis terpotong saat transaksi disimpan.</p>
					</div>
					<div class="text-right">
						<p class="text-[10px] uppercase font-semibold text-emerald-700">Total Transaksi</p>
						<p class="text-base font-bold text-emerald-900">
							Rp {calculatedTotal.toLocaleString('id-ID')}
						</p>
					</div>
				</div>
			</div>

			<DialogFooter class="gap-2 pt-2">
				<Button type="button" variant="outline" onclick={closeCreateModal} disabled={creating}>
					Batal
				</Button>
				<Button type="submit" disabled={creating || calculatedTotal <= 0} class="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white">
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