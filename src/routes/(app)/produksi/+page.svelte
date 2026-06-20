<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog';
	import { Plus, Loader2, CheckCircle2, Factory } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';

	let { data } = $props();

	let showModal = $state(false);
	let quantityKg = $state('');
	let productionDate = $state(new Date().toISOString().slice(0, 10));
	let notes = $state('');
	let showHistory = $state(data.todaySummary.confirmedCount > 0);
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<Factory size={24} class="text-emerald-600" />
			<h1 class="text-2xl font-bold">Produksi Harian</h1>
		</div>
		<Button onclick={() => showModal = true}><Plus size={16} class="mr-1" /> Tambah Produksi</Button>
	</div>

	<div class="rounded-lg border bg-card">
		<div class="p-6">
			<div class="mb-4 flex items-center justify-between">
				<div>
					<h2 class="text-sm font-medium text-muted-foreground">Produksi Hari Ini</h2>
					<p class="text-3xl font-bold">{data.todaySummary.totalKg.toLocaleString('id-ID')} <span class="text-lg font-normal text-muted-foreground">/ {data.todaySummary.targetKg.toLocaleString('id-ID')} kg</span></p>
				</div>
				<div class="text-right">
					<p class="text-sm text-muted-foreground">{data.todaySummary.percentage}%</p>
					<p class="text-xs text-muted-foreground">{data.todaySummary.draftCount} DRAFT · {data.todaySummary.confirmedCount} CONFIRMED</p>
				</div>
			</div>
			<div class="h-4 w-full overflow-hidden rounded-full bg-muted">
				<div class="h-full rounded-full bg-emerald-600 transition-all duration-500" style="width: {data.todaySummary.percentage}%"></div>
			</div>
			{#if data.todaySummary.draftCount > 0}
				<form method="post" action="?/confirm" use:enhance={() => {
					return async ({ result, update }) => {
						update();
						if (result.type === 'success') { toast.success('Produksi hari ini dikonfirmasi'); showHistory = true; }
						else if (result.type === 'failure') { const msg = (result.data as any)?.message; if (msg) toast.error(msg); }
					};
				}} class="mt-4">
					<Button type="submit" variant="default" class="w-full"><CheckCircle2 size={16} class="mr-1" /> Konfirmasi Produksi Hari Ini</Button>
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
								<th class="px-4 py-3 text-right font-medium text-muted-foreground">Kg</th>
								<th class="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
								<th class="px-4 py-3 text-left font-medium text-muted-foreground">Keterangan</th>
							</tr>
						</thead>
						<tbody>
							{#each data.todayItems as item}
								<tr class="border-t transition-colors hover:bg-muted/30">
									<td class="px-4 py-3">
										<div class="font-medium">{item.productName}</div>
										<div class="text-xs text-muted-foreground">{item.productCode}</div>
									</td>
									<td class="px-4 py-3 text-right font-medium">{item.quantityKg.toLocaleString('id-ID')}</td>
									<td class="px-4 py-3 text-center">
										{#if item.status === 'CONFIRMED'}
											<span class="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"><CheckCircle2 size={12} /> CONFIRMED</span>
										{:else}
											<span class="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">DRAFT</span>
										{/if}
									</td>
									<td class="px-4 py-3 text-xs text-muted-foreground">{item.notes || '—'}</td>
								</tr>
							{:else}
								<tr><td colspan="4" class="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada produksi</td></tr>
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
