<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '@/components/ui/button/button.svelte';
	import CheckoutModal from '$lib/components/checkout/CheckoutModal.svelte';
	import { siteConfig } from '$lib/config';

	let { data } = $props();

	let menuOpen = $state(false);
	let checkoutProduct = $state<{
		id: string; name: string; code: string; price: string; unit: string; description: string | null;
	} | null>(null);

	function formatStock(stock: number, unit: string): string {
		if (unit === 'SAK' || unit === 'PCS') return Math.floor(stock).toLocaleString('id-ID');
		if (unit === 'TON') return stock.toFixed(1);
		return Math.round(stock).toLocaleString('id-ID');
	}

	function formatPrice(price: string, unit: string): string {
		const num = Number(price);
		if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)} juta/${unit.toLowerCase()}`;
		if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)} rb/${unit.toLowerCase()}`;
		return `Rp ${num.toLocaleString('id-ID')}/${unit.toLowerCase()}`;
	}

	function openCheckout(item: any) {
		if (!data.user) { goto('/login'); return; }
		checkoutProduct = {
			id: item.id, name: item.name, code: item.code,
			price: item.price, unit: item.unit, description: item.description
		};
	}

	let observer: IntersectionObserver | undefined;

	$effect(() => {
		observer = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) e.target.classList.add('visible');
				}
			},
			{ threshold: 0.1 }
		);
		document.querySelectorAll('.reveal').forEach((el) => observer!.observe(el));
		return () => observer?.disconnect();
	});
</script>

<svelte:head>
	<title>{siteConfig.name} — Tepung Tapioka Premium</title>
	<meta name="description" content={siteConfig.description} />
	<link rel="preload" as="image" href="/img/cassava.jpg" fetchpriority="high" />
	<link rel="dns-prefetch" href="//ojbivocgryxqdykebsyy.storage.supabase.co" />
	<link rel="preconnect" href="https://ojbivocgryxqdykebsyy.storage.supabase.co" crossorigin="anonymous" />
	<meta name="keywords" content={siteConfig.keywords} />
	<meta name="author" content={siteConfig.name} />
	<meta property="og:title" content={`${siteConfig.name} - Tepung Tapioka Premium`} />
	<meta property="og:description" content={siteConfig.description} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={siteConfig.name} />
	<meta property="og:locale" content="id_ID" />
	<meta property="og:url" content={siteConfig.url.toString()} />
	<meta property="og:image" content={siteConfig.ogImage.toString()} />
	<meta name="robots" content="index, follow" />
	<meta name="googlebot" content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={siteConfig.name} />
	<meta name="twitter:image" content={siteConfig.ogImage.toString()} />
	<meta name="twitter:description" content={siteConfig.description} />
	<meta name="google-site-verification" content={siteConfig.googleVerification.toString()} />
	<link rel="canonical" href={siteConfig.url.toString()} />
</svelte:head>

<!-- Fluid Island Nav -->
<nav
	class="fixed inset-x-0 top-0 z-50 flex justify-center"
	aria-label="Navigasi utama"
>
	<div
		class="mt-4 flex items-center gap-6 rounded-full border border-white/10 bg-background/70 px-5 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] md:px-6"
	>
		<a href="/" class="flex items-center gap-2" aria-label="Beranda">
			<picture><source srcset="/img/logo.webp" type="image/webp" /><img src="/img/logo.png" alt="TapioLeaf" class="h-7 w-7 rounded-lg object-cover" width="28" height="28" /></picture>
			<span class="text-sm font-bold tracking-tight">TapioLeaf</span>
		</a>
		<div class="hidden items-center gap-5 text-sm md:flex">
			<a href="#products" class="text-muted-foreground transition-colors duration-300 hover:text-foreground">Produk</a>
			<a href="#about" class="text-muted-foreground transition-colors duration-300 hover:text-foreground">Tentang</a>
			<a href="#contact" class="text-muted-foreground transition-colors duration-300 hover:text-foreground">Kontak</a>
			{#if data.user}
				{#if data.user.role === 'pembeli_umkm'}
					<a href="/orders" class="text-muted-foreground transition-colors duration-300 hover:text-foreground">Pesanan</a>
				{/if}
				<a href="/account" class="text-muted-foreground transition-colors duration-300 hover:text-foreground">Dashboard</a>
				<form method="post" action="/api/sign-out" class="inline">
					<button type="submit" class="cursor-pointer rounded-full bg-destructive/10 px-4 py-1.5 text-xs font-medium text-destructive transition-all duration-300 hover:bg-destructive/20 active:scale-[0.97]">Logout</button>
				</form>
			{:else}
				<Button variant="default" href="/login" class="!rounded-full !px-4 !py-1.5 !text-xs">Masuk</Button>
			{/if}
		</div>
		<button
			onclick={() => (menuOpen = !menuOpen)}
			class="group relative flex h-8 w-8 items-center justify-center md:hidden"
			aria-label="Toggle menu"
			aria-expanded={menuOpen}
		>
			<div class="flex flex-col items-center gap-[6px]">
				<span
					class="block h-0.5 w-5 bg-foreground transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] {menuOpen ? 'translate-y-[6.5px] rotate-45' : ''}"
				></span>
				<span
					class="block h-0.5 w-5 bg-foreground transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] {menuOpen ? 'opacity-0' : ''}"
				></span>
				<span
					class="block h-0.5 w-5 bg-foreground transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] {menuOpen ? '-translate-y-[6.5px] -rotate-45' : ''}"
				></span>
			</div>
		</button>
	</div>
	{#if menuOpen}
		<div
			class="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-3xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
			role="dialog"
			aria-modal="true"
		>
			<button
				onclick={() => (menuOpen = false)}
				class="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 transition-all duration-300 hover:bg-muted active:scale-95"
				aria-label="Tutup menu"
			>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
			</button>
			<div class="flex flex-col items-center gap-8 text-lg">
				<a href="#products" onclick={() => (menuOpen = false)} class="transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] translate-y-0 opacity-100 hover:text-foreground">Produk</a>
				<a href="#about" onclick={() => (menuOpen = false)} class="transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] translate-y-0 opacity-100 hover:text-foreground">Tentang</a>
				<a href="#contact" onclick={() => (menuOpen = false)} class="transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] translate-y-0 opacity-100 hover:text-foreground">Kontak</a>
				{#if data.user}
					<a href="/orders" onclick={() => (menuOpen = false)} class="transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] translate-y-0 opacity-100 hover:text-foreground">Pesanan</a>
					<a href="/account" onclick={() => (menuOpen = false)} class="transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] translate-y-0 opacity-100 hover:text-foreground">Dashboard</a>
					<form method="post" action="/api/sign-out">
						<button type="submit" onclick={() => (menuOpen = false)} class="cursor-pointer rounded-full bg-destructive/10 px-6 py-2 text-sm font-medium text-destructive hover:bg-destructive/20">Keluar</button>
					</form>
				{:else}
					<Button variant="default" href="/login" onclick={() => (menuOpen = false)} class="!rounded-full">Masuk</Button>
				{/if}
			</div>
		</div>
	{/if}
</nav>

<!-- Hero: Editorial Split -->
<section class="relative flex min-h-[100dvh] flex-col overflow-hidden">
	<div class="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center px-6 pb-8 pt-28 md:flex-row md:px-10 md:py-8">
		<div class="flex w-full flex-col justify-center md:w-1/2 md:pr-12">
			<span class="mb-4 w-fit rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-foreground">Produsen Tepung Tapioka</span>
			<h1 class="mb-4 text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl lg:text-7xl">
				Tepung Tapioka<br />
				<span class="text-primary">Premium</span>
			</h1>
			<p class="mb-8 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
				Mengolah singkong pilihan petani lokal menjadi tepung tapioka berkualitas tinggi. Siap melayani kebutuhan industri dan rumah tangga Anda.
			</p>
			<div class="flex flex-col gap-3 sm:flex-row">
				<a
					href="#products"
					class="group relative inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/20 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-2xl hover:shadow-primary/30 active:scale-[0.97]"
				>
					Lihat Produk
					<span class="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
					</span>
				</a>
				<a
					href="#about"
					class="group inline-flex items-center gap-2 rounded-full border border-border bg-background px-7 py-3.5 text-sm font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-primary/30 hover:bg-primary/5 active:scale-[0.97]"
				>
					Tentang Kami
				</a>
			</div>
		</div>
		<div class="relative mt-8 flex w-full items-center justify-center md:mt-0 md:w-1/2">
			<div class="relative w-full overflow-hidden rounded-[2rem] shadow-2xl">
				<div class="p-1.5">
					<div class="overflow-hidden rounded-[calc(2rem-0.375rem)]">
						<picture>
							<source srcset="/img/cassava.avif" type="image/avif" />
							<source srcset="/img/cassava.webp" type="image/webp" />
							<img
								src="/img/cassava.jpg"
								alt="Singkong segar pilihan petani lokal"
								class="h-[320px] w-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105 md:h-[460px] lg:h-[520px]"
								width="800"
								height="520"
								fetchpriority="high"
								decoding="async"
							/>
						</picture>
						<div class="absolute inset-0 rounded-[calc(2rem-0.375rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<main>
	<!-- Products: Asymmetrical Bento -->
	<section id="products" class="px-6 py-24 md:px-10 md:py-32">
		<div class="mx-auto max-w-7xl">
			<div class="mb-12 text-center">
				<span class="mx-auto mb-4 block w-fit rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-foreground">Katalog</span>
				<h2 class="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Produk Kami</h2>
				<p class="mx-auto max-w-md text-muted-foreground">Tersedia berbagai varian tepung tapioka dan produk turunan untuk kebutuhan Anda</p>
			</div>

			{#if data.items.length === 0}
				<div class="py-16 text-center">
					<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-4 text-muted-foreground/40"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>
					<p class="text-lg font-medium text-muted-foreground">Produk tidak tersedia</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
					{#each data.items as item, i}
						<div
							class="group reveal"
							class:reveal-delay-1={i % 5 === 0}
							class:reveal-delay-2={i % 5 === 1}
							class:reveal-delay-3={i % 5 === 2}
							class:reveal-delay-4={i % 5 === 3}
							class:reveal-delay-5={i % 5 === 4}
						>
							<div class="h-full rounded-[1.5rem] bg-black/[0.03] p-1.5 ring-1 ring-black/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:shadow-lg dark:bg-white/[0.03] dark:ring-white/10">
								<div class="flex h-full flex-col rounded-[calc(1.5rem-0.375rem)] bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
								{#if item.imageUrl}
									<div class="overflow-hidden rounded-[calc(1.5rem-0.375rem)] rounded-b-none">
										<img
											src={item.imageUrl}
											alt={item.name}
											class="h-44 w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105 md:h-52"
											loading="lazy"
											decoding="async"
											width="400"
											height="208"
										/>
									</div>
								{:else}
									<div class="flex h-44 items-center justify-center rounded-[calc(1.5rem-0.375rem)] rounded-b-none bg-primary/5 md:h-52">
										<span class="text-4xl font-bold text-primary/30">{item.name.charAt(0)}</span>
									</div>
								{/if}
									<div class="flex flex-1 flex-col p-5">
										<div class="mb-3 flex items-start gap-3">
											<div class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/5 ring-1 ring-primary/10">
												{#if !item.imageUrl}
													<span class="text-sm font-bold text-primary">{item.name.charAt(0)}</span>
												{/if}
											</div>
											<div class="min-w-0 flex-1">
												<h3 class="font-semibold leading-tight">{item.name}</h3>
												<p class="mt-0.5 text-xs text-muted-foreground">{item.description || 'Produk CV TapioLeaf'}</p>
											</div>
										</div>
										<div class="mt-auto flex items-center justify-between border-t border-border/50 pt-3">
											<span class="text-sm font-bold text-primary">{formatPrice(item.price, item.unit)}</span>
											<span class="text-xs text-muted-foreground">{formatStock(item.currentStock, item.unit)} {item.unit}</span>
										</div>
										<button
											onclick={() => openCheckout(item)}
											class="group/btn mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-xs font-semibold text-primary-foreground transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-primary/90 active:scale-[0.97]"
										>
											Pesan Sekarang
											<span class="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/btn:translate-x-0.5 scale-105">
												<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
											</span>
										</button>
										{#if (item.unit === 'SAK' || item.unit === 'PCS' ? Math.floor(item.currentStock) : Math.round(item.currentStock)) < 10}
											<div class="mt-1.5 flex items-center gap-1 text-xs text-destructive">
												<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
												Stok terbatas
											</div>
										{/if}
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>

	<!-- About: Split layout -->
	<section id="about" class="bg-muted/30 px-6 py-24 md:px-10 md:py-32">
		<div class="mx-auto max-w-7xl">
			<div class="mb-4 text-center">
				<span class="mx-auto mb-4 block w-fit rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-foreground">Tentang</span>
				<h2 class="mb-4 text-3xl font-bold tracking-tight md:text-4xl">CV TapioLeaf</h2>
			</div>
			<div class="grid items-start gap-12 md:grid-cols-2">
				<div class="space-y-6">
					<p class="text-lg leading-relaxed text-muted-foreground">
						Berpengalaman sejak 2002, CV TapioLeaf adalah produsen tepung tapioka yang mengolah singkong segar dari petani lokal di Pati, Jawa Tengah.
					</p>
					<div class="space-y-5">
						<div class="flex items-start gap-4 reveal reveal-delay-1">
							<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/5 ring-1 ring-primary/10">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
							</div>
							<div>
								<h3 class="font-semibold">Kualitas Terjamin</h3>
								<p class="text-sm text-muted-foreground">Singkong pilihan dari petani lokal, diproses dengan standar quality control ketat.</p>
							</div>
						</div>
						<div class="flex items-start gap-4 reveal reveal-delay-2">
							<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/5 ring-1 ring-primary/10">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
							</div>
							<div>
								<h3 class="font-semibold">Kapasitas Produksi Besar</h3>
								<p class="text-sm text-muted-foreground">Hingga 4.000 kg tepung tapioka per hari dengan peralatan modern dan higienis.</p>
							</div>
						</div>
						<div class="flex items-start gap-4 reveal reveal-delay-3">
							<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/5 ring-1 ring-primary/10">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/><path d="M11 17v.01"/><path d="M7 14v.01"/></svg>
							</div>
							<div>
								<h3 class="font-semibold">Bahan Baku Lokal</h3>
								<p class="text-sm text-muted-foreground">Memberdayakan petani singkong lokal dengan harga adil dan kemitraan berkelanjutan.</p>
							</div>
						</div>
					</div>
				</div>
				<div class="reveal reveal-delay-2">
					<div class="rounded-[1.5rem] bg-black/[0.03] p-1.5 ring-1 ring-black/5 dark:bg-white/[0.03] dark:ring-white/10">
						<div class="rounded-[calc(1.5rem-0.375rem)] bg-card p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] md:p-8">
							<h3 class="mb-6 text-lg font-semibold">Biodata Perusahaan</h3>
							<dl class="space-y-4">
								<div class="flex justify-between border-b border-border/50 pb-3">
									<dt class="text-sm text-muted-foreground">Nama</dt>
									<dd class="text-sm font-medium">CV TapioLeaf</dd>
								</div>
								<div class="flex justify-between border-b border-border/50 pb-3">
									<dt class="text-sm text-muted-foreground">Berdiri</dt>
									<dd class="text-sm font-medium">2002</dd>
								</div>
								<div class="flex justify-between border-b border-border/50 pb-3">
									<dt class="text-sm text-muted-foreground">Kapasitas</dt>
									<dd class="text-sm font-medium">4.000 kg/hari</dd>
								</div>
								<div class="flex justify-between border-b border-border/50 pb-3">
									<dt class="text-sm text-muted-foreground">Produk Utama</dt>
									<dd class="text-sm font-medium">Tepung Tapioka</dd>
								</div>
								<div class="flex justify-between">
									<dt class="text-sm text-muted-foreground">Distribusi</dt>
									<dd class="text-sm font-medium text-right max-w-[200px]">Pengepul, pasar lokal & nasional</dd>
								</div>
							</dl>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Vision & Mission -->
	<section class="px-6 py-24 md:px-10 md:py-32">
		<div class="mx-auto max-w-7xl">
			<div class="mb-16 text-center">
				<span class="mx-auto mb-4 block w-fit rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-foreground">Arah</span>
				<h2 class="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Visi & Misi</h2>
			</div>
			<div class="mx-auto mb-16 max-w-3xl reveal">
				<div class="rounded-[2rem] bg-primary/5 p-2 ring-1 ring-primary/10">
					<div class="rounded-[calc(2rem-0.5rem)] bg-card p-8 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
						<div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
						</div>
						<h3 class="mb-3 text-xl font-semibold text-primary">Visi</h3>
						<p class="mx-auto max-w-xl text-muted-foreground">Menjadi produsen tepung tapioka terkemuka yang mendukung ketahanan pangan nasional dan memberdayakan petani singkong lokal.</p>
					</div>
				</div>
			</div>
			<h3 class="mb-10 text-center text-lg font-semibold">Misi Kami</h3>
			<div class="grid gap-6 md:grid-cols-3">
				<div class="reveal reveal-delay-1">
					<div class="rounded-[1.5rem] bg-black/[0.03] p-1.5 ring-1 ring-black/5 dark:bg-white/[0.03] dark:ring-white/10">
						<div class="rounded-[calc(1.5rem-0.375rem)] bg-card p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
							<div class="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">1</div>
							<h3 class="mb-2 font-semibold">Mutu Terbaik</h3>
							<p class="text-sm text-muted-foreground">Menghasilkan tepung tapioka dengan standar kualitas tertinggi melalui proses produksi yang terkontrol dan higienis.</p>
						</div>
					</div>
				</div>
				<div class="reveal reveal-delay-2">
					<div class="rounded-[1.5rem] bg-black/[0.03] p-1.5 ring-1 ring-black/5 dark:bg-white/[0.03] dark:ring-white/10">
						<div class="rounded-[calc(1.5rem-0.375rem)] bg-card p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
							<div class="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">2</div>
							<h3 class="mb-2 font-semibold">Kemitraan Petani</h3>
							<p class="text-sm text-muted-foreground">Membangun hubungan saling menguntungkan dengan petani singkong lokal untuk pasokan bahan baku berkelanjutan.</p>
						</div>
					</div>
				</div>
				<div class="reveal reveal-delay-3">
					<div class="rounded-[1.5rem] bg-black/[0.03] p-1.5 ring-1 ring-black/5 dark:bg-white/[0.03] dark:ring-white/10">
						<div class="rounded-[calc(1.5rem-0.375rem)] bg-card p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
							<div class="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">3</div>
							<h3 class="mb-2 font-semibold">Inovasi Berkelanjutan</h3>
							<p class="text-sm text-muted-foreground">Terus berinovasi dalam proses produksi dan pengembangan produk untuk memenuhi kebutuhan pasar yang berkembang.</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Production Process: Z-Axis Cascade -->
	<section class="bg-muted/30 px-6 py-24 md:px-10 md:py-32">
		<div class="mx-auto max-w-7xl">
			<div class="mb-16 text-center">
				<span class="mx-auto mb-4 block w-fit rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-foreground">Proses</span>
				<h2 class="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Proses Produksi</h2>
				<p class="mx-auto max-w-md text-muted-foreground">Dari singkong segar hingga tepung tapioka siap pakai</p>
			</div>
			<div class="grid gap-5 md:grid-cols-3 md:gap-6">
				{#each [
					{ num: '1', title: 'Pemilihan Singkong', desc: 'Singkong segar dipilih dari petani lokal. Hanya yang memenuhi standar kadar air dan ukuran yang diproses.' },
					{ num: '2', title: 'Pencucian & Pengupasan', desc: 'Singkong dicuci bersih dan dikupas untuk menghilangkan kotoran dan kulit luar menggunakan air bersih mengalir.' },
					{ num: '3', title: 'Pemarutan & Pemerasan', desc: 'Singkong diparut halus kemudian diperas untuk memisahkan pati dari ampasnya. Cairan pati ditampung dalam bak pengendapan.' },
					{ num: '4', title: 'Pengeringan & Penggilingan', desc: 'Pati yang mengendap dikeringkan dengan sinar matahari atau oven, lalu digiling hingga menjadi tepung tapioka halus.' },
					{ num: '5', title: 'Pengemasan', desc: 'Tepung tapioka dikemas dalam berbagai ukuran, dari kemasan eceran hingga karung besar untuk industri.' }
				] as step, i}
					<div class="reveal reveal-delay-{(i % 3) + 1}" class:md:col-span-2={i === 3} class:md:col-span-1={i !== 3 && i !== 4}>
						<div class="rounded-[1.25rem] bg-black/[0.03] p-1.5 ring-1 ring-black/5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-lg dark:bg-white/[0.03] dark:ring-white/10">
							<div class="rounded-[calc(1.25rem-0.375rem)] bg-card p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
								<div class="mb-3 flex items-center gap-3">
									<div class="flex h-9 w-9 items-center justify-center rounded-full bg-warning/20 text-xs font-bold text-warning">{step.num}</div>
									<h3 class="font-semibold">{step.title}</h3>
								</div>
								<p class="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Commitment -->
	<section class="px-6 py-24 md:px-10 md:py-32">
		<div class="mx-auto max-w-7xl">
			<div class="mb-16 text-center">
				<span class="mx-auto mb-4 block w-fit rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-foreground">Komitmen</span>
				<h2 class="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Nilai Kami</h2>
			</div>
			<div class="grid gap-6 md:grid-cols-3">
				<div class="reveal reveal-delay-1">
					<div class="rounded-[1.5rem] bg-black/[0.03] p-1.5 ring-1 ring-black/5 dark:bg-white/[0.03] dark:ring-white/10">
						<div class="rounded-[calc(1.5rem-0.375rem)] bg-card p-8 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
							<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
							</div>
							<h3 class="mb-2 font-semibold">Kualitas</h3>
							<p class="text-sm text-muted-foreground">Setiap batch produk melewati kontrol kualitas ketat untuk konsistensi dan keamanan pangan.</p>
						</div>
					</div>
				</div>
				<div class="reveal reveal-delay-2">
					<div class="rounded-[1.5rem] bg-black/[0.03] p-1.5 ring-1 ring-black/5 dark:bg-white/[0.03] dark:ring-white/10">
						<div class="rounded-[calc(1.5rem-0.375rem)] bg-card p-8 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
							<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M21 9H9"/></svg>
							</div>
							<h3 class="mb-2 font-semibold">Tepat Waktu</h3>
							<p class="text-sm text-muted-foreground">Komitmen memenuhi target produksi harian dan mengirim pesanan tepat waktu kepada pelanggan.</p>
						</div>
					</div>
				</div>
				<div class="reveal reveal-delay-3">
					<div class="rounded-[1.5rem] bg-black/[0.03] p-1.5 ring-1 ring-black/5 dark:bg-white/[0.03] dark:ring-white/10">
						<div class="rounded-[calc(1.5rem-0.375rem)] bg-card p-8 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
							<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M2 22V12l10-5 10 5v10"/><path d="M7 22v-7l5-2.5 5 2.5v7"/><path d="M2 22h20"/></svg>
							</div>
							<h3 class="mb-2 font-semibold">Keberlanjutan</h3>
							<p class="text-sm text-muted-foreground">Praktik bisnis berkelanjutan yang mendukung petani lokal dan kelestarian lingkungan.</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Contact -->
	<section id="contact" class="bg-muted/30 px-6 py-24 md:px-10 md:py-32">
		<div class="mx-auto max-w-7xl">
			<div class="mb-16 text-center">
				<span class="mx-auto mb-4 block w-fit rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-foreground">Kontak</span>
				<h2 class="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Hubungi Kami</h2>
				<p class="mx-auto max-w-md text-muted-foreground">Silakan hubungi kami untuk pemesanan atau pertanyaan lebih lanjut</p>
			</div>
			<div class="grid gap-6 md:grid-cols-3">
				<div class="reveal reveal-delay-1">
					<div class="rounded-[1.5rem] bg-black/[0.03] p-1.5 ring-1 ring-black/5 dark:bg-white/[0.03] dark:ring-white/10">
						<div class="rounded-[calc(1.5rem-0.375rem)] bg-card p-6 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
							<div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/5 ring-1 ring-primary/10">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
							</div>
							<h3 class="mb-1 font-semibold">Alamat</h3>
							<p class="text-sm text-muted-foreground">Desa Waturoyo, Kec. Margoyoso<br />Kabupaten Pati, Jawa Tengah</p>
						</div>
					</div>
				</div>
				<div class="reveal reveal-delay-2">
					<div class="rounded-[1.5rem] bg-black/[0.03] p-1.5 ring-1 ring-black/5 dark:bg-white/[0.03] dark:ring-white/10">
						<div class="rounded-[calc(1.5rem-0.375rem)] bg-card p-6 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
							<div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/5 ring-1 ring-primary/10">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
							</div>
							<h3 class="mb-1 font-semibold">Telepon</h3>
							<p class="text-sm text-muted-foreground">+62 821-3794-9528</p>
						</div>
					</div>
				</div>
				<div class="reveal reveal-delay-3">
					<div class="rounded-[1.5rem] bg-black/[0.03] p-1.5 ring-1 ring-black/5 dark:bg-white/[0.03] dark:ring-white/10">
						<div class="rounded-[calc(1.5rem-0.375rem)] bg-card p-6 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
							<div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/5 ring-1 ring-primary/10">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
							</div>
							<h3 class="mb-1 font-semibold">Email</h3>
							<p class="text-sm text-muted-foreground">info@tapioleaf.com<br />sales@tapioleaf.com</p>
						</div>
					</div>
				</div>
			</div>
			<div class="mx-auto mt-12 max-w-4xl overflow-hidden rounded-[1.5rem] shadow-lg reveal">
				<div class="rounded-[1.5rem] bg-black/[0.03] p-1.5 ring-1 ring-black/5 dark:bg-white/[0.03] dark:ring-white/10">
					<div class="overflow-hidden rounded-[calc(1.5rem-0.375rem)]">
						<iframe
							width="100%"
							height="320"
							style="border:0; display: block;"
							src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31706.63490499471!2d111.0122342743164!3d-6.605931600000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e712b006decfbef%3A0xd7021e3f2a13a76b!2sCV%20Tapioleaf!5e0!3m2!1sid!2sid!4v1781956255160!5m2!1sid!2sid"
							allowfullscreen
							loading="lazy"
							referrerpolicy="no-referrer-when-downgrade"
							title="Peta Lokasi CV TapioLeaf"
						></iframe>
					</div>
				</div>
			</div>
		</div>
	</section>
</main>

<!-- Footer -->
<footer class="border-t px-6 py-10 text-center text-sm text-muted-foreground">
	<div class="mx-auto max-w-7xl">
		<div class="mb-6 flex items-center justify-center gap-2">
			<picture><source srcset="/img/logo.webp" type="image/webp" /><img src="/img/logo.png" alt="TapioLeaf" class="h-6 w-6 rounded-md object-cover" width="24" height="24" /></picture>
			<span class="text-sm font-bold tracking-tight">{siteConfig.name}</span>
		</div>
		<p class="mb-2">&copy; 2026 CV TapioLeaf. All rights reserved.</p>
		<div class="flex items-center justify-center gap-1 text-xs text-muted-foreground">
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
			Sen&ndash;Sab, 07:00 &ndash; 16:00 WIB
		</div>
	</div>
</footer>

<CheckoutModal
	open={checkoutProduct !== null}
	product={checkoutProduct}
	onClose={() => (checkoutProduct = null)}
/>
