<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { LogOut, LayoutDashboard, Package, Warehouse, Factory, Tags, Menu, X } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { Toaster } from 'svelte-sonner';

	let { children, data } = $props();

	let sidebarOpen = $state(false);

	const roleLabels: Record<string, string> = {
		owner: 'Owner',
		admin_penjualan: 'Admin Penjualan',
		petugas_gudang: 'Petugas Gudang',
		bagian_produksi: 'Bagian Produksi'
	};

	function closeSidebar() { sidebarOpen = false; }

	function handleLogout() {
		fetch('/api/auth/sign-out', { method: 'POST', headers: { 'Content-Type': 'application/json' } }).catch(() => {});
		document.cookie = 'better-auth.session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
		document.cookie = 'better-auth.session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + location.hostname;
		goto('/login');
	}
</script>

<Toaster position="top-right" richColors />
<div class="flex min-h-screen bg-background">
	<!-- Mobile overlay -->
	{#if sidebarOpen}
		<button class="fixed inset-0 z-40 bg-black/50 md:hidden" onclick={closeSidebar} aria-label="Tutup menu"></button>
	{/if}

	<!-- Sidebar -->
	<aside class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card px-4 py-6 transition-transform md:static md:translate-x-0" class:-translate-x-full={!sidebarOpen}>
		<div class="mb-6 flex items-center justify-between px-2 md:justify-start md:gap-3">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">TL</div>
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
			<a href="/kategori" onclick={closeSidebar} class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground" class:bg-accent={$page.url.pathname === '/kategori'}>
				<Tags size={18} /> Kategori Produk
			</a>
			<a href="/produk" onclick={closeSidebar} class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground" class:bg-accent={$page.url.pathname === '/produk'}>
				<Package size={18} /> Produk
			</a>
			<a href="/gudang" onclick={closeSidebar} class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground" class:bg-accent={$page.url.pathname === '/gudang' || $page.url.pathname === '/gudang/riwayat'}>
				<Warehouse size={18} /> Gudang
			</a>
			<a href="/produksi" onclick={closeSidebar} class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground" class:bg-accent={$page.url.pathname === '/produksi' || $page.url.pathname === '/produksi/riwayat'}>
				<Factory size={18} /> Produksi
			</a>
		</nav>
		<Separator class="my-4" />
		<Button variant="outline" class="w-full justify-start gap-3" onclick={handleLogout}>
			<LogOut size={18} /> Keluar
		</Button>
	</aside>

	<!-- Main -->
	<main class="min-w-0 flex-1">
		<!-- Mobile header -->
		<div class="sticky top-0 z-30 flex items-center gap-3 border-b bg-background px-4 py-3 md:hidden">
			<button onclick={() => sidebarOpen = true}><Menu size={22} /></button>
			<div class="flex items-center gap-2">
				<div class="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">TL</div>
				<span class="text-sm font-semibold">CV TapioLeaf</span>
			</div>
		</div>
		<div class="p-4 md:p-8">
			{@render children()}
		</div>
	</main>
</div>
