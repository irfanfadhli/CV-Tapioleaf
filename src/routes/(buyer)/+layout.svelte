<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { LogOut, ShoppingBag, Package } from '@lucide/svelte';
	import { Toaster } from 'svelte-sonner';

	let { children } = $props();

	function handleLogout() {
		fetch('/api/sign-out', { method: 'POST' }).catch(() => {});
		window.location.href = '/';
	}
</script>

<Toaster position="bottom-right" richColors />
<div class="min-h-screen bg-gray-50">
	<header class="border-b bg-white">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
			<div class="flex items-center gap-2">
				<a href="/"
					><img src="/img/logo.png" alt="TapioLeaf" class="h-8 w-8 rounded-xl object-cover" /></a
				>
				<span class="text-sm font-semibold">CV TapioLeaf</span>
			</div>
			<div class="flex items-center gap-2">
				<a href="/#products"
					><Button variant="outline" size="sm"><Package size={14} class="mr-1" /> Katalog</Button
					></a
				>
				<a href="/orders"
					><Button variant="outline" size="sm"><ShoppingBag size={14} class="mr-1" /> Pesanan</Button
					></a
				>
				<Button variant="outline" size="sm" onclick={handleLogout}
					><LogOut size={14} class="mr-1" /> Keluar</Button
				>
			</div>
		</div>
	</header>
	<main class="mx-auto max-w-5xl px-4 py-8">
		{@render children()}
	</main>
</div>