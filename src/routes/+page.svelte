<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		Search,
		MapPin,
		Phone,
		Mail,
		Clock,
		AlertTriangle,
		Package,
		Factory,
		Shield,
		Wheat,
		Menu,
		X,
		ShoppingCart
	} from '@lucide/svelte';
	import CheckoutModal from '$lib/components/checkout/CheckoutModal.svelte';

	let { data } = $props();

	let scrolled = $state(false);

	$effect(() => {
		const onScroll = () => scrolled = window.scrollY > 10;
		onScroll();
		addEventListener('scroll', onScroll, { passive: true });
		return () => removeEventListener('scroll', onScroll);
	});

	let checkoutProduct = $state<{
		id: string;
		name: string;
		code: string;
		price: string;
		unit: string;
		description: string | null;
	} | null>(null);
	let menuOpen = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let searchQuery = $state('');

	function handleSearch() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			const q = searchQuery.toLowerCase();
			const url = new URL($page.url);
			if (q) url.searchParams.set('search', q);
			else url.searchParams.delete('search');
			goto(url.toString(), { replaceState: true });
		}, 300);
	}

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
		if (!data.user) {
			goto('/login');
			return;
		}
		checkoutProduct = {
			id: item.id,
			name: item.name,
			code: item.code,
			price: item.price,
			unit: item.unit,
			description: item.description
		};
	}

	let filtered = $derived(
		$page.url.searchParams.get('search')
			? data.items.filter(
					(i) =>
						i.name.toLowerCase().includes($page.url.searchParams.get('search')!) ||
						(i.description || '').toLowerCase().includes($page.url.searchParams.get('search')!)
				)
			: data.items
	);
</script>

<svelte:head>
	<title>CV TapioLeaf — Tepung Tapioka Berkualitas</title>
</svelte:head>

<div class="min-h-screen bg-white">
	<!-- Navbar -->
	<nav class="top-center fixed z-50 w-full bg-white transition-all duration-300 {scrolled ? 'backdrop-blur-sm' : ''}">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
			<div class="flex items-center gap-2">
				<img src="/img/logo.png" alt="TapioLeaf" class="h-9 w-9 rounded-lg object-cover" />
				<div class="text-sm font-bold">CV TapioLeaf</div>
			</div>
			<div class="hidden items-center gap-4 text-sm md:flex">
				<a href="#products" class="text-muted-foreground hover:text-emerald-600">Produk</a>
				<a href="#about" class="text-muted-foreground hover:text-emerald-600">Tentang</a>
				<a href="#contact" class="text-muted-foreground hover:text-emerald-600">Kontak</a>
				{#if data.user}
					{#if data.user.role === 'pembeli_umkm'}
						<a href="/orders" class="text-muted-foreground hover:text-emerald-600">Pesanan</a>
					{/if}
					<a href="/account" class="text-muted-foreground hover:text-emerald-600">Dashboard</a>
					<form method="post" action="/api/sign-out" class="inline">
						<button
							type="submit"
							class="cursor-pointer rounded-lg bg-red-50 px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
							>Logout</button
						>
					</form>
				{:else}
					<a
						href="/login"
						class="rounded-lg bg-emerald-50 px-4 py-1.5 text-sm font-medium text-gray-900 hover:bg-emerald-400"
						>Masuk</a
					>
				{/if}
			</div>
			<button
				onclick={() => (menuOpen = !menuOpen)}
				class="flex items-center p-1 md:hidden"
				aria-label="Toggle menu"
			>
				{#if menuOpen}<X size={22} />{:else}<Menu size={22} />{/if}
			</button>
		</div>
		{#if menuOpen}
			<div class="border-t bg-white px-4 py-4 md:hidden">
				<div class="flex flex-col gap-3 text-sm">
					<a
						href="#products"
						onclick={() => (menuOpen = false)}
						class="rounded-lg px-3 py-2 hover:bg-gray-50">Produk</a
					>
					<a
						href="#about"
						onclick={() => (menuOpen = false)}
						class="rounded-lg px-3 py-2 hover:bg-gray-50">Tentang</a
					>
					<a
						href="#contact"
						onclick={() => (menuOpen = false)}
						class="rounded-lg px-3 py-2 hover:bg-gray-50">Kontak</a
					>
					{#if data.user}
						{#if data.user.role === 'pembeli_umkm'}
						<a
							href="/orders"
							onclick={() => (menuOpen = false)}
							class="rounded-lg px-3 py-2 hover:bg-gray-50">Pesanan</a
						>
						{/if}
						<a
							href="/account"
							onclick={() => (menuOpen = false)}
							class="rounded-lg px-3 py-2 hover:bg-gray-50">Dashboard</a
						>
						<form method="post" action="/api/sign-out">
							<button
								type="submit"
								onclick={() => (menuOpen = false)}
								class="w-full cursor-pointer rounded-lg bg-red-50 px-3 py-2 text-center font-medium text-red-600 hover:bg-red-100"
								>Keluar</button
							>
						</form>
					{:else}
						<a
							href="/login"
							onclick={() => (menuOpen = false)}
							class="rounded-lg bg-emerald-50 px-3 py-2 text-center font-medium text-gray-900 hover:bg-emerald-400"
							>Masuk</a
						>
					{/if}
				</div>
			</div>
		{/if}
	</nav>

	<!-- Hero -->
	<section
		class="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-cover bg-center px-4 pt-16 text-center"
		style="background-image: url('/img/cassava.jpg')"
	>
		<div class="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
		<div class="relative z-10 mx-auto max-w-6xl px-4 py-12 md:py-20">
			<div
				class="mx-auto mb-6 flex h-20 w-20 md:h-24 md:w-24 items-center justify-center overflow-hidden rounded-2xl bg-white/20"
			>
				<img src="/img/logo.png" alt="CV TapioLeaf" class="h-full w-full object-cover" />
			</div>
			<h1 class="mb-3 text-3xl font-bold text-white md:text-5xl">CV TapioLeaf</h1>
			<p class="mx-auto mb-8 max-w-2xl text-base text-gray-200 md:text-lg">
				Produsen tepung tapioka berkualitas tinggi. Mengolah singkong pilihan menjadi tepung tapioka
				premium untuk kebutuhan industri dan rumah tangga.
			</p>
			<div class="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
				<a
					href="#products"
					class="w-full sm:w-auto rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:bg-emerald-700 active:scale-95"
					>Lihat Produk</a
				>
				<a
					href="#about"
					class="w-full sm:w-auto rounded-xl border-2 border-white px-8 py-3 font-semibold text-white transition-all hover:bg-white/10 active:scale-95"
					>Tentang Kami</a
				>
			</div>
		</div>
	</section>

	<!-- Products -->
	<section id="products" class="px-4 py-12 md:py-12 md:py-16">
		<div class="mx-auto max-w-6xl">
			<div class="mb-8 text-center">
				<h2 class="mb-2 text-xl font-bold md:text-2xl">Produk Kami</h2>
				<p class="text-muted-foreground">
					Tersedia berbagai varian tepung tapioka dan produk turunan
				</p>
			</div>

			<div class="relative mx-auto mb-8 max-w-md">
				<Search size={18} class="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
				<input
					type="text"
					placeholder="Cari produk..."
					class="w-full rounded-full border bg-gray-50 py-2.5 pr-4 pl-10 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
					bind:value={searchQuery}
					oninput={handleSearch}
				/>
			</div>

			{#if filtered.length === 0}
				<div class="py-12 text-center">
					<Package size={48} class="mx-auto mb-4 text-muted-foreground/40" />
					<p class="text-lg font-medium text-muted-foreground">Produk tidak ditemukan</p>
				</div>
			{:else}
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{#each filtered as item}
						<div
							class="group rounded-xl border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
						>
							{#if item.imageUrl}
								<div class="-mx-4 -mt-4 mb-3 overflow-hidden rounded-t-xl bg-gray-50">
									<img
										src={item.imageUrl}
										alt={item.name}
										class="h-36 w-full object-cover sm:h-40 md:h-48"
										onerror={(e) => {
											(e.target as HTMLElement).style.display = 'none';
										}}
									/>
								</div>
							{/if}
							<div class="mb-2 flex items-start gap-3">
								<div
									class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emerald-50"
								>
									{#if !item.imageUrl}
										<span class="text-sm font-bold text-emerald-700">{item.name.charAt(0)}</span>
									{/if}
								</div>
								<div class="min-w-0 flex-1">
									<h3 class="font-semibold leading-tight">{item.name}</h3>
									<p class="mt-0.5 text-xs text-muted-foreground">
										{item.description || 'Produk CV TapioLeaf'}
									</p>
								</div>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-sm font-bold text-emerald-700"
									>{formatPrice(item.price, item.unit)}</span
								>
								<span class="text-xs text-muted-foreground">{formatStock(item.currentStock, item.unit)} {item.unit}</span>
							</div>
							<button
								onclick={() => openCheckout(item)}
								class="mt-2 block w-full rounded-lg bg-emerald-600 py-1.5 text-center text-xs font-medium text-white transition-colors hover:bg-emerald-700"
							>
								<ShoppingCart size={14} class="mr-1 inline" /> Pesan Sekarang
							</button>
							{#if (item.unit === 'SAK' || item.unit === 'PCS' ? Math.floor(item.currentStock) : Math.round(item.currentStock)) < 10}
								<div class="mt-1 flex items-center gap-1 text-xs text-red-600">
									<AlertTriangle size={12} /> Stok terbatas
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>

	<!-- About -->
	<section id="about" class="bg-gray-50 px-4 py-12 md:py-16">
		<div class="mx-auto max-w-4xl">
			<h2 class="mb-6 text-center text-xl font-bold md:mb-8 md:text-2xl">Tentang CV TapioLeaf</h2>
			<div class="grid gap-6 md:grid-cols-2 md:gap-8">
				<div class="space-y-4">
					<div class="flex items-start gap-3">
						<Shield size={20} class="mt-0.5 shrink-0 text-emerald-600" />
						<div>
							<h3 class="font-semibold">Kualitas Terjamin</h3>
							<p class="text-sm text-muted-foreground">
								Kami menggunakan singkong pilihan dari petani lokal untuk menghasilkan tepung
								tapioka dengan kualitas terbaik dan konsisten.
							</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<Factory size={20} class="mt-0.5 shrink-0 text-emerald-600" />
						<div>
							<h3 class="font-semibold">Kapasitas Produksi Besar</h3>
							<p class="text-sm text-muted-foreground">
								Mampu memproduksi hingga 4.000 kg tepung tapioka per hari dengan peralatan modern
								dan proses quality control yang ketat.
							</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<Wheat size={20} class="mt-0.5 shrink-0 text-emerald-600" />
						<div>
							<h3 class="font-semibold">Bahan Baku Lokal</h3>
							<p class="text-sm text-muted-foreground">
								Memberdayakan petani singkong lokal dengan harga yang adil dan bermitra untuk
								meningkatkan kualitas hasil panen.
							</p>
						</div>
					</div>
				</div>
				<div class="rounded-xl border bg-white p-6 shadow-sm">
					<h3 class="mb-4 font-semibold">Biodata Perusahaan</h3>
					<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<tbody>
							<tr class="border-b"
								><td class="py-2 text-muted-foreground">Nama</td><td class="py-2 font-medium"
									>CV TapioLeaf</td
								></tr
							>
							<tr class="border-b"
								><td class="py-2 text-muted-foreground">Berdiri</td><td class="py-2 font-medium"
									>2002</td
								></tr
							>
							<tr class="border-b"
								><td class="py-2 text-muted-foreground">Bidang</td><td class="py-2 font-medium"
									>Pengolahan dan Produksi Tepung Tapioka</td
								></tr
							>
							<tr class="border-b"
								><td class="py-2 text-muted-foreground">Kapasitas</td><td class="py-2 font-medium"
									>4.000 kg/hari</td
								></tr
							>
							<tr
								><td class="py-2 text-muted-foreground">Produk Utama</td><td
									class="py-2 font-medium">Tepung Tapioka</td
								></tr
							>
							<tr
								><td class="py-2 text-muted-foreground">Wilayah Distribusi</td><td
									class="py-2 font-medium">Melalui pengepul untuk pasar lokal dan nasional</td
								></tr
							>
						</tbody>
					</table>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Visi & Misi -->
	<section id="vision" class="border-t bg-white px-4 py-12 md:py-16">
		<div class="mx-auto max-w-4xl">
			<div class="text-center">
				<h2 class="mb-8 text-2xl font-bold">Visi & Misi</h2>
				<div class="mx-auto mb-8 max-w-2xl rounded-xl border bg-emerald-50 p-6">
					<h3 class="mb-2 text-lg font-semibold text-emerald-800">Visi</h3>
					<p class="text-muted-foreground">
						Menjadi produsen tepung tapioka terkemuka yang mendukung ketahanan pangan nasional dan
						memberdayakan petani singkong lokal.
					</p>
				</div>
			</div>
			<h3 class="mb-6 text-center text-lg font-semibold">Misi Kami</h3>
			<div class="grid gap-6 md:grid-cols-3">
				<div class="rounded-xl border p-5 text-left shadow-sm">
					<div
						class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700"
					>
						1
					</div>
					<h3 class="mb-1 font-semibold">Mutu Terbaik</h3>
					<p class="text-sm text-muted-foreground">
						Menghasilkan tepung tapioka dengan standar kualitas tertinggi melalui proses produksi
						yang terkontrol dan higienis.
					</p>
				</div>
				<div class="rounded-xl border p-5 text-left shadow-sm">
					<div
						class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700"
					>
						2
					</div>
					<h3 class="mb-1 font-semibold">Kemitraan Petani</h3>
					<p class="text-sm text-muted-foreground">
						Membangun hubungan yang saling menguntungkan dengan petani singkong lokal untuk
						memastikan pasokan bahan baku yang berkelanjutan.
					</p>
				</div>
				<div class="rounded-xl border p-5 text-left shadow-sm">
					<div
						class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700"
					>
						3
					</div>
					<h3 class="mb-1 font-semibold">Inovasi Berkelanjutan</h3>
					<p class="text-sm text-muted-foreground">
						Terus berinovasi dalam proses produksi dan pengembangan produk untuk memenuhi kebutuhan
						pasar yang berkembang.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Proses Produksi -->
	<section id="process" class="bg-gray-50 px-4 py-12 md:py-16">
		<div class="mx-auto max-w-4xl">
			<h2 class="mb-6 text-center text-xl font-bold md:mb-8 md:text-2xl">Proses Produksi</h2>
			<div class="grid gap-4 md:grid-cols-2 md:gap-6">
				<div class="rounded-xl border bg-white p-5 shadow-sm">
					<div
						class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-sm font-bold text-orange-700"
					>
						1
					</div>
					<h3 class="mb-1 font-semibold">Pemilihan Singkong</h3>
					<p class="text-sm text-muted-foreground">
						Singkong segar dipilih dari petani lokal dengan kualitas terbaik. Hanya singkong yang
						memenuhi standar kadar air dan ukuran yang diproses.
					</p>
				</div>
				<div class="rounded-xl border bg-white p-5 shadow-sm">
					<div
						class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-sm font-bold text-orange-700"
					>
						2
					</div>
					<h3 class="mb-1 font-semibold">Pencucian & Pengupasan</h3>
					<p class="text-sm text-muted-foreground">
						Singkong dicuci bersih dan dikupas untuk menghilangkan kotoran dan kulit luar. Proses
						ini menggunakan air bersih yang mengalir.
					</p>
				</div>
				<div class="rounded-xl border bg-white p-5 shadow-sm">
					<div
						class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-sm font-bold text-orange-700"
					>
						3
					</div>
					<h3 class="mb-1 font-semibold">Pemarutan & Pemerasan</h3>
					<p class="text-sm text-muted-foreground">
						Singkong diparut halus kemudian diperas untuk memisahkan pati dari ampasnya. Cairan pati
						ditampung dalam bak pengendapan.
					</p>
				</div>
				<div class="rounded-xl border bg-white p-5 shadow-sm">
					<div
						class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-sm font-bold text-orange-700"
					>
						4
					</div>
					<h3 class="mb-1 font-semibold">Pengeringan & Penggilingan</h3>
					<p class="text-sm text-muted-foreground">
						Pati yang telah mengendap dikeringkan di bawah sinar matahari atau menggunakan oven,
						kemudian digiling hingga menjadi tepung tapioka halus.
					</p>
				</div>
				<div class="rounded-xl border bg-white p-5 shadow-sm">
					<div
						class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-sm font-bold text-orange-700"
					>
						5
					</div>
					<h3 class="mb-1 font-semibold">Pengemasan</h3>
					<p class="text-sm text-muted-foreground">
						Tepung tapioka dikemas dalam berbagai ukuran sesuai kebutuhan pelanggan, dari kemasan
						eceran hingga karung besar untuk industri.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Komitmen -->
	<section class="bg-white px-4 py-16 text-shadow-black">
		<div class="mx-auto max-w-4xl text-center">
			<h2 class="mb-6 text-xl font-bold md:mb-8 md:text-2xl">Komitmen Kami</h2>
			<div class="grid gap-4 md:grid-cols-3 md:gap-6">
				<div class="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
					<div
						class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-300"
					>
						<Shield size={22} />
					</div>
					<h3 class="mb-2 font-semibold">Kualitas</h3>
					<p class="text-sm text-gray-700">
						Setiap batch produk melewati kontrol kualitas ketat untuk memastikan konsistensi dan
						keamanan pangan.
					</p>
				</div>
				<div class="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
					<div
						class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-300"
					>
						<Factory size={22} />
					</div>
					<h3 class="mb-2 font-semibold">Produksi Tepat Waktu</h3>
					<p class="text-sm text-gray-700">
						Komitmen untuk memenuhi target produksi harian 4.000 kg dan mengirim pesanan tepat waktu
						kepada pelanggan.
					</p>
				</div>
				<div class="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
					<div
						class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-300"
					>
						<Wheat size={22} />
					</div>
					<h3 class="mb-2 font-semibold">Keberlanjutan</h3>
					<p class="text-sm text-gray-700">
						Berkomitmen pada praktik bisnis berkelanjutan yang mendukung petani lokal dan
						kelestarian lingkungan.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Contact -->
	<section id="contact" class="px-4 py-12 md:py-16">
		<div class="mx-auto max-w-4xl">
			<h2 class="mb-6 text-center text-xl font-bold md:mb-8 md:text-2xl">Hubungi Kami</h2>
			<div class="grid gap-4 md:grid-cols-3 md:gap-6">
				<div class="rounded-xl border bg-white p-5 text-center shadow-sm">
					<MapPin size={24} class="mx-auto mb-3 text-emerald-600" />
					<h3 class="mb-1 font-semibold">Alamat</h3>
					<p class="text-sm text-muted-foreground">
						Desa Waturoyo<br />Kec. Margoyoso <br />Kabupaten Pati<br />Jawa Tengah, Indonesia
					</p>
				</div>
				<div class="rounded-xl border bg-white p-5 text-center shadow-sm">
					<Phone size={24} class="mx-auto mb-3 text-emerald-600" />
					<h3 class="mb-1 font-semibold">Telepon</h3>
					<p class="text-sm text-muted-foreground"><br />+62 821-3794-9528</p>
				</div>
				<div class="rounded-xl border bg-white p-5 text-center shadow-sm">
					<Mail size={24} class="mx-auto mb-3 text-emerald-600" />
					<h3 class="mb-1 font-semibold">Email</h3>
					<p class="text-sm text-muted-foreground">info@tapioleaf.com<br />sales@tapioleaf.com</p>
				</div>
			</div>
		</div>
		<div class="mx-auto mt-8 max-w-4xl overflow-hidden rounded-xl border shadow-sm">
			<iframe
				width="100%"
				height="300"
				frameborder="0"
				style="border:0; display: block;"
				src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31706.63490499471!2d111.0122342743164!3d-6.605931600000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e712b006decfbef%3A0xd7021e3f2a13a76b!2sCV%20Tapioleaf!5e0!3m2!1sid!2sid!4v1781956255160!5m2!1sid!2sid"
				allowfullscreen
				loading="lazy"
				referrerpolicy="no-referrer-when-downgrade"
				title="Peta Lokasi CV TapioLeaf"
			></iframe>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t bg-gray-50 px-4 py-8 text-center text-sm text-muted-foreground">
		<p class="mb-2">&copy; 2026 CV TapioLeaf. All rights reserved.</p>
		<div class="flex items-center justify-center gap-1 text-xs">
			<Clock size={12} /> Sen—Sab, 07:00 — 16:00 WIB
		</div>
	</footer>
</div>

<CheckoutModal
	open={checkoutProduct !== null}
	product={checkoutProduct}
	onClose={() => (checkoutProduct = null)}
/>
