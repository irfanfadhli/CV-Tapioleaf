<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { LogOut, User, ShoppingBag, ArrowLeft } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();

	function handleLogout() {
		fetch('/api/auth/sign-out', { method: 'POST', headers: { 'Content-Type': 'application/json' } }).catch(() => {});
		const cookies = ['session_token', 'session_data', 'account_data', 'dont_remember'];
		const prefixes = ['better-auth.', '__Secure-better-auth.'];
		for (const p of prefixes) {
			for (const c of cookies) {
				document.cookie = `${p}${c}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
				document.cookie = `${p}${c}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${location.hostname};`;
			}
		}
		goto('/');
	}
</script>

<div class="min-h-screen bg-gray-50">
	<header class="border-b bg-white">
		<div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
			<div class="flex items-center gap-2">
				<a href="/" class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">TL</a>
				<span class="text-sm font-semibold">CV TapioLeaf</span>
			</div>
			<Button variant="outline" size="sm" onclick={handleLogout}><LogOut size={14} class="mr-1" /> Keluar</Button>
		</div>
	</header>

	<main class="mx-auto max-w-4xl px-4 py-8">
		<h1 class="mb-6 text-2xl font-bold">Akun Saya</h1>

		<Card class="mb-6">
			<CardHeader>
				<div class="flex items-center gap-3">
					<div class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
						<User size={22} class="text-emerald-700" />
					</div>
					<div>
						<CardTitle class="text-lg">{data.user.name || 'Pelanggan'}</CardTitle>
						<CardDescription>{data.user.email}</CardDescription>
					</div>
				</div>
			</CardHeader>
		</Card>

		<Card>
			<CardHeader>
				<div class="flex items-center gap-2">
					<ShoppingBag size={18} class="text-emerald-600" />
					<CardTitle class="text-lg">Pesanan Saya</CardTitle>
				</div>
				<CardDescription>Belum ada pesanan. Kunjungi katalog produk untuk memesan.</CardDescription>
			</CardHeader>
			<CardContent>
				<a href="/"><Button variant="outline" class="gap-2"><ArrowLeft size={14} /> Kembali ke Katalog</Button></a>
			</CardContent>
		</Card>
	</main>
</div>
