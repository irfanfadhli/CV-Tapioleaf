# Admin Dashboard — Owner Analytics (Production to Sales)

**Date:** 2026-06-20
**Status:** Draft
**Author:** Development Team

## 1. Overview

Build a comprehensive admin dashboard for the Owner (`owner` role) to analyze the full production-to-sales pipeline. Subset view for `admin_penjualan` (sales + stock widgets only).

## 2. Data Model Changes

Add `costPrice` column to `products` table:
- **Column:** `costPrice` — `decimal(15,2)` nullable
- **Purpose:** Track base cost per unit for margin calculation
- **Display:** Added to product create/edit form in `ProductFormModal`
- **Margin formula:** `((price - costPrice) / price) * 100`

No new tables required. Dashboard queries aggregate from existing tables:
- `orders` + `order_items` — sales/revenue/trends
- `production_entries` — production trends vs 4000kg target
- `products` + `stock_movements` — stock status + alerts
- `product_categories` — category distribution

## 3. Architecture

### Data Flow
- **SSR on page load:** `+page.server.ts` runs `Promise.allSettled` for all widget queries in parallel
- **Period filter (CSR):** Client-side `fetch('/api/dashboard?period=today|week|month')` updates all widgets without page reload
- **Widget isolation:** Each widget data passed independently. If one query fails, only that widget shows an error state

### Query Strategy
- All aggregation done at PostgreSQL level (GROUP BY, SUM, COUNT, COALESCE)
- Parallel execution via `Promise.allSettled` for partial failure tolerance
- Index strategy: ensure `orders.created_at`, `stock_movements.movement_date`, `production_entries.production_date` are indexed for range queries

## 4. Component Tree

```
src/lib/server/dashboard/service.ts     — All aggregation queries
src/routes/(app)/dashboard/+page.server.ts — SSR load + API handler for period filter
src/routes/(app)/dashboard/+page.svelte   — Dashboard page layout
src/lib/components/dashboard/
├── KPICard.svelte              — Reusable card (title, value, subtitle, change%, icon, alert)
├── SalesTrendChart.svelte      — Bar chart daily sales (7/30 days)
├── ProductionChart.svelte      — Bar chart daily production + reference target line
├── CategoryChart.svelte        — Donut chart sales by category
├── RecentTransactions.svelte   — Table 5 latest PAID/PENDING orders
├── StockAlertBanner.svelte     — Banner listing critical stock products
├── PeriodFilter.svelte         — Segmented button: Hari Ini | Minggu Ini | Bulan Ini
└── SkeletonWidget.svelte       — Loading placeholder per widget
```

### Widget States
| State | Display |
|-------|---------|
| Loading | Skeleton animation |
| Loaded | Data with animation |
| Error | Warning icon + "Data tidak tersedia" |
| Empty | 0 or "Belum ada data" |

## 5. API Endpoints

### GET /api/dashboard?period=today|week|month

Returns JSON with all widget data for client-side period switching.

**KPI Cards Response:**
```json
{
  "sales": { "total": 15000000, "count": 12, "change": 15.5 },
  "production": { "totalKg": 3200, "targetKg": 4000, "percentage": 80 },
  "stock": { "totalSKU": 8, "criticalCount": 2 },
  "revenue": { "total": 15000000, "change": 8.3, "margin": 22.5 }
}
```

**Trends Response:**
```json
{
  "salesTrend": [ { "date": "2025-01-01", "total": 2500000, "count": 3 } ],
  "productionTrend": [ { "date": "2025-01-01", "totalKg": 3200 } ]
}
```

**Transactions & Alerts:**
```json
{
  "recentTransactions": [ { "id": "...", "customerName": "...", "totalAmount": 500000, "status": "PAID", "createdAt": "..." } ],
  "stockAlerts": [ { "id": "...", "name": "...", "currentStock": 5, "minimumStock": 50 } ],
  "categoryDistribution": [ { "category": "Tepung", "total": 8000000 } ]
}
```

## 6. Dashboard Layout

```
┌──────────────────────────────────────────────────────────┐
│  CV TapioLeaf | Dashboard            [Filter ▼]    [🔄]   │
├──────────────────────────────────────────────────────────┤
│  ⚠ 2 produk stok kritis! [Lihat Detail →]                │
├────────┬────────┬────────┬───────────────────────────────┤
│💰 Jual │📦 Produk│🏭 Stok │📈 Pendapatan                  │
│ Rp 15jt │ 3.2ton │ 2 kritis│ +8.3% vs kmrn     │
│ +15% ↑ │ 80%   │ 8 total │ Margin: 22.5%      │
├────────┴────────┴────────┴───────────────────────────────┤
│  📊 Tren Penjualan 7 Hari      │ 🏭 Tren Produksi        │
│  [Bar Chart]                    │ [Bar + target line]     │
├────────────────────────────────┼──────────────────────────┤
│  🕐 Transaksi Terbaru           │ 🍩 Per Kategori         │
│  TRX-001 | Rp 500k | PAID      │ [Donut Chart]           │
│  TRX-002 | Rp 750k | PENDING   │                         │
└────────────────────────────────┴──────────────────────────┘
```

## 7. Role Access

- **`owner`** — Full dashboard (all 6 widgets + alerts)
- **`admin_penjualan`** — Subset: sales KPI, revenue KPI, sales trend, recent transactions (already configured in routes.ts)

## 8. Error Handling

- Widget-level isolation via `Promise.allSettled`
- Each widget independently renders its own error/loading/empty state
- Stock alert banner hidden when no critical products exist
- Period filter changes are idempotent (re-clicking same period has no effect)
- Empty state for first-day setup: all widgets show "Belum ada data" gracefully

## 9. Out of Scope

- Detail transaction drill-down (exists in Orders module)
- Edit data directly from dashboard
- Push notifications
- Dashboard export/print
- Public or embeddable dashboard
