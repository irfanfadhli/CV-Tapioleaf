import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { calculateShippingRates } from '$lib/server/shipping/rajaongkir';

export const GET: RequestHandler = async ({ url }) => {
	const destinationId = url.searchParams.get('destinationId');
	const weightKg = Number(url.searchParams.get('weight') || 1);
	const itemValue = Number(url.searchParams.get('value') || 0);

	if (!destinationId) {
		return json({ error: 'Destination ID wajib diisi', rates: [] }, { status: 400 });
	}

	const rates = await calculateShippingRates({
		receiverDestinationId: destinationId,
		weightKg,
		itemValue
	});

	// Tambahkan perhitungan dinamis berdasarkan lokasi asal pabrik (Ngemplak Kidul, Margoyoso, Kab. Pati, Jawa Tengah -> Kode 33.18)
	const destStr = String(destinationId);
	let adjustedRates = rates;

	// Zona 1: Lokal Sekitar Pabrik (Kab. Pati: Margoyoso, Tayu, Juwana, Pati Kota, dll)
	if (destStr.startsWith('33.18') || destStr.toLowerCase().includes('pati') || destStr.toLowerCase().includes('margoyoso')) {
		const w = Math.max(1, weightKg);
		adjustedRates = [
			{
				courier_name: 'Kurir Lokal Pabrik / J&T Express',
				courier_code: 'jnt',
				service_name: 'Lokal Pati & Sekitar',
				cost: Math.round(6000 + (w - 1) * 2000),
				etd: '1',
				description: 'Pengiriman lokal dalam Kabupaten Pati (Dekat Pabrik Margoyoso)'
			},
			{
				courier_name: 'J&T Cargo',
				courier_code: 'jnt_cargo',
				service_name: 'Cargo Lokal (Karung)',
				cost: Math.round(12000 + (w - 1) * 1200),
				etd: '1',
				description: 'Spesial muatan karung partai besar area Pati'
			},
			{
				courier_name: 'JNE',
				courier_code: 'jne',
				service_name: 'REG Lokal',
				cost: Math.round(7000 + (w - 1) * 2500),
				etd: '1',
				description: 'Layanan reguler lokal Pati'
			}
		];
	} else if (
		// Zona 2: Tetangga Kabupaten Terdekat Pati (Kudus, Jepara, Rembang, Blora, Grobogan)
		destStr.startsWith('33.19') || // Kudus
		destStr.startsWith('33.20') || // Jepara
		destStr.startsWith('33.17') || // Rembang
		destStr.startsWith('33.16') || // Blora
		destStr.startsWith('33.15')    // Grobogan
	) {
		const w = Math.max(1, weightKg);
		adjustedRates = [
			{
				courier_name: 'J&T Express',
				courier_code: 'jnt',
				service_name: 'EZ (Reguler)',
				cost: Math.round(9000 + (w - 1) * 3500),
				etd: '1-2',
				description: 'Pengiriman tetangga Kab. Pati (Kudus, Jepara, Rembang, Blora)'
			},
			{
				courier_name: 'J&T Cargo',
				courier_code: 'jnt_cargo',
				service_name: 'Cargo (Karung & Partai Besar)',
				cost: Math.round(16000 + (w - 1) * 1800),
				etd: '1-2',
				description: 'Spesial muatan karung partai besar'
			},
			{
				courier_name: 'JNE',
				courier_code: 'jne',
				service_name: 'REG',
				cost: Math.round(10000 + (w - 1) * 4000),
				etd: '1-2',
				description: 'Layanan reguler JNE'
			}
		];
	} else if (destStr.startsWith('33')) {
		// Zona 3: Wilayah Jawa Tengah Lainnya (Semarang, Solo, Banyumas, Kebumen, Magelang, dll)
		const w = Math.max(1, weightKg);
		adjustedRates = [
			{
				courier_name: 'J&T Express',
				courier_code: 'jnt',
				service_name: 'EZ (Reguler)',
				cost: Math.round(12000 + (w - 1) * 5000),
				etd: '2-3',
				description: 'Pengiriman Jawa Tengah'
			},
			{
				courier_name: 'J&T Cargo',
				courier_code: 'jnt_cargo',
				service_name: 'Cargo (Karung & Partai Besar)',
				cost: Math.round(20000 + (w - 1) * 2200),
				etd: '2-3',
				description: 'Spesial muatan karung partai besar'
			},
			{
				courier_name: 'JNE',
				courier_code: 'jne',
				service_name: 'REG',
				cost: Math.round(13000 + (w - 1) * 5500),
				etd: '2-3',
				description: 'Layanan reguler JNE'
			}
		];
	} else if (destStr.startsWith('34')) {
		// Zona 4: D.I. Yogyakarta (Antar-Provinsi Jateng -> DIY)
		const w = Math.max(1, weightKg);
		adjustedRates = [
			{
				courier_name: 'J&T Express',
				courier_code: 'jnt',
				service_name: 'EZ (Reguler)',
				cost: Math.round(14000 + (w - 1) * 6000),
				etd: '2-3',
				description: 'Pengiriman Pati (Jateng) ke D.I. Yogyakarta'
			},
			{
				courier_name: 'J&T Cargo',
				courier_code: 'jnt_cargo',
				service_name: 'Cargo (Karung & Partai Besar)',
				cost: Math.round(24000 + (w - 1) * 2500),
				etd: '2-3',
				description: 'Spesial muatan karung partai besar'
			},
			{
				courier_name: 'JNE',
				courier_code: 'jne',
				service_name: 'REG',
				cost: Math.round(15000 + (w - 1) * 6500),
				etd: '2-3',
				description: 'Layanan reguler JNE'
			}
		];
	} else if (destStr.startsWith('31') || destStr.startsWith('32') || destStr.startsWith('35')) {
		// Zona 5: DKI Jakarta, Jawa Barat, Banten, Jawa Timur
		const w = Math.max(1, weightKg);
		adjustedRates = [
			{
				courier_name: 'J&T Express',
				courier_code: 'jnt',
				service_name: 'EZ (Reguler)',
				cost: Math.round(19000 + (w - 1) * 8000),
				etd: '2-4',
				description: 'Pengiriman Antar-Provinsi Pulau Jawa'
			},
			{
				courier_name: 'J&T Cargo',
				courier_code: 'jnt_cargo',
				service_name: 'Cargo (Karung & Partai Besar)',
				cost: Math.round(32000 + (w - 1) * 3200),
				etd: '3-4',
				description: 'Spesial muatan karung partai besar'
			},
			{
				courier_name: 'JNE',
				courier_code: 'jne',
				service_name: 'REG',
				cost: Math.round(20000 + (w - 1) * 8500),
				etd: '2-4',
				description: 'Layanan reguler JNE'
			}
		];
	} else {
		// Zona 6: Luar Pulau Jawa (Sumatera, Kalimantan, Sulawesi, Bali, Nusa Tenggara, Maluku, Papua)
		const w = Math.max(1, weightKg);
		adjustedRates = [
			{
				courier_name: 'J&T Express',
				courier_code: 'jnt',
				service_name: 'EZ (Reguler)',
				cost: Math.round(28000 + (w - 1) * 15000),
				etd: '3-5',
				description: 'Pengiriman Luar Pulau Jawa'
			},
			{
				courier_name: 'J&T Cargo',
				courier_code: 'jnt_cargo',
				service_name: 'Cargo (Karung & Partai Besar)',
				cost: Math.round(45000 + (w - 1) * 6000),
				etd: '4-7',
				description: 'Spesial muatan karung luar pulau'
			},
			{
				courier_name: 'JNE',
				courier_code: 'jne',
				service_name: 'REG',
				cost: Math.round(30000 + (w - 1) * 16000),
				etd: '3-5',
				description: 'Layanan reguler JNE'
			}
		];
	}

	return json({ rates: adjustedRates });
};
