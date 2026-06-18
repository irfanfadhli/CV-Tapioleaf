# FEATURE PRD / SRS
# CV TapioLeaf Management System
# Fitur 2: Dashboard Monitoring

**Versi:** 1.0.0
**Tanggal:** 2025-01-01
**Status:** Draft
**Author:** Tim Produk CV TapioLeaf

---

## 1. Feature Overview

### 1.1 Latar Belakang

Owner CV TapioLeaf membutuhkan pandangan menyeluruh atas operasional perusahaan secara real-time. Saat ini, informasi tentang stok, produksi, dan penjualan tersebar di catatan manual yang tidak terkonsolidasi, menyebabkan keterlambatan pengambilan keputusan bisnis.

### 1.2 Masalah yang Diselesaikan

| No | Masalah | Dampak |
|----|---------|--------|
| 1 | Data stok, produksi, penjualan tidak terintegrasi | Owner harus kumpulkan info dari banyak sumber |
| 2 | Laporan harian memerlukan waktu lama | Keputusan terlambat |
| 3 | Tidak ada indikator bisnis yang jelas | Sulit deteksi masalah awal |
| 4 | Tidak ada perbandingan performa periode | Tidak bisa evaluasi tren |

### 1.3 Tujuan Fitur

- Menyediakan ringkasan eksekutif bisnis dalam satu tampilan
- Menampilkan statistik real-time stok, produksi, dan penjualan
- Memberikan notifikasi kondisi kritis (stok minimum, target produksi)
- Memudahkan Owner dalam monitoring tanpa perlu akses detail modul lain

### 1.4 Scope Fitur

#### In Scope
- Ringkasan statistik: total penjualan hari ini, stok saat ini, produksi hari ini
- Grafik tren penjualan (7 hari / 30 hari)
- Grafik tren produksi (7 hari / 30 hari)
- Indikator stok kritis (di bawah minimum)
- Daftar transaksi terbaru
- KPI card bisnis utama
- Filter periode (hari ini, minggu ini, bulan ini)

#### Out of Scope
- Detail transaksi per customer (ada di modul penjualan)
- Edit data langsung dari dashboard
- Dashboard per role selain Owner (custom per modul masing-masing)
- Push notification mobile
- Dashboard publik/embed

### 1.5 Business Impact

- **Efisiensi:** Owner bisa monitor bisnis dalam hitungan detik
- **Deteksi Dini:** Alert stok kritis dan gap produksi vs target
- **Pengambilan Keputusan:** Data visual mempercepat analisis

### 1.6 Success Metrics

| Metric | Target |
|--------|--------|
| Dashboard load time | < 2 detik |
| Data freshness | Real-time (SSR + on-demand refresh) |
| Alert stok kritis | 100% muncul saat stok < minimum |
| User adoption | Owner buka dashboard minimal 1x/hari |

---

## 2. User Story

### US-DASH-001
```
As an Owner
I want melihat ringkasan bisnis hari ini di satu halaman
So that saya bisa segera mengetahui kondisi operasional tanpa buka banyak modul
```
**Priority:** Critical
**Acceptance Notes:** Dashboard harus load dalam < 2 detik dengan data terkini.

---

### US-DASH-002
```
As an Owner
I want melihat total penjualan hari ini, minggu ini, dan bulan ini
So that saya bisa memantau pencapaian target penjualan
```
**Priority:** Critical
**Acceptance Notes:** Tampilkan nilai (Rp) dan jumlah transaksi, dengan perbandingan periode sebelumnya.

---

### US-DASH-003
```
As an Owner
I want melihat grafik tren penjualan 7 hari terakhir
So that saya bisa melihat pola penjualan dan mengidentifikasi hari terbaik
```
**Priority:** High
**Acceptance Notes:** Grafik bar/line dengan tooltip nilai dan tanggal.

---

### US-DASH-004
```
As an Owner
I want melihat total produksi hari ini dan riwayat 7 hari
So that saya bisa memantau apakah produksi sesuai kapasitas (4 ton/hari)
```
**Priority:** High
**Acceptance Notes:** Tampilkan dalam satuan kg/ton dengan indikator vs target kapasitas.

---

### US-DASH-005
```
As an Owner
I want mendapat peringatan visual jika stok produk di bawah minimum
So that saya bisa segera instruksikan bagian produksi untuk menambah stok
```
**Priority:** High
**Acceptance Notes:** Badge merah/kuning pada KPI card stok; daftar produk kritis.

---

### US-DASH-006
```
As an Owner
I want melihat daftar 5 transaksi penjualan terbaru
So that saya bisa memantau aktivitas penjualan tanpa buka modul penjualan
```
**Priority:** Medium
**Acceptance Notes:** Tampilkan: nomor transaksi, pembeli, total, status, waktu.

---

### US-DASH-007
```
As an Owner
I want memfilter data dashboard berdasarkan periode (hari ini/minggu/bulan)
So that saya bisa membandingkan performa antar periode
```
**Priority:** Medium
**Acceptance Notes:** Perubahan filter langsung update semua widget tanpa reload halaman.

---

### US-DASH-008
```
As an Admin Penjualan
I want melihat ringkasan penjualan dan stok terkait tugasnya
So that saya bisa fokus pada target penjualan
```
**Priority:** Medium
**Acceptance Notes:** Dashboard Admin Penjualan menampilkan subset data (penjualan + stok produk aktif).

---

## 3. Use Case Description

### UC-DASH-001: Akses Dashboard Monitoring

| Elemen | Detail |
|--------|--------|
| **Use Case ID** | UC-DASH-001 |
| **Nama** | Melihat Dashboard Monitoring |
| **Actor** | Owner |
| **Preconditions** | User sudah login dengan role Owner |
| **Trigger** | User navigasi ke /dashboard atau login otomatis redirect |

**Main Flow:**
1. Owner login → sistem redirect ke `/dashboard`
2. Sistem melakukan server-side rendering dengan data terkini
3. Sistem mengambil data dari multiple queries secara paralel:
   - Statistik penjualan (hari ini, minggu, bulan)
   - Total produksi hari ini
   - Stok saat ini + produk kritis
   - 5 transaksi terbaru
   - Data tren 7 hari terakhir
4. Sistem menampilkan KPI cards, grafik, dan tabel
5. Alert stok kritis ditampilkan jika ada

**Alternative Flow:**
- **AF-1:** User mengubah filter periode → sistem refresh data tanpa reload page
- **AF-2:** User klik "Refresh" → data diperbarui manual

**Exception Flow:**

| Kode | Kondisi | Respon Sistem |
|------|---------|---------------|
| EX-1 | Database lambat | Tampilkan skeleton loading per widget |
| EX-2 | Partial data error | Widget gagal tampilkan error kecil, widget lain tetap jalan |
| EX-3 | Tidak ada data hari ini | Tampilkan "Belum ada data" per widget |

**Post Conditions:**
- Semua widget menampilkan data terkini
- Alert stok kritis terlihat jika ada

---

### UC-DASH-002: Filter Periode Dashboard

| Elemen | Detail |
|--------|--------|
| **Use Case ID** | UC-DASH-002 |
| **Nama** | Filter Periode Data Dashboard |
| **Actor** | Owner |
| **Preconditions** | Owner berada di halaman /dashboard |

**Main Flow:**
1. Owner memilih filter periode (hari ini / minggu ini / bulan ini)
2. Sistem fetch data baru sesuai periode yang dipilih
3. Semua widget diupdate secara bersamaan
4. Grafik dan tabel menyesuaikan rentang tanggal

---

## 4. Functional Requirements

| ID | Requirement | Description | Actor | Validasi |
|----|-------------|-------------|-------|----------|
| FR-DASH-001 | KPI Card Penjualan | Tampilkan total penjualan (Rp + jumlah transaksi) untuk periode terpilih | Owner | Data dari tabel transactions |
| FR-DASH-002 | KPI Card Produksi | Tampilkan total produksi hari ini vs kapasitas 4000 kg | Owner | Data dari tabel production_entries |
| FR-DASH-003 | KPI Card Stok | Tampilkan jumlah total SKU aktif dan jumlah yang stok kritis | Owner | Join products + stock_movements |
| FR-DASH-004 | KPI Card Pendapatan | Tampilkan total pendapatan vs periode sebelumnya (persentase naik/turun) | Owner | Bandingkan period saat ini vs period sebelumnya |
| FR-DASH-005 | Grafik Tren Penjualan | Line/bar chart penjualan harian 7 hari terakhir | Owner | Data digroup by date |
| FR-DASH-006 | Grafik Tren Produksi | Bar chart produksi harian 7 hari dengan garis target 4000 kg | Owner | Data digroup by date |
| FR-DASH-007 | Alert Stok Kritis | Banner/list produk dengan stok di bawah minimum | Owner | Filter products where currentStock < minimumStock |
| FR-DASH-008 | Tabel Transaksi Terbaru | 5 transaksi penjualan terbaru dengan status | Owner | Order by createdAt DESC limit 5 |
| FR-DASH-009 | Filter Periode | Tombol filter: Hari Ini / Minggu Ini / Bulan Ini | Owner | Default: Hari Ini |
| FR-DASH-010 | Auto Refresh | Data otomatis refresh setiap 5 menit | Sistem | Polling atau SSE |
| FR-DASH-011 | Perbandingan Periode | Tampilkan perubahan % vs periode yang sama sebelumnya | Owner | Kalkulasi di server |
| FR-DASH-012 | Distribusi Penjualan | Pie/donut chart penjualan per kategori produk | Owner | Agregasi per kategori |

---

## 5. Non-Functional Requirements

### Performance
| Requirement | Target |
|-------------|--------|
| Dashboard initial load | < 2 detik (SSR) |
| Filter period change | < 1 detik (CSR fetch) |
| Chart render time | < 500ms |
| Concurrent dashboard users | Mendukung 10 simultaneous |

### Security
- Dashboard hanya bisa diakses role OWNER (dan subset untuk ADMIN_PENJUALAN)
- Semua query via Prisma parameterized
- Data agregasi, bukan raw data sensitif

### Reliability
- Partial failure tolerance: jika 1 widget gagal, yang lain tetap tampil
- Skeleton loading untuk setiap widget

### Scalability
- Query dashboard menggunakan agregasi database, bukan aplikasi
- Index pada kolom date/created_at untuk query rentang waktu

---

## 6. Business Rules

| BR-ID | Rule | Description |
|-------|------|-------------|
| BR-DASH-001 | Kapasitas Produksi | Target produksi harian = 4000 kg; indikator merah jika < 80% |
| BR-DASH-002 | Stok Kritis | Stok kritis = stok saat ini < minimum stok yang dikonfigurasi per produk |
| BR-DASH-003 | Periode Perbandingan | "Hari Ini" dibanding hari yang sama kemarin; "Minggu Ini" vs minggu lalu |
| BR-DASH-004 | Satuan Produksi | Produksi ditampilkan dalam satuan kg, konversi ke ton jika > 1000 kg |
| BR-DASH-005 | Transaksi Terbaru | Hanya tampilkan transaksi dengan status PAID dan PENDING (bukan CANCELLED) |
| BR-DASH-006 | Data Realtime | Data dashboard maksimal 5 menit stale (auto-refresh interval) |
| BR-DASH-007 | Hak Akses Widget | Admin Penjualan hanya melihat widget penjualan dan stok produk aktif |

---

## 7. User Flow

### Success Flow — Akses Dashboard
```
1. Owner login berhasil
2. Redirect otomatis ke /dashboard
3. [Skeleton loading tampil]
4. SSR fetch data dari server:
   - Parallel query: penjualan, produksi, stok, transaksi terbaru
5. Semua widget ter-render dengan data
6. Jika ada stok kritis → banner alert muncul di atas dashboard
7. Dashboard tampil lengkap
```

### Filter Period Flow
```
1. Owner berada di dashboard
2. Owner klik filter "Minggu Ini"
3. Filter active state berubah
4. [Loading indicator kecil per widget]
5. Client-side fetch ke /api/dashboard?period=week
6. Semua widget update data
7. Grafik re-render dengan data baru
8. Persentase perbandingan diupdate
```

### Alert Stok Kritis Flow
```
1. Dashboard dimuat
2. Query: SELECT products WHERE currentStock < minimumStock
3. Jika hasil > 0:
   - Banner kuning/merah muncul di atas dashboard
   - "3 produk membutuhkan restock segera"
   - List produk: nama, stok saat ini, stok minimum
4. Klik banner → navigate ke /gudang/stok?filter=kritis
```

### Edge Flow — Tidak Ada Data
```
1. Owner buka dashboard di hari pertama setup
2. Query return data kosong
3. Setiap widget tampilkan empty state:
   - KPI card: "Rp 0" atau "-"
   - Grafik: "Belum ada data untuk periode ini"
   - Tabel transaksi: "Belum ada transaksi"
```

---

## 8. Data Flow

### Dashboard Load Flow
```
Browser
  └─► GET /dashboard (SSR)
        │
        ▼
  SvelteKit load() function (server-side)
        │  Parallel Promise.all:
        ├─► DashboardService.getSalesSummary(period)
        ├─► DashboardService.getProductionSummary(date)
        ├─► DashboardService.getStockSummary()
        └─► DashboardService.getRecentTransactions(5)
              │  Prisma aggregate queries
              ▼
        PostgreSQL (NeonDB)
              │  Aggregated results
              ▼
        DashboardDTO transform
              │
              ▼
  SvelteKit: pass data ke page component
        │
        ▼
  Browser: Render KPI cards + Charts + Tables
```

### Filter Period Flow
```
User selects filter
  └─► Client-side fetch: GET /api/dashboard?period=week
        │
        ▼
  API Route Handler
        │  Validate period param
        ▼
  DashboardService.getSummary(period)
        │  Prisma queries dengan date range
        ▼
  PostgreSQL
        │
        ▼
  JSON response
        │
        ▼
  Svelte reactive update semua widgets
```

---

## 9. Validation Rules

```typescript
// schemas/dashboard.schema.ts
import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  period: z
    .enum(['today', 'week', 'month'], {
      errorMap: () => ({ message: 'Period harus: today, week, atau month' })
    })
    .default('today'),

  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD')
    .optional(),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
```

---

## 10. Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Gagal memuat data dashboard",
  "code": "DASHBOARD_LOAD_ERROR",
  "errors": {}
}
```

### Widget-Level Error Handling
```typescript
// Setiap widget handle error secara independen
// Jika 1 query gagal, widget lain tetap render

const [salesData, productionData, stockData] = await Promise.allSettled([
  getSalesSummary(period),
  getProductionSummary(),
  getStockSummary(),
]);

// Setiap widget cek status: 'fulfilled' | 'rejected'
```

### Error Catalog

| HTTP Status | Code | Kondisi | Handling |
|-------------|------|---------|----------|
| 400 | INVALID_PERIOD | Parameter period tidak valid | Return validasi error |
| 403 | FORBIDDEN | Role tidak diizinkan | Redirect ke 403 page |
| 500 | DASHBOARD_ERROR | Query error | Tampilkan widget error state |
| 503 | DATABASE_TIMEOUT | DB tidak respond | Tampilkan "Data sementara tidak tersedia" |

---

## 11. Acceptance Criteria

```gherkin
Feature: Dashboard Monitoring

  Scenario: Owner melihat KPI dashboard hari ini
    Given saya login sebagai Owner
    When saya membuka halaman /dashboard
    Then saya melihat KPI card: total penjualan hari ini
    And saya melihat KPI card: total produksi hari ini
    And saya melihat KPI card: jumlah produk stok kritis
    And semua data di-load dalam waktu < 2 detik

  Scenario: Dashboard menampilkan alert stok kritis
    Given terdapat 2 produk dengan stok di bawah minimum
    When Owner membuka dashboard
    Then banner alert muncul dengan teks "2 produk membutuhkan restock"
    And daftar produk kritis ditampilkan

  Scenario: Owner memfilter data ke periode minggu ini
    Given saya berada di dashboard
    When saya mengklik filter "Minggu Ini"
    Then semua widget memperbarui data sesuai minggu ini
    And perbandingan ditampilkan vs minggu lalu

  Scenario: Dashboard dengan data kosong
    Given belum ada transaksi hari ini
    When Owner membuka dashboard
    Then widget penjualan menampilkan "Rp 0" atau "Belum ada transaksi"
    And tidak ada error yang muncul

  Scenario: Akses dashboard oleh role tidak authorized
    Given saya login sebagai Petugas Gudang
    When saya mencoba akses /dashboard
    Then sistem mengarahkan ke halaman 403
```

---

## 12. Database Design

```prisma
// Tidak ada tabel khusus untuk dashboard
// Dashboard menggunakan agregasi dari tabel yang sudah ada:

// Query contoh - Sales Summary
// SELECT DATE(created_at), SUM(total_amount), COUNT(id)
// FROM transactions
// WHERE created_at >= $startDate AND status != 'CANCELLED'
// GROUP BY DATE(created_at)

// Query contoh - Stock Critical
// SELECT p.name, p.minimum_stock, COALESCE(SUM(sm.quantity_change), 0) as current_stock
// FROM products p
// LEFT JOIN stock_movements sm ON sm.product_id = p.id
// GROUP BY p.id
// HAVING current_stock < p.minimum_stock
```

### Index Strategy untuk Dashboard Queries
```prisma
// Di model Transaction
@@index([createdAt])        // Range query by date
@@index([status, createdAt]) // Filter status + date range

// Di model ProductionEntry
@@index([productionDate])    // Query by date

// Di model StockMovement
@@index([productId, createdAt]) // Per product per date
```

---

## 13. Database Impact Analysis

- Dashboard hanya **membaca** data (READ-ONLY queries)
- Semua query menggunakan agregasi PostgreSQL (GROUP BY, SUM, COUNT)
- Index pada kolom date critical untuk performa
- Pertimbangkan **Materialized View** jika data > 100k rows (future optimization)

---

## 14. API Requirements

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/dashboard/summary` | Ambil semua summary data | ✅ | Owner, Admin |
| GET | `/api/dashboard/sales-trend` | Data tren penjualan per hari | ✅ | Owner |
| GET | `/api/dashboard/production-trend` | Data tren produksi per hari | ✅ | Owner |
| GET | `/api/dashboard/stock-alerts` | Daftar produk stok kritis | ✅ | Owner, Admin |
| GET | `/api/dashboard/recent-transactions` | 5 transaksi terbaru | ✅ | Owner |

### GET /api/dashboard/summary?period=today

**Response 200:**
```json
{
  "success": true,
  "data": {
    "sales": {
      "total": 15000000,
      "count": 12,
      "change": 15.5
    },
    "production": {
      "totalKg": 3200,
      "targetKg": 4000,
      "percentage": 80
    },
    "stock": {
      "totalSKU": 8,
      "criticalCount": 2
    },
    "revenue": {
      "total": 15000000,
      "change": 8.3
    }
  }
}
```

### GET /api/dashboard/sales-trend?period=week

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "date": "2025-01-01", "total": 2500000, "count": 3 },
    { "date": "2025-01-02", "total": 3200000, "count": 5 }
  ]
}
```

---

## 15. UI Components

### Dashboard Layout
```
┌────────────────────────────────────────────────────┐
│  CV TapioLeaf | Dashboard          [Filter ▼] [🔄] │
├────────────────────────────────────────────────────┤
│  ⚠ 2 produk stok kritis! [Lihat Detail →]         │
├──────────┬──────────┬──────────┬────────────────────┤
│💰 Penjualan│📦 Produksi│🏭 Stok   │📈 Pendapatan       │
│ Rp 15 jt │ 3.2 ton  │ 2 kritis │ +8.3% vs kmrn      │
│ +15% ↑   │ 80% target│ 8 total  │                   │
├──────────┴──────────┴──────────┴────────────────────┤
│  📊 Tren Penjualan 7 Hari        │ 🏭 Tren Produksi  │
│  [Bar Chart]                     │ [Bar Chart]       │
├──────────────────────────────────┼────────────────────┤
│  🕐 Transaksi Terbaru            │ 🍩 Per Kategori   │
│  TRX-001 | Rp 500k | PAID       │ [Donut Chart]     │
│  TRX-002 | Rp 750k | PENDING    │                   │
└──────────────────────────────────┴────────────────────┘
```

**Components:**
- `<KPICard>` — Props: title, value, subtitle, change, changeType, icon, alert
- `<SalesTrendChart>` — Recharts LineChart/BarChart
- `<ProductionTrendChart>` — Recharts BarChart dengan reference line target
- `<CategoryPieChart>` — Recharts PieChart/RadialBarChart
- `<RecentTransactionTable>` — Tabel 5 baris dengan status badge
- `<StockAlertBanner>` — Dismissible banner dengan daftar produk kritis
- `<PeriodFilter>` — Tombol segmented: Hari Ini | Minggu Ini | Bulan Ini
- `<SkeletonWidget>` — Loading placeholder per widget

**State per KPICard:**
| State | Tampilan |
|-------|----------|
| Loading | Skeleton animation |
| Loaded | Data dengan animasi counter |
| Error | Icon warning + "Data tidak tersedia" |
| Empty | Nilai 0 atau dash |

---

## 16. Edge Cases

| Edge Case | Kondisi | Solusi |
|-----------|---------|--------|
| Hari pertama sistem | Belum ada data | Empty state per widget, tidak error |
| Semua stok OK | Tidak ada produk kritis | Banner alert tidak ditampilkan |
| Produksi 0 hari ini | Belum ada input produksi | KPI menampilkan 0 kg (0%) |
| Data transaksi besar | Banyak transaksi di satu hari | Agregasi di DB, bukan di aplikasi |
| Timezone berbeda | Server vs browser timezone | Semua timestamp dalam WIB (UTC+7) |
| Filter sama dipilih ulang | Double-click filter aktif | Tidak ada efek (idempotent) |
| Partial widget error | 1 dari 5 query gagal | Widget error ditampilkan isolated, yang lain OK |

---

## 17. Security Requirements

- Dashboard hanya accessible oleh OWNER dan ADMIN_PENJUALAN (subset)
- Semua API endpoint dashboard menggunakan session validation
- Data yang ditampilkan adalah agregasi, bukan raw financial data detail
- Tidak ada export data langsung dari dashboard (ada di modul laporan)
- Rate limit: dashboard API max 30 request/menit per user

---

## 18. Testing Strategy

### Unit Testing (Vitest)

```typescript
describe('DashboardService', () => {
  it('getSalesSummary returns correct total for today', async () => {});
  it('getSalesSummary compares correctly with previous period', async () => {});
  it('getStockAlerts returns only products below minimum', async () => {});
  it('getProductionSummary calculates percentage of target correctly', async () => {});
});
```

### E2E Testing (Playwright)

```typescript
test('Owner melihat dashboard lengkap', async ({ page }) => {
  await loginAs(page, 'owner');
  await page.goto('/dashboard');
  await expect(page.locator('[data-testid="kpi-sales"]')).toBeVisible();
  await expect(page.locator('[data-testid="kpi-production"]')).toBeVisible();
  await expect(page.locator('[data-testid="chart-sales-trend"]')).toBeVisible();
});

test('Filter periode mengupdate semua widget', async ({ page }) => {
  await loginAs(page, 'owner');
  await page.goto('/dashboard');
  await page.click('[data-testid="filter-week"]');
  // Assert loading indicator
  // Assert data updated
});
```

---

## 19. DevOps & Deployment

### Environment Variables
```env
DASHBOARD_CACHE_TTL=300          # 5 menit cache TTL
DASHBOARD_AUTO_REFRESH_MS=300000 # 5 menit auto refresh
PRODUCTION_TARGET_KG=4000        # Kapasitas produksi harian
```

### Monitoring
- Track dashboard load time via server timing header
- Alert jika dashboard query > 3 detik

---

## 20. Definition of Done

```markdown
- [ ] Semua KPI card selesai (penjualan, produksi, stok, pendapatan)
- [ ] Grafik tren penjualan selesai
- [ ] Grafik tren produksi dengan reference line target selesai
- [ ] Alert banner stok kritis selesai
- [ ] Tabel transaksi terbaru selesai
- [ ] Filter periode (hari ini/minggu/bulan) selesai
- [ ] Auto-refresh 5 menit selesai
- [ ] Empty state per widget selesai
- [ ] Skeleton loading selesai
- [ ] API endpoints dashboard selesai dan tertest
- [ ] Unit test DashboardService coverage > 80%
- [ ] E2E test dashboard selesai
- [ ] RBAC: hanya Owner yang bisa akses full dashboard
- [ ] Performance: load < 2 detik
- [ ] Deploy staging berhasil
- [ ] QA sign-off
```

---

*Dokumen ini adalah PRD/SRS resmi untuk Fitur Dashboard Monitoring CV TapioLeaf Management System.*
*Versi: 1.0.0 | Status: Draft | Last Updated: 2025-01-01*
