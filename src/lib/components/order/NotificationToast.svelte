<script lang="ts">
	import { XCircle } from '@lucide/svelte';

	let { customerName, totalAmount, onDismiss } = $props();
</script>

<div class="fixed top-4 right-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 shadow-lg animate-in fade-in-0 flex items-start gap-2 w-72">
	<div class="flex items-start gap-2">
		<XCircle class="mt-0.5 text-red-500 shrink-0" />
		<div>
			<p class="font-medium">Pesanan Baru</p>
			<p class="mt-0.5 text-sm"><strong>{customerName || 'Pelanggan'}</strong></p>
			<p class="mt-0.5 text-xs">Rp {totalAmount} · Menunggu persetujuan admin</p>
		</div>
	</div>
	<button
		onclick={onDismiss}
		class="absolute right-2 top-2 rounded-full p-1.5 text-red-400 hover:text-red-300">
		<XCircle class="h-4 w-4" />
	</button>
</div>