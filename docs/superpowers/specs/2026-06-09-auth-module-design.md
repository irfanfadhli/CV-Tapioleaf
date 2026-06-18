# Auth Module Design — CV TapioLeaf Management System

**Date:** 2026-06-09
**Status:** Draft
**Framework:** Better Auth + Drizzle ORM + SvelteKit 5

---

## Overview

Authentication module for CV TapioLeaf Management System. Built on **Better Auth** with Drizzle adapter + PostgreSQL. Handles login, RBAC, session management, route protection, and audit logging across 4 roles.

## Architecture

```
hooks.server.ts (route guard)
        │
        ▼
auth.api.getSession() ← Better Auth (handles sessions, cookies, CSRF)
        │
        ▼
Route config: match path → check role → allow/deny
        │
        ▼
Audit log service (logs events to auth_logs table)
```

## 1. Auth Config

Better Auth setup with:
- Drizzle adapter (PostgreSQL)
- Email/password authentication (enabled)
- User schema extended with `role` field (enum)
- Session cookie: HTTP-only, Secure, SameSite=Strict (Better Auth default)
- Rate limiting via Better Auth config (5 failed attempts → 15min lockout)
- Session expiry: 8 hours idle

## 2. Roles

Better Auth role enum with 4 roles:

| Role | Access |
|------|--------|
| `owner` | Full read access, audit logs |
| `admin_penjualan` | Product management |
| `petugas_gudang` | Stock management |
| `bagian_produksi` | Production management |

## 3. Route Guards

Centralized config mapping path patterns to allowed roles:

```
/(auth)/login             → public
/(app)/dashboard          → owner, admin_penjualan
/(app)/produk             → owner (read), admin_penjualan (write)
/(app)/gudang             → owner (read), petugas_gudang (write)
/(app)/produksi           → owner (read), bagian_produksi (write)
/api/auth/*               → public (Better Auth)
```

`hooks.server.ts` checks session via `auth.api.getSession()`, then matches URL against config. Unauthenticated → `/login`. Wrong role → `/403`.

Route groups:
- `(auth)` — public pages (login), no app shell
- `(app)` — protected pages, app shell with sidebar

## 4. Audit Logging

Drizzle table `auth_logs`:

| Column | Type | Notes |
|--------|------|-------|
| id | text (cuid) | PK |
| userId | text? | FK to user, nullable (failed attempts) |
| email | text | Always captured |
| event | enum | login_success, login_failed, logout, session_expired, unauthorized_access |
| ipAddress | text? | |
| userAgent | text? | |
| metadata | json? | Optional extra data |
| createdAt | timestamp | Default now() |

Triggered via auth service wrapper or hooks.server.ts interceptor. Retention: 30 days.

## 5. Pages & Components

| Route | Component | Description |
|-------|-----------|-------------|
| `/(auth)/login` | `+page.svelte` | Centered card, email/password, states: default/loading/error/locked |
| `/(app)/+layout.svelte` | App shell | Sidebar/nav, logout button, session expiry handling |
| `/(app)/403` | `+page.svelte` | Forbidden page |
| `/(auth)/logout` | API action | POST → invalidate session → redirect |

Components (shadcn-svelte): LoginForm, PasswordInput, FormField, Alert, Button

## 6. Seed Data

CLI script to create initial Owner account. No self-registration.

## 7. Files to Create/Modify

**New:**
- `src/lib/server/auth/routes.ts`
- `src/lib/server/auth/service.ts`
- `src/lib/server/db/schema/auth-logs.ts`
- `src/routes/(auth)/login/+page.svelte`
- `src/routes/(auth)/login/+page.server.ts`
- `src/routes/(app)/+layout.svelte`
- `src/routes/(app)/403/+page.svelte`
- `src/scripts/seed.ts`

**Modified:**
- `src/hooks.server.ts`
- `src/lib/server/auth.ts`
- `src/app.d.ts`
