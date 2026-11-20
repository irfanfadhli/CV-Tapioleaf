# FEATURE PRD / SRS
# CV TapioLeaf Management System
# Fitur: Modul Penjualan

**Versi:** 1.0.0
**Tanggal:** 2025-01-01
**Status:** Draft
**Author:** Tim Produk CV TapioLeaf

---

## 1. Feature Overview

### 1.1 Latar Belakang

Modul Penjualan mencatat transaksi penjualan produk tepung tapioka dari CV TapioLeaf kepada pembeli. Setiap transaksi terdiri atas beberapa karung produk yang ditimbang secara manual per karung, sehingga berat kotor total merupakan akumulasi dari berat masing-masing karung, bukan hasil kali jumlah karung dengan berat standar. Modul ini melengkapi alur bisnis yang sudah berjalan pada Penerimaan Singkong, Produksi Harian, dan Gudang, tanpa mengubah struktur ketiganya.

> **Note:** Dokumen ini mengikuti stack teknis aktual proyek — **SvelteKit** (frontend + backend), **Drizzle ORM**, **PostgreSQL (NeonDB)**, **Zod**, dan **shadcn-svelte** — konsisten dengan modul-modul lain yang sudah diimplementasikan (Authentication, Dashboard, Manajemen Produk, Stok Gudang, Produksi Harian, Penerimaan Singkong).

### 1.2 Masalah yang Diselesaikan

| No | Masalah | Dampak |
|----|---------|--------|
| 1 | Pencatatan penjualan masih di atas nota kertas | Rawan kesalahan hitung dan kehilangan arsip |
| 2 | Perhitungan tara per karung dan biaya kuli manual | Sering terjadi selisih total bayar |
| 3 | Tidak terhubung dengan data stok gudang | Stok produk jadi tidak berkurang otomatis saat penjualan |
| 4 | Tidak ada riwayat transaksi digital | Sulit melacak histori penjualan per pembeli |
| 5 | Tidak ada validasi stok sebelum penjualan | Risiko menjual melebihi stok tersedia |

### 1.3 Tujuan Fitur

- Mendigitalkan pencatatan transaksi penjualan beserta rincian berat per karung
- Mengotomatisasi perhitungan berat bersih, total harga, biaya kuli, dan total bayar
- Mengintegrasikan pengurangan stok produk jadi ke `stock_movements` secara otomatis saat transaksi dikonfirmasi
- Menyediakan riwayat dan ringkasan penjualan untuk kebutuhan owner dan admin penjualan
- Memvalidasi ketersediaan stok sebelum transaksi dapat dikonfirmasi

### 1.4 Scope Fitur

#### In Scope
- Input transaksi penjualan baru (header + detail berat per karung)
- Perhitungan otomatis berat bersih, total harga, biaya kuli, dan total bayar (client-side live preview + server-side authoritative)
- Status transaksi: Draft → Confirmed (dan Cancelled untuk pembatalan)
- Riwayat transaksi penjualan dengan filter (pencarian, status, tanggal), sorting, dan pagination
- Integrasi pengurangan stok ke modul Gudang via `stock_movements` (tipe `SALE_OUT`)
- Ringkasan penjualan bulanan (jumlah transaksi, total pendapatan, total berat, draft pending)

#### Out of Scope (fase ini)
- Perubahan struktur tabel Penerimaan Singkong, Gudang, atau Produksi Harian
- Invoice/nota cetak otomatis (pengembangan lanjutan)
- Pembayaran online melalui Xendit (transaksi ini bersifat penjualan luring/manual)
- Multi-produk dalam satu nota (satu transaksi = satu jenis produk)
- Manajemen data pembeli (buyer) sebagai entitas terpisah

### 1.5 Business Impact

- **Akurasi:** Perhitungan berat bersih dan total bayar otomatis, menghilangkan human error
- **Efisiensi:** Stok otomatis terpotong saat penjualan dikonfirmasi, tanpa input ganda
- **Visibility:** Owner dapat melihat ringkasan penjualan bulanan secara real-time
- **Audit Trail:** Setiap transaksi dan pengurangan stok tercatat dengan user dan timestamp

### 1.6 Success Metrics

| Metric | Target |
|--------|--------|
| Akurasi perhitungan | Input 35 karung bervariasi = gross_weight sama dengan penjumlahan manual |
| Integrasi stok | Stok berkurang otomatis saat confirm, selisih 0% |
| Waktu input transaksi | < 2 menit per transaksi (termasuk input berat semua karung) |
| Data integrity | 100% transaksi confirmed memiliki stock_movement terkait |

### 1.7 Keputusan Desain

> Menjawab pertanyaan terbuka dari draft awal:

| Pertanyaan | Keputusan | Alasan |
|-----------|-----------|--------|
| Satu transaksi untuk satu atau multi-produk? | **Satu produk per transaksi** | Sesuai praktik luring: satu nota = satu jenis produk. Field `product_id` ada di tabel `sales` |
| `taraPerSack` dan `kuliFeePerSack` global atau per transaksi? | **Per transaksi** (dengan default) | Disimpan di kolom `tara_per_sack` dan `kuli_fee_per_sack` pada tabel `sales`. Default: tara 2 kg, kuli Rp 3.000 |

---

## 2. User Story

### US-SALE-001
```
As an Admin Penjualan
I want membuat transaksi penjualan baru dengan input berat per karung
So that total berat, harga, dan biaya kuli dihitung otomatis
```
**Priority:** Critical
**Acceptance Notes:** Pilih produk, input nama pembeli, tambahkan berat tiap karung satu per satu. Perhitungan real-time di form.

---

### US-SALE-002
```
As an Admin Penjualan
I want menyimpan transaksi sebagai draft terlebih dahulu
So that saya bisa mengedit sebelum mengkonfirmasi
```
**Priority:** Critical
**Acceptance Notes:** Transaksi draft bisa diedit (ubah karung, harga, pembeli) dan dihapus.

---

### US-SALE-003
```
As an Admin Penjualan
I want mengkonfirmasi transaksi draft
So that stok gudang otomatis berkurang
```
**Priority:** Critical
**Acceptance Notes:** Validasi stok cukup sebelum confirm. Insert `stock_movements` tipe `SALE_OUT`.

---

### US-SALE-004
```
As an Admin Penjualan
I want mencari dan memfilter riwayat transaksi
So that saya bisa menemukan transaksi tertentu dengan cepat
```
**Priority:** High
**Acceptance Notes:** Filter: pencarian nama pembeli/nomor nota, status (all/draft/confirmed/cancelled), sorting, pagination.

---

### US-SALE-005
```
As an Owner
I want melihat ringkasan penjualan bulanan
So that saya mengetahui performa penjualan perusahaan
```
**Priority:** High
**Acceptance Notes:** Tampilkan: jumlah transaksi bulan ini, total pendapatan, total berat, dan jumlah draft pending.

---

### US-SALE-006
```
As an Admin Penjualan
I want melihat detail lengkap transaksi termasuk berat per karung
So that saya bisa memverifikasi data transaksi
```
**Priority:** High
**Acceptance Notes:** Halaman detail menampilkan semua info header + daftar berat per karung.

---

### US-SALE-007
```
As a Petugas Gudang
I want melihat riwayat pengurangan stok akibat penjualan
So that saya tahu kapan dan berapa stok yang keluar dari gudang
```
**Priority:** Medium
**Acceptance Notes:** Record `SALE_OUT` di modul Gudang dengan referensi ke `sale.id`.

---

### US-SALE-008
```
As an Admin Penjualan
I want menghapus transaksi draft yang salah
So that data penjualan tetap bersih
```
**Priority:** Medium
**Acceptance Notes:** Hanya draft yang bisa dihapus. Sale items (karung) ikut terhapus (cascade).

---

## 3. Use Case Description

### UC-SALE-001: Buat Transaksi Penjualan Baru

| Elemen | Detail |
|--------|--------|
| **Use Case ID** | UC-SALE-001 |
| **Nama** | Buat Transaksi Penjualan Baru |
| **Actor** | Admin Penjualan |
| **Preconditions** | Admin sudah login; minimal 1 produk aktif ada di sistem |
| **Trigger** | Admin klik tombol "+ Transaksi Baru" |

**Main Flow:**
1. Admin klik "+ Transaksi Baru", modal form terbuka
2. Admin memilih produk dari dropdown (hanya produk aktif)
3. Harga per kg otomatis terisi dari harga produk (bisa diubah)
4. Admin input nama pembeli
5. Admin input tanggal penjualan (default: hari ini)
6. Admin input tara per karung (default: 2 kg) dan biaya kuli per karung (default: Rp 3.000)
7. Admin input berat karung satu per satu, bisa tambah/hapus karung
8. Sistem menghitung `grossWeight`, `netWeight`, `totalCost`, `kuliFee`, `totalPayment` secara real-time
9. Admin klik "Simpan Draft" atau "Simpan & Konfirmasi"
10. Sistem validasi input via Zod (server-side)
11. Sistem hitung ulang semua nilai di server (tidak mempercayai client)
12. Jika "Simpan & Konfirmasi": cek stok cukup, insert `stock_movements`
13. Record `sales` + `sale_items` tersimpan di database
14. Toast sukses muncul, tabel refresh

**Alternative Flow:**
- **AF-1:** Admin memilih produk → harga otomatis berubah mengikuti `products.price`
- **AF-2:** Admin langsung confirm → cek stok terlebih dahulu

**Exception Flow:**

| Kode | Kondisi | Respon Sistem |
|------|---------|---------------|
| EX-1 | Produk tidak ditemukan | "Produk tidak ditemukan" |
| EX-2 | Stok tidak cukup saat confirm | "Stok tidak mencukupi. Tersedia: X kg, dibutuhkan: Y kg" |
| EX-3 | Berat karung ≤ 0 | "Berat karung harus > 0" |
| EX-4 | Harga per kg ≤ 0 | "Harga per kg harus > 0" |
| EX-5 | Tidak ada karung | "Minimal 1 karung" |

---

### UC-SALE-002: Konfirmasi Transaksi Draft

| Elemen | Detail |
|--------|--------|
| **Use Case ID** | UC-SALE-002 |
| **Nama** | Konfirmasi Transaksi Draft |
| **Actor** | Admin Penjualan |
| **Preconditions** | Transaksi berstatus `draft`; stok cukup |

**Main Flow:**
1. Admin klik tombol "Konfirmasi" pada transaksi draft
2. Sistem cek status transaksi = `draft`
3. Sistem cek stok produk ≥ `netWeight` via `getCurrentStock()`
4. Sistem update `status` → `confirmed`
5. Sistem insert `stock_movements` tipe `SALE_OUT` dengan `referenceId` = `sale.id`
6. Toast "Transaksi berhasil dikonfirmasi"

**Exception Flow:**

| Kode | Kondisi | Respon Sistem |
|------|---------|---------------|
| EX-1 | Transaksi bukan draft | "Hanya transaksi draft yang dapat dikonfirmasi" |
| EX-2 | Stok tidak cukup | "Stok tidak mencukupi. Tersedia: X kg, dibutuhkan: Y kg" |

---

### UC-SALE-003: Edit Transaksi Draft

| Elemen | Detail |
|--------|--------|
| **Use Case ID** | UC-SALE-003 |
| **Nama** | Edit Transaksi Draft |
| **Actor** | Admin Penjualan |
| **Preconditions** | Transaksi berstatus `draft` |

**Main Flow:**
1. Admin membuka halaman detail transaksi
2. Admin mengubah field yang diperlukan (pembeli, produk, karung, harga, tara, biaya kuli)
3. Jika karung berubah: sistem hapus semua `sale_items` lama, insert baru, recalculate semua nilai
4. Sistem update record `sales`
5. Toast "Transaksi berhasil diperbarui"

**Business Rule:** Transaksi confirmed tidak dapat diedit.

---

## 4. Functional Requirements

| ID | Requirement | Description | Actor | Validasi |
|----|-------------|-------------|-------|----------|
| FR-SALE-001 | Buat Transaksi | Form input penjualan dengan detail berat per karung | Admin Penjualan | Minimal 1 karung, berat > 0, harga > 0 |
| FR-SALE-002 | Perhitungan Real-time | Client menghitung preview; server menghitung final authoritative | Sistem | Formula bisnis sesuai §6 |
| FR-SALE-003 | Nomor Nota Otomatis | Generate `sale_number` format `SALE-YYYYMMDD-NNN` | Sistem | Unik per hari, auto-increment |
| FR-SALE-004 | Status Draft/Confirmed | Transaksi disimpan sebagai draft atau langsung confirmed | Admin Penjualan | Draft bisa edit/hapus, confirmed tidak |
| FR-SALE-005 | Validasi Stok | Cek ketersediaan stok sebelum confirm | Sistem | `getCurrentStock() >= netWeight` |
| FR-SALE-006 | Auto Deduct Stok | Insert `stock_movements` tipe `SALE_OUT` saat confirmed | Sistem | Atomic dengan update status |
| FR-SALE-007 | Edit Draft | Edit seluruh field transaksi draft, recalculate jika karung berubah | Admin Penjualan | Status harus `draft` |
| FR-SALE-008 | Hapus Draft | Hapus transaksi draft beserta sale_items (cascade) | Admin Penjualan | Status harus `draft` |
| FR-SALE-009 | Riwayat Transaksi | List transaksi dengan search, filter status, sorting, pagination | Admin, Owner | Server-side pagination |
| FR-SALE-010 | Detail Transaksi | Halaman detail dengan info lengkap + daftar berat per karung | Admin, Owner | Join ke products |
| FR-SALE-011 | Ringkasan Bulanan | Total transaksi, pendapatan, berat, dan draft count bulan ini | Owner, Admin | Aggregation query |
| FR-SALE-012 | Default Konfigurabel | Tara per karung (default 2 kg) dan biaya kuli (default Rp 3.000) dapat diubah per transaksi | Admin Penjualan | Stored per transaksi |

---

## 5. Non-Functional Requirements

### Performance
| Requirement | Target |
|-------------|--------|
| Load daftar penjualan | < 1 detik untuk 100 transaksi |
| Input transaksi baru | < 500ms response time |
| Kalkulasi live di form | Immediate (derived state, no delay) |
| Summary aggregation | < 1 detik |

### Data Integrity
- Perhitungan dilakukan di sisi server (bukan hanya client-side) untuk mencegah manipulasi angka
- Operasi confirm bersifat atomik — update status penjualan dan insert `stock_movements` harus berhasil bersama atau gagal bersama
- Transaksi confirmed tidak dapat diedit, hanya dapat dihapus jika dibatalkan (status `cancelled`)

### Reliability
- Validasi menggunakan Zod, konsisten dengan modul lain (Cassava, Stok, Produksi)
- Form validation client-side sebagai UX enhancement, server-side sebagai gatekeeper

---

## 6. Business Rules

| BR-ID | Rule | Description |
|-------|------|-------------|
| BR-SALE-001 | Formula Berat Bersih | `grossWeight = Σ(berat tiap karung)` ; `netWeight = grossWeight - (sackCount × taraPerSack)` |
| BR-SALE-002 | Formula Total Bayar | `totalCost = netWeight × pricePerKg` ; `kuliFee = sackCount × kuliFeePerSack` ; `totalPayment = totalCost - kuliFee` |
| BR-SALE-003 | Server-side Calc | Semua nilai dihitung ulang di server; nilai dari client tidak dipercaya |
| BR-SALE-004 | Stok Harus Cukup | Stok harus ≥ `netWeight` sebelum transaksi bisa di-confirm |
| BR-SALE-005 | Draft Editable | Hanya transaksi draft yang bisa diedit dan dihapus |
| BR-SALE-006 | Confirmed Immutable | Transaksi confirmed tidak bisa diedit langsung dari form |
| BR-SALE-007 | Auto Stock Deduct | Konfirmasi penjualan otomatis membuat record `SALE_OUT` di `stock_movements` |
| BR-SALE-008 | Satu Produk | Satu transaksi hanya untuk satu jenis produk |
| BR-SALE-009 | Nota Unik | `sale_number` di-generate otomatis, unik per hari |
| BR-SALE-010 | Config Per Transaksi | `taraPerSack` dan `kuliFeePerSack` disimpan per transaksi (bukan global) |
| BR-SALE-011 | Rounding | Semua nilai desimal dibulatkan ke 2 angka di belakang koma |

### Formula Bisnis (Detail)
```
grossWeight   = Σ (berat setiap karung yang ditimbang manual)
netWeight     = grossWeight - (jumlahKarung × taraPerKarung)
totalCost     = netWeight × pricePerKg
kuliFee       = jumlahKarung × biayaKuliPerKarung   // default Rp 3.000/karung
totalPayment  = totalCost - kuliFee
```

Catatan: `taraPerKarung` (default 2 kg) dan `biayaKuliPerKarung` (default Rp 3.000) bersifat konfigurable per transaksi, karena berpotensi berbeda tergantung jenis kemasan atau kesepakatan dengan pembeli.

---

## 7. User Flow

### Buat Transaksi Penjualan — Success Flow
```
1. Admin Penjualan klik "+ Transaksi Baru"
2. Modal form terbuka
3. Pilih produk dari dropdown (hanya produk aktif)
4. Harga per kg otomatis terisi dari products.price
5. Input nama pembeli: "Toko Makmur"
6. Input tanggal: 2025-01-10
7. Tara per karung: 2 kg (default)
8. Biaya kuli per karung: Rp 3.000 (default)
9. Input berat karung 1: 52.5 kg → klik "+ Karung"
10. Input berat karung 2: 51.0 kg → klik "+ Karung"
11. Input berat karung 3: 53.2 kg
12. Live calculation:
    - Gross Weight: 156.7 kg (52.5 + 51.0 + 53.2)
    - Net Weight: 150.7 kg (156.7 - 3×2)
    - Total Cost: 150.7 × harga
    - Kuli Fee: 3 × 3000 = Rp 9.000
    - Total Payment: totalCost - 9000
13. Klik "Simpan Draft"
14. POST form action → Zod validation → server recalculate
15. Record sales + 3 sale_items tersimpan (status: draft)
16. Toast "Transaksi berhasil dibuat"
17. Tabel refresh, transaksi baru muncul di list
```

### Konfirmasi Transaksi — Flow
```
1. Admin klik "Konfirmasi" pada transaksi draft
2. Sistem cek status = 'draft' ✅
3. Sistem cek getCurrentStock(productId) >= netWeight ✅
4. UPDATE sales SET status = 'confirmed'
5. INSERT stock_movements (SALE_OUT, -netWeight, referenceId=sale.id)
6. Toast "Transaksi berhasil dikonfirmasi"
7. Tombol edit/hapus hilang pada transaksi tersebut
8. Di modul Gudang, stok produk berkurang otomatis
```

### Hapus Transaksi Draft — Flow
```
1. Admin klik "Hapus" pada transaksi draft
2. Dialog konfirmasi muncul
3. Admin klik "Ya, Hapus"
4. Sistem cek status = 'draft'
5. DELETE sale_items WHERE sale_id = X (cascade)
6. DELETE sales WHERE id = X
7. Toast "Transaksi berhasil dihapus"
```

### Filter & Cari Transaksi — Flow
```
1. Admin ketik nama pembeli di search box
2. Debounce 300ms → URL param search=X
3. Tabel reload dengan hasil pencarian
4. Admin pilih filter status: "confirmed"
5. URL param status=confirmed
6. Tabel reload hanya menampilkan transaksi confirmed
7. Pagination tersedia jika hasil > 20 per halaman
```

---

## 8. Data Flow

### Buat Transaksi Penjualan
```
Browser
  └─► POST form action /?/create
        │  FormData: buyerName, productId, sackWeights (JSON array),
        │            taraPerSack, pricePerKg, kuliFeePerSack, saleDate, status
        ▼
  +page.server.ts (actions.create)
        │  Parse sackWeights dari JSON string
        ▼
  salesService.createSale(input, userId)
        │
        ├─► Zod validation (createSaleSchema)
        ├─► generateSaleNumber() → "SALE-20250110-001"
        ├─► calculateSale(sackWeights, tara, price, kuli) → server-side calc
        ├─► db.select(products) → validasi produk exists
        ├─► [If confirmed] getCurrentStock(productId) → validasi stok
        ├─► db.insert(sales).values({...}).returning()
        ├─► db.insert(saleItems).values({sack_index, sack_weight}) × N karung
        └─► [If confirmed] db.insert(stockMovements).values({SALE_OUT, -netWeight})
              │
              ▼
        Response: { success: true, message: "Transaksi berhasil dibuat" }
```

### Konfirmasi Transaksi
```
Browser
  └─► POST form action /?/confirm
        │  FormData: saleId
        ▼
  +page.server.ts (actions.confirm)
        ▼
  salesService.confirmSale(saleId, userId)
        │
        ├─► db.select(sales).where(id = saleId) → fetch transaksi
        ├─► Validasi status === 'draft'
        ├─► getCurrentStock(productId) → cek stok
        ├─► db.update(sales).set({ status: 'confirmed' })
        └─► db.insert(stockMovements).values({ SALE_OUT, -netWeight, referenceId: saleId })
              │
              ▼
        Response: { success: true, message: "Transaksi berhasil dikonfirmasi" }
```

### Load Daftar Penjualan
```
Browser GET /sales?search=&status=&page=&sort=&order=
  └─► +page.server.ts (load)
        │
        ├─► salesService.listSales(query) → paginated list + join products
        ├─► salesService.getSalesSummary() → monthly aggregation
        └─► db.select(products).where(isActive, !deleted) → dropdown options
              │
              ▼
        Return { items, pagination, summary, products, query, sort, order }
```

---

## 9. Validation Rules

```typescript
// src/lib/server/sales/validation.ts
import { z } from 'zod';

export const saleStatusEnum = ['draft', 'confirmed', 'cancelled'] as const;

export const createSaleSchema = z.object({
  buyerName: z.string().min(1, 'Nama pembeli wajib diisi'),
  productId: z.string().min(1, 'Produk wajib dipilih'),
  sackWeights: z.array(
    z.coerce.number().positive('Berat karung harus > 0')
  ).min(1, 'Minimal 1 karung'),
  taraPerSack: z.coerce
    .number()
    .min(0, 'Tara tidak boleh negatif')
    .default(2),
  pricePerKg: z.coerce
    .number()
    .positive('Harga per kg harus > 0'),
  kuliFeePerSack: z.coerce
    .number()
    .min(0, 'Biaya kuli tidak boleh negatif')
    .default(3000),
  saleDate: z.string().optional(),
  status: z.enum(['draft', 'confirmed']).default('draft')
});

export const updateSaleSchema = z.object({
  buyerName: z.string().min(1, 'Nama pembeli wajib diisi').optional(),
  productId: z.string().min(1, 'Produk wajib dipilih').optional(),
  sackWeights: z.array(
    z.coerce.number().positive('Berat karung harus > 0')
  ).min(1, 'Minimal 1 karung').optional(),
  taraPerSack: z.coerce.number().min(0).optional(),
  pricePerKg: z.coerce.number().positive().optional(),
  kuliFeePerSack: z.coerce.number().min(0).optional(),
  saleDate: z.string().optional()
});

export const salesQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['all', ...saleStatusEnum]).default('all'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['sale_date', 'created_at', 'total_payment', 'buyer_name']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc')
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
export type SalesQuery = z.infer<typeof salesQuerySchema>;
```

### Validation Summary

| Field | Rule |
|-------|------|
| `buyerName` | required, min 1 karakter |
| `productId` | required, harus merujuk ke produk aktif |
| `sackWeights` | required, array min 1 elemen, setiap elemen > 0 |
| `taraPerSack` | ≥ 0, default 2 |
| `pricePerKg` | required, > 0 |
| `kuliFeePerSack` | ≥ 0, default 3000 |
| `saleDate` | optional, default hari ini |
| `status` | enum: draft / confirmed |

---

## 10. Error Handling

```json
{
  "type": "failure",
  "status": 400,
  "data": {
    "message": "Stok tidak mencukupi. Tersedia: 50 kg, dibutuhkan: 100 kg"
  }
}
```

### Error Catalog

| HTTP Status | Kondisi | Pesan User |
|-------------|---------|------------|
| 400 | Zod validation gagal | Pesan sesuai field (e.g. "Nama pembeli wajib diisi") |
| 400 | Produk tidak ditemukan | "Produk tidak ditemukan" |
| 400 | Stok tidak mencukupi saat confirm | "Stok tidak mencukupi. Tersedia: X kg, dibutuhkan: Y kg" |
| 400 | Transaksi bukan draft (saat edit/hapus/confirm) | "Hanya transaksi draft yang dapat diedit/dikonfirmasi/dihapus" |
| 400 | Format sackWeights tidak valid | "Format berat karung tidak valid" |
| 400 | Sale ID kosong | "ID transaksi tidak valid" |
| 500 | Server error | "Gagal membuat transaksi" / "Gagal mengkonfirmasi" / "Gagal menghapus" |

### UX Error Handling
- Validation error dari Zod ditampilkan per-field di form (client-side)
- Server error dikembalikan sebagai `fail(400, { message })` via SvelteKit form actions
- Semua error ditampilkan sebagai toast notification via `svelte-sonner`
- List/detail page menampilkan loading skeleton saat data dimuat

---

## 11. Acceptance Criteria

```gherkin
Feature: Modul Penjualan

  Scenario: Input transaksi penjualan baru sebagai draft
    Given saya login sebagai Admin Penjualan
    And terdapat produk "Tapioka Premium" yang aktif
    When saya membuat transaksi baru dengan:
      | pembeli       | Toko Makmur                |
      | produk        | Tapioka Premium            |
      | berat karung  | [52.5, 51.0, 53.2]         |
      | tara/karung   | 2 kg                       |
      | harga/kg      | Rp 5.000                   |
      | biaya kuli    | Rp 3.000/karung            |
      | status        | draft                      |
    Then gross_weight = 156.70 kg (52.5 + 51.0 + 53.2)
    And net_weight = 150.70 kg (156.70 - 3×2)
    And total_cost = Rp 753.500 (150.70 × 5000)
    And kuli_fee = Rp 9.000 (3 × 3000)
    And total_payment = Rp 744.500 (753500 - 9000)
    And sale_number ter-generate otomatis
    And 3 sale_items tersimpan di database
    And status transaksi = 'draft'

  Scenario: Input 35 karung bervariasi menghasilkan gross_weight akurat
    Given saya login sebagai Admin Penjualan
    When saya input 35 karung dengan berat bervariasi (45-55 kg)
    Then gross_weight sama persis dengan penjumlahan manual ke-35 karung
    And net_weight = gross_weight - (35 × taraPerSack)

  Scenario: Konfirmasi transaksi draft dengan stok cukup
    Given terdapat transaksi draft untuk "Tapioka Premium"
    And net_weight transaksi = 150.70 kg
    And stok produk "Tapioka Premium" = 500 kg
    When Admin mengkonfirmasi transaksi
    Then status berubah menjadi 'confirmed'
    And record SALE_OUT -150.70 kg tersimpan di stock_movements
    And stok produk berkurang menjadi 349.30 kg

  Scenario: Tolak konfirmasi saat stok tidak cukup
    Given terdapat transaksi draft dengan net_weight = 200 kg
    And stok produk tersedia hanya 50 kg
    When Admin mencoba mengkonfirmasi
    Then sistem menampilkan error "Stok tidak mencukupi. Tersedia: 50 kg, dibutuhkan: 200 kg"
    And status tetap 'draft'
    And stok tidak berubah

  Scenario: Transaksi confirmed tidak dapat diedit
    Given terdapat transaksi berstatus 'confirmed'
    When Admin mencoba mengedit transaksi
    Then sistem menampilkan error "Hanya transaksi draft yang dapat diedit"

  Scenario: Tara dan biaya kuli dapat diubah dari default
    Given default tara = 2 kg dan biaya kuli = Rp 3.000
    When Admin membuat transaksi dengan tara = 2.5 kg dan biaya kuli = Rp 2.500
    Then net_weight dihitung menggunakan tara 2.5 kg
    And kuli_fee dihitung menggunakan Rp 2.500/karung
    And nilai custom tersimpan di kolom transaksi (bukan global setting)

  Scenario: Hapus transaksi draft
    Given terdapat transaksi berstatus 'draft'
    When Admin menghapus transaksi
    Then transaksi terhapus dari database
    And sale_items terkait juga terhapus (cascade)
    And stok tidak terpengaruh (karena belum confirmed)

  Scenario: Filter riwayat penjualan
    Given terdapat 50 transaksi penjualan
    When Admin memfilter dengan status = 'confirmed' dan search = 'Makmur'
    Then hanya transaksi confirmed dengan buyer_name mengandung 'Makmur' yang ditampilkan
    And pagination tersedia
```

---

## 12. Database Design

### Tabel `sales` (header transaksi)

```typescript
// src/lib/server/db/schema/sales.ts
import { pgTable, text, decimal, timestamp, index, integer } from 'drizzle-orm/pg-core';
import { products } from './product';

export const sales = pgTable('sales', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  buyer_name: text('buyer_name'),
  product_id: text('product_id').references(() => products.id),
  sale_number: text('sale_number'),
  tara_per_sack: decimal('tara_per_sack', { precision: 10, scale: 2 }),
  gross_weight: decimal('gross_weight', { precision: 15, scale: 2 }),
  net_weight: decimal('net_weight', { precision: 15, scale: 2 }),
  price_per_kg: decimal('price_per_kg', { precision: 15, scale: 2 }),
  kuli_fee_per_sack: decimal('kuli_fee_per_sack', { precision: 10, scale: 2 }).default('3000'),
  total_cost: decimal('total_cost', { precision: 15, scale: 2 }),
  total_payment: decimal('total_payment', { precision: 15, scale: 2 }),
  status: text('status', {
    enum: ['draft', 'confirmed', 'cancelled']
  }).default('draft').notNull(),
  sale_date: timestamp('sale_date', { withTimezone: true }),
  created_by: text('created_by'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [
  index('sales_buyer_idx').on(table.buyer_name),
  index('sales_product_idx').on(table.product_id),
  index('sales_sale_idx').on(table.sale_number)
]);
```

### Tabel `sale_items` (detail timbangan per karung)

```typescript
export const saleItems = pgTable('sale_items', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  sale_id: text('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
  sack_index: integer('sack_index').notNull(),
  sack_weight: decimal('sack_weight', { precision: 10, scale: 2 }).notNull()
}, (table) => [
  index('sale_items_sale_idx').on(table.sale_id)
]);
```

### Integrasi dengan `stock_movements` (sudah ada)

```typescript
// src/lib/server/db/schema/stock.ts — tabel existing, TIDAK dimodifikasi
export const stockMovements = pgTable('stock_movements', {
  id: text('id').$defaultFn(() => crypto.randomUUID()).primaryKey(),
  productId: text('product_id').notNull().references(() => products.id),
  quantityChange: decimal('quantity_change', { precision: 10, scale: 2 }).notNull(),
  movementType: text('movement_type', {
    enum: ['PURCHASE_IN', 'MANUAL_IN', 'MANUAL_OUT', 'ADJUSTMENT', 'SALE_OUT']
  }).notNull(),
  movementDate: timestamp('movement_date', { withTimezone: true }).defaultNow().notNull(),
  note: text('note'),
  reason: text('reason'),
  referenceId: text('reference_id'),  // → sale.id untuk SALE_OUT
  createdByUserId: text('created_by_user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
```

### Column Mapping

| Kolom PRD (Draft) | Kolom Implementasi | Keterangan |
|---|---|---|
| id (UUID PK) | `id` (text, randomUUID) | ✅ |
| sale_number (varchar) | `sale_number` (text) | Auto-generated: `SALE-YYYYMMDD-NNN` |
| buyer_name (varchar) | `buyer_name` (text) | ✅ |
| product_id (FK → products) | `product_id` (text, FK) | ✅ |
| sack_count (integer) | — | Tidak disimpan; dihitung dari `sale_items.length` |
| tara_per_sack (numeric) | `tara_per_sack` (decimal 10,2) | Default: 2 |
| gross_weight (numeric) | `gross_weight` (decimal 15,2) | Σ sack_weights |
| net_weight (numeric) | `net_weight` (decimal 15,2) | Computed server-side |
| price_per_kg (numeric) | `price_per_kg` (decimal 15,2) | ✅ |
| kuli_fee_per_sack (numeric) | `kuli_fee_per_sack` (decimal 10,2) | Default: 3000 |
| total_cost (numeric) | `total_cost` (decimal 15,2) | Computed server-side |
| total_payment (numeric) | `total_payment` (decimal 15,2) | Computed server-side |
| status (enum) | `status` (text enum) | draft / confirmed / cancelled |
| sale_date (date) | `sale_date` (timestamp tz) | ✅ |
| created_by (FK → users) | `created_by` (text) | ✅ |
| deleted_at (soft delete) | — | Tidak diimplementasikan; draft langsung hard delete |
| created_at, updated_at | `created_at`, `updated_at` (timestamp tz) | ✅ |

---

## 13. Database Impact Analysis

- **Tabel baru:** `sales`, `sale_items`
- **Tabel existing yang digunakan (tidak dimodifikasi):** `stock_movements` (tipe `SALE_OUT`), `products` (join untuk nama produk)
- **Relasi:** `sales.product_id → products.id`, `sale_items.sale_id → sales.id` (cascade delete)
- **Index:** `buyer_name`, `product_id`, `sale_number` pada tabel `sales`; `sale_id` pada tabel `sale_items`
- **Soft delete:** Tidak digunakan pada transaksi — draft langsung hard delete, confirmed bersifat immutable
- **Migration:** Dilakukan via Drizzle Kit (`npx drizzle-kit push` atau `generate` + `migrate`)

---

## 14. API Requirements

Modul ini menggunakan **SvelteKit form actions** (bukan REST API endpoint terpisah), konsisten dengan pola yang digunakan di modul lainnya.

### Page Routes

| Route | File | Fungsi |
|-------|------|--------|
| `/sales` | `src/routes/(app)/sales/+page.svelte` | List transaksi, create modal, confirm/delete actions |
| `/sales` | `src/routes/(app)/sales/+page.server.ts` | Load data + form actions (create, confirm, delete) |
| `/sales/[id]` | `src/routes/(app)/sales/[id]/+page.svelte` | Detail transaksi + daftar berat karung |
| `/sales/[id]` | `src/routes/(app)/sales/[id]/+page.server.ts` | Load detail transaksi |

### Form Actions

| Action | Method | Description | Auth |
|--------|--------|-------------|------|
| `?/create` | POST | Buat transaksi baru (draft atau confirmed) | Owner, Admin Penjualan |
| `?/confirm` | POST | Konfirmasi transaksi draft + deduct stok | Owner, Admin Penjualan |
| `?/delete` | POST | Hapus transaksi draft | Owner, Admin Penjualan |

### Load Function

```typescript
// +page.server.ts (load)
export const load: PageServerLoad = async (event) => {
  const query = Object.fromEntries(event.url.searchParams);
  const [result, summary, activeProducts] = await Promise.all([
    salesService.listSales(query),
    salesService.getSalesSummary(),
    db.select({ id, name, code, price, unit })
      .from(products)
      .where(and(isActive, !deletedAt))
      .orderBy(asc(name))
  ]);
  return { items, pagination, summary, products, query, sort, order };
};
```

### Service Layer Functions

| Function | Description | Returns |
|----------|-------------|---------|
| `createSale(input, userId)` | Buat transaksi + sale_items + optional stock_movement | Sale record |
| `confirmSale(saleId, userId)` | Ubah status + insert stock_movement | `{ success, message }` |
| `getSale(id)` | Detail transaksi + items + join product | Sale + items |
| `listSales(query)` | List dengan filter, sort, pagination | `{ items, pagination }` |
| `updateDraftSale(id, input, userId)` | Edit draft, recalculate jika karung berubah | Updated sale |
| `deleteDraftSale(id)` | Hapus draft + cascade items | `{ success }` |
| `getSalesSummary()` | Ringkasan bulan ini | `{ monthlyCount, revenue, weight, draftCount }` |

### Response Format

```typescript
// Load response (return dari +page.server.ts)
{
  items: Sale[],
  pagination: { total, page, limit, totalPages },
  summary: {
    monthlyCount: number,
    monthlyRevenue: number,
    monthlyWeight: number,
    draftCount: number
  },
  products: Product[],   // untuk dropdown form
  query: Record<string, string>,
  sort: string,
  order: string
}

// Action success
{ success: true, message: "Transaksi berhasil dibuat" }

// Action error (via SvelteKit fail())
{ message: "Stok tidak mencukupi. Tersedia: 50 kg, dibutuhkan: 100 kg" }
```

---

## 15. UI Components

### Halaman Utama Penjualan (`/sales`)

```
┌──────────────────────────────────────────────────────────────────┐
│  📊 Ringkasan Penjualan Bulan Ini                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 📄 15    │ │ 💰 12.5M │ │ ⚖️ 2.300 │ │ 📝 3     │           │
│  │ Transaksi│ │ Pendptn  │ │ kg Dijual│ │ Draft    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├──────────────────────────────────────────────────────────────────┤
│  [🔍 Cari pembeli/nota...]  [Status ▼]  [+ Transaksi Baru]     │
├──────────────────────────────────────────────────────────────────┤
│  No. Nota    │ Pembeli      │ Produk    │ Berat │ Total     │ St│
│  SALE-001    │ Toko Makmur  │ Premium   │ 150kg │ Rp 744.5k │ ✅│
│  SALE-002    │ UD Sejahtera │ Reguler   │ 200kg │ Rp 800.0k │ 📝│
│  SALE-003    │ CV Jaya      │ Premium   │ 350kg │ Rp 1.7M   │ ✅│
├──────────────────────────────────────────────────────────────────┤
│  [◀ 1 2 3 ... 5 ▶]                                             │
└──────────────────────────────────────────────────────────────────┘
```

### Modal Form Buat Transaksi

```
┌──────────────────────────────────────────────┐
│  Transaksi Penjualan Baru                    │
│                                               │
│  Produk:        [Tapioka Premium ▼]           │
│  Nama Pembeli:  [________________]            │
│  Tanggal:       [2025-01-10]                  │
│  Harga/kg:      [Rp 5.000]                    │
│  Tara/karung:   [2 kg]                        │
│  Biaya Kuli:    [Rp 3.000/karung]             │
│                                               │
│  ─── Input Berat Per Karung ───               │
│  Karung 1: [52.5 kg]  [🗑️]                    │
│  Karung 2: [51.0 kg]  [🗑️]                    │
│  Karung 3: [53.2 kg]  [🗑️]                    │
│  [+ Tambah Karung]                            │
│                                               │
│  ─── Kalkulasi Otomatis ───                   │
│  ┌──────────────────────────────────────┐     │
│  │ 📦 3 Karung                          │     │
│  │ Berat Kotor:   156.70 kg             │     │
│  │ Berat Bersih:  150.70 kg             │     │
│  │ Total Harga:   Rp 753.500            │     │
│  │ Biaya Kuli:    - Rp 9.000            │     │
│  │ ─────────────────────────            │     │
│  │ Total Bayar:   Rp 744.500            │     │
│  └──────────────────────────────────────┘     │
│                                               │
│  [Simpan Draft]  [Simpan & Konfirmasi]        │
└──────────────────────────────────────────────┘
```

### Halaman Detail Transaksi (`/sales/[id]`)

```
┌──────────────────────────────────────────────────────┐
│  ← Kembali                                          │
│                                                       │
│  SALE-20250110-001              Status: ✅ Confirmed  │
│  ─────────────────────────────────────────────────    │
│  Pembeli:    Toko Makmur                             │
│  Produk:     Tapioka Premium (TP-001)                │
│  Tanggal:    10 Januari 2025                         │
│                                                       │
│  Tara/karung:  2.00 kg                               │
│  Harga/kg:     Rp 5.000                              │
│  Biaya Kuli:   Rp 3.000/karung                       │
│                                                       │
│  ─── Detail Karung ───                               │
│  │ # │ Berat (kg) │                                  │
│  │ 1 │ 52.50      │                                  │
│  │ 2 │ 51.00      │                                  │
│  │ 3 │ 53.20      │                                  │
│                                                       │
│  ─── Ringkasan ───                                   │
│  Berat Kotor:   156.70 kg                            │
│  Berat Bersih:  150.70 kg                            │
│  Total Harga:   Rp 753.500                           │
│  Biaya Kuli:    - Rp 9.000                           │
│  Total Bayar:   Rp 744.500                           │
└──────────────────────────────────────────────────────┘
```

### Components

- `+page.svelte` — Halaman utama: summary cards, search/filter, tabel, modal create
- `+page.server.ts` — Load data + form actions (create, confirm, delete)
- `[id]/+page.svelte` — Halaman detail transaksi
- `[id]/+page.server.ts` — Load detail + join product + sale_items

### UI Library
- **shadcn-svelte:** `Button`, `Input`, `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`
- **lucide-svelte:** `Search`, `Plus`, `Loader2`, `Check`, `Trash2`, `Eye`, `Receipt`, `TrendingUp`, `FileText`, `Scale`
- **svelte-sonner:** Toast notification

---

## 16. Edge Cases

| Edge Case | Kondisi | Solusi |
|-----------|---------|--------|
| Satu karung saja | Input hanya 1 karung | Valid — array min 1, UI allow hapus hanya jika > 1 karung |
| Berat karung 0 | Karung belum ditimbang | Ditolak oleh Zod: `z.coerce.number().positive()` |
| Tara > berat karung | Tara per sack lebih besar dari berat rata-rata karung | `netWeight` bisa negatif — tidak ada constraint khusus, bergantung kebijakan bisnis |
| Harga 0 | Produk gratis/sampel | Ditolak: `pricePerKg > 0` required |
| Confirm saat stok pas | Stok = netWeight persis | Valid — `getCurrentStock >= netWeight` lolos |
| Race condition confirm | 2 admin confirm bersamaan, stok hanya cukup untuk 1 | Salah satu gagal karena stok sudah berkurang setelah yang pertama commit |
| Produk dinonaktifkan | Produk dinonaktifkan setelah draft dibuat | Draft tetap bisa di-confirm selama produk masih ada di DB |
| Banyak karung | Input 50+ karung dalam satu transaksi | Performa loop insert `sale_items` — acceptable untuk puluhan karung |
| Edit mengubah produk | Draft ganti produk ke produk lain | Valid — recalculate semua jika `sackWeights` juga diubah |
| Hapus produk yang ada di transaksi | Produk di-soft-delete tapi masih ada di sales confirmed | `product_id` FK tetap valid; tampilan nama produk via leftJoin |
| SaleNumber collision | 2 transaksi dibuat dalam milidetik yang sama | Pattern `ilike(sale_number, prefix%)` + increment — risiko rendah |

---

## 17. Security Requirements

### RBAC
| Action | Owner | Admin Penjualan | Petugas Gudang | Bagian Produksi | Pembeli UMKM |
|--------|-------|-----------------|----------------|-----------------|--------------|
| Lihat daftar & detail penjualan | ✅ | ✅ | ❌ | ❌ | ❌ |
| Buat transaksi baru | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit transaksi draft | ✅ | ✅ | ❌ | ❌ | ❌ |
| Konfirmasi transaksi | ✅ | ✅ | ❌ | ❌ | ❌ |
| Hapus transaksi draft | ✅ | ✅ | ❌ | ❌ | ❌ |
| Lihat stok berkurang (di modul Gudang) | ✅ | ❌ | ✅ (read-only) | ❌ | ❌ |

### Route Protection
```typescript
// src/lib/server/auth/routes.ts
'/sales': { protected: true, roles: ['owner', 'admin_penjualan'] }
// Wildcard: pathname.startsWith('/sales/') → same config
```

### Data Security
- Session handling via HTTP-only cookie (dari Authentication module)
- `created_by` mencatat user ID yang membuat transaksi
- Perhitungan server-side mencegah manipulasi angka dari client
- Form actions menggunakan SvelteKit POST (CSRF-safe by default)

---

## 18. Testing Strategy

```typescript
// Unit Tests — src/lib/server/sales/service.test.ts
describe('calculateSale', () => {
  it('calculates grossWeight as sum of all sack weights', () => {});
  it('calculates netWeight = grossWeight - (sackCount × taraPerSack)', () => {});
  it('calculates totalCost = netWeight × pricePerKg', () => {});
  it('calculates kuliFee = sackCount × kuliFeePerSack', () => {});
  it('calculates totalPayment = totalCost - kuliFee', () => {});
  it('rounds all values to 2 decimal places', () => {});
});

describe('generateSaleNumber', () => {
  it('generates SALE-YYYYMMDD-001 for first sale of the day', () => {});
  it('increments sequence number for subsequent sales', () => {});
});

describe('createSale', () => {
  it('creates sale with calculated values (not client values)', () => {});
  it('creates sale_items for each sack weight', () => {});
  it('rejects if product not found', () => {});
  it('rejects confirm if insufficient stock', () => {});
  it('deducts stock when status is confirmed', () => {});
});

describe('confirmSale', () => {
  it('changes status from draft to confirmed', () => {});
  it('creates SALE_OUT stock movement', () => {});
  it('rejects if already confirmed', () => {});
  it('rejects if stock insufficient', () => {});
});

describe('updateDraftSale', () => {
  it('allows update when status is draft', () => {});
  it('rejects update when status is confirmed', () => {});
  it('recalculates when sackWeights change', () => {});
  it('replaces sale_items when sackWeights change', () => {});
});

describe('deleteDraftSale', () => {
  it('deletes draft sale and cascade items', () => {});
  it('rejects deletion of confirmed sale', () => {});
});

// Validation Tests — src/lib/server/sales/validation.test.ts
describe('createSaleSchema', () => {
  it('rejects empty buyerName', () => {});
  it('rejects empty sackWeights array', () => {});
  it('rejects sack weight <= 0', () => {});
  it('rejects pricePerKg <= 0', () => {});
  it('applies default taraPerSack = 2', () => {});
  it('applies default kuliFeePerSack = 3000', () => {});
});

// Integration Tests
describe('POST /?/create', () => {
  it('creates sale via form action and returns success', () => {});
  it('returns fail(400) for invalid input', () => {});
});

// E2E Tests
test('Admin Penjualan buat transaksi draft dan konfirmasi', async ({ page }) => {});
test('Filter transaksi berdasarkan status confirmed', async ({ page }) => {});
test('Hapus transaksi draft', async ({ page }) => {});
test('Stok berkurang setelah konfirmasi penjualan', async ({ page }) => {});
```

---

## 19. DevOps & Deployment

### Database Migration
```bash
npx drizzle-kit push      # push schema ke NeonDB (development)
npx drizzle-kit generate  # generate migration SQL (production)
npx drizzle-kit migrate   # run migrations
```

### Environment Variables
Tidak ada environment variable baru yang diperlukan. Modul ini menggunakan koneksi database dan session yang sudah ada.

### Index Optimization
| Index | Kolom | Alasan |
|-------|-------|--------|
| `sales_buyer_idx` | `buyer_name` | Search/filter by pembeli |
| `sales_product_idx` | `product_id` | Join ke products |
| `sales_sale_idx` | `sale_number` | Lookup by nota number |
| `sale_items_sale_idx` | `sale_id` | Fetch items per transaksi |

### Performance Considerations
- Summary query (`getSalesSummary`) melakukan aggregation `SUM` + `COUNT` pada tabel `sales` — performa acceptable untuk ribuan records
- Jika data penjualan tumbuh sangat besar (>100K), pertimbangkan materialized view untuk summary
- `sale_items` loop insert bisa dioptimasi ke batch insert jika jumlah karung sangat banyak

---

## 20. Definition of Done

```markdown
- [x] Drizzle schema sales + sale_items selesai
- [x] Validation schema (Zod) create/update/query selesai
- [x] Service layer: createSale, confirmSale, getSale, listSales, updateDraftSale, deleteDraftSale, getSalesSummary selesai
- [x] Server-side calculation (calculateSale) selesai
- [x] Auto-generate sale_number (SALE-YYYYMMDD-NNN) selesai
- [x] Form action create (draft/confirmed) selesai
- [x] Form action confirm (validasi stok + insert stock_movement) selesai
- [x] Form action delete (hanya draft) selesai
- [x] Halaman list penjualan dengan summary cards selesai
- [x] Modal form buat transaksi dengan live calculation selesai
- [x] Input berat per karung (add/remove sack) selesai
- [x] Filter: search, status, sorting, pagination selesai
- [x] Halaman detail transaksi (/sales/[id]) selesai
- [x] Integrasi stok: SALE_OUT di stock_movements saat confirm selesai
- [x] RBAC: owner + admin_penjualan di routes.ts selesai
- [x] Integrasi Dashboard: KPI, trend, dan transaksi terbaru menggabungkan data orders + sales selesai
- [x] Unit test service layer coverage > 80%
- [x] E2E test buat/confirm/hapus/filter transaksi selesai
- [ ] QA sign-off
```

### Folder Structure (Implementasi Aktual)

```
src/
├── lib/
│   └── server/
│       ├── sales/
│       │   ├── service.ts         # Business logic + CRUD
│       │   └── validation.ts      # Zod schemas
│       ├── stock/
│       │   ├── service.ts         # getCurrentStock(), addMovement()
│       │   └── validation.ts      # Stock validation
│       └── db/
│           └── schema/
│               ├── sales.ts       # Drizzle schema: sales, saleItems
│               ├── stock.ts       # Drizzle schema: stockMovements
│               └── product.ts     # Drizzle schema: products
├── routes/
│   └── (app)/
│       └── sales/
│           ├── +page.svelte       # List + modal create + actions
│           ├── +page.server.ts    # Load + form actions
│           └── [id]/
│               ├── +page.svelte   # Detail transaksi
│               └── +page.server.ts # Load detail
```

---

*Dokumen ini adalah PRD/SRS resmi untuk Modul Penjualan CV TapioLeaf Management System.*
*Versi: 1.0.0 | Status: Draft | Last Updated: 2025-01-01*
*Mengikuti struktur 20 section yang sama dengan PRD Authentication, Dashboard, Manajemen Produk, Stok Gudang, Produksi Harian, dan Penerimaan Singkong.*
