<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog';
	import { Plus, Loader2, Wheat, Truck, Scale, DollarSign, Pencil, Trash2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let showModal = $state(false);
	let showSupplierModal = $state(false);
	let deleteTargetId = $state<string | null>(null);
	let receiptDate = $state(new Date().toISOString().slice(0, 10));
	let supplierId = $state('');
	let vehicleNumber = $state('');
	let driverName = $state('');
	let grossWeight = $state(0);
	let taraWeight = $state(0);
	let refraction = $state(0);
	let pricePerKg = $state(0);
	let notes = $state('');
	let submitting = $state(false);
	let editTarget = $state<any>(null);

	let netWeight = $derived(Math.max(grossWeight - taraWeight, 0));
	let finalWeight = $derived(Math.max(netWeight - refraction, 0));
	let totalCost = $derived(finalWeight * pricePerKg);
</script>

<svelte:head>
	<title>Penerimaan Singkong — CV TapioLeaf</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div class="flex items-center gap-3">
			<Wheat size={24} class="text-primary" />
			<h1 class="text-xl font-bold md:text-2xl">Penerimaan Singkong</h1>
		</div>
		<div class="flex items-center gap-2">
			<Button onclick={() => showSupplierModal = true} variant="outline" size="sm" class="md:default"><Plus size={16} class="mr-1" /> Supplier</Button>
			<Button onclick={() => showModal = true} size="sm" class="md:default"><Plus size={16} class="mr-1" /> Tambah Penerimaan</Button>
		</div>
	</div>

	<!-- Summary -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-xl border bg-card p-4 shadow-sm">
			<p class="text-xs font-medium text-muted-foreground">Total Gross</p>
			<p class="text-xl font-bold">{data.summary.totalGross.toLocaleString('id-ID')} kg</p>
		</div>
		<div class="rounded-xl border bg-card p-4 shadow-sm">
			<p class="text-xs font-medium text-muted-foreground">Total Refraksi</p>
			<p class="text-xl font-bold text-warning">{data.summary.totalRefraction.toLocaleString('id-ID')} kg</p>
		</div>
		<div class="rounded-xl border bg-card p-4 shadow-sm">
			<p class="text-xs font-medium text-muted-foreground">Total Final</p>
			<p class="text-xl font-bold text-primary">{data.summary.totalFinal.toLocaleString('id-ID')} kg</p>
		</div>
		<div class="rounded-xl border bg-card p-4 shadow-sm">
			<p class="text-xs font-medium text-muted-foreground">Total Biaya</p>
			<p class="text-xl font-bold">Rp {data.summary.totalCost.toLocaleString('id-ID')}</p>
		</div>
	</div>

	<!-- Receipts Table -->
	<div class="rounded-lg border">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-muted/50">
					<tr>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Tanggal</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Supplier</th>
						<th class="hidden lg:table-cell px-4 py-3 text-left font-medium text-muted-foreground">Kendaraan</th>
						<th class="hidden md:table-cell px-4 py-3 text-right font-medium text-muted-foreground">Gross</th>
						<th class="hidden md:table-cell px-4 py-3 text-right font-medium text-muted-foreground">Tara</th>
						<th class="hidden lg:table-cell px-4 py-3 text-right font-medium text-muted-foreground">Net</th>
						<th class="hidden md:table-cell px-4 py-3 text-right font-medium text-muted-foreground">Refraksi</th>
						<th class="px-4 py-3 text-right font-medium text-muted-foreground">Final</th>
						<th class="hidden sm:table-cell px-4 py-3 text-right font-medium text-muted-foreground">Harga/Kg</th>
						<th class="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
						<th class="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each data.receipts.items as r}
						<tr class="border-t transition-colors hover:bg-muted/30">
							<td class="px-4 py-3 text-xs text-muted-foreground">{new Date(r.receiptDate).toLocaleDateString('id-ID')}</td>
							<td class="px-4 py-3 font-medium">{r.supplierName}</td>
							<td class="hidden lg:table-cell px-4 py-3 text-xs">{r.vehicleNumber}{#if r.driverName} ({r.driverName}){/if}</td>
							<td class="hidden md:table-cell px-4 py-3 text-right">{r.grossWeight.toLocaleString('id-ID')}</td>
							<td class="hidden md:table-cell px-4 py-3 text-right">{r.taraWeight.toLocaleString('id-ID')}</td>
							<td class="hidden lg:table-cell px-4 py-3 text-right font-medium">{r.netWeight.toLocaleString('id-ID')}</td>
							<td class="hidden md:table-cell px-4 py-3 text-right text-warning">{r.refraction.toLocaleString('id-ID')}</td>
							<td class="px-4 py-3 text-right font-medium text-primary">{r.finalWeight.toLocaleString('id-ID')}</td>
							<td class="hidden sm:table-cell px-4 py-3 text-right">Rp {r.pricePerKg.toLocaleString('id-ID')}</td>
							<td class="px-4 py-3 text-right font-semibold">Rp {r.totalCost.toLocaleString('id-ID')}</td>
							<td class="px-4 py-3 text-center">
								<div class="flex items-center justify-center gap-1">
									<Button variant="ghost" size="sm" onclick={() => editTarget = r}><Pencil size={14} /></Button>
									<Button variant="ghost" size="sm" type="button" onclick={() => deleteTargetId = r.id} class="text-destructive hover:text-destructive" aria-label="Hapus"><Trash2 size={14} /></Button>
								</div>
							</td>
						</tr>
					{:else}
						<tr><td colspan="11" class="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada penerimaan singkong</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Add Receipt Modal -->
<Dialog open={showModal} onOpenChange={(o) => { if (!o) showModal = false; }}>
	<DialogContent class="!p-0 sm:!p-6 w-full max-w-[calc(100%-2rem)] sm:max-w-lg overflow-hidden">
		<div class="flex max-h-[90dvh] overflow-hidden flex-col">
			<DialogHeader class="px-4 pt-4 pb-0 sm:px-0 sm:pt-0">
				<DialogTitle>Tambah Penerimaan Singkong</DialogTitle>
				<DialogDescription>Catat penerimaan singkong dari supplier</DialogDescription>
			</DialogHeader>
			<form method="post" action="?/create" use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') { await update(); toast.success('Penerimaan dicatat'); showModal = false; }
					else if (result.type === 'failure') { await update(); const msg = (result.data as any)?.message; if (msg) toast.error(msg); }
				};
			}} class="flex min-h-0 flex-1 flex-col">
				<div class="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-0">
					<div class="grid gap-2">
						<label for="cs-supplier" class="text-sm font-medium">Supplier *</label>
						{#if data.suppliers.length === 0}
							<div class="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">Belum ada supplier. Tambah supplier dulu.</div>
						{/if}
						<select id="cs-supplier" name="supplierId" class="h-11 rounded-lg border bg-background px-3 text-[16px]" required disabled={data.suppliers.length === 0}>
							<option value="">{data.suppliers.length === 0 ? 'Tidak ada supplier' : 'Pilih supplier'}</option>
							{#each data.suppliers as s}
								<option value={s.id}>{s.name}</option>
							{/each}
						</select>
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div class="grid gap-2">
							<label for="cs-receipt-date" class="text-sm font-medium">Tanggal</label>
							<Input id="cs-receipt-date" name="receiptDate" type="date" bind:value={receiptDate} class="text-[16px]" />
						</div>
						<div class="grid gap-2">
							<label for="cs-vehicle-number" class="text-sm font-medium">No. Kendaraan *</label>
							<Input id="cs-vehicle-number" name="vehicleNumber" bind:value={vehicleNumber} required placeholder="Contoh: H 1234 AB" class="text-[16px]" />
						</div>
					</div>
					<div class="grid gap-2">
						<label for="cs-driver-name" class="text-sm font-medium">Nama Supir</label>
						<Input id="cs-driver-name" name="driverName" bind:value={driverName} placeholder="Opsional" class="text-[16px]" />
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div class="grid gap-2">
							<label for="cs-gross-weight" class="text-sm font-medium">Gross Weight (kg) *</label>
							<Input id="cs-gross-weight" name="grossWeight" type="number" step="0.01" bind:value={grossWeight} required class="text-[16px]" inputmode="decimal" />
						</div>
						<div class="grid gap-2">
							<label for="cs-tara-weight" class="text-sm font-medium">Tara Weight (kg) *</label>
							<Input id="cs-tara-weight" name="taraWeight" type="number" step="0.01" bind:value={taraWeight} required class="text-[16px]" inputmode="decimal" />
						</div>
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div class="grid gap-2">
							<label for="cs-refraction" class="text-sm font-medium">Refraksi (kg) *</label>
							<Input id="cs-refraction" name="refraction" type="number" step="0.01" bind:value={refraction} required class="text-[16px]" inputmode="decimal" />
						</div>
						<div class="grid gap-2">
							<label for="cs-price-per-kg" class="text-sm font-medium">Harga/Kg (Rp) *</label>
							<Input id="cs-price-per-kg" name="pricePerKg" type="number" step="50" bind:value={pricePerKg} required class="text-[16px]" inputmode="decimal" />
						</div>
					</div>
					<div class="grid gap-2">
						<label for="cs-notes" class="text-sm font-medium">Keterangan</label>
						<textarea id="cs-notes" name="notes" class="h-11 rounded-lg border bg-background px-3 py-2.5 text-[16px]" rows="2" bind:value={notes}></textarea>
					</div>
					<!-- Live Calculation -->
					<div class="rounded-lg border bg-primary/5 p-4 text-sm space-y-1">
						<p>Net Weight: <strong>{netWeight.toFixed(2)} kg</strong> (gross - tara)</p>
						<p>Final Weight: <strong>{finalWeight.toFixed(2)} kg</strong> (net - refraksi)</p>
						<p class="text-lg font-bold text-primary">Total Biaya: Rp {totalCost.toLocaleString('id-ID')}</p>
					</div>
				</div>
				<div class="sticky bottom-0 flex justify-end gap-3 border-t bg-popover px-4 py-4 sm:px-0 sm:pb-0 sm:pt-4"><Button type="button" variant="outline" onclick={() => showModal = false}>Batal</Button><Button type="submit">Simpan</Button></div>
			</form>
		</div>
	</DialogContent>
</Dialog>

<!-- Edit Receipt Modal -->
<Dialog open={editTarget !== null} onOpenChange={(o) => { if (!o) editTarget = null; }}>
	<DialogContent class="!p-0 sm:!p-6 w-full max-w-[calc(100%-2rem)] sm:max-w-lg overflow-hidden">
		<div class="flex max-h-[90dvh] overflow-hidden flex-col">
			<DialogHeader class="px-4 pt-4 pb-0 sm:px-0 sm:pt-0">
				<DialogTitle>Edit Penerimaan Singkong</DialogTitle>
				<DialogDescription>Perbarui data penerimaan</DialogDescription>
			</DialogHeader>
			<form method="post" action="?/update" use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') { await update(); toast.success('Penerimaan diperbarui'); editTarget = null; }
					else if (result.type === 'failure') { await update(); const msg = (result.data as any)?.message; if (msg) toast.error(msg); }
				};
			}} class="flex min-h-0 flex-1 flex-col">
				<input type="hidden" name="id" value={editTarget?.id || ''} />
				<div class="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-0">
					<div class="grid gap-2">
						<label for="ed-supplier" class="text-sm font-medium">Supplier *</label>
						<select id="ed-supplier" name="supplierId" class="h-11 rounded-lg border bg-background px-3 text-[16px]" required>
							<option value="">Pilih supplier</option>
							{#each data.suppliers as s}
								<option value={s.id} selected={s.id === editTarget?.supplierId}>{s.name}</option>
							{/each}
						</select>
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div class="grid gap-2">
							<label for="ed-date" class="text-sm font-medium">Tanggal</label>
							<Input id="ed-date" name="receiptDate" type="date" value={editTarget?.receiptDate ? new Date(editTarget.receiptDate).toISOString().slice(0, 10) : ''} class="text-[16px]" />
						</div>
						<div class="grid gap-2">
							<label for="ed-vehicle" class="text-sm font-medium">No. Kendaraan *</label>
							<Input id="ed-vehicle" name="vehicleNumber" value={editTarget?.vehicleNumber || ''} required class="text-[16px]" />
						</div>
					</div>
					<div class="grid gap-2">
						<label for="ed-driver" class="text-sm font-medium">Nama Supir</label>
						<Input id="ed-driver" name="driverName" value={editTarget?.driverName || ''} class="text-[16px]" />
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div class="grid gap-2">
							<label for="ed-gross" class="text-sm font-medium">Gross Weight (kg) *</label>
							<Input id="ed-gross" name="grossWeight" type="number" step="0.01" value={editTarget?.grossWeight || 0} required class="text-[16px]" inputmode="decimal" />
						</div>
						<div class="grid gap-2">
							<label for="ed-tara" class="text-sm font-medium">Tara Weight (kg) *</label>
							<Input id="ed-tara" name="taraWeight" type="number" step="0.01" value={editTarget?.taraWeight || 0} required class="text-[16px]" inputmode="decimal" />
						</div>
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div class="grid gap-2">
							<label for="ed-refr" class="text-sm font-medium">Refraksi (kg) *</label>
							<Input id="ed-refr" name="refraction" type="number" step="0.01" value={editTarget?.refraction || 0} required class="text-[16px]" inputmode="decimal" />
						</div>
						<div class="grid gap-2">
							<label for="ed-price" class="text-sm font-medium">Harga/Kg (Rp) *</label>
							<Input id="ed-price" name="pricePerKg" type="number" step="50" value={editTarget?.pricePerKg || 0} required class="text-[16px]" inputmode="decimal" />
						</div>
					</div>
					<div class="grid gap-2">
						<label for="ed-notes" class="text-sm font-medium">Keterangan</label>
						<textarea id="ed-notes" name="notes" class="h-11 rounded-lg border bg-background px-3 py-2.5 text-[16px]" rows="2">{editTarget?.notes || ''}</textarea>
					</div>
				</div>
				<div class="sticky bottom-0 flex justify-end gap-3 border-t bg-popover px-4 py-4 sm:px-0 sm:pb-0 sm:pt-4"><Button type="button" variant="outline" onclick={() => editTarget = null}>Batal</Button><Button type="submit">Simpan</Button></div>
			</form>
		</div>
	</DialogContent>
</Dialog>

<!-- Add Supplier Modal -->
<Dialog open={showSupplierModal} onOpenChange={(o) => { if (!o) showSupplierModal = false; }}>
	<DialogContent class="sm:max-w-sm">
		<DialogHeader>
			<DialogTitle>Tambah Supplier</DialogTitle>
			<DialogDescription>Tambahkan supplier singkong baru</DialogDescription>
		</DialogHeader>
		<form method="post" action="?/addSupplier" use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'success') { window.location.reload(); }
				else if (result.type === 'failure') { const msg = (result.data as any)?.message; if (msg) toast.error(msg); }
			};
		}}>
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<label for="sup-name" class="text-sm font-medium">Nama Supplier *</label>
					<Input id="sup-name" name="name" required placeholder="Nama supplier" />
				</div>
				<div class="grid gap-2">
					<label for="sup-phone" class="text-sm font-medium">Telepon</label>
					<Input id="sup-phone" name="phone" placeholder="Opsional" />
				</div>
				<div class="grid gap-2">
					<label for="sup-addr" class="text-sm font-medium">Alamat</label>
					<textarea id="sup-addr" name="address" class="rounded-lg border bg-background px-3 py-2 text-sm" rows="2" placeholder="Opsional"></textarea>
				</div>
			</div>
			<DialogFooter><Button type="submit">Simpan</Button></DialogFooter>
		</form>
	</DialogContent>
</Dialog>

<Dialog open={deleteTargetId !== null} onOpenChange={(o) => { if (!o) deleteTargetId = null; }}>
	<DialogContent class="sm:max-w-sm">
		<DialogHeader>
			<DialogTitle>Hapus Penerimaan?</DialogTitle>
			<DialogDescription>Tindakan ini tidak bisa dibatalkan.</DialogDescription>
		</DialogHeader>
		<DialogFooter class="gap-2">
			<Button variant="outline" onclick={() => deleteTargetId = null}>Batal</Button>
			<form method="post" action="?/delete" use:enhance={() => {
				return async ({ result, update }) => {
					update();
					if (result.type === 'success') { deleteTargetId = null; toast.success('Penerimaan dihapus'); await invalidateAll(); }
					else if (result.type === 'failure') { const msg = (result.data as any)?.message; if (msg) toast.error(msg); }
				};
			}}>
				<input type="hidden" name="id" value={deleteTargetId ?? ''} />
				<Button variant="destructive" type="submit">Hapus</Button>
			</form>
		</DialogFooter>
	</DialogContent>
</Dialog>
