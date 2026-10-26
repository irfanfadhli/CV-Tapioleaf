import { describe, it, expect } from 'vitest';
import { createSaleSchema, updateSaleSchema, salesQuerySchema } from '$lib/server/sales/validation';

describe('createSaleSchema', () => {
	it('should parse valid input with defaults', () => {
		const result = createSaleSchema.parse({
			buyerName: 'Toko Makmur',
			buyerType: 'umkm',
			productId: 'prod-001',
			sackWeights: [52.5, 51.0, 53.2],
			pricePerKg: 5000
		});

		expect(result.buyerName).toBe('Toko Makmur');
		expect(result.buyerType).toBe('umkm');
		expect(result.productId).toBe('prod-001');
		expect(result.sackWeights).toEqual([52.5, 51.0, 53.2]);
		expect(result.taraPerSack).toBe(2);
		expect(result.pricePerKg).toBe(5000);
		expect(result.kuliFeePerSack).toBe(3000);
		expect(result.status).toBe('draft');
	});

	it('should accept custom tara and kuli fee', () => {
		const result = createSaleSchema.parse({
			buyerName: 'UD Jaya',
			buyerType: 'pengepul',
			productId: 'prod-002',
			sackWeights: [50],
			pricePerKg: 4500,
			taraPerSack: 2.5,
			kuliFeePerSack: 2500
		});

		expect(result.taraPerSack).toBe(2.5);
		expect(result.kuliFeePerSack).toBe(2500);
		expect(result.buyerType).toBe('pengepul');
	});

	it('should accept status confirmed', () => {
		const result = createSaleSchema.parse({
			buyerName: 'Test',
			buyerType: 'umkm',
			productId: 'prod-001',
			sackWeights: [50],
			pricePerKg: 5000,
			status: 'confirmed'
		});

		expect(result.status).toBe('confirmed');
	});

	it('should reject missing buyerType', () => {
		expect(() =>
			createSaleSchema.parse({
				buyerName: 'Test',
				productId: 'prod-001',
				sackWeights: [50],
				pricePerKg: 5000
			})
		).toThrow();
	});

	it('should reject invalid buyerType', () => {
		expect(() =>
			createSaleSchema.parse({
				buyerName: 'Test',
				buyerType: 'grosir',
				productId: 'prod-001',
				sackWeights: [50],
				pricePerKg: 5000
			})
		).toThrow();
	});

	it('should reject empty buyerName', () => {
		expect(() =>
			createSaleSchema.parse({
				buyerName: '',
				productId: 'prod-001',
				sackWeights: [50],
				pricePerKg: 5000
			})
		).toThrow();
	});

	it('should reject empty sackWeights array', () => {
		expect(() =>
			createSaleSchema.parse({
				buyerName: 'Test',
				productId: 'prod-001',
				sackWeights: [],
				pricePerKg: 5000
			})
		).toThrow();
	});

	it('should reject sack weight <= 0', () => {
		expect(() =>
			createSaleSchema.parse({
				buyerName: 'Test',
				productId: 'prod-001',
				sackWeights: [52.5, 0, 53.2],
				pricePerKg: 5000
			})
		).toThrow();
	});

	it('should reject negative sack weight', () => {
		expect(() =>
			createSaleSchema.parse({
				buyerName: 'Test',
				productId: 'prod-001',
				sackWeights: [-10],
				pricePerKg: 5000
			})
		).toThrow();
	});

	it('should reject pricePerKg <= 0', () => {
		expect(() =>
			createSaleSchema.parse({
				buyerName: 'Test',
				productId: 'prod-001',
				sackWeights: [50],
				pricePerKg: 0
			})
		).toThrow();
	});

	it('should reject negative pricePerKg', () => {
		expect(() =>
			createSaleSchema.parse({
				buyerName: 'Test',
				productId: 'prod-001',
				sackWeights: [50],
				pricePerKg: -100
			})
		).toThrow();
	});

	it('should reject empty productId', () => {
		expect(() =>
			createSaleSchema.parse({
				buyerName: 'Test',
				productId: '',
				sackWeights: [50],
				pricePerKg: 5000
			})
		).toThrow();
	});

	it('should apply default taraPerSack = 2', () => {
		const result = createSaleSchema.parse({
			buyerName: 'Test',
			buyerType: 'pengepul',
			productId: 'prod-001',
			sackWeights: [50],
			pricePerKg: 5000
		});

		expect(result.taraPerSack).toBe(2);
	});

	it('should apply default kuliFeePerSack = 3000', () => {
		const result = createSaleSchema.parse({
			buyerName: 'Test',
			buyerType: 'pengepul',
			productId: 'prod-001',
			sackWeights: [50],
			pricePerKg: 5000
		});

		expect(result.kuliFeePerSack).toBe(3000);
	});

	it('should reject negative tara', () => {
		expect(() =>
			createSaleSchema.parse({
				buyerName: 'Test',
				buyerType: 'pengepul',
				productId: 'prod-001',
				sackWeights: [50],
				pricePerKg: 5000,
				taraPerSack: -1
			})
		).toThrow();
	});

	it('should reject negative kuli fee', () => {
		expect(() =>
			createSaleSchema.parse({
				buyerName: 'Test',
				buyerType: 'pengepul',
				productId: 'prod-001',
				sackWeights: [50],
				pricePerKg: 5000,
				kuliFeePerSack: -500
			})
		).toThrow();
	});

	it('should allow zero tara (no tare deduction)', () => {
		const result = createSaleSchema.parse({
			buyerName: 'Test',
			buyerType: 'pengepul',
			productId: 'prod-001',
			sackWeights: [50],
			pricePerKg: 5000,
			taraPerSack: 0
		});

		expect(result.taraPerSack).toBe(0);
	});

	it('should coerce string numbers to numbers', () => {
		const result = createSaleSchema.parse({
			buyerName: 'Test',
			buyerType: 'pengepul',
			productId: 'prod-001',
			sackWeights: ['52.5', '51.0'],
			pricePerKg: '5000',
			taraPerSack: '2',
			kuliFeePerSack: '3000'
		});

		expect(result.sackWeights).toEqual([52.5, 51.0]);
		expect(result.pricePerKg).toBe(5000);
		expect(result.taraPerSack).toBe(2);
		expect(result.kuliFeePerSack).toBe(3000);
	});
});

describe('updateSaleSchema', () => {
	it('should accept partial update with buyerName only', () => {
		const result = updateSaleSchema.parse({
			buyerName: 'Updated Buyer'
		});

		expect(result.buyerName).toBe('Updated Buyer');
		expect(result.sackWeights).toBeUndefined();
	});

	it('should accept partial update with sackWeights', () => {
		const result = updateSaleSchema.parse({
			sackWeights: [55.0, 56.5]
		});

		expect(result.sackWeights).toEqual([55.0, 56.5]);
	});

	it('should reject empty sackWeights array when provided', () => {
		expect(() =>
			updateSaleSchema.parse({
				sackWeights: []
			})
		).toThrow();
	});

	it('should reject invalid sack weight when provided', () => {
		expect(() =>
			updateSaleSchema.parse({
				sackWeights: [0]
			})
		).toThrow();
	});

	it('should reject empty buyerName when provided', () => {
		expect(() =>
			updateSaleSchema.parse({
				buyerName: ''
			})
		).toThrow();
	});
});

describe('salesQuerySchema', () => {
	it('should apply defaults for empty query', () => {
		const result = salesQuerySchema.parse({});

		expect(result.status).toBe('all');
		expect(result.page).toBe(1);
		expect(result.limit).toBe(20);
		expect(result.sort).toBe('created_at');
		expect(result.order).toBe('desc');
	});

	it('should accept valid status filter', () => {
		const result = salesQuerySchema.parse({ status: 'confirmed' });
		expect(result.status).toBe('confirmed');
	});

	it('should accept valid sort options', () => {
		const result = salesQuerySchema.parse({ sort: 'total_payment', order: 'asc' });
		expect(result.sort).toBe('total_payment');
		expect(result.order).toBe('asc');
	});

	it('should coerce page and limit from strings', () => {
		const result = salesQuerySchema.parse({ page: '3', limit: '50' });
		expect(result.page).toBe(3);
		expect(result.limit).toBe(50);
	});

	it('should reject limit > 100', () => {
		expect(() =>
			salesQuerySchema.parse({ limit: 101 })
		).toThrow();
	});

	it('should accept search query', () => {
		const result = salesQuerySchema.parse({ search: 'Toko Makmur' });
		expect(result.search).toBe('Toko Makmur');
	});

	it('should accept date range filters', () => {
		const result = salesQuerySchema.parse({
			startDate: '2025-01-01',
			endDate: '2025-01-31'
		});
		expect(result.startDate).toBe('2025-01-01');
		expect(result.endDate).toBe('2025-01-31');
	});
});
