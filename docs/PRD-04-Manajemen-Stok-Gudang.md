# FEATURE PRD / SRS
# CV TapioLeaf Management System
# Fitur 4: Manajemen Stok Gudang

**Versi:** 1.0.0
**Tanggal:** 2025-01-01
**Status:** Draft
**Author:** Tim Produk CV TapioLeaf

---

## 1. Feature Overview

### 1.1 Latar Belakang

Manajemen stok gudang adalah jantung operasional CV TapioLeaf. Saat ini, pencatatan stok dilakukan secara manual di buku gudang, menyebabkan selisih antara stok fisik dan catatan yang sulit dideteksi. Produksi harian otomatis menambah stok, sementara penjualan menguranginya — semua harus tercatat akurat dan real-time.

### 1.2 Masalah yang Diselesaikan

| No | Masalah | Dampak |
|----|---------|--------|
| 1 | Selisih stok fisik vs catatan manual | Overstocking atau kekurangan stok tiba-tiba |
| 2 | Tidak ada riwayat pergerakan stok | Sulit audit dan investigasi selisih |
| 3 | Tidak ada notifikasi stok minimum | Produksi terganggu karena kehabisan produk |
| 4 | Stok masuk dari produksi tidak langsung tercatat | Delay informasi ke tim penjualan |
| 5 | Tidak ada stock adjustment formal | Selisih stok ditutupi tanpa dokumentasi |

### 1.3 Tujuan Fitur

- Mencatat setiap pergerakan stok (masuk, keluar, adjustment) secara real-time
- Menghitung stok current secara otomatis berdasarkan histori pergerakan
- Memberikan notifikasi saat stok di bawah minimum
- Menyediakan riwayat lengkap pergerakan stok untuk audit
- Mendukung stock adjustment dengan catatan alasan

### 1.4 Scope Fitur

#### In Scope
- Input stok masuk manual (pembelian bahan, dll)
- Stok keluar manual (distribusi, retur)
- Stock adjustment dengan alasan
- Riwayat pergerakan stok per produk
- Notifikasi stok kritis (di bawah minimum)
- Saldo stok real-time per produk
- Laporan stok snapshot

#### Out of Scope
- Manajemen gudang multi-lokasi (future)
- Barcode scanning (future)
- FIFO/LIFO cost accounting (future)
- Integrasi dengan perangkat IoT timbangan (future)
- Stok bahan baku/raw material (modul terpisah)

### 1.5 Business Impact

- **Akurasi:** Eliminasi selisih stok antara catatan dan fisik
- **Efisiensi:** Alert otomatis menggantikan cek manual harian
- **Audit Trail:** Setiap perubahan stok terlacak ke pengguna dan waktu

### 1.6 Success Metrics

| Metric | Target |
|--------|--------|
| Akurasi stok | Selisih < 0.1% dari total stok tercatat |
| Alert response time | Notifikasi stok kritis muncul < 1 menit setelah trigger |
| Audit completeness | 100% pergerakan stok tercatat dengan user + timestamp |

---

## 2. User Story

### US-STK-001
```
As a Petugas Gudang
I want mencatat stok masuk dari hasil produksi atau sumber lain
So that saldo stok selalu akurat dan terkini
```
**Priority:** Critical
**Acceptance Notes:** Pilih produk, quantity, tanggal, sumber (produksi/lainnya), keterangan.

---

### US-STK-002
```
As a Petugas Gudang
I want mencatat stok keluar untuk pengiriman penjualan
So that stok berkurang sesuai barang yang dikirim
```
**Priority:** Critical
**Acceptance Notes:** Stok keluar terhubung ke transaksi penjualan atau bisa manual.

---

### US-STK-003
```
As a Petugas Gudang
I want melakukan stock adjustment saat ada selisih stok fisik vs sistem
So that saldo stok sistem sesuai dengan fisik di gudang
```
**Priority:** High
**Acceptance Notes:** Wajib isi alasan adjustment. Bisa positif (tambah) atau negatif (kurang).

---

### US-STK-004
```
As a Petugas Gudang
I want melihat saldo stok saat ini untuk semua produk
So that saya tahu berapa stok yang tersedia untuk dijual
```
**Priority:** Critical
**Acceptance Notes:** Tampilkan stok saat ini, stok minimum, dan status (normal/kritis).

---

### US-STK-005
```
As a Petugas Gudang
I want melihat riwayat semua pergerakan stok produk tertentu
So that saya bisa melacak kapan dan mengapa stok berubah
```
**Priority:** High
**Acceptance Notes:** Filter by produk, tipe pergerakan, rentang tanggal. Pagination.

---

### US-STK-006
```
As a Petugas Gudang
I want mendapat notifikasi visual saat stok produk di bawah minimum
So that saya bisa segera koordinasi dengan tim produksi
```
**Priority:** High
**Acceptance Notes:** Badge/banner pada halaman stok; highlight baris produk kritis.

---

### US-STK-007
```
As an Owner
I want melihat ringkasan nilai total stok saat ini
So that saya bisa menghitung aset persediaan perusahaan
```
**Priority:** Medium
**Acceptance Notes:** Total nilai = SUM(stok * harga jual per produk).

---

### US-STK-008
```
As a Petugas Gudang
I want riwayat produksi otomatis tercermin di stok gudang
So that saya tidak perlu input ganda antara modul produksi dan gudang
```
**Priority:** High
**Acceptance Notes:** Input produksi harian otomatis trigger stock_movement tipe PRODUCTION_IN.

---

## 3. Use Case Description

### UC-STK-001: Input Stok Masuk

| Elemen | Detail |
|--------|--------|
| **Use Case ID** | UC-STK-001 |
| **Nama** | Input Stok Masuk |
| **Actor** | Petugas Gudang |
| **Preconditions** | Petugas Gudang sudah login; produk ada di sistem |
| **Trigger** | Petugas gudang menerima produk dari produksi atau pembelian |

**Main Flow:**
1. Petugas klik "+ Stok Masuk"
2. Form muncul: pilih produk, quantity, tanggal, tipe sumber, keterangan
3. Petugas isi semua field
4. Petugas klik "Simpan"
5. Sistem validasi input
6. Sistem buat record `stock_movement` dengan tipe `STOCK_IN`
7. Saldo stok produk otomatis bertambah
8. Notifikasi sukses

**Alternative Flow:**
- **AF-1:** Stok masuk dari produksi: dipanggil otomatis oleh modul produksi (bukan manual)

**Exception Flow:**

| Kode | Kondisi | Respon Sistem |
|------|---------|---------------|
| EX-1 | Quantity = 0 atau negatif | "Quantity harus lebih dari 0" |
| EX-2 | Produk tidak ditemukan | "Produk tidak valid" |
| EX-3 | Tanggal di masa depan | "Tanggal tidak boleh di masa depan" |

---

### UC-STK-002: Stock Adjustment

| Elemen | Detail |
|--------|--------|
| **Use Case ID** | UC-STK-002 |
| **Nama** | Stock Adjustment |
| **Actor** | Petugas Gudang |
| **Preconditions** | Ada selisih stok yang perlu dikoreksi |

**Main Flow:**
1. Petugas pilih produk yang akan di-adjust
2. Sistem tampilkan stok sistem saat ini
3. Petugas input stok fisik yang sebenarnya (actual count)
4. Sistem hitung selisih otomatis (fisik - sistem)
5. Petugas wajib isi alasan adjustment
6. Petugas klik "Terapkan Adjustment"
7. Sistem buat record `stock_movement` tipe `ADJUSTMENT` dengan selisih
8. Saldo stok diupdate ke nilai fisik

**Business Rule:** Adjustment bisa positif atau negatif tergantung hasil opname.

---

## 4. Functional Requirements

| ID | Requirement | Description | Actor | Validasi |
|----|-------------|-------------|-------|----------|
| FR-STK-001 | Stok Masuk Manual | Form input stok masuk dengan detail lengkap | Petugas Gudang | Quantity > 0, produk aktif |
| FR-STK-002 | Stok Keluar Manual | Form input stok keluar manual | Petugas Gudang | Quantity > 0, tidak melebihi stok tersedia |
| FR-STK-003 | Stock Adjustment | Input selisih stok dengan alasan wajib | Petugas Gudang | Alasan min 10 karakter |
| FR-STK-004 | Auto Stock Update | Stok update otomatis saat produksi dicatat | Sistem | Triggered by produksi module |
| FR-STK-005 | Auto Stock Deduct | Stok kurang otomatis saat transaksi penjualan confirmed | Sistem | Triggered by penjualan module |
| FR-STK-006 | Saldo Stok Real-time | Tampilkan stok saat ini = SUM semua movements per produk | Sistem | Computed dari stock_movements |
| FR-STK-007 | Alert Stok Kritis | Highlight produk dengan stok < minimumStock | Sistem | Comparison vs minimumStock di products |
| FR-STK-008 | Riwayat Pergerakan | List semua movements dengan filter dan pagination | Petugas, Owner | Filter: produk, tipe, tanggal |
| FR-STK-009 | Validasi Stok Negatif | Tolak transaksi keluar jika melebihi stok tersedia | Sistem | currentStock - quantity >= 0 |
| FR-STK-010 | Tipe Pergerakan | Kategori jelas: PRODUCTION_IN, PURCHASE_IN, SALE_OUT, MANUAL_OUT, ADJUSTMENT | Sistem | Enum terdefinisi |
| FR-STK-011 | Referensi Transaksi | Stok keluar otomatis menyimpan referensi transaction ID | Sistem | Foreign key ke transactions |
| FR-STK-012 | Nilai Stok Total | Kalkulasi nilai total stok = SUM(currentStock * price) | Owner | Harga dari products.price |

---

## 5. Non-Functional Requirements

### Performance
| Requirement | Target |
|-------------|--------|
| Load daftar stok | < 1 detik untuk 100 produk |
| Input stok masuk/keluar | < 500ms |
| Kalkulasi saldo stok | Real-time via query agregasi |

### Data Integrity
- Stok tidak boleh negatif (constraint aplikasi + DB check constraint)
- Setiap pergerakan stok tidak dapat dihapus (immutable audit log)
- Hanya bisa dibatalkan dengan adjustment berlawanan

### Reliability
- Stok deduct saat penjualan dalam satu database transaction (atomic)
- Rollback otomatis jika salah satu bagian gagal

---

## 6. Business Rules

| BR-ID | Rule | Description |
|-------|------|-------------|
| BR-STK-001 | Stok Tidak Negatif | Stok tidak bisa kurang dari 0; transaksi ditolak jika melebihi stok tersedia |
| BR-STK-002 | Immutable Movements | Record stock_movement tidak bisa diedit/dihapus setelah dibuat |
| BR-STK-003 | Koreksi via Adjustment | Kesalahan input stok dikoreksi via adjustment, bukan edit langsung |
| BR-STK-004 | Alasan Adjustment Wajib | Stock adjustment wajib memiliki alasan (min 10 karakter) |
| BR-STK-005 | Saldo Kalkulasi | Saldo = SUM(quantity_change) dari semua movements per produk |
| BR-STK-006 | Produksi Auto-Sync | Input produksi harian otomatis membuat record stok masuk |
| BR-STK-007 | Penjualan Auto-Deduct | Konfirmasi penjualan otomatis membuat record stok keluar |
| BR-STK-008 | Waktu Nyata | Stok harus mencerminkan kondisi terkini (tidak ada batch update) |

---

## 7. User Flow

### Input Stok Masuk — Success Flow
```
1. Petugas Gudang klik "+ Stok Masuk"
2. Form muncul
3. Pilih produk dari dropdown (hanya aktif)
4. Input quantity (misal: 500 kg)
5. Pilih tanggal (default: hari ini)
6. Pilih sumber: PURCHASE_IN (pembelian)
7. Isi keterangan (opsional)
8. Klik "Simpan"
9. Validasi → OK
10. POST /api/stock/movements
11. Record dibuat: +500 kg
12. Saldo produk berubah dari 200 → 700 kg
13. Toast "Stok masuk berhasil dicatat"
14. Tabel stok refresh
```

### Stock Adjustment — Flow
```
1. Petugas temukan selisih saat opname
2. Stok sistem: 200 kg
3. Stok fisik aktual: 185 kg
4. Klik "Adjustment" pada produk tersebut
5. Form tampil dengan stok sistem: 200 kg
6. Petugas input stok aktual: 185
7. Sistem hitung: 185 - 200 = -15 (selisih)
8. Petugas wajib isi alasan: "Stok rusak saat penyimpanan"
9. Klik "Terapkan"
10. Record dibuat: -15 kg tipe ADJUSTMENT
11. Saldo berubah 200 → 185 kg
12. Toast "Adjustment berhasil"
```

### Alert Stok Kritis — Flow
```
1. Penjualan dikonfirmasi → stok berkurang
2. Cek: stok < minimumStock?
3. Jika ya:
   - Baris produk di tabel stok highlight merah
   - Badge "KRITIS" muncul
   - Alert muncul di dashboard
4. Jika tidak → normal
```

---

## 8. Data Flow

### Stok Masuk Manual
```
Browser
  └─► POST /api/stock/movements
        │  { productId, quantityChange: +N, type: PURCHASE_IN, note, date }
        ▼
  Zod Validation
        ▼
  StockService.addMovement(dto)
        │
        ├─► ProductRepository.findActive(productId) — validasi produk
        ├─► StockMovementRepository.create(data)
        └─► [Tidak perlu update separate table — saldo dihitung dari movements]
              │
              ▼
        PostgreSQL: INSERT INTO stock_movements
              │
              ▼
  Response 201
```

### Stok Keluar Otomatis (Triggered by Penjualan)
```
TransactionService.confirmPayment(transactionId)
  └─► StockService.deductForTransaction(transactionId)
        │
        ├─► Fetch transaction items
        ├─► For each item:
        │     ├─► Check currentStock >= quantity
        │     └─► StockMovementRepository.create(SALE_OUT)
        └─► If any product insufficient → ROLLBACK all
```

---

## 9. Validation Rules

```typescript
// schemas/stock.schema.ts
import { z } from 'zod';

export const stockMovementSchema = z.object({
  productId: z
    .string({ required_error: 'Produk wajib dipilih' })
    .cuid('ID produk tidak valid'),

  quantityChange: z
    .number({ required_error: 'Quantity wajib diisi' })
    .refine((v) => v !== 0, 'Quantity tidak boleh 0'),

  type: z.enum([
    'PRODUCTION_IN',
    'PURCHASE_IN',
    'SALE_OUT',
    'MANUAL_OUT',
    'ADJUSTMENT',
  ]),

  movementDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(
      (d) => new Date(d) <= new Date(),
      'Tanggal tidak boleh di masa depan'
    ),

  note: z.string().max(255).optional(),

  referenceId: z.string().cuid().optional(), // transaction ID untuk SALE_OUT
});

export const stockAdjustmentSchema = z.object({
  productId: z.string().cuid(),
  actualStock: z
    .number()
    .int('Stok aktual harus bilangan bulat')
    .min(0, 'Stok tidak boleh negatif'),
  reason: z
    .string({ required_error: 'Alasan adjustment wajib diisi' })
    .min(10, 'Alasan minimal 10 karakter')
    .max(255, 'Alasan maksimal 255 karakter'),
});

export const stockQuerySchema = z.object({
  productId: z.string().cuid().optional(),
  type: z.enum(['PRODUCTION_IN', 'PURCHASE_IN', 'SALE_OUT', 'MANUAL_OUT', 'ADJUSTMENT']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
```

---

## 10. Error Handling

```json
{
  "success": false,
  "message": "Stok tidak mencukupi",
  "code": "INSUFFICIENT_STOCK",
  "errors": {
    "productId": ["Stok tersedia: 50 kg, dibutuhkan: 100 kg"]
  }
}
```

### Error Catalog

| HTTP Status | Code | Kondisi | Pesan User |
|-------------|------|---------|------------|
| 400 | VALIDATION_ERROR | Input tidak valid | "Data yang dikirim tidak valid" |
| 409 | INSUFFICIENT_STOCK | Stok tidak mencukupi | "Stok tidak mencukupi. Tersedia: X kg" |
| 404 | PRODUCT_NOT_FOUND | Produk tidak ditemukan | "Produk tidak ditemukan" |
| 422 | NEGATIVE_STOCK | Hasil adjustment negatif | "Stok tidak bisa menjadi negatif" |
| 500 | STOCK_UPDATE_ERROR | Error saat update | "Gagal memperbarui stok. Coba lagi" |

---

## 11. Acceptance Criteria

```gherkin
Feature: Manajemen Stok Gudang

  Scenario: Input stok masuk berhasil
    Given saya login sebagai Petugas Gudang
    And terdapat produk "Tapioka Premium" dengan stok 200 kg
    When saya input stok masuk 500 kg untuk produk tersebut
    Then saldo stok produk menjadi 700 kg
    And record pergerakan stok tersimpan dengan tipe PURCHASE_IN
    And timestamp dan user tercatat

  Scenario: Tolak stok keluar melebihi stok tersedia
    Given produk "Tapioka Reguler" memiliki stok 50 kg
    When Petugas mencoba input stok keluar 100 kg
    Then sistem menampilkan error "Stok tidak mencukupi. Tersedia: 50 kg"
    And stok tidak berubah

  Scenario: Stock adjustment dengan alasan
    Given stok sistem produk adalah 200 kg
    And saat opname fisik, stok sebenarnya 185 kg
    When Petugas input adjustment dengan stok aktual 185 dan alasan "Susut penyimpanan"
    Then record adjustment -15 kg tersimpan
    And saldo stok menjadi 185 kg
    And alasan tersimpan di database

  Scenario: Alert stok kritis
    Given produk "Tapioka Premium" memiliki stok minimum 100 kg
    When stok berkurang menjadi 80 kg
    Then baris produk di-highlight merah di tabel stok
    And badge "KRITIS" ditampilkan pada produk
    And alert muncul di dashboard Owner

  Scenario: Stok berkurang otomatis saat penjualan dikonfirmasi
    Given produk "Tapioka Premium" memiliki stok 500 kg
    And terdapat transaksi penjualan 200 kg yang dikonfirmasi
    Then stok otomatis berkurang menjadi 300 kg
    And record SALE_OUT tersimpan dengan referensi transaksi
```

---

## 12. Database Design

```prisma
model StockMovement {
  id              String          @id @default(cuid())
  productId       String          @map("product_id")
  quantityChange  Decimal         @db.Decimal(10, 2) @map("quantity_change")
  movementType    MovementType    @map("movement_type")
  movementDate    DateTime        @map("movement_date")
  note            String?
  referenceId     String?         @map("reference_id")  // transaction ID / production entry ID
  createdByUserId String          @map("created_by_user_id")
  createdAt       DateTime        @default(now()) @map("created_at")

  product         Product         @relation(fields: [productId], references: [id])
  createdBy       User            @relation(fields: [createdByUserId], references: [id])

  @@index([productId])
  @@index([movementType])
  @@index([movementDate])
  @@index([createdAt])
  @@map("stock_movements")
}

// View untuk saldo stok per produk (computed)
// SELECT product_id, SUM(quantity_change) as current_stock
// FROM stock_movements
// GROUP BY product_id

enum MovementType {
  PRODUCTION_IN   // dari modul produksi
  PURCHASE_IN     // pembelian/penerimaan manual
  SALE_OUT        // pengurangan karena penjualan
  MANUAL_OUT      // pengeluaran manual
  ADJUSTMENT      // koreksi stock opname
}
```

### Current Stock View (PostgreSQL)
```sql
CREATE VIEW v_current_stock AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.minimum_stock,
  COALESCE(SUM(sm.quantity_change), 0) AS current_stock,
  CASE
    WHEN COALESCE(SUM(sm.quantity_change), 0) < p.minimum_stock THEN 'CRITICAL'
    ELSE 'NORMAL'
  END AS stock_status
FROM products p
LEFT JOIN stock_movements sm ON sm.product_id = p.id
WHERE p.is_active = true AND p.deleted_at IS NULL
GROUP BY p.id, p.name, p.minimum_stock;
```

### Index Strategy
| Kolom | Alasan |
|-------|--------|
| product_id | Saldo per produk (most common query) |
| movement_date | Range query laporan |
| movement_type | Filter per tipe |

---

## 13. Database Impact Analysis

- Tabel baru: `stock_movements`
- Saldo stok dihitung via agregasi, **bukan disimpan sebagai kolom terpisah** (event sourcing pattern)
- Keuntungan: immutable audit trail, bisa rebuild saldo kapan saja
- Pertimbangan: untuk performa pada data besar, buat `v_current_stock` view atau cache di aplikasi
- Tidak ada hard delete pada `stock_movements` — data immutable

---

## 14. API Requirements

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/stock` | Daftar stok semua produk dengan saldo terkini | ✅ | Owner, Admin, Gudang |
| GET | `/api/stock/:productId` | Saldo stok produk tertentu | ✅ | Owner, Admin, Gudang |
| POST | `/api/stock/movements` | Input pergerakan stok manual | ✅ | Petugas Gudang |
| POST | `/api/stock/adjustment` | Stock adjustment dengan alasan | ✅ | Petugas Gudang |
| GET | `/api/stock/movements` | Riwayat semua pergerakan stok | ✅ | Owner, Admin, Gudang |
| GET | `/api/stock/movements/:productId` | Riwayat per produk | ✅ | Owner, Admin, Gudang |
| GET | `/api/stock/alerts` | Daftar produk stok kritis | ✅ | Owner, Admin, Gudang |

### GET /api/stock Response
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "productId": "clxxxx",
        "productName": "Tapioka Premium 25kg",
        "currentStock": 320,
        "minimumStock": 100,
        "unit": "SAK",
        "stockStatus": "NORMAL",
        "lastMovement": "2025-01-10T09:00:00Z"
      },
      {
        "productId": "clyyy",
        "productName": "Tapioka Reguler 50kg",
        "currentStock": 45,
        "minimumStock": 80,
        "unit": "SAK",
        "stockStatus": "CRITICAL",
        "lastMovement": "2025-01-09T14:00:00Z"
      }
    ],
    "summary": {
      "totalSKU": 8,
      "criticalCount": 2,
      "totalStockValue": 48000000
    }
  }
}
```

### POST /api/stock/movements Request
```json
{
  "productId": "clxxxx",
  "quantityChange": 500,
  "type": "PURCHASE_IN",
  "movementDate": "2025-01-10",
  "note": "Pembelian dari pemasok ABC"
}
```

### POST /api/stock/adjustment Request
```json
{
  "productId": "clxxxx",
  "actualStock": 185,
  "reason": "Selisih saat opname fisik bulanan"
}
```

---

## 15. UI Components

### Stok Overview Page
```
┌────────────────────────────────────────────────────────┐
│  Manajemen Stok Gudang     [+ Stok Masuk] [🔄 Adjust] │
├────────────────────────────────────────────────────────┤
│  ⚠ 2 produk stok kritis!                              │
├────────────────────────────────────────────────────────┤
│  Produk              │ Stok   │ Min  │ Status │ Aksi   │
│  Tapioka Premium     │ 320 sak│ 100  │ ✅ OK  │ [+][-] │
│  Tapioka Reguler 🔴 │ 45 sak │ 80   │ ⚠ KRITIS│ [+][-] │
└────────────────────────────────────────────────────────┘

[Tabs: Stok Saat Ini | Riwayat Pergerakan]
```

### Riwayat Pergerakan
```
┌────────────────────────────────────────────────────┐
│  [Produk ▼] [Tipe ▼] [Dari: ____] [Sampai: ____]  │
├────────────────────────────────────────────────────┤
│  Tanggal    │ Produk    │ Tipe        │ Qty   │ By  │
│  2025-01-10 │ Tapioka P │ PURCHASE_IN │ +500  │ Ali │
│  2025-01-10 │ Tapioka R │ SALE_OUT    │ -200  │ Sys │
│  2025-01-09 │ Tapioka P │ ADJUSTMENT  │ -15   │ Ali │
└────────────────────────────────────────────────────┘
```

**Components:**
- `<StockTable>` — Tabel stok dengan highlight kritis
- `<StockMovementModal>` — Modal input stok masuk/keluar
- `<AdjustmentModal>` — Modal stock adjustment
- `<StockMovementHistory>` — Tabel riwayat dengan filter
- `<StockStatusBadge>` — NORMAL (hijau) / KRITIS (merah)
- `<CriticalStockBanner>` — Banner alert stok kritis

---

## 16. Edge Cases

| Edge Case | Kondisi | Solusi |
|-----------|---------|--------|
| Stok 0 saat adjustment negatif | Stok sistem 0, input aktual lebih rendah | Tidak mungkin karena 0 adalah minimum |
| Race condition stok | 2 penjualan bersamaan kurangi stok sama | Database transaction + SELECT FOR UPDATE |
| Produksi dicatat, stok otomatis masuk | Modul produksi trigger stock movement | Event-driven atau service call |
| Pembatalan penjualan | Stok sudah berkurang | Buat MANUAL_IN record untuk reverse |
| Adjustment ke nol | Stok aktual 0 | Valid — buat adjustment negatif penuh |
| Quantity desimal | Produk dalam kg (ada 0.5 kg) | Decimal(10,2) di database |

---

## 17. Security Requirements

- RBAC: Petugas Gudang bisa CUD stock movements; Owner dan Admin hanya R
- Semua movements mencatat `createdByUserId` untuk audit
- Record tidak bisa diedit atau dihapus (append-only)
- Validasi server-side: stok tidak boleh negatif

---

## 18. Testing Strategy

```typescript
// Unit Tests
describe('StockService', () => {
  it('calculateCurrentStock returns correct sum', async () => {});
  it('rejects deduction when insufficient stock', async () => {});
  it('adjustment creates correct negative/positive movement', async () => {});
  it('marks product as CRITICAL when below minimum', async () => {});
});

// Integration Tests
describe('POST /api/stock/movements', () => {
  it('creates PURCHASE_IN movement and updates balance', async () => {});
  it('rejects SALE_OUT exceeding available stock', async () => {});
  it('adjustment with reason creates ADJUSTMENT record', async () => {});
});

// E2E
test('Petugas Gudang input stok masuk berhasil', async ({ page }) => {});
test('Alert stok kritis muncul setelah stok di bawah minimum', async ({ page }) => {});
```

---

## 19. DevOps & Deployment

```env
STOCK_CRITICAL_CHECK_INTERVAL_MS=60000  # Check setiap 1 menit
```

### Database Optimization
- Pertimbangkan partial index: `WHERE deleted_at IS NULL`
- Monitoring query plan untuk `SUM(quantity_change)` dengan data besar
- Scheduled job untuk archive movements > 2 tahun ke tabel arsip

---

## 20. Definition of Done

```markdown
- [ ] Input stok masuk manual selesai
- [ ] Input stok keluar manual selesai
- [ ] Stock adjustment dengan alasan selesai
- [ ] Saldo stok real-time dari agregasi selesai
- [ ] Alert stok kritis (highlight + banner) selesai
- [ ] Riwayat pergerakan dengan filter selesai
- [ ] Auto-deduct stok saat penjualan selesai
- [ ] Auto-add stok dari produksi selesai
- [ ] Validasi stok tidak negatif selesai
- [ ] API endpoints semua selesai
- [ ] Race condition handling (DB transaction) selesai
- [ ] Unit test StockService coverage > 80%
- [ ] E2E test stok masuk/keluar/adjustment selesai
- [ ] RBAC ditest: Petugas Gudang CUD, Owner R
- [ ] Deploy staging berhasil
- [ ] QA sign-off
```

---

*Dokumen ini adalah PRD/SRS resmi untuk Fitur Manajemen Stok Gudang CV TapioLeaf Management System.*
*Versi: 1.0.0 | Status: Draft | Last Updated: 2025-01-01*
