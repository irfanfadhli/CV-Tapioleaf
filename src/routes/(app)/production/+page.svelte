<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog';
	import { Plus, Loader2, CheckCircle2, Factory, Trash2, Pencil, AlertTriangle } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let showModal = $state(false);
	let editTarget = $state<any>(null);
	let deleteTargetId = $state<string | null>(null);
	let quantityInput = $state('');
	let cassavaInput = $state('');
	let productionDate = $state(new Date().toISOString().slice(0, 10));
	let notes = $state('');
	let showHistory = $state(false);
	$effect(() => {
		showHistory = (data.todaySummary?.confirmedCount ?? 0) > 0;
	});

	// Edit form state
	let editProductId = $state('');
	let editQuantity = $state('');
	let editCassava = $state('');
	let editDate = $state('');
	let editNotes = $state('');

	let editAutoYield = $derived.by(() => {
		const qty = Number(editQuantity);
		const cas = Number(editCassava);
		if (qty > 0 && cas > 0) {
			const calculated = (qty / cas) * 100;
			return Math.round(calculated * 10) / 10;
		}
		return 0;
	});

	function openEditModal(item: any) {
		editTarget = item;
		editProductId = item.productId || '';
		editQuantity = item.quantityKg ? String(item.quantityKg) : '';
		editCassava = item.cassavaUsedKg ? String(item.cassavaUsedKg) : '';
		editDate = item.productionDate ? new Date(item.productionDate).toISOString().slice(0, 10) : '';
		editNotes = item.notes || '';
	}

	// Yield dihitung otomatis: (Tepung Dihasilkan / Singkong Digunakan) * 100
	let autoYield = $derived.by(() => {
		const qty = Number(quantityInput);
		const cas = Number(cassavaInput);
		if (qty > 0 && cas > 0) {
			const calculated = (qty / cas) * 100;
			return Math.round(calculated * 10) / 10;
		}
		return 0;
	});
</script>

<svelte:head>
	<title>Produksi Harian — CV TapioLeaf</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div class="flex items-center gap-3">
			<Factory size={24} class="text-primary" />
			<h1 class="text-xl font-bold md:text-2xl">Produksi Harian</h1>
		</div>
		<Button onclick={() => showModal = true} size="sm" class="md:default"><Plus size={16} class="mr-1" /> Tambah Produksi</Button>
	</div>

	<!-- Cassava Stock -->
	<div class="rounded-xl border bg-primary/5 p-4 shadow-sm">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-xs font-medium text-primary">Stok Singkong Tersedia</p>
				<p class="text-2xl font-bold text-primary">{Math.max(0, data.cassavaStock).toLocaleString('id-ID')} kg</p>
			</div>
			<p class="text-xs text-primary">Bahan baku untuk produksi</p>
		</div>
	</div>

	<div class="rounded-lg border bg-card">
		<div class="p-6">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="text-sm font-medium text-muted-foreground">Singkong Diproses</h2>
					<p class="mt-1 text-3xl font-bold">{data.todaySummary.totalKg.toLocaleString('id-ID')} <span class="text-base font-normal text-muted-foreground">kg</span></p>
				</div>
				<div class="text-right">
					<span class="text-xs text-muted-foreground">Sesuai Permintaan</span>
					<p class="text-xs text-muted-foreground">{data.todaySummary.draftCount} DRAFT · {data.todaySummary.confirmedCount} CONFIRMED</p>
				</div>
			</div>
			{#if data.todaySummary.draftCount > 0}
				<form method="post" action="?/confirm" use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') { window.location.reload(); }
						else if (result.type === 'failure') { const msg = (result.data as any)?.message; if (msg) toast.error(msg); }
					};
				}} class="mt-4">
					<Button type="submit" variant="default" class="w-full"><CheckCircle2 size={16} class="mr-1" /> Konfirmasi Semua Produksi</Button>
				</form>
			{/if}
		</div>
	</div>

	{#if showHistory}
		<div>
			<h2 class="mb-3 text-lg font-semibold">Riwayat Produksi Hari Ini</h2>
			<div class="rounded-lg border">
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="bg-muted/50">
							<tr>
								<th class="px-4 py-3 text-right font-medium text-muted-foreground">Hasil Tepung (kg)</th>
								<th class="hidden sm:table-cell px-4 py-3 text-right font-medium text-muted-foreground">Singkong Diproses (kg)</th>
								<th class="hidden md:table-cell px-4 py-3 text-right font-medium text-muted-foreground">Yield</th>
								<th class="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
								<th class="hidden lg:table-cell px-4 py-3 text-left font-medium text-muted-foreground">Keterangan</th>
								<th class="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
							</tr>
						</thead>
						<tbody>
							{#each data.todayItems as item}
								<tr class="border-t transition-colors hover:bg-muted/30">
									<td class="px-4 py-3 text-right font-semibold text-primary">{item.tapiocaFlourResult?.toLocaleString('id-ID') || item.quantityKg?.toLocaleString('id-ID') || '—'} kg</td>
									<td class="hidden sm:table-cell px-4 py-3 text-right font-medium">{item.cassavaUsedKg?.toLocaleString('id-ID') || '—'} kg</td>
									<td class="hidden md:table-cell px-4 py-3 text-right text-xs text-muted-foreground">{item.yieldPercentage ? `${item.yieldPercentage}%` : '—'}</td>
									<td class="px-4 py-3 text-center">
										{#if item.status === 'CONFIRMED'}
											<span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"><CheckCircle2 size={12} /> CONFIRMED</span>
										{:else}
											<span class="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">DRAFT</span>
										{/if}
									</td>
									<td class="hidden lg:table-cell px-4 py-3 text-xs text-muted-foreground">{item.notes || '—'}</td>
									<td class="px-4 py-3 text-center">
										<div class="flex items-center justify-center gap-1">
											<Button variant="ghost" size="sm" type="button" onclick={() => openEditModal(item)} class="text-primary hover:text-primary" aria-label="Edit">
												<Pencil size={14} />
											</Button>
											<Button variant="ghost" size="sm" type="button" onclick={() => deleteTargetId = item.id} class="text-destructive hover:text-destructive" aria-label="Hapus">
												<Trash2 size={14} />
											</Button>
										</div>
									</td>
								</tr>
							{:else}
								<tr><td colspan="6" class="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada produksi</td></tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}
</div>

<Dialog open={showModal} onOpenChange={(o) => { if (!o) showModal = false; }}>
	<DialogContent class="!p-0 sm:!p-6 w-full max-w-[calc(100%-2rem)] sm:max-w-lg overflow-hidden">
		<div class="flex max-h-[90dvh] overflow-hidden flex-col">
			<DialogHeader class="px-4 pt-4 pb-0 sm:px-0 sm:pt-0">
				<DialogTitle>Tambah Produksi</DialogTitle>
				<DialogDescription>Catat hasil produksi harian</DialogDescription>
			</DialogHeader>
			<form method="post" action="?/create" use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') { update(); toast.success('Produksi berhasil dicatat'); showModal = false; }
					else if (result.type === 'failure') { update(); const msg = (result.data as any)?.message; if (msg) toast.error(msg); }
				};
			}} class="flex min-h-0 flex-1 flex-col">
				<div class="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-0">
					<div class="grid gap-2">
						<label for="prod-quantityKg" class="text-sm font-medium">Quantity / Hasil Tepung (kg) *</label>
						<Input
							id="prod-quantityKg"
							name="quantityKg"
							type="number"
							step="0.1"
							required
							placeholder="Contoh: 2500"
							bind:value={quantityInput}
							class="text-[16px]"
							inputmode="decimal"
						/>
					</div>
					<div class="rounded-lg border bg-primary/5 p-3 text-sm">
						<p class="font-medium text-primary">Stok Singkong Tersedia: {Math.max(0, data.cassavaStock).toLocaleString('id-ID')} kg</p>
						{#if Math.max(0, data.cassavaStock) <= 0}
							<p class="mt-1 flex items-center gap-1 text-xs text-destructive"><AlertTriangle size={12} /> Stok singkong habis!</p>
						{/if}
					</div>
					{#if Math.max(0, data.cassavaStock) > 0}
					<div class="grid gap-2">
						<label for="prod-cassava" class="text-sm font-medium">Singkong Digunakan (kg) *</label>
						<Input
							id="prod-cassava"
							name="cassavaUsedKg"
							type="number"
							step="0.1"
							required
							placeholder="Berapa kg singkong diproses?"
							bind:value={cassavaInput}
							class="text-[16px]"
							inputmode="decimal"
						/>
					</div>
					{/if}
					<div class="grid gap-2">
						<label for="prod-yield" class="text-sm font-medium">Yield / Rendemen (%)</label>
						<div class="relative">
							<Input
								id="prod-yield"
								type="text"
								value={autoYield > 0 ? `${autoYield}% (Otomatis)` : '0% (Otomatis dihitung)'}
								readonly
								class="bg-muted/50 font-semibold text-foreground cursor-not-allowed"
							/>
							<input type="hidden" name="yieldPercentage" value={autoYield > 0 ? autoYield : ''} />
						</div>
						<p class="text-xs text-muted-foreground">Dihitung otomatis: (Hasil Tepung ÷ Singkong Digunakan) × 100%</p>
					</div>
					<div class="grid gap-2">
						<label for="prod-productionDate" class="text-sm font-medium">Tanggal</label>
						<Input id="prod-productionDate" name="productionDate" type="date" bind:value={productionDate} class="text-[16px]" />
					</div>
					<div class="grid gap-2">
						<label for="prod-notes" class="text-sm font-medium">Keterangan</label>
						<textarea id="prod-notes" name="notes" class="h-11 rounded-lg border bg-background px-3 py-2.5 text-[16px]" rows="2"></textarea>
					</div>
				</div>
				<div class="sticky bottom-0 flex justify-end gap-3 border-t bg-popover px-4 py-4 sm:px-0 sm:pb-0 sm:pt-4">
					<Button type="button" variant="outline" onclick={() => showModal = false}>Batal</Button>
					<Button type="submit">Simpan</Button>
				</div>
			</form>
		</div>
	</DialogContent>
</Dialog>

<Dialog open={deleteTargetId !== null} onOpenChange={(o) => { if (!o) deleteTargetId = null; }}>
	<DialogContent class="sm:max-w-sm">
		<DialogHeader>
			<DialogTitle>Hapus Entry Produksi?</DialogTitle>
			<DialogDescription>Tindakan ini tidak bisa dibatalkan.</DialogDescription>
		</DialogHeader>
		<DialogFooter class="gap-2">
			<Button variant="outline" onclick={() => deleteTargetId = null}>Batal</Button>
			<form method="post" action="?/delete" use:enhance={() => {
				return async ({ result, update }) => {
					update();
					if (result.type === 'success') { deleteTargetId = null; toast.success('Produksi dihapus'); await invalidateAll(); }
					else if (result.type === 'failure') { const msg = (result.data as any)?.message; if (msg) toast.error(msg); }
				};
			}}>
				<input type="hidden" name="id" value={deleteTargetId ?? ''} />
				<Button variant="destructive" type="submit">Hapus</Button>
			</form>
		</DialogFooter>
	</DialogContent>
</Dialog>

<!-- Edit Production Modal -->
<Dialog open={editTarget !== null} onOpenChange={(o) => { if (!o) editTarget = null; }}>
	<DialogContent class="!p-0 sm:!p-6 w-full max-w-[calc(100%-2rem)] sm:max-w-lg overflow-hidden">
		<div class="flex max-h-[90dvh] overflow-hidden flex-col">
			<DialogHeader class="px-4 pt-4 pb-0 sm:px-0 sm:pt-0">
				<DialogTitle>Edit Produksi</DialogTitle>
				<DialogDescription>Perbarui data hasil produksi</DialogDescription>
			</DialogHeader>
			<form method="post" action="?/update" use:enhance={() => {
				return async ({ result, update }) => {
					update();
					if (result.type === 'success') {
						editTarget = null;
						toast.success('Produksi berhasil diperbarui');
						await invalidateAll();
					} else if (result.type === 'failure') {
						const msg = (result.data as any)?.message;
						if (msg) toast.error(msg);
					}
				};
			}} class="flex min-h-0 flex-1 flex-col">
				<input type="hidden" name="id" value={editTarget?.id ?? ''} />
				<div class="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-0">
					<div class="grid gap-2">
						<label for="edit-quantityKg" class="text-sm font-medium">Quantity / Hasil Tepung (kg) *</label>
						<Input
							id="edit-quantityKg"
							name="quantityKg"
							type="number"
							step="0.1"
							required
							placeholder="Contoh: 2500"
							bind:value={editQuantity}
							class="text-[16px]"
							inputmode="decimal"
						/>
					</div>
					<div class="grid gap-2">
						<label for="edit-cassava" class="text-sm font-medium">Singkong Digunakan (kg) *</label>
						<Input
							id="edit-cassava"
							name="cassavaUsedKg"
							type="number"
							step="0.1"
							required
							placeholder="Berapa kg singkong diproses?"
							bind:value={editCassava}
							class="text-[16px]"
							inputmode="decimal"
						/>
					</div>
					<div class="grid gap-2">
						<label for="edit-yield" class="text-sm font-medium">Yield / Rendemen (%)</label>
						<div class="relative">
							<Input
								id="edit-yield"
								type="text"
								value={editAutoYield > 0 ? `${editAutoYield}% (Otomatis)` : '0% (Otomatis dihitung)'}
								readonly
								class="bg-muted/50 font-semibold text-foreground cursor-not-allowed"
							/>
							<input type="hidden" name="yieldPercentage" value={editAutoYield > 0 ? editAutoYield : ''} />
						</div>
						<p class="text-xs text-muted-foreground">Dihitung otomatis: (Hasil Tepung ÷ Singkong Digunakan) × 100%</p>
					</div>
					<div class="grid gap-2">
						<label for="edit-date" class="text-sm font-medium">Tanggal</label>
						<Input id="edit-date" name="productionDate" type="date" bind:value={editDate} class="text-[16px]" />
					</div>
					<div class="grid gap-2">
						<label for="edit-notes" class="text-sm font-medium">Keterangan</label>
						<textarea id="edit-notes" name="notes" bind:value={editNotes} class="h-11 rounded-lg border bg-background px-3 py-2.5 text-[16px]" rows="2"></textarea>
					</div>
				</div>
				<div class="sticky bottom-0 flex justify-end gap-3 border-t bg-popover px-4 py-4 sm:px-0 sm:pb-0 sm:pt-4">
					<Button type="button" variant="outline" onclick={() => editTarget = null}>Batal</Button>
					<Button type="submit">Simpan</Button>
				</div>
			</form>
		</div>
	</DialogContent>
</Dialog>
