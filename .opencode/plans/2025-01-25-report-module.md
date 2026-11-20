# Report Module Implementation Plan

## Goal
Create a minimal Report Module (`/laporan`) allowing finance staff and owner to access sales, stock, and production summaries by period.

## Architecture
- **Route**: `(app)/laporan` with tabbed UI
- **Server**: `src/lib/server/reports/` with Zod-validated queries
- **RBAC**: Server-side checks (not just sidebar hide)
- **DB**: Read-only aggregations via Drizzle
- **Timezone**: Asia/Jakarta
- **Export**: PDF (existing pattern) + Excel/CSV

## Files to Create/Modify

### New Files
- `src/lib/server/reports/validation.ts` — Zod schemas
- `src/lib/server/reports/service.ts` — Query functions
- `src/routes/(app)/laporan/+page.server.ts` — Load + RBAC + export
- `src/routes/(app)/laporan/+page.svelte` — UI

### Modify
- `src/routes/(app)/+layout.svelte` — Add sidebar link
- `src/lib/server/auth/routes.ts` — RBAC for `/laporan`

## Task Breakdown

### Task 1: Reports Validation Schema
Create `src/lib/server/reports/validation.ts`:
- `periodSchema` — today/week/month/custom
- Custom date range validation (end >= start)
- Timezone-aware period boundaries (Asia/Jakarta)

### Task 2: Reports Service Layer
Create `src/lib/server/reports/service.ts`:
- `getSalesReport(start, end)` — orders + sales transactions with totals
- `getStockReport(start, end)` — per product opening/in/out/closing/min-alert
- `getProductionReport(start, end)` — batches + kg, daily breakdown
- All queries: DB-level SUM/COUNT/GROUP BY

### Task 3: Reports Route Server
Create `src/routes/(app)/laporan/+page.server.ts`:
- RBAC check: owner all, admin_penjualan sales, petugas_gudang stock, bagian_produksi production
- Load: fetch data for active tab + period
- Actions: export PDF, export Excel

### Task 4: Reports UI
Create `src/routes/(app)/laporan/+page.svelte`:
- Tab bar: Penjualan, Stok, Produksi
- Period selector (buttons + custom date range)
- Tables with totals row
- Empty/loading states
- Export buttons per tab

### Task 5: Sidebar + Route Protection
Modify:
- `src/routes/(app)/+layout.svelte` — Add "Laporan" link per role
- `src/lib/server/auth/routes.ts` — Add `/laporan` RBAC

### Task 6: Verify
- `npm run check` — 0 errors
- `npm run build` — success
- `npx vitest --run` — 81+ tests pass

## Pattern References
- Dashboard service: `src/lib/server/dashboard/service.ts`
- Dashboard page: `src/routes/(app)/dashboard/`
- Existing RBAC: `src/lib/server/auth/routes.ts`
- Stock service: `src/lib/server/stock/service.ts`
