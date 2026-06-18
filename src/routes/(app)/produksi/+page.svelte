<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog';
	import { Plus, Loader2, CheckCircle2, Factory, History } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';

	let { data } = $props();

	let showModal = $state(false);
	let productId = $state('');
	let quantityKg = $state('');
	let productionDate = $state(new Date().toISOString().slice(0, 10));
	let notes = $state('');
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<Factory size={24} class="text-emerald-600" />
			<h1 class="text-2xl font-bold">Produksi Harian</h1>
		</div>
		<div class="flex gap-2">
			<Button onclick={() => showModal = true}><Plus size={16} class="mr-1" /> Tambah Produksi</Button>
			<a href="/produksi/riwayat"><Button variant="outline"><History size={16} class="mr-1" /> Riwayat</Button></a>
		</div>
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
						if (result.type === 'success') { toast.success('Produksi hari ini dikonfirmasi'); }
						else if (result.type === 'failure') { const msg = (result.data as any)?.message; if (msg) toast.error(msg); }
					};
				}} class="mt-4">
					<Button variant="default" class="w-full"><CheckCircle2 size={16} class="mr-1" /> Konfirmasi Produksi Hari Ini</Button>
				</form>
			{/if}
		</div>
	</div>
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
