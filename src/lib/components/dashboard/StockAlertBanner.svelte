<script lang="ts">
	import { goto } from '$app/navigation';
	import { AlertTriangle, ArrowRight, X } from '@lucide/svelte';

	let { products: criticalProducts = [] as Array<{ name: string; currentStock: number; minimumStock: number }> }: {
		products?: Array<{ name: string; currentStock: number; minimumStock: number }>;
	} = $props();

	let dismissed = $state(false);
</script>

{#if criticalProducts.length > 0 && !dismissed}
	<div class="rounded-xl border border-amber-300/80 bg-amber-50/90 p-4 shadow-xs">
		<div class="flex items-start justify-between gap-3">
			<div class="flex items-start gap-3">
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-200/80 text-amber-800">
					<AlertTriangle size={18} />
				</div>
				<div>
					<p class="text-sm font-bold text-amber-900">
						{criticalProducts.length} produk membutuhkan restok segera
					</p>
					<ul class="mt-1 space-y-0.5 text-xs sm:text-sm text-amber-800">
						{#each criticalProducts as p}
							<li class="flex items-center gap-1.5">
								<span class="inline-block h-1.5 w-1.5 rounded-full bg-amber-600"></span>
								<span class="font-medium text-amber-950">{p.name}</span>
								<span class="text-amber-700">
									— sisa stok: <strong class="font-bold text-red-600">{p.currentStock}</strong> (min: {p.minimumStock})
								</span>
							</li>
						{/each}
					</ul>
				</div>
			</div>
			<div class="flex items-center gap-2 shrink-0">
				<button
					type="button"
					onclick={() => goto('/warehouses')}
					class="inline-flex cursor-pointer items-center gap-1 text-xs sm:text-sm font-semibold text-amber-900 hover:text-amber-950 underline underline-offset-2"
				>
					Lihat Detail
					<ArrowRight size={14} />
				</button>
				<button
					type="button"
					onclick={() => dismissed = true}
					class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-amber-700 hover:bg-amber-200/60 hover:text-amber-950 transition-colors"
					aria-label="Tutup notifikasi"
				>
					<X size={16} />
				</button>
			</div>
		</div>
	</div>
{/if}
