<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { TriangleAlert } from '@lucide/svelte';

	let {
		open = false,
		title = 'Konfirmasi',
		description = '',
		confirmLabel = 'Hapus',
		cancelLabel = 'Batal',
		variant = 'danger' as 'danger' | 'default',
		onConfirm = () => {},
		onCancel = () => {},
	}: {
		open: boolean;
		title?: string;
		description?: string;
		confirmLabel?: string;
		cancelLabel?: string;
		variant?: 'danger' | 'default';
		onConfirm: () => void;
		onCancel?: () => void;
	} = $props();

	let cancelRef: HTMLButtonElement | undefined = $state();

	$effect(() => {
		if (open) {
			requestAnimationFrame(() => cancelRef?.focus());
		}
	});
</script>

<Dialog.Root open={open} onOpenChange={(v) => { if (!v) onCancel?.(); }}>
	<Dialog.Content showCloseButton={false}>
		<div class="flex flex-col items-center gap-4 text-center">
			{#if variant === 'danger'}
				<div class="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
					<TriangleAlert size={24} class="text-destructive" />
				</div>
			{/if}
			<div>
				<h3 class="text-lg font-semibold">{title}</h3>
				{#if description}
					<p class="mt-1 text-sm text-muted-foreground">{description}</p>
				{/if}
			</div>
		</div>
		<div class="flex justify-center gap-3">
			<Button variant="outline" onclick={() => { onCancel?.(); }} bind:ref={cancelRef}>{cancelLabel}</Button>
			<Button
				variant={variant === 'danger' ? 'destructive' : 'default'}
				onclick={() => { onConfirm(); }}
			>{confirmLabel}</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>