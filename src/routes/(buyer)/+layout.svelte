<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Menu } from '@lucide/svelte';
	import { Toaster } from 'svelte-sonner';
	import { page } from '$app/stores';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { onMount } from 'svelte';
	import CancellationToast from '$lib/components/order/CancellationToast.svelte';

	let { children, data } = $props();

	function handleLogout() {
		fetch('/api/sign-out', { method: 'POST' }).catch(() => {});
		window.location.href = '/login';
	}

	let unreadCount = $state(data.unreadCount || 0);
	let currentToast = $state<{ orderId: string; message: string; totalAmount: string | null; type: string } | null>(null);

	async function pollNotifications() {
		try {
			const res = await fetch('/api/user/notifications', { cache: 'no-store' });
			if (!res.ok) return;
			const result = await res.json() as { notifications: { id: string; orderId: string; type: string; message: string; totalAmount: string | null }[]; count: number };
			unreadCount = result.count;

			const relevant = result.notifications.filter((n) => n.type === 'order_cancelled' || n.type === 'order_approved');
			if (relevant.length > 0 && !currentToast) {
				const n = relevant[0];
				currentToast = { orderId: n.orderId, message: n.message, totalAmount: n.totalAmount, type: n.type };
				markAllRead(relevant.map((r) => r.id));
			}
		} catch {
			// silence
		}
	}

	async function markAllRead(ids: string[]) {
		if (ids.length === 0) return;
		try {
			await fetch('/api/user/notifications', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids })
			});
		} catch {
			// silence
		}
	}

	function dismissToast() {
		currentToast = null;
	}

	function goToOrder(orderId: string) {
		window.location.href = `/orders/${orderId}`;
	}

	onMount(() => {
		const interval = setInterval(pollNotifications, 30000);
		return () => clearInterval(interval);
	});
</script>

<Toaster position="bottom-right" richColors />
{#if currentToast}
	<div class="fixed bottom-4 right-4 z-[100] max-w-sm animate-in slide-in-from-bottom-2 duration-300">
		<CancellationToast
			message={currentToast.message}
			totalAmount={currentToast.totalAmount}
			type={currentToast.type}
			onAccept={() => { goToOrder(currentToast!.orderId); }}
			onDismiss={dismissToast}
		/>
	</div>
{/if}
<div class="min-h-screen bg-background">
	<header class="border-b bg-card">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
			<div class="flex items-center gap-2">
				<a href="/"
					><picture><source srcset="/img/logo.webp" type="image/webp" /><img src="/img/logo.png" alt="TapioLeaf" class="h-8 w-8 rounded-xl object-cover" width="32" height="32" loading="lazy" decoding="async" /></picture></a
				>
				<span class="text-sm font-semibold">CV TapioLeaf</span>
			</div>
			<div class="hidden items-center gap-6 text-sm md:flex">
				<a
					href="/#products"
					class="text-sm font-medium transition-colors duration-200 hover:text-foreground {$page.url.pathname === '/' ? 'text-primary font-semibold' : 'text-muted-foreground'}"
				>
					Katalog
				</a>
				<a
					href="/account"
					class="text-sm font-medium transition-colors duration-200 hover:text-foreground {$page.url.pathname.startsWith('/account') || $page.url.pathname.startsWith('/orders') ? 'text-primary font-semibold' : 'text-muted-foreground'}"
				>
					Dashboard
				</a>
				<button
					type="button"
					class="cursor-pointer text-sm font-medium text-destructive/80 transition-colors duration-200 hover:text-destructive"
					onclick={handleLogout}
				>
					Keluar
				</button>
			</div>
			<div class="md:hidden">
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Button variant="ghost" size="icon">
							<Menu size={18} />
							<span class="sr-only">Menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" class="w-44">
						<DropdownMenuItem class={$page.url.pathname === '/' ? 'text-primary font-semibold' : ''}>
							<a href="/#products" class="flex w-full items-center">Katalog</a>
						</DropdownMenuItem>
						<DropdownMenuItem class={$page.url.pathname.startsWith('/account') || $page.url.pathname.startsWith('/orders') ? 'text-primary font-semibold' : ''}>
							<a href="/account" class="flex w-full items-center">Dashboard</a>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onclick={handleLogout} class="text-destructive">
							Keluar
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	</header>
	<main class="mx-auto max-w-5xl px-4 py-8">
		{@render children()}
	</main>
</div>