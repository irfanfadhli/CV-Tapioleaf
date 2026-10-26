import { expect, test } from '@playwright/test';

/**
 * E2E Tests for Modul Penjualan
 * 
 * These tests verify the public-facing behavior of the sales module.
 * Tests that require authentication use a pre-condition check.
 * 
 * Note: Full CRUD tests require a logged-in session. Tests below
 * cover route protection and basic navigation patterns.
 */

test.describe('Penjualan — Route Protection', () => {
	test('Sales page redirects to login when not authenticated', async ({ page }) => {
		await page.goto('/sales');
		await expect(page).toHaveURL(/\/login/);
	});

	test('Sales detail page redirects to login when not authenticated', async ({ page }) => {
		await page.goto('/sales/some-random-id');
		await expect(page).toHaveURL(/\/login/);
	});
});

test.describe('Penjualan — UI Elements (authenticated)', () => {
	// These tests require a valid session. We use test.skip if login is not available.
	// In CI, these would use a test account.
	
	test.beforeEach(async ({ page }) => {
		// Attempt to access sales page directly
		await page.goto('/sales');
		// If redirected to login, skip the rest of the tests in this block
		if (page.url().includes('/login')) {
			test.skip();
		}
	});

	test('Sales list page shows title and toolbar', async ({ page }) => {
		await expect(page.locator('h1')).toContainText('Penjualan');
		await expect(page.locator('button:has-text("Transaksi Baru")')).toBeVisible();
	});

	test('Sales list page shows summary cards', async ({ page }) => {
		// Check all 4 summary cards exist
		await expect(page.locator('text=Pendapatan Bulan Ini')).toBeVisible();
		await expect(page.locator('text=Berat Terjual')).toBeVisible();
		await expect(page.locator('text=Draft')).toBeVisible();
		await expect(page.locator('text=Total Transaksi')).toBeVisible();
	});

	test('Sales list page shows table headers', async ({ page }) => {
		await expect(page.locator('th:has-text("No. Nota")')).toBeVisible();
		await expect(page.locator('th:has-text("Pembeli")')).toBeVisible();
		await expect(page.locator('th:has-text("Total Bayar")')).toBeVisible();
		await expect(page.locator('th:has-text("Status")')).toBeVisible();
	});

	test('Sales list page shows search input', async ({ page }) => {
		const searchInput = page.locator('input[placeholder*="Cari pembeli"]');
		await expect(searchInput).toBeVisible();
	});

	test('Sales list page shows status filter dropdown', async ({ page }) => {
		const statusSelect = page.locator('select');
		await expect(statusSelect).toBeVisible();
		// Check the filter options
		await expect(statusSelect.locator('option[value="all"]')).toHaveText('Semua Status');
		await expect(statusSelect.locator('option[value="draft"]')).toHaveText('Draft');
		await expect(statusSelect.locator('option[value="confirmed"]')).toHaveText('Confirmed');
	});

	test('Create modal opens when clicking Transaksi Baru button', async ({ page }) => {
		await page.locator('button:has-text("Transaksi Baru")').click();
		// Dialog should open
		await expect(page.locator('text=Transaksi Penjualan Baru')).toBeVisible();
		// Form fields should be present
		await expect(page.locator('#buyerName')).toBeVisible();
		await expect(page.locator('#productId')).toBeVisible();
		await expect(page.locator('#saleDate')).toBeVisible();
	});

	test('Create modal shows calculation preview section', async ({ page }) => {
		await page.locator('button:has-text("Transaksi Baru")').click();
		await expect(page.locator('text=Ringkasan Kalkulasi')).toBeVisible();
		await expect(page.locator('text=Jumlah Karung')).toBeVisible();
		await expect(page.locator('text=Berat Kotor')).toBeVisible();
		await expect(page.locator('text=Total Bayar')).toBeVisible();
	});

	test('Create modal has draft and confirm buttons', async ({ page }) => {
		await page.locator('button:has-text("Transaksi Baru")').click();
		await expect(page.locator('button:has-text("Simpan Draft")')).toBeVisible();
		await expect(page.locator('button:has-text("Simpan & Konfirmasi")')).toBeVisible();
	});

	test('Filter changes URL params for status', async ({ page }) => {
		const statusSelect = page.locator('select');
		await statusSelect.selectOption('confirmed');
		await page.waitForURL(/status=confirmed/);
		await expect(page).toHaveURL(/status=confirmed/);
	});

	test('Search input updates URL params with debounce', async ({ page }) => {
		const searchInput = page.locator('input[placeholder*="Cari pembeli"]');
		await searchInput.fill('Makmur');
		// Wait for debounce (300ms) + navigation
		await page.waitForURL(/search=Makmur/, { timeout: 3000 });
		await expect(page).toHaveURL(/search=Makmur/);
	});
});

test.describe('Dashboard — Sales Integration', () => {
	test('Dashboard page redirects to login when not authenticated', async ({ page }) => {
		await page.goto('/dashboard');
		await expect(page).toHaveURL(/\/login/);
	});
});
