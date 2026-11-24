import { and, eq, gte, lte, ilike, or, sql, desc, asc, isNull, type SQL } from 'drizzle-orm';
import { db } from '../db';
import { sales, saleItems } from '../db/schema/sales';
import { products } from '../db/schema/product';
import { stockMovements } from '../db/schema/stock';
import { createSaleSchema, updateSaleSchema, salesQuerySchema } from './validation';
import type { CreateSaleInput, UpdateSaleInput, SalesQuery } from './validation';
import { getCurrentStock } from '../stock/service';

// --- Helpers ---

function formatError(e: unknown): string {
	if (e && typeof e === 'object' && 'issues' in e && Array.isArray((e as any).issues)) {
		return (e as { issues: Array<{ message: string }> }).issues.map((i) => i.message).join(', ');
	}
	return e instanceof Error ? e.message : 'Terjadi kesalahan';
}

async function generateSaleNumber(): Promise<string> {
	const today = new Date();
	const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
	const prefix = `SALE-${dateStr}-`;

	const lastSale = await db
		.select({ sale_number: sales.sale_number })
		.from(sales)
		.where(ilike(sales.sale_number, `${prefix}%`))
		.orderBy(desc(sales.sale_number))
		.limit(1);

	const lastNum = lastSale.length > 0 && lastSale[0].sale_number
		? parseInt(lastSale[0].sale_number.slice(prefix.length), 10)
		: 0;
	const nextNum = String(lastNum + 1).padStart(3, '0');
	return `${prefix}${nextNum}`;
}

/**
 * Calculate sale business formulas server-side
 * Aturan tara: Total Tara (kg) = Math.ceil(jumlahKarung / 2) (misal 35 karung / 2 = 17.5 -> 18 kg)
 * Atau jika manualTotalTara disediakan, gunakan manualTotalTara
 */
export function calculateTotalTara(sackCount: number, manualTotalTara?: number): number {
	if (manualTotalTara !== undefined && manualTotalTara >= 0 && !isNaN(manualTotalTara)) {
		return manualTotalTara;
	}
	if (sackCount <= 0) return 0;
	// Dibagi 2, jika ganjil (desimal .5) dibulatkan ke atas jadi genap/bilangan bulat terdekat
	return Math.ceil(sackCount / 2);
}

function calculateSale(sackWeights: number[], taraInput: number, pricePerKg: number, kuliFeePerSack: number) {
	const sackCount = sackWeights.length;
	const grossWeight = sackWeights.reduce((sum, w) => sum + w, 0);
	// Jika taraInput > 0 dan tidak sama dengan rumus standar, gunakan input, jika tidak hitung Math.ceil(sackCount / 2)
	const totalTara = (taraInput !== undefined && taraInput >= 0) ? taraInput : calculateTotalTara(sackCount);
	const netWeight = grossWeight - totalTara;
	const totalCost = netWeight * pricePerKg;
	const kuliFee = sackCount * kuliFeePerSack;
	const totalPayment = totalCost - kuliFee;

	return {
		sackCount,
		grossWeight: Math.round(grossWeight * 100) / 100,
		totalTara: Math.round(totalTara * 100) / 100,
		netWeight: Math.round(netWeight * 100) / 100,
		totalCost: Math.round(totalCost * 100) / 100,
		kuliFee: Math.round(kuliFee * 100) / 100,
		totalPayment: Math.round(totalPayment * 100) / 100
	};
}

// --- CRUD ---

export async function createSale(input: CreateSaleInput, userId?: string) {
	let data: CreateSaleInput;
	try { data = createSaleSchema.parse(input); } catch (e) { throw new Error(formatError(e)); }

	const saleNumber = await generateSaleNumber();
	const calc = calculateSale(data.sackWeights, data.taraPerSack, data.pricePerKg, data.kuliFeePerSack);
	if (calc.netWeight <= 0) throw new Error('Berat bersih tidak boleh nol atau negatif');

	// Validate or resolve product
	let productId = data.productId;
	if (!productId) {
		const [defaultProd] = await db.select({ id: products.id, name: products.name })
			.from(products)
			.where(and(eq(products.isActive, true), isNull(products.deletedAt)))
			.orderBy(asc(products.createdAt))
			.limit(1);
		if (defaultProd) {
			productId = defaultProd.id;
		}
	}

	if (productId) {
		const [product] = await db.select({ id: products.id, name: products.name })
			.from(products).where(eq(products.id, productId)).limit(1);
		if (!product) throw new Error('Produk tidak ditemukan');

		// If confirming directly, check stock
		if (data.status === 'confirmed') {
			const currentStock = await getCurrentStock(productId);
			if (currentStock < calc.netWeight) {
				throw new Error(`Stok tidak mencukupi. Tersedia: ${currentStock} kg, dibutuhkan: ${calc.netWeight} kg`);
			}
		}
	} else if (data.status === 'confirmed') {
		// If there is no product at all in database but confirmed
		throw new Error('Tidak ada produk aktif untuk mengkonfirmasi transaksi');
	}

	const [sale] = await db.insert(sales).values({
		sale_number: saleNumber,
		buyer_name: data.buyerName,
		buyer_phone: data.buyerPhone || null,
		buyer_address: data.buyerAddress || null,
		buyer_type: data.buyerType || null,
		weigher_name: data.weigherName || null,
		weigher_address: data.weigherAddress || null,
		weigher_phone: data.weigherPhone || null,
		product_id: productId || null,
		tara_per_sack: String(calc.totalTara),
		gross_weight: String(calc.grossWeight),
		net_weight: String(calc.netWeight),
		price_per_kg: String(data.pricePerKg),
		kuli_fee_per_sack: String(data.kuliFeePerSack),
		total_cost: String(calc.totalCost),
		total_payment: String(calc.totalPayment),
		status: data.status,
		sale_date: data.saleDate ? new Date(data.saleDate) : new Date(),
		created_by: userId || null
	}).returning();

	// Insert sale items (per sack weight)
	for (let i = 0; i < data.sackWeights.length; i++) {
		await db.insert(saleItems).values({
			sale_id: sale.id,
			sack_index: i + 1,
			sack_weight: String(data.sackWeights[i])
		});
	}

	// If confirmed directly as SALE, deduct stock. If WEIGHING_IN, add stock into warehouse.
	if (data.status === 'confirmed' && productId) {
		if (data.entryType === 'weighing') {
			await db.insert(stockMovements).values({
				productId: productId,
				quantityChange: String(calc.netWeight),
				movementType: 'MANUAL_IN',
				note: `Hasil Penimbangan Tepung ${saleNumber} (Penimbang: ${data.weigherName || 'Petugas'})`,
				referenceId: sale.id,
				createdByUserId: userId || null
			});
		} else {
			await db.insert(stockMovements).values({
				productId: productId,
				quantityChange: String(-calc.netWeight),
				movementType: 'SALE_OUT',
				note: `Penjualan ${saleNumber} kepada ${data.buyerName}`,
				referenceId: sale.id,
				createdByUserId: userId || null
			});
		}
	}

	return sale;
}

export async function confirmSale(saleId: string, userId?: string) {
	const [sale] = await db.select().from(sales).where(eq(sales.id, saleId)).limit(1);
	if (!sale) throw new Error('Transaksi tidak ditemukan');
	if (sale.status !== 'draft') throw new Error('Hanya transaksi draft yang dapat dikonfirmasi');

	// Check stock availability
	let productId = sale.product_id;
	if (!productId) {
		// Cari produk aktif tanpa deletedAt, atau produk apa pun yang belum terhapus
		let [defaultProd] = await db
			.select({ id: products.id })
			.from(products)
			.where(and(eq(products.isActive, true), isNull(products.deletedAt)))
			.limit(1);

		if (!defaultProd) {
			[defaultProd] = await db
				.select({ id: products.id })
				.from(products)
				.where(isNull(products.deletedAt))
				.limit(1);
		}

		if (defaultProd) {
			productId = defaultProd.id;
			await db.update(sales).set({ product_id: productId }).where(eq(sales.id, saleId));
		}
	}

	const netWeight = Number(sale.net_weight);
	if (netWeight <= 0) throw new Error('Berat bersih tidak boleh nol atau negatif');

	if (productId) {
		const currentStock = await getCurrentStock(productId);
		if (currentStock < netWeight) {
			throw new Error(`Stok tidak mencukupi. Tersedia: ${currentStock} kg, dibutuhkan: ${netWeight} kg`);
		}

		await db.insert(stockMovements).values({
			productId: productId,
			quantityChange: String(-netWeight),
			movementType: 'SALE_OUT',
			note: `Penjualan ${sale.sale_number} kepada ${sale.weigher_name || sale.buyer_name || 'Penimbang'}`,
			referenceId: saleId,
			createdByUserId: userId || null
		});
	}

	// Update status sale
	await db.update(sales).set({
		status: 'confirmed',
		updated_at: new Date()
	}).where(eq(sales.id, saleId));

	return { success: true, message: 'Transaksi berhasil dikonfirmasi' };
}

export async function getSale(id: string) {
	const [sale] = await db.select({
		id: sales.id,
		sale_number: sales.sale_number,
		buyer_name: sales.buyer_name,
		buyer_phone: sales.buyer_phone,
		buyer_address: sales.buyer_address,
		buyer_type: sales.buyer_type,
		weigher_name: sales.weigher_name,
		weigher_address: sales.weigher_address,
		weigher_phone: sales.weigher_phone,
		product_id: sales.product_id,
		tara_per_sack: sales.tara_per_sack,
		gross_weight: sales.gross_weight,
		net_weight: sales.net_weight,
		price_per_kg: sales.price_per_kg,
		kuli_fee_per_sack: sales.kuli_fee_per_sack,
		total_cost: sales.total_cost,
		total_payment: sales.total_payment,
		status: sales.status,
		sale_date: sales.sale_date,
		created_by: sales.created_by,
		created_at: sales.created_at,
		updated_at: sales.updated_at,
		product_name: products.name,
		product_code: products.code,
		product_unit: products.unit
	})
		.from(sales)
		.leftJoin(products, eq(products.id, sales.product_id))
		.where(eq(sales.id, id))
		.limit(1);

	if (!sale) throw new Error('Transaksi tidak ditemukan');

	const items = await db.select().from(saleItems)
		.where(eq(saleItems.sale_id, id))
		.orderBy(asc(saleItems.sack_index));

	return { ...sale, items };
}

export async function listSales(query: SalesQuery) {
	const q = salesQuerySchema.parse(query);
	const conditions: SQL<unknown>[] = [];

	if (q.search) {
		conditions.push(or(
			ilike(sales.buyer_name, `%${q.search}%`),
			ilike(sales.sale_number, `%${q.search}%`)
		) as SQL<unknown>);
	}
	if (q.status && q.status !== 'all') {
		conditions.push(eq(sales.status, q.status));
	}
	if (q.startDate) {
		conditions.push(gte(sales.sale_date, new Date(q.startDate)));
	}
	if (q.endDate) {
		const end = new Date(q.endDate);
		end.setHours(23, 59, 59, 999);
		conditions.push(lte(sales.sale_date, end));
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;
	const offset = (q.page - 1) * q.limit;

	const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(sales).where(where);
	const total = Number(countResult.count);

	const orderFn = q.order === 'desc' ? desc : asc;
	const sortColumn = q.sort === 'sale_date' ? sales.sale_date
		: q.sort === 'total_payment' ? sales.total_payment
		: q.sort === 'buyer_name' ? sales.buyer_name
		: sales.created_at;

	const rows = await db.select({
		id: sales.id,
		sale_number: sales.sale_number,
		buyer_name: sales.buyer_name,
		buyer_phone: sales.buyer_phone,
		buyer_address: sales.buyer_address,
		buyer_type: sales.buyer_type,
		weigher_name: sales.weigher_name,
		weigher_address: sales.weigher_address,
		weigher_phone: sales.weigher_phone,
		product_id: sales.product_id,
		gross_weight: sales.gross_weight,
		net_weight: sales.net_weight,
		price_per_kg: sales.price_per_kg,
		total_cost: sales.total_cost,
		total_payment: sales.total_payment,
		status: sales.status,
		sale_date: sales.sale_date,
		created_at: sales.created_at,
		product_name: products.name,
		product_code: products.code
	})
		.from(sales)
		.leftJoin(products, eq(products.id, sales.product_id))
		.where(where)
		.orderBy(orderFn(sortColumn))
		.limit(q.limit)
		.offset(offset);

	return {
		items: rows,
		pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) }
	};
}

export async function updateDraftSale(id: string, input: UpdateSaleInput, userId?: string) {
	let data: UpdateSaleInput;
	try { data = updateSaleSchema.parse(input); } catch (e) { throw new Error(formatError(e)); }

	const [existing] = await db.select().from(sales).where(eq(sales.id, id)).limit(1);
	if (!existing) throw new Error('Transaksi tidak ditemukan');
	if (existing.status !== 'draft') throw new Error('Hanya transaksi draft yang dapat diedit');

	const updates: Record<string, any> = { updated_at: new Date() };

	if (data.buyerName !== undefined) updates.buyer_name = data.buyerName;
	if (data.buyerPhone !== undefined) updates.buyer_phone = data.buyerPhone;
	if (data.buyerAddress !== undefined) updates.buyer_address = data.buyerAddress;
	if (data.buyerType !== undefined) updates.buyer_type = data.buyerType;
	if (data.weigherName !== undefined) updates.weigher_name = data.weigherName;
	if (data.weigherAddress !== undefined) updates.weigher_address = data.weigherAddress;
	if (data.weigherPhone !== undefined) updates.weigher_phone = data.weigherPhone;
	if (data.productId !== undefined) updates.product_id = data.productId;
	if (data.taraPerSack !== undefined) updates.tara_per_sack = String(data.taraPerSack);
	if (data.pricePerKg !== undefined) updates.price_per_kg = String(data.pricePerKg);
	if (data.kuliFeePerSack !== undefined) updates.kuli_fee_per_sack = String(data.kuliFeePerSack);
	if (data.saleDate !== undefined) updates.sale_date = new Date(data.saleDate);

	// Recalculate if sack weights changed
	if (data.sackWeights) {
		const taraPerSack = data.taraPerSack ?? Number(existing.tara_per_sack);
		const pricePerKg = data.pricePerKg ?? Number(existing.price_per_kg);
		const kuliFeePerSack = data.kuliFeePerSack ?? Number(existing.kuli_fee_per_sack);
		const calc = calculateSale(data.sackWeights, taraPerSack, pricePerKg, kuliFeePerSack);
		if (calc.netWeight <= 0) throw new Error('Berat bersih tidak boleh nol atau negatif');

		updates.tara_per_sack = String(calc.totalTara);
		updates.gross_weight = String(calc.grossWeight);
		updates.net_weight = String(calc.netWeight);
		updates.total_cost = String(calc.totalCost);
		updates.total_payment = String(calc.totalPayment);

		// Replace sale items
		await db.delete(saleItems).where(eq(saleItems.sale_id, id));
		for (let i = 0; i < data.sackWeights.length; i++) {
			await db.insert(saleItems).values({
				sale_id: id,
				sack_index: i + 1,
				sack_weight: String(data.sackWeights[i])
			});
		}
	}

	const [updated] = await db.update(sales).set(updates).where(eq(sales.id, id)).returning();
	return updated;
}

export async function deleteDraftSale(id: string) {
	const [existing] = await db.select().from(sales).where(eq(sales.id, id)).limit(1);
	if (!existing) throw new Error('Transaksi tidak ditemukan');

	// Jika berstatus confirmed, kembalikan stok terlebih dahulu
	if (existing.status === 'confirmed' && existing.product_id) {
		const netWeight = Number(existing.net_weight || 0);
		if (netWeight > 0) {
			await db.insert(stockMovements).values({
				productId: existing.product_id,
				quantityChange: String(netWeight),
				movementType: 'MANUAL_IN',
				note: `Pengembalian stok pembatalan/penghapusan penjualan ${existing.sale_number || ''}`,
				referenceId: id
			});
		}
	}

	// sale_items will cascade delete
	await db.delete(sales).where(eq(sales.id, id));
	return { success: true };
}

export async function getSalesSummary() {
	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

	const [monthlyResult] = await db.select({
		count: sql<number>`count(*)`,
		totalPayment: sql<string>`COALESCE(SUM(total_payment::numeric), 0)`,
		totalWeight: sql<string>`COALESCE(SUM(net_weight::numeric), 0)`
	})
		.from(sales)
		.where(and(
			eq(sales.status, 'confirmed'),
			gte(sales.sale_date, startOfMonth)
		));

	const [draftCount] = await db.select({ count: sql<number>`count(*)` })
		.from(sales)
		.where(eq(sales.status, 'draft'));

	return {
		monthlyCount: Number(monthlyResult?.count || 0),
		monthlyRevenue: Number(monthlyResult?.totalPayment || 0),
		monthlyWeight: Number(monthlyResult?.totalWeight || 0),
		draftCount: Number(draftCount?.count || 0)
	};
}
