import { describe, it, expect } from 'vitest';
import { createProductionSchema, productionQuerySchema } from './validation';

describe('Production Validation', () => {
	it('validates create production input', () => {
		const result = createProductionSchema.safeParse({
			productId: 'abc123',
			quantityKg: 500,
			cassavaUsedKg: 2000,
			yieldPercentage: 25
		});
		expect(result.success).toBe(true);
	});

	it('rejects negative quantity', () => {
		const result = createProductionSchema.safeParse({
			productId: 'abc123',
			quantityKg: -1,
			cassavaUsedKg: 2000
		});
		expect(result.success).toBe(false);
	});

	it('rejects quantity over 10000', () => {
		const result = createProductionSchema.safeParse({
			productId: 'abc123',
			quantityKg: 15000,
			cassavaUsedKg: 2000
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid yield percentage', () => {
		const result = createProductionSchema.safeParse({
			productId: 'abc123',
			quantityKg: 500,
			cassavaUsedKg: 2000,
			yieldPercentage: 150
		});
		expect(result.success).toBe(false);
	});

	it('accepts production without yield', () => {
		const result = createProductionSchema.safeParse({
			productId: 'abc123',
			quantityKg: 500,
			cassavaUsedKg: 2000
		});
		expect(result.success).toBe(true);
	});

	it('parses production query with defaults', () => {
		const result = productionQuerySchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe('all');
			expect(result.data.page).toBe(1);
			expect(result.data.sort).toBe('productionDate');
		}
	});
});
