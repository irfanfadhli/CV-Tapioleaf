<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { LogOut, ShoppingBag, Package, Menu } from '@lucide/svelte';
	import { Toaster } from 'svelte-sonner';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';

	let { children } = $props();

	function handleLogout() {
		fetch('/api/sign-out', { method: 'POST' }).catch(() => {});
		window.location.href = '/login';
	}
</script>

<Toaster position="bottom-right" richColors />
<div class="min-h-screen bg-background">
	<header class="border-b bg-card">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
			<div class="flex items-center gap-2">
				<a href="/"
					><picture><source srcset="/img/logo.webp" type="image/webp" /><img src="/img/logo.png" alt="TapioLeaf" class="h-8 w-8 rounded-xl object-cover" width="32" height="32" loading="lazy" decoding="async" /></picture></a
				>
				<span class="text-sm font-semibold">CV TapioLeaf</span>
			</div>
			<div class="flex items-center gap-2">
				<a href="/#products" class="hidden sm:inline-block"
					><Button variant="outline" size="sm"><Package size={14} class="mr-1" /> Katalog</Button
					></a
				>
				<a href="/orders" class="hidden sm:inline-block"
					><Button variant="outline" size="sm"><ShoppingBag size={14} class="mr-1" /> Pesanan</Button
					></a
				>
				<Button variant="outline" size="sm" class="hidden sm:inline-flex" onclick={handleLogout}
					><LogOut size={14} class="mr-1" /> Keluar</Button
				>
				<DropdownMenu>
					<DropdownMenuTrigger class="sm:hidden">
						<Button variant="ghost" size="icon">
							<Menu size={18} />
							<span class="sr-only">Menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem>
							<a href="/#products" class="flex w-full items-center gap-2"><Package size={14} /> Katalog</a>
						</DropdownMenuItem>
						<DropdownMenuItem>
							<a href="/orders" class="flex w-full items-center gap-2"><ShoppingBag size={14} /> Pesanan</a>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onclick={handleLogout}>
							<LogOut size={14} /> Keluar
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
