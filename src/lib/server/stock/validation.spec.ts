import { describe, it, expect } from 'vitest';
import { createMovementSchema, movementQuerySchema, stockQuerySchema } from './validation';

describe('Stock Validation', () => {
	it('validates create movement input', () => {
		const result = createMovementSchema.safeParse({
			productId: 'abc123',
			quantityChange: 50,
			movementType: 'MANUAL_IN'
		});
		expect(result.success).toBe(true);
	});

	it('rejects zero quantity', () => {
		const result = createMovementSchema.safeParse({
			productId: 'abc123',
			quantityChange: 0,
			movementType: 'MANUAL_IN'
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid movement type', () => {
		const result = createMovementSchema.safeParse({
			productId: 'abc123',
			quantityChange: 10,
			movementType: 'INVALID' as any
		});
		expect(result.success).toBe(false);
	});

	it('requires reason for adjustment with min 10 chars', () => {
		const result = createMovementSchema.safeParse({
			productId: 'abc123',
			quantityChange: -5,
			movementType: 'ADJUSTMENT',
			reason: 'short'
		});
		expect(result.success).toBe(false);
	});

	it('parses movement query with defaults', () => {
		const result = movementQuerySchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.page).toBe(1);
			expect(result.data.limit).toBe(20);
			expect(result.data.order).toBe('desc');
		}
	});

	it('parses stock query with defaults', () => {
		const result = stockQuerySchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe('all');
			expect(result.data.page).toBe(1);
		}
	});
});
