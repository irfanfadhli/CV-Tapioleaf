import { expect, test } from '@playwright/test';

test('Landing page — hero section visible', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toContainText('CV TapioLeaf');
	await expect(page.locator('text=Lihat Produk').first()).toBeVisible();
	await expect(page.locator('text=Tentang Kami').first()).toBeVisible();
});

test('Landing page — product section has items', async ({ page }) => {
	await page.goto('/');
	await page.locator('text=Produk').first().click();
	await expect(page.locator('text=Produk Kami')).toBeVisible();
});

test('Landing page — contact section loads', async ({ page }) => {
	await page.goto('/');
	await page.locator('text=Kontak').first().click();
	await expect(page.locator('text=Hubungi Kami')).toBeVisible();
});

test('Catalog page loads products', async ({ page }) => {
	await page.goto('/catalog');
	await expect(page.locator('h1')).toContainText('Katalog');
});

test('Protected route — redirects to login', async ({ page }) => {
	await page.goto('/dashboard');
	await expect(page).toHaveURL(/\/login/);
});

test('Protected route — 403 page shows access denied', async ({ page }) => {
	await page.goto('/403');
	await expect(page.locator('text=Akses Ditolak')).toBeVisible();
});
