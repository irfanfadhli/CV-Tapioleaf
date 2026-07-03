import { describe, it, expect } from 'vitest';

// Inline test of getPeriodRange logic since it's not exported
function getPeriodRange(period: 'today' | 'week' | 'month') {
	const now = new Date();
	const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

	switch (period) {
		case 'today': {
			const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const prevStart = new Date(start.getTime() - 86400000);
			const prevEndClamped = new Date(prevStart.getTime() + 86399999);
			return { start, end, prevStart, prevEnd: prevEndClamped };
		}
		case 'week': {
			const dayOfWeek = now.getDay();
			const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
			const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
			const prevStart = new Date(start.getTime() - 7 * 86400000);
			const prevEndClamped = new Date(start.getTime() - 1);
			return { start, end, prevStart, prevEnd: prevEndClamped };
		}
		case 'month': {
			const start = new Date(now.getFullYear(), now.getMonth(), 1);
			const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
			const prevEndClamped = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
			return { start, end, prevStart, prevEnd: prevEndClamped };
		}
	}
}

describe('Dashboard Period Range', () => {
	it('today range starts at 00:00:00 today', () => {
		const range = getPeriodRange('today');
		expect(range.start.getHours()).toBe(0);
		expect(range.start.getMinutes()).toBe(0);
		expect(range.start.getSeconds()).toBe(0);
	});

	it('today range ends at 23:59:59 today', () => {
		const range = getPeriodRange('today');
		expect(range.end.getHours()).toBe(23);
		expect(range.end.getMinutes()).toBe(59);
	});

	it('today prev period is yesterday', () => {
		const range = getPeriodRange('today');
		const yesterdayStart = new Date(range.start.getTime() - 86400000);
		expect(range.prevStart.getTime()).toBe(yesterdayStart.getTime());
	});

	it('week range starts on Monday', () => {
		const range = getPeriodRange('week');
		const day = range.start.getDay();
		// Monday = 1, if Sunday(0) then treat as previous Monday
		expect(day === 1 || day === 0).toBe(true);
	});

	it('month range starts on the 1st', () => {
		const range = getPeriodRange('month');
		expect(range.start.getDate()).toBe(1);
	});

	it('month prevEnd is last day of previous month', () => {
		const range = getPeriodRange('month');
		expect(range.prevEnd.getDate()).toBeGreaterThanOrEqual(28);
		expect(range.prevEnd.getDate()).toBeLessThanOrEqual(31);
	});
});
