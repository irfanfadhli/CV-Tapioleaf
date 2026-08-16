<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { LogOut, LayoutDashboard, Package, Warehouse, Factory, Tags, Menu, X, Wheat, Building2, Home, ShoppingBag } from '@lucide/svelte';
	import { Toaster } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { notifications } from '$lib/stores/notifications';
	import NotificationToast from '$lib/components/order/NotificationToast.svelte';

	let { children, data } = $props();

	let sidebarOpen = $state(false);
	let showNewOrderToast = $state(false);
	let toastOrder = $state<{ id: string; customerName: string | null; totalAmount: string } | null>(null);
	let lastKnownCount = $state(0);

	const roleLabels: Record<string, string> = {
		owner: 'Owner',
		admin_penjualan: 'Admin Penjualan',
		petugas_gudang: 'Petugas Gudang',
		bagian_produksi: 'Bagian Produksi'
	};

	function closeSidebar() { sidebarOpen = false; }

	function handleLogout() {
		fetch('/api/sign-out', { method: 'POST' }).catch(() => {});
		window.location.href = '/login';
	}

	onMount(() => {
		lastKnownCount = data.pendingCount || 0;
		notifications.refresh();
		const interval = setInterval(() => {
			notifications.refresh().then(() => {
				const state = get(notifications);
				if (state.pendingCount > lastKnownCount) {
					// New order arrived
					lastKnownCount = state.pendingCount;
					if (state.recentPending.length > 0) {
						const newest = state.recentPending[0];
						toastOrder = { id: newest.id, customerName: newest.customerName, totalAmount: newest.totalAmount };
						showNewOrderToast = true;
						notifications.markSeen(newest.id);
					}
				} else if (state.pendingCount < lastKnownCount) {
					// Order was processed (approved/cancelled)
					lastKnownCount = state.pendingCount;
				}
			});
		}, 30000);

		return () => clearInterval(interval);
	});

	function dismissToast() {
		showNewOrderToast = false;
	}

	function handleToastClick() {
		if (toastOrder) {
			goto(`/admin-orders/${toastOrder.id}`);
			dismissToast();
		}
	}
</script>

	<!-- Toast notifications -->
	{#if showNewOrderToast && toastOrder}
		<div class="fixed top-20 right-4 z-[100] max-w-xs animate-in slide-in-from-top-2 duration-300">
			<button onclick={handleToastClick} class="block w-full text-left cursor-pointer">
				<NotificationToast
					customerName={toastOrder.customerName}
					totalAmount={toastOrder.totalAmount}
					onDismiss={dismissToast}
				/>
			</button>
		</div>
	{/if}

	<Toaster position="top-right" richColors />
	<div class="flex min-h-screen bg-background">
	<!-- Mobile overlay -->
	{#if sidebarOpen}
		<button class="fixed inset-0 z-40 bg-foreground/80 backdrop-blur-sm md:hidden" onclick={closeSidebar} aria-label="Tutup menu"></button>
	{/if}

	<!-- Sidebar -->
	<aside class="fixed inset-y-0 left-0 z-50 flex w-64 max-w-[80vw] flex-col overflow-y-auto border-r bg-card px-4 py-6 transition-transform md:static md:translate-x-0" class:-translate-x-full={!sidebarOpen}>
		<div class="mb-6 flex items-center justify-between px-2 md:justify-start md:gap-3">
			<div class="flex items-center gap-3">
				<a href="/dashboard"><img src="/img/logo.png" alt="TapioLeaf" class="h-10 w-10 rounded-full object-cover" /></a>
				<div class="hidden md:block">
					<p class="font-semibold leading-tight">{data.user.name}</p>
					<p class="text-xs text-muted-foreground">{roleLabels[data.user.role] || data.user.role}</p>
				</div>
			</div>
			<button onclick={closeSidebar} class="md:hidden"><X size={20} /></button>
		</div>
		<div class="mb-4 px-2 md:hidden">
			<p class="font-semibold leading-tight text-sm">{data.user.name}</p>
			<p class="text-xs text-muted-foreground">{roleLabels[data.user.role] || data.user.role}</p>
		</div>
		<Separator class="mb-4" />
		<nav class="flex flex-1 flex-col gap-1">
			<a href="/dashboard" onclick={closeSidebar} class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground" class:bg-accent={$page.url.pathname === '/dashboard'}>
				<LayoutDashboard size={18} /> Dashboard
			</a>
		<a href="/admin-orders" onclick={closeSidebar} class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground" class:bg-accent={$page.url.pathname === '/admin-orders' || $page.url.pathname.startsWith('/admin-orders')}>
			<ShoppingBag size={18} /> Pesanan
			{#if $notifications.pendingCount > 0}
				<span class="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500/10 px-1.5 text-[10px] font-bold text-red-600">
					{$notifications.pendingCount > 9 ? '9+' : $notifications.pendingCount}
				</span>
			{/if}
		</a>
			<div class="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bahan Baku</div>
			<a href="/suppliers" onclick={closeSidebar} class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground" class:bg-accent={$page.url.pathname === '/suppliers'}>
				<Building2 size={18} /> Supplier
			</a>
			<a href="/cassava" onclick={closeSidebar} class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground" class:bg-accent={$page.url.pathname === '/cassava'}>
				<Wheat size={18} /> Penerimaan Singkong
			</a>
			<div class="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Produksi</div>
			<a href="/production" onclick={closeSidebar} class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground" class:bg-accent={$page.url.pathname === '/production' || $page.url.pathname === '/production/history'}>
				<Factory size={18} /> Produksi Harian
			</a>
			<div class="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stok & Produk</div>
			<a href="/warehouses" onclick={closeSidebar} class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground" class:bg-accent={$page.url.pathname === '/warehouses' || $page.url.pathname === '/warehouses/history'}>
				<Warehouse size={18} /> Gudang
			</a>
			<a href="/categories" onclick={closeSidebar} class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground" class:bg-accent={$page.url.pathname === '/categories'}>
				<Tags size={18} /> Kategori Produk
			</a>
			<a href="/products" onclick={closeSidebar} class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground" class:bg-accent={$page.url.pathname === '/products'}>
				<Package size={18} /> Produk
			</a>
		</nav>
		<Separator class="my-4" />
		<a href="/" class="mb-2"><Button variant="ghost" class="w-full justify-start gap-3"><Home size={18} /> Landing Page</Button></a>
		<Button variant="outline" class="w-full justify-start gap-3" onclick={handleLogout}>
			<LogOut size={18} /> Keluar
		</Button>
	</aside>

	<!-- Main -->
	<main class="min-w-0 flex-1">
		<!-- Mobile header -->
		<div class="sticky top-0 z-30 flex items-center gap-3 border-b bg-background px-4 py-3 md:hidden">
			<Button variant="ghost" size="icon" onclick={() => sidebarOpen = true}>
				<Menu size={18} />
				<span class="sr-only">Menu</span>
			</Button>
			<a href="/dashboard" class="flex items-center gap-2">
				<img src="/img/logo.png" alt="TapioLeaf" class="h-7 w-7 rounded-full object-cover" />
				<span class="text-sm font-semibold">CV TapioLeaf</span>
			</a>
		</div>
		<div class="p-4 md:p-8">
			{@render children()}
		</div>
	</main>
</div>
