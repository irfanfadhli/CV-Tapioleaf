<script lang="ts">
	import { X as XIcon, CheckCircle2, AlertCircle, ShoppingBag } from '@lucide/svelte';
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

	let isApproved = $derived(type === 'order_approved');
</script>

<div
	class="w-full max-w-sm overflow-hidden rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 {isApproved
		? 'border-primary/30 bg-card/95 ring-1 ring-primary/10'
		: 'border-destructive/30 bg-card/95 ring-1 ring-destructive/10'}"
>
	<div class="flex items-start gap-3 p-4">
		<div
			class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl {isApproved
				? 'bg-primary/10 text-primary'
				: 'bg-destructive/10 text-destructive'}"
		>
			{#if isApproved}
				<CheckCircle2 size={18} />
			{:else}
				<AlertCircle size={18} />
			{/if}
		</div>

		<div class="min-w-0 flex-1">
			<div class="flex items-center justify-between gap-2">
				<p
					class="text-xs font-bold uppercase tracking-wider {isApproved
						? 'text-primary'
						: 'text-destructive'}"
				>
					{isApproved ? 'Pesanan Disetujui' : 'Pesanan Dibatalkan'}
				</p>
				<button
					type="button"
					onclick={onDismiss}
					class="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
					aria-label="Tutup"
				>
					<XIcon size={14} />
				</button>
			</div>

			<p class="mt-1 text-xs sm:text-sm font-medium text-foreground leading-snug">
				{message}
			</p>

			{#if totalAmount}
				<p class="mt-1.5 text-xs font-semibold text-muted-foreground">
					Total: <span class="text-foreground">Rp {Number(totalAmount).toLocaleString('id-ID')}</span>
				</p>
			{/if}

			<div class="mt-3 flex items-center gap-2">
				<Button
					size="sm"
					variant={isApproved ? 'default' : 'secondary'}
					class="h-8 flex-1 text-xs gap-1.5 font-medium"
					onclick={onAccept}
				>
					<ShoppingBag size={13} />
					Lihat Pesanan
				</Button>
				<Button
					size="sm"
					variant="ghost"
					class="h-8 text-xs text-muted-foreground hover:text-foreground"
					onclick={onDismiss}
				>
					Nanti
				</Button>
			</div>
		</div>
	</div>
</div>