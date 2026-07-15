<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog';
	import { Plus, Loader2, CheckCircle2, Factory, Trash2, AlertTriangle } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let showModal = $state(false);
	let deleteTargetId = $state<string | null>(null);
	let quantityKg = $state('');
	let productionDate = $state(new Date().toISOString().slice(0, 10));
	let notes = $state('');
	let showHistory = $state(data.todaySummary.confirmedCount > 0);
	let cassavaInput = $state(0);
	let yieldInput = $state(0);
	let flourResult = $derived(cassavaInput * (yieldInput / 100));
</script>

<div class="space-y-6">
	<div class="flex flex-wrap items-center gap-2">
		<div class="flex items-center gap-3">
			<Factory size={24} class="text-emerald-600" />
			<h1 class="text-xl font-bold md:text-2xl">Produksi Harian</h1>
		</div>
		<Button onclick={() => showModal = true} size="sm" class="md:default"><Plus size={16} class="mr-1" /> Tambah Produksi</Button>
	</div>

	<!-- Cassava Stock -->
	<div class="rounded-xl border bg-emerald-50 p-4 shadow-sm">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-xs font-medium text-emerald-700">Stok Singkong Tersedia</p>
				<p class="text-2xl font-bold text-emerald-800">{Math.max(0, data.cassavaStock).toLocaleString('id-ID')} kg</p>
			</div>
			<p class="text-xs text-emerald-600">Bahan baku untuk produksi</p>
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
								<th class="px-4 py-3 text-left font-medium text-muted-foreground">Produk</th>
								<th class="px-4 py-3 text-right font-medium text-muted-foreground">Tepung</th>
								<th class="hidden sm:table-cell px-4 py-3 text-right font-medium text-muted-foreground">Singkong</th>
								<th class="hidden md:table-cell px-4 py-3 text-right font-medium text-muted-foreground">Yield</th>
								<th class="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
								<th class="hidden lg:table-cell px-4 py-3 text-left font-medium text-muted-foreground">Keterangan</th>
								<th class="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
							</tr>
						</thead>
						<tbody>
							{#each data.todayItems as item}
								<tr class="border-t transition-colors hover:bg-muted/30">
									<td class="px-4 py-3">
										<div class="font-medium">{item.productName}</div>
										<div class="text-xs text-muted-foreground">{item.productCode}</div>
									</td>
									<td class="px-4 py-3 text-right font-medium">{item.tapiocaFlourResult?.toLocaleString('id-ID') || '—'}</td>
									<td class="hidden sm:table-cell px-4 py-3 text-right">{item.cassavaUsedKg?.toLocaleString('id-ID') || '—'}</td>
									<td class="hidden md:table-cell px-4 py-3 text-right text-xs text-muted-foreground">{item.yieldPercentage ? `${item.yieldPercentage}%` : '—'}</td>
									<td class="px-4 py-3 text-center">
										{#if item.status === 'CONFIRMED'}
											<span class="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"><CheckCircle2 size={12} /> CONFIRMED</span>
										{:else}
											<span class="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">DRAFT</span>
										{/if}
									</td>
									<td class="hidden lg:table-cell px-4 py-3 text-xs text-muted-foreground">{item.notes || '—'}</td>
									<td class="px-4 py-3 text-center">
										<Button variant="ghost" size="sm" type="button" onclick={() => deleteTargetId = item.id} class="text-red-500 hover:text-red-700" aria-label="Hapus"><Trash2 size={14} /></Button>
									</td>
								</tr>
							{:else}
								<tr><td colspan="7" class="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada produksi</td></tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}
</div>

<Dialog open={showModal} onOpenChange={(o) => { if (!o) showModal = false; }}>
	<DialogContent class="sm:max-w-sm">
		<DialogHeader>
			<DialogTitle>Tambah Produksi</DialogTitle>
			<DialogDescription>Catat hasil produksi harian</DialogDescription>
		</DialogHeader>
		<form method="post" action="?/create" use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === 'success') { update(); toast.success('Produksi berhasil dicatat'); showModal = false; }
				else if (result.type === 'failure') { update(); const msg = (result.data as any)?.message; if (msg) toast.error(msg); }
			};
		}}>
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<label for="prod-productId" class="text-sm font-medium">Produk *</label>
					<select id="prod-productId" name="productId" class="rounded-lg border bg-background px-3 py-2 text-sm" required>
						<option value="">Pilih produk</option>
						{#each data.products as p}
							<option value={p.id}>{p.code} — {p.name}</option>
						{/each}
					</select>
				</div>
				<div class="grid gap-2">
					<label for="prod-quantityKg" class="text-sm font-medium">Quantity (kg) *</label>
					<Input id="prod-quantityKg" name="quantityKg" type="number" step="0.1" required placeholder="Contoh: 2500" />
				</div>
				<div class="rounded-lg border bg-emerald-50 p-3 text-sm">
					<p class="font-medium text-emerald-800">Stok Singkong: {Math.max(0, data.cassavaStock).toLocaleString('id-ID')} kg</p>
					{#if Math.max(0, data.cassavaStock) <= 0}
						<p class="mt-1 flex items-center gap-1 text-xs text-red-600"><AlertTriangle size={12} /> Stok singkong habis!</p>
					{/if}
				</div>
				{#if Math.max(0, data.cassavaStock) > 0}
				<div class="grid gap-2">
					<label for="prod-cassava" class="text-sm font-medium">Singkong Digunakan (kg) *</label>
					<Input id="prod-cassava" name="cassavaUsedKg" type="number" step="0.1" required placeholder="Berapa kg singkong diproses?" bind:value={cassavaInput} />
				</div>
				{/if}
				<div class="grid gap-2">
					<label for="prod-yield" class="text-sm font-medium">Yield (%)</label>
					<Input id="prod-yield" name="yieldPercentage" type="number" step="0.1" placeholder="Contoh: 25" bind:value={yieldInput} />
					<p class="text-xs text-muted-foreground">Persentase tepung yang dihasilkan dari singkong</p>
				</div>
				{#if flourResult > 0}
				<div class="rounded-lg border bg-blue-50 p-3 text-sm">
					<p class="font-medium text-blue-800">Hasil Tepung: {flourResult.toLocaleString('id-ID')} kg</p>
					<p class="text-xs text-blue-600">Hasil tepung tapioka dari singkong yang diproses</p>
				</div>
				{/if}
				<div class="grid gap-2">
					<label for="prod-productionDate" class="text-sm font-medium">Tanggal</label>
					<Input id="prod-productionDate" name="productionDate" type="date" bind:value={productionDate} />
				</div>
				<div class="grid gap-2">
					<label for="prod-notes" class="text-sm font-medium">Keterangan</label>
					<textarea id="prod-notes" name="notes" class="rounded-lg border bg-background px-3 py-2 text-sm" rows="2"></textarea>
				</div>
			</div>
			<DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
		</form>
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
