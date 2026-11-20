import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: { command: 'bun run build && bun run preview', port: 4173, reuseExistingServer: !process.env.CI },
	testMatch: '**/*.e2e.{ts,js}',
	use: {
		headless: !process.env.HEADED,
		viewport: { width: 1280, height: 720 },
	},
});
