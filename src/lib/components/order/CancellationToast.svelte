<script lang="ts">
	import { X as XIcon } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	let {
		message,
		totalAmount,
		type,
		onAccept,
		onDismiss
	}: {
		message: string;
		totalAmount: string | null;
		type: string;
		onAccept: () => void;
		onDismiss: () => void;
	} = $props();
</script>

<div class="w-full max-w-sm overflow-hidden rounded-xl border border-destructive/20 bg-card shadow-lg">
	<div class="flex items-start gap-2 px-4 py-2.5">
		<XIcon class="mt-0.5 text-destructive" size={16} />
		<div>
			<p class="font-medium text-destructive text-sm">{message}</p>
			{#if totalAmount}
				<p class="mt-1.5 text-sm font-semibold">Total pesanan: Rp {Number(totalAmount).toLocaleString('id-ID')}</p>
			{/if}
			{#if type === 'order_cancelled'}
				<p class="mt-1.5 text-sm text-muted-foreground">Pesanan dibatalkan oleh Admin</p>
			{:else if type === 'order_approved'}
				<p class="mt-1.5 text-sm font-semibold">Pesanan disetujui oleh Admin</p>
			{/if}
		</div>
	</div>
	<div class="flex items-center gap-2 px-4 pb-3">
		<Button size="sm" class="flex-1" onclick={onAccept}>Lihat Pesanan</Button>
		<Button variant="ghost" size="icon-sm" onclick={onDismiss}><XIcon size={14} /></Button>
	</div>
</div>