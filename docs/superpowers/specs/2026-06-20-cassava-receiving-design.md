# Cassava Receiving System — Implementation Design

**Date:** 2026-06-20
**Adapted from:** `docs/PRD-Cassava-Receiving-System.md`

## Adaptations for Current Codebase

The PRD uses Prisma ORM — this project uses **Drizzle ORM** with PostgreSQL/Neon. All schema/service patterns follow existing Drizzle conventions (see `src/lib/server/db/schema/`). No AuditLog table needed initially — existing system doesn't have one. Simplify to core delivery tracking first.

## Data Model (Drizzle)

### Tables to Create

**suppliers** (`src/lib/server/db/schema/supplier.ts`)
- `id` text PK, `name` text notNull, `phone` text, `address` text, `isActive` boolean default true, `createdAt`, `updatedAt`

**cassava_receipts** (`src/lib/server/db/schema/cassava.ts`)
- `id` text PK (UUID)
- `receiptDate` timestamp
- `supplierId` text FK → suppliers.id
- `vehicleNumber` text
- `driverName` text?
- `grossWeight` decimal(10,2)
- `taraWeight` decimal(10,2)
- `netWeight` decimal(10,2) — calculated: gross - tara
- `refraction` decimal(10,2)
- `finalWeight` decimal(10,2) — calculated: net - refraction
- `pricePerKg` decimal(10,2)
- `totalCost` decimal(12,2) — calculated: finalWeight × pricePerKg
- `paymentStatus` text enum: UNPAID / PARTIAL / PAID default UNPAID
- `notes` text?
- `receivedById` text FK → user.id
- `createdAt`, `updatedAt`, `deletedAt`?

Indexes: `supplierId`, `receiptDate`

## Scope for Initial Implementation

Build the core cassava receiving feature with:
1. Supplier list (CRUD)
2. Cassava receipt entry with live calculation (gross → tara → net → refraction → final → cost)
3. Receipt list with filters and daily summary
4. Admin sidebar link
5. Route config for `owner` + `petugas_gudang`

**Deferred** (from PRD — can add later):
- Production batch integration (separate from existing produksi module)
- Payment history tracking
- Supplier reports
- Audit log
