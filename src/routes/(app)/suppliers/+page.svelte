<script lang="ts">
	import { Building2, Phone, MapPin, Trash2 } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';

	let { data } = $props();
</script>

<div class="space-y-6">
	<div class="flex items-center gap-3">
		<Building2 size={24} class="text-emerald-600" />
		<h1 class="text-xl font-bold md:text-2xl">Daftar Supplier</h1>
	</div>

	{#if data.suppliers.length === 0}
		<div class="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">Belum ada supplier</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.suppliers as s}
				<div class="relative rounded-xl border bg-white p-5 shadow-sm">
					<div class="flex items-start justify-between">
						<div>
							<h3 class="font-semibold">{s.name}</h3>
							<div class="mt-2 space-y-1 text-sm text-muted-foreground">
								{#if s.phone}
									<p class="flex items-center gap-2"><Phone size={14} /> {s.phone}</p>
								{/if}
								{#if s.address}
									<p class="flex items-center gap-2"><MapPin size={14} /> {s.address}</p>
								{/if}
							</div>
						</div>
						<form method="post" action="?/delete" use:enhance={() => {
							return async ({ result }) => {
								if (result.type === 'success') { toast.success('Supplier dihapus'); }
								else if (result.type === 'failure') { const msg = (result.data as any)?.message; if (msg) toast.error(msg); }
							};
						}} onsubmit={(e) => { if (!confirm('Hapus supplier ini?')) e.preventDefault(); }}>
							<input type="hidden" name="id" value={s.id} />
							<Button variant="ghost" size="sm" type="submit" class="text-red-500 hover:text-red-700"><Trash2 size={16} /></Button>
						</form>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
