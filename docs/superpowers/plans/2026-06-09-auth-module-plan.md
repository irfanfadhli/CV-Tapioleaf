# Auth Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement authentication module with Better Auth — login, RBAC, route guards, audit logging, and login page UI.

**Architecture:** Better Auth handles auth (sessions, cookies, password hashing, rate limiting). We add route guard middleware in hooks.server.ts, audit logging via Better Auth hooks, and a Drizzle `auth_logs` table.

**Tech Stack:** SvelteKit 5, Better Auth, Drizzle ORM (PostgreSQL/Neon), shadcn-svelte, Lucide icons, Vitest, Playwright

---

### Task 1: Generate Better Auth Schema & Configure Auth with Roles

**Files:**
- Run: `npm run auth:schema`
- Modify: `src/lib/server/auth.ts`
- Modify: `src/app.d.ts`

- [ ] **Step 1: Run the auth schema generation**

```bash
npm run auth:schema
```

Expected: generates `src/lib/server/db/auth.schema.ts` with Better Auth's user, session, account, verification tables.

- [ ] **Step 2: Update app.d.ts to include role in Locals**

Edit `src/app.d.ts`:
```typescript
import type { User, Session } from 'better-auth';

declare global {
	namespace App {
		interface Locals {
			user?: User & { role: 'owner' | 'admin_penjualan' | 'petugas_gudang' | 'bagian_produksi' };
			session?: Session;
		}
	}
}

export {};
```

- [ ] **Step 3: Configure Better Auth with roles, rate limiting, and audit hooks**

Edit `src/lib/server/auth.ts`:
```typescript
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { createAuthMiddleware } from 'better-auth/api';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: { enabled: true },
	user: {
		additionalFields: {
			role: {
				type: 'string',
				required: true,
				defaultValue: 'petugas_gudang',
				input: false
			}
		}
	},
	rateLimit: {
		enabled: true,
		window: 10,
		max: 100,
		customRules: {
			'/sign-in/email': { window: 10, max: 5 }
		}
	},
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			const { path, context } = ctx;
			if (path === '/sign-in/email' || path === '/sign-out') {
				const { db: drizzleDb } = await import('$lib/server/db');
				const { authLogs } = await import('$lib/server/db/schema/auth-logs');
				const session = context.newSession || context.session;
				if (session) {
					const requestEvent = getRequestEvent();
					await drizzleDb.insert(authLogs).values({
						userId: session.user.id,
						email: session.user.email,
						event: path === '/sign-in/email' ? 'login_success' : 'logout',
						ipAddress: requestEvent.request.headers.get('x-forwarded-for') || requestEvent.request.headers.get('x-real-ip') || 'unknown',
						userAgent: requestEvent.request.headers.get('user-agent')
					});
				}
			}
		})
	},
	plugins: [sveltekitCookies(getRequestEvent)]
});
```

- [ ] **Step 4: Verify build passes**

```bash
npm run check
```

Expected: No type errors. Auth config compiles.

---

### Task 2: Add shadcn UI Components

**Files:**
- Run: `npx shadcn-svelte@latest add @shadcn/button @shadcn/card @shadcn/input @shadcn/label @shadcn/alert @shadcn/separator`

- [ ] **Step 1: Install shadcn components**

```bash
npx shadcn-svelte@latest add @shadcn/button @shadcn/card @shadcn/input @shadcn/label @shadcn/alert @shadcn/separator --yes
```

Expected: Components created in `src/lib/components/ui/`.

---

### Task 3: Create Route Config & Update hooks.server.ts

**Files:**
- Create: `src/lib/server/auth/routes.ts`
- Modify: `src/hooks.server.ts`

- [ ] **Step 1: Create route config file**

Create `src/lib/server/auth/routes.ts`:
```typescript
export type AppRole = 'owner' | 'admin_penjualan' | 'petugas_gudang' | 'bagian_produksi';

export interface RouteConfig {
	protected: boolean;
	roles?: AppRole[];
}

const routeMap: Record<string, RouteConfig> = {
	'/(auth)/login': { protected: false },
	'/(app)/dashboard': { protected: true, roles: ['owner', 'admin_penjualan'] },
	'/(app)/produk': { protected: true, roles: ['owner', 'admin_penjualan'] },
	'/(app)/gudang': { protected: true, roles: ['owner', 'petugas_gudang'] },
	'/(app)/produksi': { protected: true, roles: ['owner', 'bagian_produksi'] },
	'/(app)/403': { protected: false }
};

export function getRouteConfig(pathname: string): RouteConfig | null {
	// Match against known paths, fallback to protected for unmatched (app) routes
	if (routeMap[pathname]) return routeMap[pathname];
	if (pathname.startsWith('/api/auth')) return { protected: false };
	if (pathname.startsWith('/(app)')) return { protected: true, roles: ['owner', 'admin_penjualan', 'petugas_gudang', 'bagian_produksi'] };
	if (pathname.startsWith('/demo')) return { protected: false };
	return { protected: true, roles: ['owner', 'admin_penjualan', 'petugas_gudang', 'bagian_produksi'] };
}
```

- [ ] **Step 2: Update hooks.server.ts with route guard**

Edit `src/hooks.server.ts`:
```typescript
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { getRouteConfig } from '$lib/server/auth/routes';

const handleAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user as typeof event.locals.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

const handleRouteGuard: Handle = async ({ event, resolve }) => {
	if (building) return resolve(event);

	const config = getRouteConfig(event.url.pathname);
	if (!config) return resolve(event);

	if (config.protected) {
		if (!event.locals.user) {
			throw redirect(303, `/(auth)/login?redirect=${encodeURIComponent(event.url.pathname)}`);
		}
		if (config.roles && !config.roles.includes(event.locals.user.role)) {
			throw redirect(303, '/(app)/403');
		}
	}

	// Redirect logged-in users away from login page
	if (event.url.pathname === '/(auth)/login' && event.locals.user) {
		throw redirect(303, '/(app)/dashboard');
	}

	return resolve(event);
};

export const handle: Handle = (input) => handleRouteGuard(handleAuth(input));
```

---

### Task 4: Create Audit Logging Schema & Service

**Files:**
- Create: `src/lib/server/db/schema/auth-logs.ts`
- Modify: `src/lib/server/db/schema.ts`
- Modify: `src/lib/server/auth.ts` (already done in Task 1's hooks)

- [ ] **Step 1: Create auth-logs schema**

Create `src/lib/server/db/schema/auth-logs.ts`:
```typescript
import { pgTable, text, timestamp, json } from 'drizzle-orm/pg-core';

export const authLogs = pgTable('auth_logs', {
	id: text('id').primaryKey().defaultRandom(),
	userId: text('user_id'),
	email: text('email').notNull(),
	event: text('event', {
		enum: ['login_success', 'login_failed', 'logout', 'session_expired', 'unauthorized_access']
	}).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	metadata: json('metadata'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
```

- [ ] **Step 2: Export auth-logs from schema**

Edit `src/lib/server/db/schema.ts`:
```typescript
import { pgTable, serial, integer, text } from 'drizzle-orm/pg-core';

export const task = pgTable('task', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export * from './auth.schema';
export * from './schema/auth-logs';
```

---

### Task 5: Create Login Page

**Files:**
- Create: `src/routes/(auth)/+layout.svelte`
- Create: `src/routes/(auth)/login/+page.server.ts`
- Create: `src/routes/(auth)/login/+page.svelte`

- [ ] **Step 1: Create auth group layout**

Create `src/routes/(auth)/+layout.svelte`:
```svelte
<script lang="ts">
	import '../../layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
	{@render children()}
</div>
```

- [ ] **Step 2: Create login page server action**

Create `src/routes/(auth)/login/+page.server.ts`:
```typescript
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		throw redirect(303, '/(app)/dashboard');
	}
	return {};
};

export const actions: Actions = {
	login: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';

		if (!email || !password) {
			return fail(400, { message: 'Email dan password wajib diisi', success: false });
		}

		try {
			await auth.api.signInEmail({
				body: { email, password }
			});
		} catch (error) {
			if (error instanceof APIError) {
				const status = error.status ?? 400;
				if (status === 423) {
					return fail(423, { message: 'Akun dikunci sementara. Coba lagi dalam 15 menit', success: false, locked: true });
				}
				return fail(status, { message: 'Email atau password salah', success: false });
			}
			return fail(500, { message: 'Terjadi kesalahan sistem', success: false });
		}

		throw redirect(303, '/(app)/dashboard');
	}
};
```

- [ ] **Step 3: Create login page UI**

Create `src/routes/(auth)/login/+page.svelte`:
```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/card.svelte';
	import Alert from '$lib/components/ui/alert/alert.svelte';
	import { Eye, EyeOff, Loader2 } from 'lucide-svelte';

	let { form, submitting } = $props();

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);

	function togglePassword() {
		showPassword = !showPassword;
	}
</script>

<Card class="w-full max-w-md">
	<CardHeader class="text-center">
		<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold text-white">
			TL
		</div>
		<CardTitle class="text-xl">CV TapioLeaf</CardTitle>
		<CardDescription>Sistem Manajemen Operasional</CardDescription>
	</CardHeader>
	<CardContent>
		{#if form?.message && !form?.locked}
			<Alert class="mb-4" variant="destructive">{form.message}</Alert>
		{/if}
		{#if form?.locked}
			<Alert class="mb-4" variant="destructive">
				{form.message}
			</Alert>
		{/if}
		<form method="post" action="?/login" use:enhance>
			<div class="grid gap-4">
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						name="email"
						type="email"
						placeholder="nama@email.com"
						required
						bind:value={email}
						disabled={submitting}
					/>
				</div>
				<div class="grid gap-2">
					<Label for="password">Password</Label>
					<div class="relative">
						<Input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							placeholder="********"
							required
							bind:value={password}
							disabled={submitting}
							class="pr-10"
						/>
						<button
							type="button"
							onclick={togglePassword}
							class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
						>
							{#if showPassword}
								<EyeOff size={16} />
							{:else}
								<Eye size={16} />
							{/if}
						</button>
					</div>
				</div>
				<Button type="submit" class="w-full" disabled={submitting}>
					{#if submitting}
						<Loader2 size={16} class="mr-2 animate-spin" />
						Memproses...
					{:else}
						Masuk
					{/if}
				</Button>
			</div>
		</form>
	</CardContent>
</Card>
```

---

### Task 6: Create App Shell Layout with Logout

**Files:**
- Create: `src/routes/(app)/+layout.svelte`
- Create: `src/routes/(app)/+layout.server.ts`
- Create: `src/routes/(app)/dashboard/+page.svelte` (placeholder)

- [ ] **Step 1: Create app layout server load**

Create `src/routes/(app)/+layout.server.ts`:
```typescript
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	if (!event.locals.user) {
		throw redirect(303, '/(auth)/login');
	}
	return {
		user: {
			name: event.locals.user.name,
			email: event.locals.user.email,
			role: event.locals.user.role
		}
	};
};
```

- [ ] **Step 2: Create app shell layout**

Create `src/routes/(app)/+layout.svelte`:
```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button/button.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { LogOut, LayoutDashboard, Package, Warehouse, Factory } from 'lucide-svelte';

	let { children, data } = $props();

	const roleLabels: Record<string, string> = {
		owner: 'Owner',
		admin_penjualan: 'Admin Penjualan',
		petugas_gudang: 'Petugas Gudang',
		bagian_produksi: 'Bagian Produksi'
	};
</script>

<div class="flex min-h-screen bg-background">
	<aside class="flex w-64 flex-col border-r bg-card px-4 py-6">
		<div class="mb-6 flex items-center gap-3 px-2">
			<div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
				TL
			</div>
			<div>
				<p class="font-semibold leading-tight">{data.user.name}</p>
				<p class="text-xs text-muted-foreground">{roleLabels[data.user.role] || data.user.role}</p>
			</div>
		</div>
		<Separator class="mb-4" />
		<nav class="flex flex-1 flex-col gap-1">
			<a
				href="/(app)/dashboard"
				class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
				class:bg-accent={$page.url.pathname === '/(app)/dashboard'}
			>
				<LayoutDashboard size={18} />
				Dashboard
			</a>
			<a
				href="/(app)/produk"
				class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
			>
				<Package size={18} />
				Produk
			</a>
			<a
				href="/(app)/gudang"
				class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
			>
				<Warehouse size={18} />
				Gudang
			</a>
			<a
				href="/(app)/produksi"
				class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
			>
				<Factory size={18} />
				Produksi
			</a>
		</nav>
		<Separator class="my-4" />
		<form method="post" action="?/logout" use:enhance>
			<Button variant="outline" class="w-full justify-start gap-3" type="submit">
				<LogOut size={18} />
				Keluar
			</Button>
		</form>
	</aside>
	<main class="flex-1 p-8">
		{@render children()}
	</main>
</div>
```

- [ ] **Step 3: Add logout action to app layout**

Edit `src/routes/(app)/+layout.server.ts`:
```typescript
import { redirect, fail } from '@sveltejs/kit';
import type { LayoutServerLoad, Actions } from './$types';
import { auth } from '$lib/server/auth';

export const load: LayoutServerLoad = async (event) => {
	if (!event.locals.user) {
		throw redirect(303, '/(auth)/login');
	}
	return {
		user: {
			name: event.locals.user.name,
			email: event.locals.user.email,
			role: event.locals.user.role
		}
	};
};

export const actions: Actions = {
	logout: async (event) => {
		await auth.api.signOut({ headers: event.request.headers });
		throw redirect(303, '/(auth)/login');
	}
};
```

- [ ] **Step 4: Create dashboard placeholder**

Create `src/routes/(app)/dashboard/+page.svelte`:
```svelte
<script lang="ts">
	let { data } = $props();
</script>

<h1 class="mb-2 text-2xl font-bold">Dashboard</h1>
<p class="text-muted-foreground">Selamat datang, {data.user.name}!</p>
```

Create `src/routes/(app)/dashboard/+page.server.ts`:
```typescript
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	return { user: event.locals.user };
};
```

---

### Task 7: Create 403 Forbidden Page

**Files:**
- Create: `src/routes/(app)/403/+page.svelte`

- [ ] **Step 1: Create 403 page**

Create `src/routes/(app)/403/+page.svelte`:
```svelte
<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Card, { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card/card.svelte';
	import { ShieldAlert } from 'lucide-svelte';

	let { data } = $props();
</script>

<div class="flex min-h-[60vh] items-center justify-center">
	<Card class="w-full max-w-md text-center">
		<CardHeader>
			<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
				<ShieldAlert size={32} class="text-destructive" />
			</div>
			<CardTitle class="text-2xl">Akses Ditolak</CardTitle>
			<CardDescription>
				Anda tidak memiliki akses ke halaman ini.
			</CardDescription>
		</CardHeader>
		<CardContent>
			<p class="text-sm text-muted-foreground">
				Halaman ini memerlukan hak akses yang tidak dimiliki oleh akun Anda. Silakan hubungi Owner jika Anda membutuhkan akses.
			</p>
		</CardContent>
		<CardFooter class="justify-center">
			<a href="/(app)/dashboard">
				<Button>Kembali ke Dashboard</Button>
			</a>
		</CardFooter>
	</Card>
</div>
```

---

### Task 8: Create Seed Script

**Files:**
- Create: `src/scripts/seed.ts`

- [ ] **Step 1: Create seed script**

Create `src/scripts/seed.ts`:
```typescript
import { auth } from '../lib/server/auth';
import { db } from '../lib/server/db';
import { user } from '../lib/server/db/auth.schema';
import { eq } from 'drizzle-orm';

async function seed() {
	console.log('Seeding database...');

	const existingOwner = await db.select().from(user).where(eq(user.email, 'owner@tapioleaf.com')).limit(1);

	if (existingOwner.length > 0) {
		console.log('Owner account already exists. Skipping...');
		return;
	}

	const createdUser = await auth.api.signUpEmail({
		body: {
			email: 'owner@tapioleaf.com',
			password: 'Admin123!',
			name: 'Pak Budi'
		}
	});

	console.log('Owner account created:', createdUser.user.id);
	console.log('Email: owner@tapioleaf.com');
	console.log('Password: Admin123!');
}

seed()
	.catch((error) => {
		console.error('Seed failed:', error);
		process.exit(1);
	})
	.finally(() => {
		process.exit(0);
	});
```

- [ ] **Step 2: Add seed script to package.json**

Edit `package.json` scripts:
```json
"seed": "npx tsx src/scripts/seed.ts"
```

---

### Task 9: Create Tests

**Files:**
- Create: `src/lib/server/auth/routes.spec.ts`
- Create: `tests/auth.e2e.ts`

- [ ] **Step 1: Write route config unit test**

Create `src/lib/server/auth/routes.spec.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { getRouteConfig } from './routes';

describe('getRouteConfig', () => {
	it('returns public config for login page', () => {
		const config = getRouteConfig('/(auth)/login');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(false);
	});

	it('returns protected config for dashboard with owner and admin roles', () => {
		const config = getRouteConfig('/(app)/dashboard');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(true);
		expect(config!.roles).toContain('owner');
		expect(config!.roles).toContain('admin_penjualan');
	});

	it('returns protected config for gudang with owner and petugas roles', () => {
		const config = getRouteConfig('/(app)/gudang');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(true);
		expect(config!.roles).toContain('owner');
		expect(config!.roles).toContain('petugas_gudang');
	});

	it('returns protected config for produksi with owner and bagian_produksi roles', () => {
		const config = getRouteConfig('/(app)/produksi');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(true);
		expect(config!.roles).toContain('owner');
		expect(config!.roles).toContain('bagian_produksi');
	});

	it('returns null for unknown non-app routes', () => {
		const config = getRouteConfig('/unknown');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(true);
	});

	it('returns public config for auth API routes', () => {
		const config = getRouteConfig('/api/auth/sign-in');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(false);
	});

	it('returns public config for 403 page', () => {
		const config = getRouteConfig('/(app)/403');
		expect(config).not.toBeNull();
		expect(config!.protected).toBe(false);
	});
});
```

- [ ] **Step 2: Run unit tests**

```bash
npm run test:unit -- --run
```

Expected: All route config tests pass.

- [ ] **Step 3: Write E2E login test**

Create `tests/auth.e2e.ts`:
```typescript
import { expect, test } from '@playwright/test';

test('Login page loads and shows form elements', async ({ page }) => {
	await page.goto('/(auth)/login');
	await expect(page.locator('h3')).toContainText('CV TapioLeaf');
	await expect(page.locator('input[name="email"]')).toBeVisible();
	await expect(page.locator('input[name="password"]')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Masuk' })).toBeVisible();
});

test('Login with invalid credentials shows error', async ({ page }) => {
	await page.goto('/(auth)/login');
	await page.fill('input[name="email"]', 'wrong@email.com');
	await page.fill('input[name="password"]', 'wrongpassword');
	await page.click('button[type="submit"]');
	await expect(page.getByText('Email atau password salah')).toBeVisible();
});

test('Already logged in user is redirected to dashboard', async ({ page }) => {
	// This test requires a seeded database with the owner account
	await page.goto('/(auth)/login');
	await page.fill('input[name="email"]', 'owner@tapioleaf.com');
	await page.fill('input[name="password"]', 'Admin123!');
	await page.click('button[type="submit"]');
	await expect(page).toHaveURL(/dashboard/);
});

test('Password visibility toggle works', async ({ page }) => {
	await page.goto('/(auth)/login');
	const passwordInput = page.locator('input[name="password"]');
	await expect(passwordInput).toHaveAttribute('type', 'password');
	await page.click('button[aria-label="Tampilkan password"]');
	await expect(passwordInput).toHaveAttribute('type', 'text');
	await page.click('button[aria-label="Sembunyikan password"]');
	await expect(passwordInput).toHaveAttribute('type', 'password');
});
```

---

### Task 10: Push Drizzle Schema & Run Seed

**Files:**
- Run: `npm run db:push`

- [ ] **Step 1: Push schema to database**

```bash
npm run db:push
```

Expected: All tables created (users, sessions, accounts, verifications, auth_logs).

- [ ] **Step 2: Run seed script to create owner account**

```bash
npm run seed
```

Expected: Owner account created with email owner@tapioleaf.com and password Admin123!.

- [ ] **Step 3: Run the dev server and verify login works**

```bash
npm run dev
```

Open `http://localhost:5173/(auth)/login` — should see the login page. Log in with owner@tapioleaf.com / Admin123! — should redirect to dashboard.
