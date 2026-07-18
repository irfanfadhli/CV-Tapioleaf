<script lang="ts">
	import { goto } from '$app/navigation';

	let { transactions = [] as Array<{ id: string; customerName: string | null; totalAmount: string; status: string; createdAt: Date | null }>, loading = false }: {
		transactions?: Array<{ id: string; customerName: string | null; totalAmount: string; status: string; createdAt: Date | null }>;
		loading?: boolean;
	} = $props();

	function statusBadge(status: string): string {
		const map: Record<string, string> = { PAID: 'bg-primary/10 text-primary', PENDING: 'bg-warning/20 text-warning', CANCELLED: 'bg-destructive/10 text-destructive' };
		return map[status] || 'bg-muted text-muted-foreground';
	}

	function statusLabel(status: string): string {
		const map: Record<string, string> = { PAID: 'Lunas', PENDING: 'Menunggu', CANCELLED: 'Batal' };
		return map[status] || status;
	}
</script>

<div class="rounded-xl border bg-card p-5 shadow-sm">
	<h3 class="mb-3 text-sm font-semibold text-muted-foreground">🕐 Transaksi Terbaru</h3>
	{#if loading}
		<div class="animate-pulse space-y-3">
			{#each [1,2,3,4,5] as _}
				<div class="h-8 w-full rounded bg-muted"></div>
			{/each}
		</div>
	{:else if transactions.length === 0}
		<p class="py-6 text-center text-sm text-muted-foreground">Belum ada transaksi</p>
	{:else}
		<div class="space-y-2">
			{#each transactions as t}
				<button onclick={() => goto(`/orders/${t.id}`)} class="flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors hover:bg-muted/50">
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{t.customerName || 'Anonim'}</p>
						<p class="text-xs text-muted-foreground">#{t.id.slice(0, 8).toUpperCase()} · {t.createdAt ? new Date(t.createdAt).toLocaleString('id-ID') : '-'}</p>
					</div>
					<div class="flex items-center gap-2 shrink-0">
						<span class="text-sm font-semibold">Rp {Number(t.totalAmount).toLocaleString('id-ID')}</span>
						<span class="rounded-full px-2 py-0.5 text-xs font-medium {statusBadge(t.status)}">{statusLabel(t.status)}</span>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
