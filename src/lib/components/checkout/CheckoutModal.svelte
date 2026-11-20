<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '$lib/components/ui/dialog';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import Store from '@lucide/svelte/icons/store';
	import Truck from '@lucide/svelte/icons/truck';
	import Clock from '@lucide/svelte/icons/clock';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import { toast } from 'svelte-sonner';
	import { parse } from 'devalue';

	let {
		open,
		product,
		onClose
	}: {
		open: boolean;
		product: { id: string; name: string; code: string; price: string; unit: string; description: string | null } | null;
		onClose: () => void;
	} = $props();

	let quantity = $state('1');
	let customerName = $state('');
	let customerPhone = $state('');
	let deliveryMethod = $state<'PICKUP' | 'DELIVERY'>('PICKUP');
	let pickupDate = $state(''); // YYYY-MM-DD
	let pickupTime = $state('09:00');
	let customerAddress = $state('');
	let notes = $state('');

	// === State Ongkir & RajaOngkir ===
	let destinationSearchQuery = $state('');
	let destinationResults = $state<Array<{ id: number; label: string }>>([]);
	let selectedDestination = $state<{ id: number; label: string } | null>(null);
	let isSearchingDestination = $state(false);
	let destinationDebounceTimer: ReturnType<typeof setTimeout> | undefined;

	let shippingRates = $state<Array<{ courier_name: string; courier_code: string; service_name: string; cost: number; etd: string }>>([]);
	let selectedShippingRate = $state<{ courier_name: string; courier_code: string; service_name: string; cost: number; etd: string } | null>(null);
	let isLoadingRates = $state(false);

	async function handleDestinationInput(val: string) {
		destinationSearchQuery = val;
		clearTimeout(destinationDebounceTimer);
		if (val.trim().length < 3) {
			destinationResults = [];
			return;
		}
		isSearchingDestination = true;
		destinationDebounceTimer = setTimeout(async () => {
			try {
				const res = await fetch(`/api/shipping/destination?q=${encodeURIComponent(val.trim())}`);
				const json = await res.json();
				destinationResults = json.results || [];
			} catch {
				destinationResults = [];
			} finally {
				isSearchingDestination = false;
			}
		}, 400);
	}

	async function selectDestination(dest: { id: number; label: string }) {
		selectedDestination = dest;
		destinationSearchQuery = dest.label;
		destinationResults = [];
		await fetchRates(dest.id);
	}

	async function fetchRates(destId: number) {
		if (!product) return;
		isLoadingRates = true;
		shippingRates = [];
		selectedShippingRate = null;

		const qtyNum = Number(quantity) || 1;
		const itemVal = Number(product.price || 0) * qtyNum;

		try {
			const res = await fetch(`/api/shipping/cost?destinationId=${destId}&weight=${qtyNum}&value=${itemVal}`);
			const json = await res.json();
			shippingRates = json.rates || [];
			if (shippingRates.length > 0) {
				selectedShippingRate = shippingRates[0]; // Default pilih opsi pertama (termurah/standar)
			}
		} catch {
			shippingRates = [];
		} finally {
			isLoadingRates = false;
		}
	}

	// Hitung Total Bayar Dinamis
	const subtotalProduct = $derived((Number(product?.price || 0) * (Number(quantity) || 0)));
	const currentShippingFee = $derived(deliveryMethod === 'DELIVERY' ? (selectedShippingRate?.cost || 0) : 0);
	const grandTotal = $derived(subtotalProduct + currentShippingFee);

	// === Validasi Waktu ===
	const OPEN_HOUR = 8;   // 08:00 WIB
	const CLOSE_HOUR = 17; // 17:00 WIB

	const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

	// Waktu sekarang dalam WIB (UTC+7)
	function getNowWIB() {
		const now = new Date();
		// Konversi ke WIB (UTC+7)
		const wibOffset = 7 * 60; // menit
		const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
		const wibMinutes = (utcMinutes + wibOffset) % (24 * 60);
		return {
			hour: Math.floor(wibMinutes / 60),
			minute: wibMinutes % 60,
			totalMinutes: wibMinutes
		};
	}

	// Tanggal hari ini di WIB dalam format YYYY-MM-DD
	function getTodayWIB(): string {
		const now = new Date();
		const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000));
		return wib.toISOString().split('T')[0];
	}

	// Tanggal maksimum yang bisa dipilih (14 hari ke depan)
	function getMaxDateWIB(): string {
		const now = new Date();
		const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000));
		wib.setDate(wib.getDate() + 14);
		return wib.toISOString().split('T')[0];
	}

	// Apakah tanggal yang dipilih adalah hari ini?
	const isToday = $derived.by(() => {
		if (!pickupDate) return false;
		return pickupDate === getTodayWIB();
	});

	// Nama hari dari tanggal yang dipilih
	const selectedDayName = $derived.by(() => {
		if (!pickupDate) return '';
		const d = new Date(pickupDate + 'T00:00:00');
		return DAY_NAMES[d.getDay()];
	});

	// Format tanggal untuk tampilan (contoh: "Senin, 15 Nov 2026")
	const formattedPickupDate = $derived.by(() => {
		if (!pickupDate) return '';
		const d = new Date(pickupDate + 'T00:00:00');
		const day = DAY_NAMES[d.getDay()];
		return `${day}, ${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
	});

	// Apakah toko sudah tutup hari ini? (hanya relevan jika tanggal = hari ini)
	const isShopClosedToday = $derived.by(() => {
		const now = getNowWIB();
		return now.totalMinutes >= CLOSE_HOUR * 60;
	});

	// Apakah pesanan tidak bisa dilakukan (tutup hari ini + tanggal hari ini dipilih)
	const isShopClosed = $derived.by(() => {
		if (!isToday) return false;
		return isShopClosedToday;
	});

	// Minimum tanggal: hari ini jika masih bisa pesan, besok jika sudah tutup
	const minPickupDate = $derived.by(() => {
		const today = getTodayWIB();
		if (isShopClosedToday) {
			// Sudah tutup hari ini, min date = besok
			const tomorrow = new Date(today + 'T00:00:00');
			tomorrow.setDate(tomorrow.getDate() + 1);
			return tomorrow.toISOString().split('T')[0];
		}
		return today;
	});

	// Auto-set pickupDate saat dialog dibuka
	$effect(() => {
		if (open && !pickupDate) {
			pickupDate = minPickupDate;
		}
	});

	// Minimum jam yang bisa dipilih (tergantung apakah hari ini atau masa depan)
	const minPickupTime = $derived.by(() => {
		// Jika tanggal di masa depan, bisa pilih dari jam buka
		if (!isToday) return `${String(OPEN_HOUR).padStart(2, '0')}:00`;

		// Jika hari ini, hitung buffer 30 menit
		const now = getNowWIB();
		const bufferMinutes = now.totalMinutes + 30;
		const minHour = Math.max(OPEN_HOUR, Math.floor(bufferMinutes / 60));
		const minMin = bufferMinutes % 60;
		// Jika sudah lewat jam tutup, kembalikan null
		if (minHour >= CLOSE_HOUR) return null;
		return `${String(minHour).padStart(2, '0')}:${String(minMin).padStart(2, '0')}`;
	});

	// Validasi tanggal
	const isPickupDateInvalid = $derived.by(() => {
		if (deliveryMethod !== 'PICKUP') return false;
		if (!pickupDate) return true;
		const today = getTodayWIB();
		// Tidak boleh tanggal yang sudah lewat
		if (pickupDate < today) return true;
		// Jika hari ini tapi toko sudah tutup
		if (pickupDate === today && isShopClosedToday) return true;
		return false;
	});

	// Validasi apakah pickupTime yang dipilih valid
	const isPickupTimeInvalid = $derived.by(() => {
		if (deliveryMethod !== 'PICKUP') return false;
		if (isPickupDateInvalid) return true;
		if (!pickupTime) return true;
		const [h, m] = pickupTime.split(':').map(Number);
		const selectedMinutes = h * 60 + m;
		const openMinutes = OPEN_HOUR * 60;
		const closeMinutes = CLOSE_HOUR * 60;
		// Harus dalam jam operasional
		if (selectedMinutes < openMinutes || selectedMinutes >= closeMinutes) return true;
		// Jika hari ini, harus belum lewat (dengan 30 menit buffer)
		if (isToday) {
			const now = getNowWIB();
			return selectedMinutes <= now.totalMinutes + 30;
		}
		return false;
	});
	let submitting = $state(false);

	let errorMessage = $state('');

	function handleNameInput(e: Event) {
		const target = e.target as HTMLInputElement;
		// Hanya izinkan huruf, spasi, titik, koma, kutip, dash
		customerName = target.value.replace(/[^a-zA-Z\s.,'-]/g, '');
	}

	function handlePhoneInput(e: Event) {
		const target = e.target as HTMLInputElement;
		// Hanya izinkan angka dan tanda tambah (+) di awal
		customerPhone = target.value.replace(/[^0-9+]/g, '');
	}

	function handleQuantityInput(e: Event) {
		const target = e.target as HTMLInputElement;
		let val = parseFloat(target.value);
		if (val < 0) {
			quantity = '';
		}
		if (selectedDestination) {
			fetchRates(selectedDestination.id);
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!product) return;

		const qtyNum = Number(quantity);
		if (isNaN(qtyNum) || qtyNum <= 0) {
			errorMessage = 'Jumlah harus lebih besar dari 0 (tidak boleh minus atau 0)';
			toast.error(errorMessage);
			return;
		}

		if (/\d/.test(customerName)) {
			errorMessage = 'Nama tidak boleh mengandung angka';
			toast.error(errorMessage);
			return;
		}

		if (/[a-zA-Z]/.test(customerPhone) || !/^(\+62|62|0)[0-9]{7,14}$/.test(customerPhone.trim())) {
			errorMessage = 'Nomor telepon tidak valid dan tidak boleh mengandung huruf';
			toast.error(errorMessage);
			return;
		}

		if (deliveryMethod === 'DELIVERY' && customerAddress.trim().length < 5) {
			errorMessage = 'Alamat pengiriman harus diisi lengkap (minimal 5 karakter)';
			toast.error(errorMessage);
			return;
		}

		if (deliveryMethod === 'DELIVERY' && !selectedDestination) {
			errorMessage = 'Silakan pilih kecamatan/kelurahan tujuan pengiriman';
			toast.error(errorMessage);
			return;
		}

		if (deliveryMethod === 'PICKUP' && !pickupDate) {
			errorMessage = 'Silakan tentukan tanggal pengambilan';
			toast.error(errorMessage);
			return;
		}

		if (deliveryMethod === 'PICKUP' && !pickupTime) {
			errorMessage = 'Silakan tentukan jam pengambilan di tempat';
			toast.error(errorMessage);
			return;
		}

		if (deliveryMethod === 'PICKUP') {
			if (isPickupDateInvalid) {
				errorMessage = 'Tanggal pengambilan tidak valid. Pilih tanggal hari ini atau yang akan datang.';
				toast.error(errorMessage);
				return;
			}
			if (isShopClosed) {
				errorMessage = 'Toko sudah tutup hari ini (Jam operasional 08:00–17:00 WIB). Silakan pilih tanggal lain.';
				toast.error(errorMessage);
				return;
			}
			if (isPickupTimeInvalid) {
				errorMessage = isToday
					? 'Jam pengambilan tidak valid. Pilih jam yang belum terlewat (minimal 30 menit dari sekarang) dalam jam operasional 08:00–17:00 WIB.'
					: 'Jam pengambilan harus dalam jam operasional 08:00–17:00 WIB.';
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
					: customerAddress.trim();

			let finalNotes = '';
			if (deliveryMethod === 'PICKUP') {
				const pickupHeader = `Ambil di Tempat\nTanggal: ${formattedPickupDate}\nJam: ${pickupTime} WIB`;
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

			const data = typeof body.data === 'string' ? parse(body.data) : body.data;

			if (body.type === 'success') {
				if (data?.invoiceUrl) {
					window.location.href = data.invoiceUrl;
				} else {
					toast.success('Pesanan dibuat! Silakan cek status pesanan Anda.');
					window.location.href = `/orders/${data?.orderId}`;
				}
			} else {
				errorMessage = data?.message || 'Gagal membuat pesanan';
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

<Dialog {open} onOpenChange={(o) => { if (!o) onClose(); }}>
	<DialogContent class="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl max-w-[calc(100%-1.5rem)]">
		<DialogHeader class="pr-6 pb-2 border-b border-border/60">
			<DialogTitle class="text-base sm:text-lg">Buat Pesanan</DialogTitle>
			<DialogDescription class="text-xs sm:text-sm line-clamp-1">
				{product?.name} ({product?.code}) &mdash; <span class="font-semibold text-primary">Rp {Number(product?.price || 0).toLocaleString('id-ID')} / {product?.unit}</span>
			</DialogDescription>
		</DialogHeader>

		<form onsubmit={handleSubmit} class="py-2">
			{#if errorMessage}
				<div class="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs sm:text-sm text-destructive whitespace-pre-wrap">{errorMessage}</div>
			{/if}

			<!-- Grid 2 Kolom di Desktop / Layar Lebar -->
			<div class="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
				<!-- KOLOM KIRI (7/12): Data Pemesanan & Pengiriman -->
				<div class="md:col-span-7 space-y-3.5">
					<!-- Metode Pengambilan / Pengiriman -->
					<div class="grid gap-1.5">
						<span class="text-xs sm:text-sm font-medium">Metode Penerimaan *</span>
						<div class="grid grid-cols-2 gap-2">
							<button
								type="button"
								class="flex items-center justify-center gap-2 rounded-xl border p-2.5 text-center transition-all {deliveryMethod === 'PICKUP' ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs' : 'border-border bg-card text-muted-foreground hover:bg-muted/50'}"
								onclick={() => (deliveryMethod = 'PICKUP')}
								disabled={submitting}
							>
								<Store size={16} />
								<span class="text-xs font-medium">Ambil di Tempat</span>
							</button>

							<button
								type="button"
								class="flex items-center justify-center gap-2 rounded-xl border p-2.5 text-center transition-all {deliveryMethod === 'DELIVERY' ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs' : 'border-border bg-card text-muted-foreground hover:bg-muted/50'}"
								onclick={() => (deliveryMethod = 'DELIVERY')}
								disabled={submitting}
							>
								<Truck size={16} />
								<span class="text-xs font-medium">Kirim ke Alamat</span>
							</button>
						</div>
					</div>

					<!-- Form Input Customer & Jumlah -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
						<div class="grid gap-1">
							<label for="chk-name" class="text-xs font-medium">Nama Lengkap *</label>
							<Input
								id="chk-name"
								bind:value={customerName}
								oninput={handleNameInput}
								placeholder="Nama pemesan"
								required
								disabled={submitting}
								class="h-8 sm:h-9 text-xs"
							/>
						</div>

						<div class="grid gap-1">
							<label for="chk-phone" class="text-xs font-medium">No. WhatsApp *</label>
							<Input
								id="chk-phone"
								type="tel"
								bind:value={customerPhone}
								oninput={handlePhoneInput}
								placeholder="08123456789"
								required
								disabled={submitting}
								class="h-8 sm:h-9 text-xs"
							/>
						</div>
					</div>

					<div class="grid gap-1">
						<label for="chk-qty" class="text-xs font-medium">Jumlah Pesanan ({product?.unit}) *</label>
						<Input
							id="chk-qty"
							type="number"
							step="0.01"
							min="0.01"
							bind:value={quantity}
							oninput={handleQuantityInput}
							placeholder="Contoh: 10"
							required
							disabled={submitting}
							class="h-8 sm:h-9 text-xs"
						/>
					</div>

					<!-- Form Tambahan: Ambil di Tempat -->
					{#if deliveryMethod === 'PICKUP'}
						<div class="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2.5">
							<div class="flex items-center gap-1.5 text-xs font-semibold text-primary">
								<Clock size={14} />
								<span>Jadwal Pengambilan di Pabrik</span>
							</div>

							<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
								<div class="grid gap-1">
									<label for="chk-pickup-date" class="text-[11px] font-medium text-foreground">Tanggal *</label>
									<Input
										id="chk-pickup-date"
										type="date"
										bind:value={pickupDate}
										min={minPickupDate}
										max={getMaxDateWIB()}
										required
										disabled={submitting}
										class="h-8 text-xs bg-background {isPickupDateInvalid && pickupDate ? 'border-destructive ring-1 ring-destructive' : ''}"
									/>
									{#if formattedPickupDate}
										<span class="text-[10px] text-primary">{formattedPickupDate}</span>
									{/if}
								</div>

								<div class="grid gap-1">
									<label for="chk-pickup-time" class="text-[11px] font-medium text-foreground">Jam Pengambilan *</label>
									<Input
										id="chk-pickup-time"
										type="time"
										bind:value={pickupTime}
										min={minPickupTime ?? "08:00"}
										max="17:00"
										required
										disabled={submitting}
										class="h-8 text-xs bg-background {isPickupTimeInvalid ? 'border-destructive ring-1 ring-destructive' : ''}"
									/>
									<span class="text-[10px] text-muted-foreground">08:00 - 17:00 WIB</span>
								</div>
							</div>

							{#if isPickupDateInvalid && pickupDate}
								<p class="text-[10px] text-destructive">⚠ Tanggal sudah terlewat atau toko tutup.</p>
							{/if}
							{#if isPickupTimeInvalid && pickupTime}
								<p class="text-[10px] text-destructive">⚠ Jam harus dalam jam operasional toko.</p>
							{/if}
						</div>
					{/if}

					<!-- Form Tambahan: Kirim ke Alamat -->
					{#if deliveryMethod === 'DELIVERY'}
						<div class="space-y-3">
							<!-- Autocomplete Wilayah -->
							<div class="grid gap-1 relative">
								<label for="chk-dest" class="text-xs font-medium">Kota / Kecamatan Tujuan *</label>
								<div class="relative">
									<Input
										id="chk-dest"
										type="text"
										placeholder="Ketik minimal 3 huruf (contoh: Margoyoso, Pati)"
										value={destinationSearchQuery}
										oninput={(e) => handleDestinationInput((e.target as HTMLInputElement).value)}
										disabled={submitting}
										class="h-8 sm:h-9 text-xs pr-8"
										required
									/>
									{#if isSearchingDestination}
										<div class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
											<Loader2 size={13} class="animate-spin" />
										</div>
									{/if}
								</div>

								{#if destinationResults.length > 0}
									<div class="absolute left-0 right-0 top-full z-50 mt-1 max-h-44 overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-lg">
										{#each destinationResults as dest}
											<button
												type="button"
												class="w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
												onclick={() => selectDestination(dest)}
											>
												{dest.label}
											</button>
										{/each}
									</div>
								{/if}
							</div>

							<!-- Pilihan Kurir -->
							{#if selectedDestination}
								<div class="rounded-xl border border-primary/20 bg-primary/5 p-2.5 space-y-1.5">
									<div class="flex items-center justify-between">
										<span class="text-xs font-semibold text-primary flex items-center gap-1.5">
											<Truck size={14} />
											<span>Pilihan Kurir *</span>
										</span>
										{#if isLoadingRates}
											<span class="text-[10px] text-muted-foreground flex items-center gap-1">
												<Loader2 size={10} class="animate-spin" /> Memuat...
											</span>
										{/if}
									</div>

									{#if shippingRates.length > 0}
										<div class="grid gap-1.5 max-h-36 overflow-y-auto pr-0.5">
											{#each shippingRates as rate}
												<label class="flex items-center justify-between rounded-lg border p-2 text-xs transition-all cursor-pointer {selectedShippingRate === rate ? 'border-primary bg-background shadow-2xs font-semibold text-foreground ring-1 ring-primary/40' : 'border-border/60 bg-background/50 hover:bg-background text-muted-foreground'}">
													<div class="flex items-center gap-2">
														<input
															type="radio"
															name="courierOption"
															checked={selectedShippingRate === rate}
															onchange={() => (selectedShippingRate = rate)}
															class="text-primary focus:ring-primary"
														/>
														<div>
															<p class="font-medium text-foreground text-[11px] sm:text-xs">{rate.courier_name} ({rate.service_name})</p>
															{#if rate.etd}
																<p class="text-[10px] text-muted-foreground">Estimasi: {rate.etd} hari</p>
															{/if}
														</div>
													</div>
													<span class="font-bold text-primary text-xs">Rp {rate.cost.toLocaleString('id-ID')}</span>
												</label>
											{/each}
										</div>
									{:else if !isLoadingRates}
										<p class="text-[11px] text-muted-foreground italic">
											Belum ada layanan kurir tersedia.
										</p>
									{/if}
								</div>
							{/if}

							<div class="grid gap-1">
								<label for="chk-addr" class="text-xs font-medium">Detail Alamat Lengkap *</label>
								<textarea
									id="chk-addr"
									class="rounded-lg border bg-background px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary outline-hidden"
									rows="2"
									placeholder="Contoh: Jl. Diponegoro No. 12, RT 01 / RW 02"
									bind:value={customerAddress}
									required
									disabled={submitting}
								></textarea>
							</div>
						</div>
					{/if}

					<div class="grid gap-1">
						<label for="chk-notes" class="text-xs font-medium">Catatan Pesanan</label>
						<textarea
							id="chk-notes"
							class="rounded-lg border bg-background px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary outline-hidden"
							rows="1"
							placeholder={deliveryMethod === 'PICKUP' ? 'Catatan saat pengambilan (opsional)' : 'Catatan kurir/alamat (opsional)'}
							bind:value={notes}
							disabled={submitting}
						></textarea>
					</div>
				</div>

				<!-- KOLOM KANAN (5/12): Ringkasan Biaya & Aksi (Sticky di Layar Lebar) -->
				<div class="md:col-span-5 flex flex-col justify-between space-y-4">
					<div class="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-3">
						<h4 class="font-semibold text-xs text-foreground uppercase tracking-wider">Ringkasan Pembayaran</h4>

						<div class="space-y-2 text-xs">
							<div class="flex items-center justify-between text-muted-foreground">
								<span>Subtotal Produk</span>
								<span class="font-medium text-foreground">Rp {subtotalProduct.toLocaleString('id-ID')}</span>
							</div>
							<div class="flex items-center justify-between text-[11px] text-muted-foreground pl-2">
								<span>{quantity || 0} {product?.unit} &times; Rp {Number(product?.price || 0).toLocaleString('id-ID')}</span>
							</div>

							{#if deliveryMethod === 'DELIVERY'}
								<div class="flex items-center justify-between text-muted-foreground border-t border-border/40 pt-2">
									<span class="flex items-center gap-1">
										<Truck size={12} class="text-primary" />
										<span>Ongkos Kirim</span>
									</span>
									<span class="font-medium text-foreground">
										{selectedShippingRate ? `Rp ${selectedShippingRate.cost.toLocaleString('id-ID')}` : 'Belum pilih kurir'}
									</span>
								</div>
								{#if selectedShippingRate}
									<div class="text-[10px] text-muted-foreground pl-2">
										{selectedShippingRate.courier_name} ({selectedShippingRate.service_name})
									</div>
								{/if}
							{:else}
								<div class="flex items-center justify-between text-muted-foreground border-t border-border/40 pt-2">
									<span class="flex items-center gap-1">
										<Store size={12} class="text-primary" />
										<span>Pengambilan</span>
									</span>
									<span class="font-semibold text-emerald-600 dark:text-emerald-400">Gratis (Pabrik)</span>
								</div>
							{/if}

							<div class="border-t border-border/70 pt-2.5 flex items-center justify-between">
								<span class="font-bold text-xs sm:text-sm text-foreground">Total Bayar</span>
								<span class="text-primary font-black text-base sm:text-lg">Rp {grandTotal.toLocaleString('id-ID')}</span>
							</div>
						</div>
					</div>

					<!-- Tombol Aksi -->
					<div class="space-y-2 pt-2 border-t md:border-t-0 border-border/60">
						<Button
							type="submit"
							class="w-full h-9 text-xs font-semibold"
							disabled={submitting || (deliveryMethod === 'PICKUP' && (isPickupDateInvalid || isShopClosed || isPickupTimeInvalid))}
						>
							{#if submitting}<Loader2 size={13} class="mr-1.5 animate-spin" />{/if}
							Ajukan Pesanan Sekarang
						</Button>

						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={onClose}
							disabled={submitting}
							class="w-full h-8 text-xs text-muted-foreground"
						>
							Batal
						</Button>
					</div>
				</div>
			</div>
		</form>
	</DialogContent>
</Dialog>
