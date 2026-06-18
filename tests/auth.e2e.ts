import { expect, test } from '@playwright/test';

test('Login page loads and shows form elements', async ({ page }) => {
	await page.goto('/login');
	await expect(page.locator('h3')).toContainText('CV TapioLeaf');
	await expect(page.locator('input[name="email"]')).toBeVisible();
	await expect(page.locator('input[name="password"]')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Masuk' })).toBeVisible();
});

test('Login with invalid credentials shows error', async ({ page }) => {
	await page.goto('/login');
	await page.fill('input[name="email"]', 'wrong@email.com');
	await page.fill('input[name="password"]', 'wrongpassword');
	await page.click('button[type="submit"]');
	await expect(page.getByText('Email atau password salah')).toBeVisible();
});

test('Password visibility toggle works', async ({ page }) => {
	await page.goto('/login');
	const passwordInput = page.locator('input[name="password"]');
	await expect(passwordInput).toHaveAttribute('type', 'password');
	await page.click('button[aria-label="Tampilkan password"]');
	await expect(passwordInput).toHaveAttribute('type', 'text');
	await page.click('button[aria-label="Sembunyikan password"]');
	await expect(passwordInput).toHaveAttribute('type', 'password');
});
