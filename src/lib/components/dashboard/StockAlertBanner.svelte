<script lang="ts">
	import { goto } from '$app/navigation';

	let { products: criticalProducts = [] as Array<{ name: string; currentStock: number; minimumStock: number }> }: {
		products?: Array<{ name: string; currentStock: number; minimumStock: number }>;
	} = $props();

	let dismissed = $state(false);
</script>

{#if criticalProducts.length > 0 && !dismissed}
	<div class="rounded-xl border border-warning/40 bg-warning/10 p-4">
		<div class="flex items-start justify-between">
			<div class="flex items-start gap-3">
				<span class="text-xl">⚠️</span>
				<div>
					<p class="font-medium text-warning">{criticalProducts.length} produk membutuhkan restock segera</p>
					<ul class="mt-1 list-inside list-disc text-sm text-warning">
						{#each criticalProducts as p}
							<li>{p.name} — stok: {p.currentStock} (min: {p.minimumStock})</li>
						{/each}
					</ul>
				</div>
			</div>
			<div class="flex items-center gap-2 shrink-0">
				<button onclick={() => goto('/warehouses')} class="text-sm font-medium text-warning underline hover:text-warning">Lihat Detail →</button>
				<button onclick={() => dismissed = true} class="text-sm text-warning hover:text-warning">✕</button>
			</div>
		</div>
	</div>
{/if}
