import { env } from '$env/dynamic/private';

const BASE_URL = env.RAJAONGKIR_BASE_URL || 'https://api-sandbox.collaborator.komerce.id';
const API_KEY = env.RAJAONGKIR_API_KEY || '';
const ORIGIN_ID = env.RAJAONGKIR_ORIGIN_ID || '59154';

export interface DestinationItem {
	id: number;
	label: string;
	province_name: string;
	city_name: string;
	district_name: string;
	subdistrict_name?: string;
	zip_code?: string;
}

export interface ShippingCostOption {
	courier_name: string;
	courier_code: string;
	service_name: string;
	cost: number;
	etd: string;
	description?: string;
}

/**
 * Cari ID kecamatan / kelurahan tujuan (Search Destination)
 * Endpoint: GET /tariff/api/v1/destination/search?keyword=...
 */
// Mock data wilayah umum untuk pengujian offline / sebelum API Key dipasang
const FALLBACK_DESTINATIONS: DestinationItem[] = [
	{ id: 31597, label: 'Bantul, Bantul, DI Yogyakarta, 55711', province_name: 'DI Yogyakarta', city_name: 'Bantul', district_name: 'Bantul', zip_code: '55711' },
	{ id: 31598, label: 'Depok, Sleman, DI Yogyakarta, 55281', province_name: 'DI Yogyakarta', city_name: 'Sleman', district_name: 'Depok', zip_code: '55281' },
	{ id: 31599, label: 'Gondomanan, Kota Yogyakarta, DI Yogyakarta, 55121', province_name: 'DI Yogyakarta', city_name: 'Kota Yogyakarta', district_name: 'Gondomanan', zip_code: '55121' },
	{ id: 31600, label: 'Danurejan, Kota Yogyakarta, DI Yogyakarta, 55211', province_name: 'DI Yogyakarta', city_name: 'Kota Yogyakarta', district_name: 'Danurejan', zip_code: '55211' },
	{ id: 31601, label: 'Umbulharjo, Kota Yogyakarta, DI Yogyakarta, 55161', province_name: 'DI Yogyakarta', city_name: 'Kota Yogyakarta', district_name: 'Umbulharjo', zip_code: '55161' },
	{ id: 31602, label: 'Wirobrajan, Kota Yogyakarta, DI Yogyakarta, 55252', province_name: 'DI Yogyakarta', city_name: 'Kota Yogyakarta', district_name: 'Wirobrajan', zip_code: '55252' },
	{ id: 46116, label: 'Sempor, Kebumen, Jawa Tengah, 54421', province_name: 'Jawa Tengah', city_name: 'Kebumen', district_name: 'Sempor', zip_code: '54421' },
	{ id: 46117, label: 'Gombong, Kebumen, Jawa Tengah, 54411', province_name: 'Jawa Tengah', city_name: 'Kebumen', district_name: 'Gombong', zip_code: '54411' }
];

export async function searchDestination(keyword: string): Promise<DestinationItem[]> {
	if (!keyword || keyword.trim().length < 2) return [];

	// Jika API key belum terisi atau sedang offline, gunakan pencarian lokal cerdas
	if (!API_KEY) {
		const q = keyword.toLowerCase().trim();
		const matched = FALLBACK_DESTINATIONS.filter(d => 
			d.label.toLowerCase().includes(q) || 
			d.district_name.toLowerCase().includes(q) || 
			d.city_name.toLowerCase().includes(q)
		);
		if (matched.length > 0) return matched;
		// Generate opsi dinamis sesuai input pengguna agar selalu bisa dipilih
		return [{
			id: 99999,
			label: `${keyword.trim()} (Wilayah Terdeteksi)`,
			province_name: 'Indonesia',
			city_name: keyword.trim(),
			district_name: keyword.trim()
		}];
	}

	try {
		const url = `${BASE_URL}/tariff/api/v1/destination/search?keyword=${encodeURIComponent(keyword.trim())}`;
		const res = await fetch(url, {
			method: 'GET',
			headers: {
				'x-api-key': API_KEY,
				'Content-Type': 'application/json'
			}
		});

		if (!res.ok) {
			const text = await res.text();
			console.error('RajaOngkir searchDestination error:', res.status, text);
			return [];
		}

		const data = await res.json();
		const results = data.data || data.results || [];
		return results.map((item: any) => ({
			id: item.id || item.destination_id,
			label: item.label || `${item.subdistrict_name || ''}, ${item.district_name || ''}, ${item.city_name || ''}, ${item.province_name || ''}`.replace(/^,\s*/, ''),
			province_name: item.province_name || '',
			city_name: item.city_name || '',
			district_name: item.district_name || '',
			subdistrict_name: item.subdistrict_name || '',
			zip_code: item.zip_code || ''
		}));
	} catch (e) {
		console.error('Failed to search destination:', e);
		return [];
	}
}

/**
 * Hitung tarif ongkir pengiriman multi-kurir (Calculate Delivery Price)
 * Endpoint: GET /tariff/api/v1/calculate?...
 */
export async function calculateShippingRates(params: {
	receiverDestinationId: string | number;
	weightKg: number;
	itemValue: number;
	shipperDestinationId?: string | number;
}): Promise<ShippingCostOption[]> {
	const weightKg = Math.max(1, params.weightKg || 1);

	// Jika API_KEY belum dipasang, sediakan simulasi tarif realistik ekspedisi (J&T, JNE, Cargo)
	if (!API_KEY) {
		const basePerKg = 8000;
		const jntCost = Math.round(15000 + (weightKg - 1) * basePerKg);
		const jntCargoCost = Math.round(25000 + (weightKg - 1) * 3500);
		const jneCost = Math.round(16000 + (weightKg - 1) * 8500);

		return [
			{
				courier_name: 'J&T Express',
				courier_code: 'jnt',
				service_name: 'EZ (Reguler)',
				cost: jntCost,
				etd: '2-3',
				description: 'Layanan reguler J&T Express'
			},
			{
				courier_name: 'J&T Cargo',
				courier_code: 'jnt_cargo',
				service_name: 'Cargo (Karung Berat)',
				cost: jntCargoCost,
				etd: '3-4',
				description: 'Spesial muatan karung & partai besar'
			},
			{
				courier_name: 'JNE',
				courier_code: 'jne',
				service_name: 'REG',
				cost: jneCost,
				etd: '2-3',
				description: 'Layanan reguler JNE'
			}
		];
	}

	const originId = params.shipperDestinationId || ORIGIN_ID;
	// API menerima weight dalam satuan gram (1 kg = 1000 g)
	const weightGram = Math.max(1000, Math.round(params.weightKg * 1000));
	const itemValue = Math.max(0, Math.round(params.itemValue));

	try {
		const queryParams = new URLSearchParams({
			shipper_destination_id: String(originId),
			receiver_destination_id: String(params.receiverDestinationId),
			weight: String(weightGram),
			item_value: String(itemValue),
			cod: 'no'
		});

		const url = `${BASE_URL}/tariff/api/v1/calculate?${queryParams.toString()}`;
		const res = await fetch(url, {
			method: 'GET',
			headers: {
				'x-api-key': API_KEY,
				'Content-Type': 'application/json'
			}
		});

		if (!res.ok) {
			const text = await res.text();
			console.error('RajaOngkir calculate error:', res.status, text);
			return getFallbackRates(Number(params.receiverDestinationId), params.weightKg);
		}

		const data = await res.json();
		const list = data.data || data.results || [];
		const options: ShippingCostOption[] = [];

		for (const item of list) {
			options.push({
				courier_name: item.shipping_name || item.name || item.courier_name || 'Ekspedisi',
				courier_code: (item.shipping_code || item.code || item.courier_code || '').toLowerCase(),
				service_name: item.service_name || item.service || 'Standar',
				cost: Number(item.shipping_cost || item.tariff || item.cost || item.price || 0),
				etd: item.etd || item.estimated_time || '-',
				description: item.description || ''
			});
		}

		if (options.length === 0) {
			return getFallbackRates(Number(params.receiverDestinationId), params.weightKg);
		}

		return options;
	} catch (e) {
		console.error('Failed to calculate shipping rates:', e);
		return getFallbackRates(Number(params.receiverDestinationId), params.weightKg);
	}
}

/**
 * Fallback kalkulasi ongkir dinamis berdasarkan ID wilayah / jarak tujuan
 */
function getFallbackRates(receiverId: number, weightKg: number): ShippingCostOption[] {
	const w = Math.max(1, weightKg || 1);
	
	// Hitung koefisien jarak/zona berdasarkan ID wilayah
	// Wilayah dalam kota/DIY (ID 31590 - 31610): tarif lokal terjangkau
	const isLocalDIY = receiverId >= 31590 && receiverId <= 31610;
	// Wilayah Jawa Tengah dekat (Kebumen, Purworejo, Magelang, dll): tarif menengah
	const isCentralJava = receiverId >= 46000 && receiverId <= 47000;

	let baseJnt = 15000;
	let perKgJnt = 7000;
	let baseCargo = 25000;
	let perKgCargo = 3000;
	let etd = '2-3';

	if (isLocalDIY) {
		baseJnt = 9000;
		perKgJnt = 4000;
		baseCargo = 18000;
		perKgCargo = 2000;
		etd = '1-2';
	} else if (isCentralJava) {
		baseJnt = 13000;
		perKgJnt = 6000;
		baseCargo = 22000;
		perKgCargo = 2500;
		etd = '2-3';
	} else {
		// Luar Jawa / kota jauh
		baseJnt = 24000;
		perKgJnt = 12000;
		baseCargo = 40000;
		perKgCargo = 5000;
		etd = '3-5';
	}

	const jntCost = Math.round(baseJnt + (w - 1) * perKgJnt);
	const jntCargoCost = Math.round(baseCargo + (w - 1) * perKgCargo);
	const jneCost = Math.round(baseJnt + 2000 + (w - 1) * perKgJnt);

	return [
		{
			courier_name: 'J&T Express',
			courier_code: 'jnt',
			service_name: 'EZ (Reguler)',
			cost: jntCost,
			etd: etd,
			description: 'Layanan reguler J&T Express'
		},
		{
			courier_name: 'J&T Cargo',
			courier_code: 'jnt_cargo',
			service_name: 'Cargo (Karung & Partai Besar)',
			cost: jntCargoCost,
			etd: `${Number(etd.split('-')[0]) + 1}-${Number(etd.split('-')[1]) + 1}`,
			description: 'Spesial muatan karung & partai besar'
		},
		{
			courier_name: 'JNE',
			courier_code: 'jne',
			service_name: 'REG',
			cost: jneCost,
			etd: etd,
			description: 'Layanan reguler JNE'
		}
	];
}
