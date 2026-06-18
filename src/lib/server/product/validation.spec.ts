import { describe, it, expect } from 'vitest';
import { createProductSchema, updateProductSchema, productQuerySchema } from './validation';

describe('Product Validation', () => {
	it('validates create product input', () => {
		const result = createProductSchema.safeParse({
			name: 'Test Product',
			categoryId: 'abc123',
			price: 50000,
			unit: 'KG'
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid price', () => {
		const result = createProductSchema.safeParse({
			name: 'Test',
			categoryId: 'abc',
			price: -1,
			unit: 'KG'
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid unit', () => {
		const result = createProductSchema.safeParse({
			name: 'Test',
			categoryId: 'abc',
			price: 1000,
			unit: 'INVALID' as any
		});
		expect(result.success).toBe(false);
	});

	it('parses product query with defaults', () => {
		const result = productQuerySchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.page).toBe(1);
			expect(result.data.limit).toBe(20);
			expect(result.data.status).toBe('active');
		}
	});

	it('accepts optional code field', () => {
		const result = createProductSchema.safeParse({
			name: 'Test',
			categoryId: 'abc',
			price: 1000,
			unit: 'KG',
			code: 'Item-20250610-001'
		});
		expect(result.success).toBe(true);
	});
});
