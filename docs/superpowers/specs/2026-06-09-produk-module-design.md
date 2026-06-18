# Product Management Module Design — CV TapioLeaf Management System

**Date:** 2026-06-09
**Status:** Draft
**PRD Reference:** PRD-03 — Manajemen Produk

---

## Overview

Product management module for CV TapioLeaf Management System. Provides master data products and categories that serve as reference for stock, production, and dashboard modules.

## Scope

- CRUD products (Create, Read, Update, Soft Delete)
- Auto-generated product codes (format: `I-YYYYMMDD-NNN`) with manual override
- Product categories (CRUD, cannot delete if has products)
- S3-compatible image upload (optional, 800x800px resize)
- Search, filter, sort, pagination
- Stock minimum per product (used by stock module alerts)
- RBAC: admin_penjualan can write, owner read-only

## Architecture

```
Produk Page (/produk)
        │
        ├── +page.server.ts (load: fetch products, actions: CRUD)
        │       │
        │       └── ProductService (CRUD, search, code gen, image upload)
        │               │
        │               ├── Drizzle DB (products, product_categories)
        │               └── S3Storage (image upload/delete)
        │
        └── +page.svelte (ProductTable, ProductFormModal, ImageUploader, etc.)
```

## Drizzle Schema

### products table
| Column | Type | Notes |
|--------|------|-------|
| id | text (cuid) | PK |
| code | text | Unique, I-YYYYMMDD-NNN |
| name | text | |
| description | text? | |
| price | Decimal(15,2) | |
| unit | enum | KG, TON, SAK, PCS |
| minimumStock | int | Default 0 |
| imageUrl | text? | S3 URL |
| isActive | boolean | Default true |
| categoryId | text | FK to product_categories |
| createdAt | timestamp | |
| updatedAt | timestamp | |
| deletedAt | timestamp? | Soft delete |

### product_categories table
| Column | Type | Notes |
|--------|------|-------|
| id | text (cuid) | PK |
| name | text | Unique |
| isActive | boolean | Default true |
| createdAt | timestamp | |
| updatedAt | timestamp | |

## S3 Storage

Thin abstraction in `src/lib/server/storage/s3.ts`. Handles:
- `upload(file: Buffer, filename: string)` → public URL
- `delete(url: string)`
- Image resize via `sharp` (800x800px)
- MIME type validation (magic bytes)

Env config: `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`

## Product Code Generation

Format: `I-YYYYMMDD-NNN`
- Prefix `I-` + date + sequential number (reset daily)
- Auto-generated on create, admin can override
- Uniqueness validated server-side
- Code locked on edit if product has been used in transactions

## API (SvelteKit Form Actions)

| Action | Method | Description |
|--------|--------|-------------|
| `?/create` | POST | Create product (multipart: form + optional image) |
| `?/update` | POST | Update product |
| `?/toggleStatus` | POST | Activate/deactivate |
| `?/createCategory` | POST | Add category |
| `?/deleteCategory` | POST | Remove category (blocked if has products) |

Product list fetched in `load()` via URL query params: `?search=...&category=...&status=...&page=...`

## UI Components

- **ProductTable** — Columns: Kode, Nama, Harga, Stok, Gambar, Actions. Sortable, status badges.
- **ProductFormModal** — shadcn-svelte modal for create/edit. ImageUploader, CategorySelect, Zod validation.
- **ImageUploader** — Drag-drop, preview, upload to S3.
- **CategoryManager** — Inline CRUD for categories.
- **SearchInput** — Debounced (300ms), URL-synced.
- **Pagination** — 20 items per page.

## RBAC

- `admin_penjualan`: Full CRUD on products and categories
- `owner`: Read-only (view list, search, filter)
- `petugas_gudang`, `bagian_produksi`: No access (per route config)

## Files

**New:**
- `src/lib/server/db/schema/product.ts`
- `src/lib/server/product/service.ts`
- `src/lib/server/product/validation.ts`
- `src/lib/server/storage/s3.ts`
- `src/routes/(app)/produk/+page.svelte`
- `src/routes/(app)/produk/+page.server.ts`
- `src/lib/components/produk/ProductTable.svelte`
- `src/lib/components/produk/ProductFormModal.svelte`
- `src/lib/components/produk/ImageUploader.svelte`
- `src/lib/components/produk/CategoryManager.svelte`

**Modified:**
- `src/lib/server/db/schema.ts` — export product schemas
- `.env` — add S3 env vars
