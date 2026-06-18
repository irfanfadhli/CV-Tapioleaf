import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../lib/server/db/schema';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { eq } from 'drizzle-orm';

async function hashPassword(password: string): Promise<string> {
	const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
	const key = await scryptAsync(password.normalize('NFKC'), salt, {
		N: 16384,
		r: 16,
		p: 1,
		dkLen: 64,
		maxmem: 128 * 16384 * 16 * 2
	});
	return `${salt}:${bytesToHex(key)}`;
}

function generateCode(index: number): string {
	const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
	return `Item-${today}-${String(index).padStart(3, '0')}`;
}

async function seed() {
	if (!process.env.DATABASE_URL) {
		console.error('DATABASE_URL is required');
		process.exit(1);
	}

	console.log('Connecting to database...');
	const pool = new Pool({ connectionString: process.env.DATABASE_URL });
	const db = drizzle(pool, { schema });

	// Clear existing data
	console.log('Clearing existing data...');
	await db.delete(schema.stockMovements);
	await db.delete(schema.productionEntries);
	await db.delete(schema.products);
	await db.delete(schema.productCategories);
	await db.delete(schema.session);
	await db.delete(schema.account);
	await db.delete(schema.user);

	console.log('Hashing password with scrypt...');
	const passwordHash = await hashPassword('Admin123!');
	const now = new Date();

	async function createUser(name: string, email: string, role: string) {
		const id = crypto.randomUUID();
		await db.insert(schema.user).values({
			id, name, email, emailVerified: true, role, createdAt: now, updatedAt: now
		});
		await db.insert(schema.account).values({
			id: crypto.randomUUID(), accountId: id, providerId: 'credential', userId: id, password: passwordHash, createdAt: now, updatedAt: now
		});
		return id;
	}

	const ownerId = await createUser('Pak Budi', 'owner@tapioleaf.com', 'owner');
	console.log('Owner: owner@tapioleaf.com / Admin123!');

	await createUser('Budi Produksi', 'produksi@tapioleaf.com', 'bagian_produksi');
	console.log('Produksi: produksi@tapioleaf.com / Admin123!');

	await createUser('Ani Keuangan', 'admin@tapioleaf.com', 'admin_penjualan');
	console.log('Admin: admin@tapioleaf.com / Admin123!');

	await createUser('Rudi Gudang', 'gudang@tapioleaf.com', 'petugas_gudang');
	console.log('Gudang: gudang@tapioleaf.com / Admin123!');

	// Seed categories
	console.log('Seeding categories...');
	const categoryNames = [
		'Tepung Tapioka Premium',
		'Tepung Tapioka Reguler',
		'Tepung Tapioka Ekonomi',
		'Tepung Beras',
		'Tepung Ketan',
		'Gula Merah',
		'Gula Pasir',
		'Minyak Goreng',
		'Bumbu Dapur',
		'Kerupuk Mentah',
		'Mie Basah',
		'Tahu'
	];

	const categoryIds: string[] = [];
	for (const name of categoryNames) {
		const [cat] = await db.insert(schema.productCategories).values({ name }).returning();
		categoryIds.push(cat.id);
	}

	console.log(`Created ${categoryIds.length} categories`);

	// Seed products
	console.log('Seeding products...');
	const units = ['KG', 'TON', 'SAK', 'PCS'] as const;
	const productNames = [
		'Tapioka Premium 25kg', 'Tapioka Premium 50kg',
		'Tapioka Reguler 25kg', 'Tapioka Reguler 50kg',
		'Tapioka Ekonomi 25kg', 'Tapioka Ekonomi 50kg',
		'Tepung Beras 1kg', 'Tepung Beras 5kg',
		'Tepung Ketan 1kg', 'Tepung Ketan 5kg',
		'Gula Merah 500g', 'Gula Merah 1kg',
		'Gula Pasir 500g', 'Gula Pasir 1kg',
		'Minyak Goreng 1L', 'Minyak Goreng 2L',
		'Bumbu Dapur Lengkap', 'Bumbu Dapur Ekonomi',
		'Kerupuk Mentah 500g', 'Kerupuk Mentah 1kg',
		'Mie Basah 250g', 'Mie Basah 500g',
		'Tahu Putih 500g', 'Tahu Kuning 500g'
	];

	for (let i = 0; i < productNames.length; i++) {
		const catIndex = i % categoryIds.length;
		const price = Math.floor(Math.random() * 500000) + 5000;
		await db.insert(schema.products).values({
			code: generateCode(i + 1),
			name: productNames[i],
			description: `Produk ${productNames[i]} berkualitas tinggi`,
			price: String(price),
			unit: units[i % units.length],
			minimumStock: Math.floor(Math.random() * 100) + 5,
			categoryId: categoryIds[catIndex],
			isActive: true,
			createdAt: now,
			updatedAt: now
		});
	}

	console.log(`Created ${productNames.length} products`);

	// Seed stock movements
	console.log('Seeding stock movements...');

	const productRows = await db.select({ id: schema.products.id }).from(schema.products);
	const movementTypes = ['PURCHASE_IN', 'MANUAL_IN', 'MANUAL_OUT', 'ADJUSTMENT'] as const;
	const reasons = ['Stok awal gudang', 'Pembelian dari supplier', 'Penyesuaian stok opname fisik', 'Pengiriman ke pelanggan'];

	for (let i = 0; i < productRows.length; i++) {
		const type = movementTypes[i % movementTypes.length];
		let qty: number;
		if (type === 'PURCHASE_IN' || type === 'MANUAL_IN') qty = Math.floor(Math.random() * 1000) + 100;
		else if (type === 'MANUAL_OUT') qty = -(Math.floor(Math.random() * 100) + 10);
		else qty = Math.floor(Math.random() * 50) - 25;

		await db.insert(schema.stockMovements).values({
			productId: productRows[i].id,
			quantityChange: String(qty),
			movementType: type,
			movementDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
			note: type === 'ADJUSTMENT' ? reasons[i % reasons.length] : undefined,
			reason: type === 'ADJUSTMENT' ? reasons[i % reasons.length] : undefined,
			createdAt: new Date()
		});
	}

	console.log(`Created ${productRows.length} stock movements`);

	// Seed production entries
	console.log('Seeding production entries...');
	const prodTypes = ['DRAFT', 'CONFIRMED'] as const;
	for (let i = 0; i < 12; i++) {
		const p = productRows[i % productRows.length];
		const daysAgo = Math.floor(Math.random() * 7);
		const qty = Math.floor(Math.random() * 3000) + 500;
		const status = prodTypes[i % 2];
		await db.insert(schema.productionEntries).values({
			productId: p.id,
			quantityKg: String(qty),
			productionDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
			status,
			notes: status === 'DRAFT' ? 'Shift pagi' : 'Shift pagi & sore',
			createdByUserId: ownerId
		});
	}
	console.log('Created 12 production entries');

	console.log('Seed complete!');

	await pool.end();
}

seed()
	.catch((error) => {
		console.error('Seed failed:', error);
		process.exit(1);
	})
	.finally(() => {
		process.exit(0);
	});
