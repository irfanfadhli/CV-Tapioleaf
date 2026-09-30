import { expect, test } from '@playwright/test';

test('Landing page — hero section visible', async ({ page }) => {
	await page.goto('/');
	// h1 is "Tepung Tapioka Premium"; verify hero section loads
	await expect(page.locator('h1')).toBeVisible();
	await expect(page.locator('text=Lihat Produk').first()).toBeVisible();
});

test('Landing page — product section has items', async ({ page }) => {
	await page.goto('/');
	await page.locator('text=Produk').first().click();
	await expect(page.locator('text=Produk Kami')).toBeVisible();
});

test('Landing page — contact section loads', async ({ page }) => {
	await page.goto('/');
	await page.locator('text=Kontak').first().click();
	await page.waitForTimeout(500); // allow smooth scroll
	await expect(page.locator('text=Hubungi Kami')).toBeVisible();
});

test('Catalog page loads products', async ({ page }) => {
	await page.goto('/catalog');
	// Catalog page uses <title> not h1; verify page loaded with product grid
	await expect(page.locator('[class*="grid"]')).toBeVisible();
});

test('Protected route — redirects to login', async ({ page }) => {
	await page.goto('/dashboard');
	await expect(page).toHaveURL(/\/login/);
});

test('Landing page — footer visible', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('text=CV TapioLeaf').last()).toBeVisible();
});
