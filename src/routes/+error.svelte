<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Home, ArrowLeft } from '@lucide/svelte';
</script>

<svelte:head>
	<title>{$page.status === 404 ? 'Halaman Tidak Ditemukan' : 'Error'} — CV TapioLeaf</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50 p-4">
	<div class="w-full max-w-md text-center">
		<div class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
			<span class="text-4xl font-bold text-emerald-600">{$page.status}</span>
		</div>
		<h1 class="mb-2 text-2xl font-bold">
			{#if $page.status === 404}
				Halaman Tidak Ditemukan
			{:else if $page.status === 403}
				Akses Ditolak
			{:else}
				Terjadi Kesalahan
			{/if}
		</h1>
		<p class="mb-8 text-sm text-muted-foreground">
			{#if $page.status === 404}
				Halaman yang Anda cari tidak ditemukan atau telah dipindahkan.
			{:else if $page.status === 403}
				Anda tidak memiliki izin untuk mengakses halaman ini.
			{:else}
				Maaf, terjadi kesalahan pada server. Silakan coba lagi.
			{/if}
		</p>
		<div class="flex justify-center gap-3">
			<a href="/"><Button variant="outline" class="gap-2"><Home size={16} /> Beranda</Button></a>
			<Button variant="default" class="gap-2" onclick={() => history.back()}><ArrowLeft size={16} /> Kembali</Button>
		</div>
	</div>
</div>