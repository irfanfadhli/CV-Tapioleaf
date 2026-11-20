<script lang="ts">
	import { X as XIcon, CheckCircle2, AlertCircle, ShoppingBag } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	let {
		message,
		cancellationReason,
		totalAmount,
		type,
		onAccept,
		onDismiss
	}: {
		message: string;
		cancellationReason?: string | null;
		totalAmount: string | null;
		type: string;
		onAccept: () => void;
		onDismiss: () => void;
	} = $props();

	let isApproved = $derived(type === 'order_approved');
</script>

<div
	class="w-full max-w-sm overflow-hidden rounded-xl sm:rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-300 {isApproved
		? 'border-primary/30 bg-card/95 ring-1 ring-primary/10'
		: 'border-destructive/30 bg-card/95 ring-1 ring-destructive/10'}"
>
	<div class="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4">
		<div
			class="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl {isApproved
				? 'bg-primary/10 text-primary'
				: 'bg-destructive/10 text-destructive'}"
		>
			{#if isApproved}
				<CheckCircle2 size={16} class="sm:w-[18px] sm:h-[18px]" />
			{:else}
				<AlertCircle size={16} class="sm:w-[18px] sm:h-[18px]" />
			{/if}
		</div>

		<div class="min-w-0 flex-1">
			<div class="flex items-center justify-between gap-1.5">
				<p
					class="text-[11px] sm:text-xs font-bold uppercase tracking-wider {isApproved
						? 'text-primary'
						: 'text-destructive'}"
				>
					{isApproved ? 'Pesanan Disetujui' : 'Pesanan Dibatalkan'}
				</p>
				<button
					type="button"
					onclick={onDismiss}
					class="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors -mr-1 -mt-1"
					aria-label="Tutup"
				>
					<XIcon size={13} />
				</button>
			</div>

			<p class="mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium text-foreground leading-snug line-clamp-2">
				{message.split('. Alasan:')[0]}
			</p>

			{#if !isApproved && cancellationReason}
				<div class="mt-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2 space-y-0.5">
					<p class="text-[10px] font-bold uppercase tracking-wider text-destructive">
						Alasan:
					</p>
					<p class="text-xs font-semibold text-foreground leading-snug line-clamp-3 whitespace-pre-wrap">
						{cancellationReason}
					</p>
				</div>
			{/if}

			{#if totalAmount}
				<p class="mt-1 text-[11px] sm:text-xs font-semibold text-muted-foreground">
					Total: <span class="text-foreground">Rp {Number(totalAmount).toLocaleString('id-ID')}</span>
				</p>
			{/if}

			<div class="mt-2.5 sm:mt-3 flex items-center gap-1.5 sm:gap-2">
				<Button
					size="sm"
					variant={isApproved ? 'default' : 'secondary'}
					class="h-7 sm:h-8 flex-1 text-[11px] sm:text-xs gap-1 font-medium px-2.5"
					onclick={onAccept}
				>
					<ShoppingBag size={12} />
					Lihat Pesanan
				</Button>
				<Button
					size="sm"
					variant="ghost"
					class="h-7 sm:h-8 text-[11px] sm:text-xs text-muted-foreground hover:text-foreground px-2"
					onclick={onDismiss}
				>
					Tutup
				</Button>
			</div>
		</div>
	</div>
</div>