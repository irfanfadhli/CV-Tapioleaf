import { expect, test } from '@playwright/test';

test('Login page loads and shows Google sign-in button', async ({ page }) => {
	await page.goto('/login');
	await expect(page.locator('text=CV TapioLeaf').first()).toBeVisible();
	await expect(page.locator('button:has-text("Google")').first()).toBeVisible();
});

test('Landing page loads and shows hero section', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toContainText('CV TapioLeaf');
	await expect(page.locator('a[href="#products"]').first()).toBeVisible();
});

test('Protected route redirects to login', async ({ page }) => {
	await page.goto('/dashboard');
	await expect(page).toHaveURL(/\/login/);
});
