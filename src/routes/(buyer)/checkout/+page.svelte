<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Store from '@lucide/svelte/icons/store';
	import Truck from '@lucide/svelte/icons/truck';
	import Clock from '@lucide/svelte/icons/clock';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import Package from '@lucide/svelte/icons/package';
	import SearchableSelect from '$lib/components/ui/SearchableSelect.svelte';
	import { toast } from 'svelte-sonner';
	import { parse } from 'devalue';

	let { data } = $props();
	const product = $derived(data.product);

	let quantity = $state(String(data.initialQty || '1'));
	let customerName = $state(data.user?.name || '');
	let customerPhone = $state('');
	let deliveryMethod = $state<'PICKUP' | 'DELIVERY'>('DELIVERY');
	let pickupDate = $state('');
	let pickupTime = $state('09:00');
	let customerAddress = $state('');
	let notes = $state('');

	// === State Wilayah Cascading (Provinsi -> Kota/Kabupaten -> Kecamatan) ===
	const provinces = $derived(data.provinces || []);
	let selectedProvCode = $state('');
	let selectedRegCode = $state('');
	let selectedDistCode = $state('');

	let regenciesList = $state<Array<{ kode: string; nama: string }>>([]);
	let districtsList = $state<Array<{ kode: string; nama: string }>>([]);

	let isLoadingRegencies = $state(false);
	let isLoadingDistricts = $state(false);

	let shippingRates = $state<Array<{ courier_name: string; courier_code: string; service_name: string; cost: number; etd: string }>>([]);
	let selectedShippingRate = $state<{ courier_name: string; courier_code: string; service_name: string; cost: number; etd: string } | null>(null);
	let isLoadingRates = $state(false);

	async function onProvinceChange(provKode: string) {
		selectedProvCode = provKode;
		selectedRegCode = '';
		selectedDistCode = '';
		regenciesList = [];
		districtsList = [];
		shippingRates = [];
		selectedShippingRate = null;

		if (!provKode) return;
		isLoadingRegencies = true;
		try {
			const res = await fetch(`/api/shipping/destination?type=regencies&parent=${provKode}`);
			const json = await res.json();
			regenciesList = json.results || [];
		} catch {
			regenciesList = [];
		} finally {
			isLoadingRegencies = false;
		}
	}

	async function onRegencyChange(regKode: string) {
		selectedRegCode = regKode;
		selectedDistCode = '';
		districtsList = [];
		shippingRates = [];
		selectedShippingRate = null;

		if (!regKode) return;
		isLoadingDistricts = true;
		try {
			const res = await fetch(`/api/shipping/destination?type=districts&parent=${regKode}`);
			const json = await res.json();
			districtsList = json.results || [];
		} catch {
			districtsList = [];
		} finally {
			isLoadingDistricts = false;
		}
	}

	async function onDistrictChange(distKode: string) {
		selectedDistCode = distKode;
		if (!distKode) {
			shippingRates = [];
			selectedShippingRate = null;
			return;
		}
		await fetchRates(distKode);
	}

	async function fetchRates(destCode: string) {
		if (!product) return;
		isLoadingRates = true;
		shippingRates = [];
		selectedShippingRate = null;

		const qtyNum = Number(quantity) || 1;
		const itemVal = Number(product.price || 0) * qtyNum;

		try {
			const res = await fetch(`/api/shipping/cost?destinationId=${destCode}&weight=${qtyNum}&value=${itemVal}`);
			const json = await res.json();
			shippingRates = json.rates || [];
			if (shippingRates.length > 0) {
				selectedShippingRate = shippingRates[0];
			}
		} catch {
			shippingRates = [];
		} finally {
			isLoadingRates = false;
		}
	}

	// Nama teks lengkap wilayah untuk catatan pesanan
	const selectedProvinceName = $derived(provinces.find((p: any) => p.kode === selectedProvCode)?.nama || '');
	const selectedRegencyName = $derived(regenciesList.find((r) => r.kode === selectedRegCode)?.nama || '');
	const selectedDistrictName = $derived(districtsList.find((d) => d.kode === selectedDistCode)?.nama || '');
	const fullRegionLabel = $derived(
		selectedDistCode ? `Kec. ${selectedDistrictName}, ${selectedRegencyName}, ${selectedProvinceName}` : ''
	);

	// Hitung Total Bayar Dinamis
	const subtotalProduct = $derived(Number(product?.price || 0) * (Number(quantity) || 0));
	const currentShippingFee = $derived(deliveryMethod === 'DELIVERY' ? (selectedShippingRate?.cost || 0) : 0);
	const grandTotal = $derived(subtotalProduct + currentShippingFee);

	// === Operasional Pengambilan ===
	const OPEN_HOUR = 8;
	const CLOSE_HOUR = 17;
	const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

	function getNowWIB() {
		const now = new Date();
		const wibOffset = 7 * 60;
		const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
		const wibMinutes = (utcMinutes + wibOffset) % (24 * 60);
		return {
			hour: Math.floor(wibMinutes / 60),
			minute: wibMinutes % 60,
			totalMinutes: wibMinutes
		};
	}

	function getTodayWIB(): string {
		const now = new Date();
		const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000));
		return wib.toISOString().split('T')[0];
	}

	function getMaxDateWIB(): string {
		const now = new Date();
		const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000));
		wib.setDate(wib.getDate() + 14);
		return wib.toISOString().split('T')[0];
	}

	const isToday = $derived(pickupDate === getTodayWIB());
	const formattedPickupDate = $derived.by(() => {
		if (!pickupDate) return '';
		const d = new Date(pickupDate + 'T00:00:00');
		const day = DAY_NAMES[d.getDay()];
		return `${day}, ${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
	});

	const isShopClosedToday = $derived(getNowWIB().totalMinutes >= CLOSE_HOUR * 60);
	const isShopClosed = $derived(isToday && isShopClosedToday);

	const minPickupDate = $derived.by(() => {
		const today = getTodayWIB();
		if (isShopClosedToday) {
			const tomorrow = new Date(today + 'T00:00:00');
			tomorrow.setDate(tomorrow.getDate() + 1);
			return tomorrow.toISOString().split('T')[0];
		}
		return today;
	});

	$effect(() => {
		if (!pickupDate) {
			pickupDate = minPickupDate;
		}
	});

	const minPickupTime = $derived.by(() => {
		if (!isToday) return '08:00';
		const now = getNowWIB();
		const bufferMinutes = now.totalMinutes + 30;
		const minHour = Math.floor(bufferMinutes / 60);
		const minMin = bufferMinutes % 60;
		if (minHour >= CLOSE_HOUR) return null;
		return `${String(minHour).padStart(2, '0')}:${String(minMin).padStart(2, '0')}`;
	});

	const isPickupDateInvalid = $derived.by(() => {
		if (deliveryMethod !== 'PICKUP') return false;
		if (!pickupDate) return true;
		const today = getTodayWIB();
		if (pickupDate < today) return true;
		if (pickupDate === today && isShopClosedToday) return true;
		return false;
	});

	const isPickupTimeInvalid = $derived.by(() => {
		if (deliveryMethod !== 'PICKUP') return false;
		if (isPickupDateInvalid || !pickupTime) return true;
		const [h, m] = pickupTime.split(':').map(Number);
		const selectedMinutes = h * 60 + m;
		if (selectedMinutes < OPEN_HOUR * 60 || selectedMinutes >= CLOSE_HOUR * 60) return true;
		if (isToday) {
			return selectedMinutes <= getNowWIB().totalMinutes + 30;
		}
		return false;
	});

	let submitting = $state(false);
	let errorMessage = $state('');

	function handleQuantityChange(delta: number) {
		const current = Number(quantity) || 1;
		const next = Math.max(1, current + delta);
		quantity = String(next);
		if (selectedDistCode) {
			fetchRates(selectedDistCode);
		}
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!product) return;

		const qtyNum = Number(quantity);
		if (!qtyNum || isNaN(qtyNum) || qtyNum <= 0) {
			errorMessage = 'Jumlah harus lebih besar dari 0';
			toast.error(errorMessage);
			return;
		}

		if (!customerName.trim()) {
			errorMessage = 'Nama lengkap wajib diisi';
			toast.error(errorMessage);
			return;
		}

		if (!customerPhone.trim()) {
			errorMessage = 'Nomor WhatsApp wajib diisi';
			toast.error(errorMessage);
			return;
		}

		if (deliveryMethod === 'DELIVERY') {
			if (!selectedProvCode) {
				errorMessage = 'Silakan pilih Provinsi tujuan';
				toast.error(errorMessage);
				return;
			}
			if (!selectedRegCode) {
				errorMessage = 'Silakan pilih Kota/Kabupaten tujuan';
				toast.error(errorMessage);
				return;
			}
			if (!selectedDistCode) {
				errorMessage = 'Silakan pilih Kecamatan tujuan';
				toast.error(errorMessage);
				return;
			}
			if (!customerAddress.trim()) {
				errorMessage = 'Detail alamat pengiriman wajib diisi';
				toast.error(errorMessage);
				return;
			}
			if (!selectedShippingRate) {
				errorMessage = 'Pilih salah satu layanan kurir pengiriman';
				toast.error(errorMessage);
				return;
			}
		}

		if (deliveryMethod === 'PICKUP') {
			if (isPickupDateInvalid || isShopClosed || isPickupTimeInvalid) {
				errorMessage = 'Jadwal pengambilan di pabrik tidak valid.';
				toast.error(errorMessage);
				return;
			}
		}

		submitting = true;
		errorMessage = '';

		try {
			const finalAddress =
				deliveryMethod === 'PICKUP'
					? `Ambil di Tempat (${formattedPickupDate}, Pukul ${pickupTime} WIB)`
					: `${customerAddress.trim()} [${fullRegionLabel}]`;

			let finalNotes = '';
			if (deliveryMethod === 'PICKUP') {
				const pickupHeader = `Ambil di Pabrik\nTanggal: ${formattedPickupDate}\nJam: ${pickupTime} WIB`;
				finalNotes = notes.trim() ? `${pickupHeader}\nCatatan: ${notes.trim()}` : pickupHeader;
			} else {
				finalNotes = notes.trim();
			}

			const formData = new FormData();
			formData.set('productId', product.id);
			formData.set('quantity', String(qtyNum));
			formData.set('customerName', customerName.trim());
			formData.set('customerPhone', customerPhone.trim());
			formData.set('customerAddress', finalAddress);
			formData.set('notes', finalNotes);
			if (deliveryMethod === 'DELIVERY' && selectedShippingRate) {
				formData.set('shippingFee', String(selectedShippingRate.cost));
				formData.set('shippingCourier', selectedShippingRate.courier_name);
				formData.set('shippingService', selectedShippingRate.service_name);
			}

			const res = await fetch('/orders?/checkout', { method: 'POST', body: formData });
			const body = await res.json();
			const resData = typeof body.data === 'string' ? parse(body.data) : body.data;

			if (body.type === 'success') {
				toast.success('Pesanan berhasil dibuat!');
				window.location.href = `/orders/${resData?.orderId}`;
			} else {
				errorMessage = resData?.message || 'Gagal membuat pesanan';
				toast.error(errorMessage);
				submitting = false;
			}
		} catch {
			errorMessage = 'Gagal membuat pesanan. Periksa koneksi internet Anda.';
			toast.error(errorMessage);
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Checkout Pesanan - TapioLeaf</title>
</svelte:head>

<div class="min-h-screen bg-muted/20 pb-16 pt-4 sm:pt-6">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		<!-- Header Nav Checkout -->
		<div class="mb-5 flex items-center justify-between">
			<button
				type="button"
				onclick={() => history.back()}
				class="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
			>
				<ArrowLeft size={16} />
				<span>Kembali</span>
			</button>
		</div>

		<form onsubmit={handleSubmit}>
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				<!-- BAGIAN KIRI: Form Pengiriman & Data Pembeli (Shopee Style) -->
				<div class="lg:col-span-8 space-y-4">
					<!-- 1. Alamat Pengiriman / Metode Penerimaan -->
					<div class="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
						<div class="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
							<div class="flex items-center gap-2 text-primary font-bold text-sm sm:text-base">
								<MapPin size={18} />
								<span>Metode Penerimaan Pesanan</span>
							</div>
						</div>

						<div class="grid grid-cols-2 gap-3 mb-4">
							<button
								type="button"
								class="flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-center transition-all {deliveryMethod === 'DELIVERY' ? 'border-primary bg-primary/5 text-primary font-bold shadow-xs' : 'border-border bg-card text-muted-foreground hover:bg-muted/40'}"
								onclick={() => (deliveryMethod = 'DELIVERY')}
							>
								<Truck size={18} />
								<span class="text-xs sm:text-sm">Kirim ke Alamat</span>
							</button>

							<button
								type="button"
								class="flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-center transition-all {deliveryMethod === 'PICKUP' ? 'border-primary bg-primary/5 text-primary font-bold shadow-xs' : 'border-border bg-card text-muted-foreground hover:bg-muted/40'}"
								onclick={() => (deliveryMethod = 'PICKUP')}
							>
								<Store size={18} />
								<span class="text-xs sm:text-sm">Ambil di Pabrik</span>
							</button>
						</div>

						<!-- Identitas Penerima -->
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
							<div class="grid gap-1.5">
								<label for="co-name" class="text-xs font-semibold text-foreground">Nama Penerima *</label>
								<Input
									id="co-name"
									bind:value={customerName}
									placeholder="Nama lengkap pemesan"
									required
									disabled={submitting}
									class="h-9 text-xs sm:text-sm bg-background"
								/>
							</div>

							<div class="grid gap-1.5">
								<label for="co-phone" class="text-xs font-semibold text-foreground">No. WhatsApp / Telepon *</label>
								<Input
									id="co-phone"
									type="tel"
									bind:value={customerPhone}
									placeholder="Contoh: 08123456789"
									required
									disabled={submitting}
									class="h-9 text-xs sm:text-sm bg-background"
								/>
							</div>
						</div>

						{#if deliveryMethod === 'DELIVERY'}
							<div class="space-y-3.5 border-t border-border/60 pt-3.5">
								<!-- 3 Dropdown Wilayah: Provinsi -> Kota/Kabupaten -> Kecamatan -->
								<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
									<!-- 1. Provinsi -->
									<div class="flex flex-col gap-1.5 w-full min-w-0">
										<label for="co-prov" class="text-xs font-semibold text-foreground truncate">Provinsi *</label>
										<div class="w-full min-w-0">
											<SearchableSelect
												id="co-prov"
												placeholder="Pilih Provinsi"
												searchPlaceholder="Ketik nama provinsi..."
												items={provinces}
												value={selectedProvCode}
												disabled={submitting}
												onSelect={(item) => onProvinceChange(item.kode)}
											/>
										</div>
									</div>

									<!-- 2. Kota / Kabupaten -->
									<div class="flex flex-col gap-1.5 w-full min-w-0">
										<div class="flex items-center justify-between min-w-0">
											<label for="co-reg" class="text-xs font-semibold text-foreground truncate">Kota / Kabupaten *</label>
											{#if isLoadingRegencies}
												<Loader2 size={12} class="animate-spin text-primary shrink-0 ml-1" />
											{/if}
										</div>
										<div class="w-full min-w-0">
											<SearchableSelect
												id="co-reg"
												placeholder={!selectedProvCode ? 'Pilih Provinsi dulu' : isLoadingRegencies ? 'Memuat kab/kota...' : 'Pilih Kota/Kabupaten'}
												searchPlaceholder="Ketik nama kab/kota..."
												items={regenciesList}
												value={selectedRegCode}
												disabled={submitting || !selectedProvCode || isLoadingRegencies}
												onSelect={(item) => onRegencyChange(item.kode)}
											/>
										</div>
									</div>

									<!-- 3. Kecamatan -->
									<div class="flex flex-col gap-1.5 w-full min-w-0">
										<div class="flex items-center justify-between min-w-0">
											<label for="co-dist" class="text-xs font-semibold text-foreground truncate">Kecamatan *</label>
											{#if isLoadingDistricts}
												<Loader2 size={12} class="animate-spin text-primary shrink-0 ml-1" />
											{/if}
										</div>
										<div class="w-full min-w-0">
											<SearchableSelect
												id="co-dist"
												placeholder={!selectedRegCode ? 'Pilih Kab/Kota dulu' : isLoadingDistricts ? 'Memuat kecamatan...' : 'Pilih Kecamatan'}
												searchPlaceholder="Ketik nama kecamatan..."
												items={districtsList}
												value={selectedDistCode}
												disabled={submitting || !selectedRegCode || isLoadingDistricts}
												onSelect={(item) => onDistrictChange(item.kode)}
											/>
										</div>
									</div>
								</div>

								<!-- Opsi Kurir Ekspedisi (Shopee Style Opsi Pengiriman) -->
								{#if selectedDistCode}
									<div class="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2.5">
										<div class="flex items-center justify-between">
											<span class="text-xs font-bold text-primary flex items-center gap-1.5">
												<Truck size={15} />
												<span>Opsi Pengiriman ke {fullRegionLabel} *</span>
											</span>
											{#if isLoadingRates}
												<span class="text-xs text-muted-foreground flex items-center gap-1">
													<Loader2 size={12} class="animate-spin" /> Memuat tarif...
												</span>
											{/if}
										</div>

										{#if shippingRates.length > 0}
											<div class="grid gap-2">
												{#each shippingRates as rate}
													<label class="flex items-center justify-between rounded-xl border p-3 text-xs sm:text-sm transition-all cursor-pointer {selectedShippingRate === rate ? 'border-primary bg-background shadow-xs font-semibold text-foreground ring-1 ring-primary/40' : 'border-border/60 bg-background/50 hover:bg-background text-muted-foreground'}">
														<div class="flex items-center gap-3">
															<input
																type="radio"
																name="courierOption"
																checked={selectedShippingRate === rate}
																onchange={() => (selectedShippingRate = rate)}
																class="text-primary focus:ring-primary w-4 h-4"
															/>
															<div>
																<p class="font-bold text-foreground">{rate.courier_name}</p>
																{#if rate.etd}
																	<p class="text-[11px] text-muted-foreground mt-0.5">Estimasi tiba: {rate.etd} hari</p>
																{/if}
															</div>
														</div>
														<span class="font-extrabold text-primary text-sm sm:text-base">Rp {rate.cost.toLocaleString('id-ID')}</span>
													</label>
												{/each}
											</div>
										{:else if !isLoadingRates}
											<p class="text-xs text-muted-foreground italic">
												Belum ada kurir pengiriman tersedia untuk rute ini.
											</p>
										{/if}
									</div>
								{/if}

								<div class="grid gap-1.5">
									<label for="co-addr" class="text-xs font-semibold text-foreground">Alamat Lengkap Pengiriman *</label>
									<textarea
										id="co-addr"
										class="rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm focus:ring-1 focus:ring-primary outline-hidden"
										rows="2"
										placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, dan patokan"
										bind:value={customerAddress}
										required
										disabled={submitting}
									></textarea>
								</div>
							</div>
						{:else}
							<!-- Jadwal Ambil di Tempat -->
							<div class="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
								<div class="flex items-center gap-1.5 text-xs font-bold text-primary">
									<Clock size={16} />
									<span>Jadwal Pengambilan di Pabrik (Pati)</span>
								</div>

								<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div class="grid gap-1">
										<label for="co-date" class="text-xs font-medium text-foreground">Tanggal Pengambilan *</label>
										<div class="relative">
											<CalendarDays size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
											<Input
												id="co-date"
												type="date"
												bind:value={pickupDate}
												min={minPickupDate}
												max={getMaxDateWIB()}
												required
												disabled={submitting}
												class="h-9 text-xs pl-9 bg-background {isPickupDateInvalid && pickupDate ? 'border-destructive ring-1 ring-destructive' : ''}"
											/>
										</div>
										{#if formattedPickupDate}
											<span class="text-[11px] font-semibold text-primary">{formattedPickupDate}</span>
										{/if}
									</div>

									<div class="grid gap-1">
										<label for="co-time" class="text-xs font-medium text-foreground">Jam Pengambilan *</label>
										<Input
											id="co-time"
											type="time"
											bind:value={pickupTime}
											min={minPickupTime ?? "08:00"}
											max="17:00"
											required
											disabled={submitting}
											class="h-9 text-xs bg-background {isPickupTimeInvalid ? 'border-destructive ring-1 ring-destructive' : ''}"
										/>
										<span class="text-[10px] text-muted-foreground">08:00 - 17:00 WIB</span>
									</div>
								</div>

								<p class="text-xs text-muted-foreground border-t border-primary/10 pt-2">
									📍 <strong>Alamat Pabrik:</strong> Ngemplak Kidul, Margoyoso, Kab. Pati, Jawa Tengah.
								</p>
							</div>
						{/if}

						<div class="grid gap-1.5 mt-3 pt-3 border-t border-border/60">
							<label for="co-notes" class="text-xs font-semibold text-foreground">Pesan / Catatan Tambahan (Opsional)</label>
							<textarea
								id="co-notes"
								class="rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm focus:ring-1 focus:ring-primary outline-hidden"
								rows="1"
								placeholder="Tinggalkan pesan untuk penjual..."
								bind:value={notes}
								disabled={submitting}
							></textarea>
						</div>
					</div>

					<!-- 2. Rincian Produk yang Dipesan -->
					<div class="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
						<div class="flex items-center gap-2 text-primary font-bold text-sm sm:text-base border-b border-border/60 pb-3 mb-4">
							<Package size={18} />
							<span>Produk Dipesan</span>
						</div>

						<div class="flex items-start gap-4">
							{#if product.imageUrl}
								<img src={product.imageUrl} alt={product.name} class="h-20 w-20 rounded-xl object-cover border border-border shrink-0" />
							{:else}
								<div class="h-20 w-20 rounded-xl bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
									<Package size={28} />
								</div>
							{/if}

							<div class="flex-1 min-w-0">
								<h3 class="font-bold text-sm sm:text-base text-foreground truncate">{product.name}</h3>
								<p class="text-xs text-muted-foreground mt-0.5">Kode: {product.code}</p>
								<p class="text-primary font-extrabold text-sm sm:text-base mt-1">
									Rp {Number(product.price || 0).toLocaleString('id-ID')} <span class="text-xs font-normal text-muted-foreground">/ {product.unit}</span>
								</p>
							</div>

							<!-- Pengatur Jumlah Kuantitas -->
							<div class="flex flex-col items-end gap-1.5 shrink-0">
								<span class="text-xs text-muted-foreground font-medium">Jumlah ({product.unit})</span>
								<div class="flex items-center rounded-lg border border-border bg-background overflow-hidden">
									<button
										type="button"
										class="px-2.5 py-1 text-sm font-bold text-muted-foreground hover:bg-muted"
										onclick={() => handleQuantityChange(-1)}
									>-</button>
									<input
										type="number"
										step="0.01"
										min="0.01"
										bind:value={quantity}
										onchange={() => { if (selectedDistCode) fetchRates(selectedDistCode); }}
										class="w-14 text-center text-xs font-bold focus:outline-hidden"
									/>
									<button
										type="button"
										class="px-2.5 py-1 text-sm font-bold text-muted-foreground hover:bg-muted"
										onclick={() => handleQuantityChange(1)}
									>+</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- BAGIAN KANAN: Ringkasan Belanja & Tombol Bayar (Shopee Checkout Card) -->
				<div class="lg:col-span-4 sticky top-6 space-y-4">
					<div class="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
						<h4 class="font-bold text-sm sm:text-base text-foreground pb-2 border-b border-border/60">Ringkasan Pembayaran</h4>

						<div class="space-y-3 text-xs sm:text-sm">
							<div class="flex items-center justify-between text-muted-foreground">
								<span>Subtotal Produk</span>
								<span class="font-semibold text-foreground">Rp {subtotalProduct.toLocaleString('id-ID')}</span>
							</div>

							<div class="flex items-center justify-between text-muted-foreground">
								<span>Total Ongkos Kirim</span>
								<span class="font-semibold text-foreground">
									{#if deliveryMethod === 'DELIVERY'}
										{selectedShippingRate ? `Rp ${selectedShippingRate.cost.toLocaleString('id-ID')}` : 'Rp 0'}
									{:else}
										<span class="text-emerald-600 font-bold">GRATIS</span>
									{/if}
								</span>
							</div>

							{#if selectedShippingRate && deliveryMethod === 'DELIVERY'}
								<p class="text-[11px] text-muted-foreground italic pl-1 -mt-1">
									{selectedShippingRate.courier_name}
								</p>
							{/if}

							<div class="border-t border-border/70 pt-3 flex items-baseline justify-between">
								<span class="font-bold text-sm text-foreground">Total Pembayaran</span>
								<span class="text-primary font-black text-lg sm:text-xl">
									Rp {grandTotal.toLocaleString('id-ID')}
								</span>
							</div>
						</div>

						{#if errorMessage}
							<div class="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
								{errorMessage}
							</div>
						{/if}

						<Button
							type="submit"
							class="w-full h-11 text-sm font-bold shadow-md"
							disabled={submitting || (deliveryMethod === 'PICKUP' && (isPickupDateInvalid || isShopClosed || isPickupTimeInvalid))}
						>
							{#if submitting}
								<Loader2 size={16} class="mr-2 animate-spin" /> Memproses...
							{:else}
								Buat Pesanan Sekarang
							{/if}
						</Button>
					</div>
				</div>
			</div>
		</form>
	</div>
</div>
