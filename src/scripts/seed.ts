import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../lib/server/db/schema';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { eq } from 'drizzle-orm';

async function hashPassword(password: string): Promise<string> {
	const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
	const key = await scryptAsync(password.normalize('NFKC'), salt, { N: 16384, r: 16, p: 1, dkLen: 64, maxmem: 128 * 16384 * 16 * 2 });
	return `${salt}:${bytesToHex(key)}`;
}

function generateCode(index: number): string {
	const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
	return `Item-${today}-${String(index).padStart(3, '0')}`;
}

async function seed() {
	if (!process.env.DATABASE_URL) { console.error('DATABASE_URL is required'); process.exit(1); }

	console.log('Connecting to database...');
	const pool = new Pool({ connectionString: process.env.DATABASE_URL });
	const db = drizzle(pool, { schema });

	// Clear existing data
	console.log('Clearing existing data...');
	await db.delete(schema.orderItems);
	await db.delete(schema.orders);
	await db.delete(schema.cassavaReceipts);
	await db.delete(schema.suppliers);
	await db.delete(schema.stockMovements);
	await db.delete(schema.productionEntries);
	await db.delete(schema.products);
	await db.delete(schema.productCategories);
	await db.delete(schema.session);
	await db.delete(schema.account);
	await db.delete(schema.user);

	console.log('Hashing password...');
	const passwordHash = await hashPassword('Admin123!');
	const now = new Date();

	async function createUser(name: string, email: string, role: string) {
		const id = crypto.randomUUID();
		await db.insert(schema.user).values({ id, name, email, emailVerified: true, role, createdAt: now, updatedAt: now });
		await db.insert(schema.account).values({ id: crypto.randomUUID(), accountId: id, providerId: 'credential', userId: id, password: passwordHash, createdAt: now, updatedAt: now });
		return id;
	}

	const ownerId = await createUser('CV TapioLeaf', '2200018467@webmail.uad.ac.id', 'owner');
	console.log('Owner: 2200018467@webmail.uad.ac.id / Admin123!');
	await createUser('Budi Produksi', 'produksi@tapioleaf.com', 'bagian_produksi');
	await createUser('Ani Keuangan', 'admin@tapioleaf.com', 'admin_penjualan');
	await createUser('Rudi Gudang', 'gudang@tapioleaf.com', 'petugas_gudang');
	const customerId = await createUser('Santi', 'customer@tapioleaf.com', 'pembeli_umkm');
	console.log('Customer: customer@tapioleaf.com / Admin123!');

	// Seed categories
	console.log('Seeding categories...');
	const categoryNames = ['Tapioka Premium', 'Tapioka Industri', 'Tapioka Food Grade', 'Tapioka Khusus', 'Onggok Kering', 'Pakan Ternak', 'Tepung Tapioka Kemasan', 'Tapioka Olahan'];
	const categoryIds: string[] = [];
	for (const name of categoryNames) {
		const [cat] = await db.insert(schema.productCategories).values({ name }).returning();
		categoryIds.push(cat.id);
	}

	// Seed products with costPrice
	console.log('Seeding products with cost price...');
	const units = ['KG', 'TON', 'SAK', 'PCS'] as const;
	const productData = [
		{ name: 'Tapioka Premium 25kg', price: 180000, cost: 135000, unit: 'SAK' as const, cat: 0 },
		{ name: 'Tapioka Premium 50kg', price: 340000, cost: 260000, unit: 'SAK' as const, cat: 0 },
		{ name: 'Tapioka Industri 25kg', price: 150000, cost: 120000, unit: 'SAK' as const, cat: 1 },
		{ name: 'Tapioka Industri 50kg', price: 280000, cost: 225000, unit: 'SAK' as const, cat: 1 },
		{ name: 'Tapioka Food Grade 25kg', price: 160000, cost: 125000, unit: 'SAK' as const, cat: 2 },
		{ name: 'Tapioka Food Grade 50kg', price: 300000, cost: 240000, unit: 'SAK' as const, cat: 2 },
		{ name: 'Tapioka Premium 5kg', price: 40000, cost: 32000, unit: 'KG' as const, cat: 3 },
		{ name: 'Tapioka Premium 10kg', price: 75000, cost: 60000, unit: 'KG' as const, cat: 3 },
		{ name: 'Onggok Kering 25kg', price: 25000, cost: 18000, unit: 'SAK' as const, cat: 4 },
		{ name: 'Onggok Kering 50kg', price: 45000, cost: 34000, unit: 'SAK' as const, cat: 4 },
		{ name: 'Pakan Ternak 25kg', price: 35000, cost: 28000, unit: 'SAK' as const, cat: 5 },
		{ name: 'Pakan Ternak 50kg', price: 65000, cost: 52000, unit: 'SAK' as const, cat: 5 },
		{ name: 'Tapioka Kemasan 1kg', price: 12000, cost: 9000, unit: 'PCS' as const, cat: 6 },
		{ name: 'Tapioka Kemasan 500g', price: 7000, cost: 5000, unit: 'PCS' as const, cat: 6 },
		{ name: 'Tapioka Olahan 25kg', price: 130000, cost: 105000, unit: 'SAK' as const, cat: 7 },
		{ name: 'Tapioka Olahan 50kg', price: 240000, cost: 195000, unit: 'SAK' as const, cat: 7 },
	];

	const productIds: string[] = [];
	for (let i = 0; i < productData.length; i++) {
		const p = productData[i];
		const [prod] = await db.insert(schema.products).values({
			code: generateCode(i + 1), name: p.name, description: `Produk ${p.name} berkualitas tinggi`,
			price: String(p.price), costPrice: String(p.cost), unit: p.unit,
			minimumStock: Math.floor(Math.random() * 50) + 10,
			categoryId: categoryIds[p.cat], isActive: true, createdAt: now, updatedAt: now
		}).returning();
		productIds.push(prod.id);
	}
	console.log(`Created ${productData.length} products with cost prices`);

	// Seed suppliers
	console.log('Seeding suppliers...');
	const supplierNames = ['UD Tani Makmur', 'CV Sumber Rejeki', 'Poktan Sedyo Makmur', 'PT Agro Indah'];
	const supplierIds: string[] = [];
	for (const name of supplierNames) {
		const [s] = await db.insert(schema.suppliers).values({ name, phone: '08' + Math.floor(Math.random() * 1000000000), address: 'Desa Waturoyo, Pati' }).returning();
		supplierIds.push(s.id);
	}

	// Seed cassava receipts
	console.log('Seeding cassava receipts...');
	for (let i = 0; i < 6; i++) {
		const daysAgo = Math.floor(Math.random() * 14);
		const gross = Math.floor(Math.random() * 5000) + 3000;
		const tara = Math.floor(Math.random() * 200) + 100;
		const refr = Math.floor(Math.random() * 300) + 50;
		const net = gross - tara;
		const finalW = net - refr;
		const price = Math.floor(Math.random() * 500) + 1500;
		await db.insert(schema.cassavaReceipts).values({
			receiptDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
			supplierId: supplierIds[i % supplierIds.length],
			vehicleNumber: `H ${Math.floor(Math.random() * 9999) + 1000} AB`,
			driverName: 'Pak Supir',
			grossWeight: String(gross), taraWeight: String(tara),
			netWeight: String(net), refraction: String(refr),
			finalWeight: String(finalW), pricePerKg: String(price),
			totalCost: String(finalW * price),
			notes: 'Panen singkong musim ini',
			receivedById: ownerId,
			createdAt: new Date()
		});
	}
	console.log('Created 6 cassava receipts');

	// Seed production entries with yield
	console.log('Seeding production entries with yield...');
	for (let i = 0; i < 8; i++) {
		const daysAgo = Math.floor(Math.random() * 7);
		const cassavaKg = Math.floor(Math.random() * 2000) + 1000;
		const yieldPct = 22 + Math.floor(Math.random() * 8); // 22-30%
		const flourResult = cassavaKg * (yieldPct / 100);
		await db.insert(schema.productionEntries).values({
			productId: productIds[i % productIds.length],
			quantityKg: String(flourResult),
			cassavaUsedKg: String(cassavaKg),
			yieldPercentage: String(yieldPct),
			tapiocaFlourResult: String(flourResult),
			productionDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
			status: 'CONFIRMED',
			notes: `Yield ${yieldPct}%`,
			createdByUserId: ownerId
		});

		// Also add stock movement for production
		await db.insert(schema.stockMovements).values({
			productId: productIds[i % productIds.length],
			quantityChange: String(flourResult),
			movementType: 'PURCHASE_IN',
			movementDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
			note: `Produksi: seed-${i}`,
			createdAt: new Date()
		});
	}
	console.log('Created 8 production entries with yield');

	// Seed stock movements for other products
	console.log('Seeding stock movements...');
	for (let i = 0; i < productIds.length; i++) {
		const qty = Math.floor(Math.random() * 500) + 50;
		await db.insert(schema.stockMovements).values({
			productId: productIds[i], quantityChange: String(qty),
			movementType: 'PURCHASE_IN', movementDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
			note: 'Stok awal', createdAt: new Date()
		});
	}

	// Seed more customers for varied orders
	const customerData = [
		{ name: 'Santi', phone: '08123456789', addr: 'Desa Waturoyo, Pati' },
		{ name: 'Budi Santoso', phone: '08234567890', addr: 'Ds. Margoyoso, Pati' },
		{ name: 'Mbak Yuni', phone: '08345678901', addr: 'Pasar Margoyoso, Pati' },
		{ name: 'Pak Karyo', phone: '08456789012', addr: 'Desa Kertomulyo, Pati' },
		{ name: 'Bu Sari', phone: '08567890123', addr: 'Ds. Trangkil, Pati' },
	];

	// Seed PAID orders with order items for margin calculation
	console.log('Seeding paid orders with varied data...');
	const statuses = ['PAID', 'PAID', 'PAID', 'PAID', 'PENDING'] as const;
	for (let i = 0; i < 12; i++) {
		const c = customerData[i % customerData.length];
		const prodIdx = i % productIds.length;
		const qty = Math.floor(Math.random() * 15) + 2;
		const p = productData[prodIdx];
		const total = p.price * qty;
		const daysAgo = Math.floor(Math.random() * 10);
		const hoursAgo = Math.floor(Math.random() * 12);
		const orderDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000);

		const [order] = await db.insert(schema.orders).values({
			userId: customerId, status: statuses[i % statuses.length], totalAmount: String(total),
			customerName: c.name, customerPhone: c.phone,
			customerAddress: c.addr,
			paidAt: statuses[i % statuses.length] === 'PAID' ? orderDate : null,
			createdAt: orderDate,
			updatedAt: orderDate
		}).returning();

		await db.insert(schema.orderItems).values({
			orderId: order.id, productId: productIds[prodIdx],
			productName: p.name, productCode: generateCode(prodIdx + 1),
			quantity: String(qty), unitPrice: String(p.price), unit: p.unit
		});
	}
	console.log('Created 12 orders with varied customers');

	console.log('\n=== Seed Complete! ===');
	console.log('Owner: 2200018467@webmail.uad.ac.id / Admin123!');
	console.log('Customer: customer@tapioleaf.com / Admin123!');
	console.log('Dashboard now has: sales data, margins, production, stock!');

	await pool.end();
}

seed().catch((error) => { console.error('Seed failed:', error); process.exit(1); }).finally(() => { process.exit(0); });
