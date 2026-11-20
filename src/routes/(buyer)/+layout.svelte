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

	let unreadCount = $state(0);
	$effect(() => {
		unreadCount = data.unreadCount || 0;
	});
	let currentToast = $state<{ orderId: string; message: string; cancellationReason?: string | null; totalAmount: string | null; type: string } | null>(null);

	async function pollNotifications() {
		try {
			const res = await fetch('/api/user/notifications', { cache: 'no-store' });
			if (!res.ok) return;
			const result = await res.json() as { notifications: { id: string; orderId: string; type: string; message: string; cancellationReason?: string | null; totalAmount: string | null }[]; count: number };
			unreadCount = result.count;

			const relevant = result.notifications.filter((n) => n.type === 'order_cancelled' || n.type === 'order_approved');
			if (relevant.length > 0 && !currentToast) {
				const n = relevant[0];
				currentToast = { orderId: n.orderId, message: n.message, cancellationReason: n.cancellationReason || null, totalAmount: n.totalAmount, type: n.type };
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
		pollNotifications();
		const interval = setInterval(pollNotifications, 10000);
		return () => clearInterval(interval);
	});
</script>

<Toaster position="bottom-right" richColors />
{#if currentToast}
	<div class="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-4 z-[100] sm:max-w-sm animate-in slide-in-from-bottom-2 duration-300 pointer-events-none">
		<div class="pointer-events-auto">
			<CancellationToast
				message={currentToast.message}
				cancellationReason={currentToast.cancellationReason}
				totalAmount={currentToast.totalAmount}
				type={currentToast.type}
				onAccept={() => { goToOrder(currentToast!.orderId); }}
				onDismiss={dismissToast}
			/>
		</div>
	</div>
{/if}
<div class="min-h-screen bg-background">
	<header class="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md transition-all">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-3.5">
			<div class="flex items-center gap-3">
				<a href="/" class="flex items-center gap-2.5 transition-transform hover:scale-[1.02]">
					<picture>
						<source srcset="/img/logo.webp" type="image/webp" />
						<img src="/img/logo.png" alt="TapioLeaf" class="h-9 w-9 rounded-xl object-cover shadow-2xs ring-1 ring-border" width="36" height="36" loading="lazy" decoding="async" />
					</picture>
					<div>
						<span class="text-sm font-bold tracking-tight text-foreground block leading-none">CV TapioLeaf</span>
						<span class="text-[10px] text-muted-foreground tracking-wide font-medium">Customer Portal</span>
					</div>
				</a>
			</div>

			<div class="hidden items-center gap-2 text-sm md:flex">
				<a
					href="/#products"
					class="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 {$page.url.pathname === '/' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}"
				>
					Katalog Produk
				</a>
				<a
					href="/account"
					class="relative rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 {$page.url.pathname.startsWith('/account') || $page.url.pathname.startsWith('/orders') ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}"
				>
					Dashboard
					{#if unreadCount > 0}
						<span class="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
							{unreadCount}
						</span>
					{/if}
				</a>
				<div class="h-4 w-px bg-border/60 mx-1"></div>
				<button
					type="button"
					class="cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium text-destructive/90 transition-all hover:bg-destructive/10 hover:text-destructive active:scale-95"
					onclick={handleLogout}
				>
					Keluar
				</button>
			</div>

			<div class="md:hidden">
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Button variant="ghost" size="icon" class="h-9 w-9 rounded-xl">
							<Menu size={18} />
							<span class="sr-only">Menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" class="w-48 rounded-xl shadow-lg">
						<DropdownMenuItem class={$page.url.pathname === '/' ? 'text-primary font-semibold' : ''}>
							<a href="/#products" class="flex w-full items-center">Katalog Produk</a>
						</DropdownMenuItem>
						<DropdownMenuItem class={$page.url.pathname.startsWith('/account') || $page.url.pathname.startsWith('/orders') ? 'text-primary font-semibold' : ''}>
							<a href="/account" class="flex w-full items-center justify-between">
								<span>Dashboard</span>
								{#if unreadCount > 0}
									<span class="rounded-full bg-destructive px-1.5 py-0.2 text-[10px] font-bold text-destructive-foreground">
										{unreadCount}
									</span>
								{/if}
							</a>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onclick={handleLogout} class="text-destructive font-medium">
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