# FEATURE PRD / SRS
# CV TapioLeaf Management System
# Fitur 5: Produksi Harian

**Versi:** 1.0.0
**Tanggal:** 2025-01-01
**Status:** Draft
**Author:** Tim Produk CV TapioLeaf

---

## 1. Feature Overview

### 1.1 Latar Belakang

CV TapioLeaf beroperasi dengan kapasitas produksi hingga 4 ton (4.000 kg) tepung tapioka per hari. Tanpa sistem pencatatan produksi yang terstruktur, Owner tidak bisa memantau apakah produksi mencapai target harian, dan tim gudang tidak tahu berapa stok yang bertambah setiap harinya.

### 1.2 Masalah yang Diselesaikan

| No | Masalah | Dampak |
|----|---------|--------|
| 1 | Pencatatan produksi masih manual di buku | Data produksi terlambat diketahui Owner |
| 2 | Tidak ada sinkronisasi produksi ke stok gudang | Stok di sistem tidak mencerminkan produksi terbaru |
| 3 | Tidak ada riwayat produksi yang mudah diakses | Tidak bisa analisis tren efisiensi produksi |
| 4 | Tidak ada perbandingan target vs realisasi | Tidak bisa deteksi masalah kapasitas |

### 1.3 Tujuan Fitur

- Memungkinkan Bagian Produksi mencatat hasil produksi harian secara digital
- Otomatis menambah stok gudang saat produksi dicatat
- Memberikan visibilitas produksi vs target ke Owner melalui dashboard
- Menyimpan riwayat produksi untuk analisis dan laporan

### 1.4 Scope Fitur

#### In Scope
- Input hasil produksi harian (per produk, per shift opsional)
- Satu produksi per hari per produk (atau bisa multiple entry)
- Otomatis trigger stok masuk ke modul gudang
- Riwayat produksi dengan filter tanggal dan produk
- Perbandingan realisasi vs target kapasitas harian
- Edit produksi yang belum dikonfirmasi
- Konfirmasi/finalisasi produksi harian

#### Out of Scope
- Manajemen bahan baku dan formula produksi
- Manajemen mesin dan downtime
- Shift management (future)
- Biaya produksi per batch (future)
- QC/quality control checklist (future)
- IoT sensor integration (future)

### 1.5 Business Impact

- **Visibilitas:** Owner real-time tahu realisasi produksi hari ini vs target
- **Efisiensi:** Penghilangan double-entry produksi → stok
- **Perencanaan:** Data historis mendukung perencanaan kapasitas

### 1.6 Success Metrics

| Metric | Target |
|--------|--------|
| Data entry produksi | 100% produksi harian tercatat di sistem |
| Sinkronisasi ke stok | 100% entry produksi otomatis update stok |
| Waktu entry | Proses input < 2 menit per sesi |

---

## 2. User Story

### US-PROD-101
```
As a Bagian Produksi
I want mencatat hasil produksi hari ini per jenis produk
So that Owner dan tim gudang bisa mengetahui berapa produk yang diproduksi
```
**Priority:** Critical
**Acceptance Notes:** Pilih produk, input quantity kg, tanggal default hari ini.

---

### US-PROD-102
```
As a Bagian Produksi
I want stok gudang otomatis bertambah saat saya mencatat produksi
So that saya tidak perlu input data yang sama di dua tempat
```
**Priority:** Critical
**Acceptance Notes:** Simpan produksi → otomatis buat stock_movement PRODUCTION_IN.

---

### US-PROD-103
```
As a Bagian Produksi
I want melihat riwayat produksi yang pernah saya input
So that saya bisa memverifikasi data yang sudah masuk
```
**Priority:** High
**Acceptance Notes:** List produksi 30 hari terakhir, dengan filter tanggal.

---

### US-PROD-104
```
As a Bagian Produksi
I want mengedit catatan produksi yang belum dikonfirmasi
So that saya bisa koreksi jika ada kesalahan input
```
**Priority:** High
**Acceptance Notes:** Hanya bisa edit jika status DRAFT; status CONFIRMED tidak bisa diedit.

---

### US-PROD-105
```
As a Bagian Produksi
I want mengkonfirmasi data produksi harian setelah semua entry selesai
So that Owner tahu data sudah final
```
**Priority:** High
**Acceptance Notes:** Setelah konfirmasi, data terkunci dan tidak bisa diedit.

---

### US-PROD-106
```
As an Owner
I want melihat total produksi hari ini vs target 4000 kg
So that saya bisa memantau efisiensi produksi
```
**Priority:** High
**Acceptance Notes:** Dashboard menampilkan progress bar produksi harian vs target.

---

### US-PROD-107
```
As an Owner
I want melihat riwayat produksi 30 hari terakhir
So that saya bisa analisis tren dan efisiensi produksi
```
**Priority:** Medium
**Acceptance Notes:** Grafik bar produksi harian vs target.

---

## 3. Use Case Description

### UC-PROD-101: Input Produksi Harian

| Elemen | Detail |
|--------|--------|
| **Use Case ID** | UC-PROD-101 |
| **Nama** | Input Hasil Produksi Harian |
| **Actor** | Bagian Produksi |
| **Preconditions** | Bagian Produksi sudah login; produk ada di sistem |
| **Trigger** | Selesai produksi dan perlu dicatat |

**Main Flow:**
1. Bagian Produksi navigasi ke /produksi
2. Klik "+ Tambah Produksi"
3. Form terbuka: pilih produk, input quantity (kg), tanggal (default: hari ini), keterangan opsional
4. Klik "Simpan"
5. Sistem validasi input
6. Sistem buat record `production_entry` dengan status DRAFT
7. **Sistem otomatis buat** `stock_movement` tipe PRODUCTION_IN
8. Toast sukses
9. Daftar produksi di-refresh

**Alternative Flow:**
- **AF-1:** Input produksi untuk tanggal sebelumnya (lupa input kemarin) — diizinkan dengan flag "Entry Terlambat"

**Exception Flow:**

| Kode | Kondisi | Respon Sistem |
|------|---------|---------------|
| EX-1 | Quantity 0 atau negatif | "Quantity harus lebih dari 0" |
| EX-2 | Produk tidak aktif | "Produk tidak tersedia untuk diproduksi" |
| EX-3 | Tanggal di masa depan | "Tanggal tidak boleh di masa depan" |
| EX-4 | Entry terduplikasi hari yang sama | Warning, tapi izinkan multiple entry per hari |

---

### UC-PROD-102: Konfirmasi Produksi Harian

| Elemen | Detail |
|--------|--------|
| **Use Case ID** | UC-PROD-102 |
| **Nama** | Konfirmasi Produksi Harian |
| **Actor** | Bagian Produksi |
| **Preconditions** | Ada entry produksi dengan status DRAFT untuk hari ini |

**Main Flow:**
1. Bagian Produksi review semua entry hari ini
2. Klik "Konfirmasi Produksi Hari Ini"
3. Dialog konfirmasi: "Total: X kg. Lanjutkan?"
4. Klik "Ya"
5. Semua entry hari ini di-update status → CONFIRMED
6. Data tidak bisa diedit setelah konfirmasi
7. Toast "Produksi hari ini berhasil dikonfirmasi"

---

### UC-PROD-103: Edit Produksi (Status DRAFT)

| Elemen | Detail |
|--------|--------|
| **Use Case ID** | UC-PROD-103 |
| **Nama** | Edit Catatan Produksi |
| **Actor** | Bagian Produksi |
| **Preconditions** | Entry produksi ada dengan status DRAFT |

**Main Flow:**
1. Klik icon edit pada entry produksi
2. Form pre-filled dengan data saat ini
3. Edit quantity atau keterangan
4. Klik "Perbarui"
5. Sistem update entry
6. **Sistem update stock_movement terkait** (selisih quantity)
7. Toast sukses

---

## 4. Functional Requirements

| ID | Requirement | Description | Actor | Validasi |
|----|-------------|-------------|-------|----------|
| FR-PROD-101 | Input Produksi | Form input produksi: produk, quantity, tanggal, keterangan | Bagian Produksi | Quantity > 0, tanggal <= hari ini |
| FR-PROD-102 | Auto Stock Update | Simpan produksi → otomatis buat stock_movement PRODUCTION_IN | Sistem | Dalam 1 DB transaction |
| FR-PROD-103 | Status Workflow | Entry produksi: DRAFT → CONFIRMED | Bagian Produksi | CONFIRMED tidak bisa diedit |
| FR-PROD-104 | Edit DRAFT Entry | Edit entry dengan status DRAFT, update stok selisih | Bagian Produksi | Hanya DRAFT yang bisa diedit |
| FR-PROD-105 | Konfirmasi Harian | Finalisasi semua entry hari ini sekaligus | Bagian Produksi | Batch update DRAFT → CONFIRMED |
| FR-PROD-106 | Riwayat Produksi | List produksi dengan filter tanggal dan produk | Bagian Produksi, Owner | Default: 30 hari terakhir |
| FR-PROD-107 | Summary Harian | Total produksi per hari untuk semua produk | Owner | Agregasi per tanggal |
| FR-PROD-108 | Target vs Realisasi | Bandingkan total produksi vs target 4000 kg/hari | Owner | Persentase pencapaian |
| FR-PROD-109 | Multiple Entry | Izinkan multiple entry per produk per hari | Bagian Produksi | Tidak ada unique constraint per hari per produk |
| FR-PROD-110 | Keterangan | Field keterangan opsional untuk catatan khusus | Bagian Produksi | Max 255 karakter |

---

## 5. Non-Functional Requirements

### Performance
| Requirement | Target |
|-------------|--------|
| Input produksi end-to-end | < 1 detik (termasuk stock update) |
| Load riwayat produksi | < 1 detik untuk 100 entry |

### Data Integrity
- Input produksi dan stock update dalam **satu database transaction** (atomic)
- Jika stock update gagal, production entry juga dibatalkan (rollback)

### Reliability
- Audit trail: setiap entry mencatat user, timestamp, IP
- Konfirmasi bersifat final — tidak bisa di-uncomfirm (hanya dengan adjustment gudang)

---

## 6. Business Rules

| BR-ID | Rule | Description |
|-------|------|-------------|
| BR-PROD-101 | Atomic Operation | Input produksi dan stock_movement dalam satu transaksi DB |
| BR-PROD-102 | Status Terkunci | Entry CONFIRMED tidak bisa diedit; koreksi via adjustment stok |
| BR-PROD-103 | Tanggal Backdate | Izinkan input untuk tanggal kemarin (max 7 hari ke belakang) |
| BR-PROD-104 | Target Harian | Target produksi default 4000 kg/hari (dapat dikonfigurasi) |
| BR-PROD-105 | Multiple Entry OK | Multiple entry per produk per hari diizinkan (shift berbeda) |
| BR-PROD-106 | Quantity Minimum | Quantity produksi minimal 1 kg |
| BR-PROD-107 | Stok Langsung Update | Stok bertambah saat entry DISIMPAN, bukan saat DIKONFIRMASI |

---

## 7. User Flow

### Input Produksi — Success Flow
```
1. Bagian Produksi buka /produksi
2. Klik "+ Tambah Produksi"
3. Modal form terbuka
4. Pilih produk: "Tapioka Premium 25kg"
5. Input quantity: 2500 (kg)
6. Tanggal: hari ini (default)
7. Keterangan: "Shift pagi" (opsional)
8. Klik "Simpan"
9. [Loading state]
10. POST /api/production
11. DB Transaction:
    a. INSERT production_entry (status: DRAFT)
    b. INSERT stock_movement (type: PRODUCTION_IN, qty: +2500)
12. COMMIT
13. Response 201
14. Toast "Produksi berhasil dicatat"
15. Saldo stok produk bertambah 2500 kg
16. Tabel produksi refresh
```

### Edit Produksi — Flow
```
1. Petugas temukan entry salah: input 2500, seharusnya 2800
2. Entry masih DRAFT → bisa diedit
3. Klik icon edit
4. Ubah quantity dari 2500 → 2800
5. Klik "Perbarui"
6. Sistem hitung selisih: 2800 - 2500 = +300
7. DB Transaction:
   a. UPDATE production_entry quantity = 2800
   b. INSERT stock_movement (ADJUSTMENT, qty: +300) [atau update original]
8. Toast "Produksi berhasil diperbarui"
```

### Konfirmasi Harian — Flow
```
1. Bagian Produksi sudah input semua entry hari ini
2. Klik "Konfirmasi Produksi Hari Ini"
3. Dialog: "Total produksi hari ini: 3.800 kg dari 2 produk. Konfirmasi?"
4. Klik "Ya, Konfirmasi"
5. PATCH /api/production/confirm-today
6. Update semua DRAFT entry → CONFIRMED
7. Toast "Produksi hari ini dikonfirmasi"
8. Tombol edit pada entry menjadi disabled
```

---

## 8. Data Flow

### Input Produksi
```
Browser
  └─► POST /api/production
        │  { productId, quantityKg, productionDate, notes }
        ▼
  Zod Validation
        ▼
  ProductionService.create(dto, userId)
        │
        ├─► ProductRepository.findActive(productId)
        │
        └─► DB Transaction:
              ├─► ProductionEntryRepository.create({...dto, status: DRAFT})
              └─► StockService.addMovement({
                    productId,
                    quantityChange: +quantityKg,
                    type: PRODUCTION_IN,
                    referenceId: productionEntry.id,
                    date: productionDate
                  })
                    │
                    ▼
              PostgreSQL COMMIT
                    │
                    ▼
  Response 201 + { entry, stockMovement }
```

---

## 9. Validation Rules

```typescript
// schemas/production.schema.ts
import { z } from 'zod';

const MAX_BACKDATE_DAYS = 7;

export const createProductionSchema = z.object({
  productId: z
    .string({ required_error: 'Produk wajib dipilih' })
    .cuid('ID produk tidak valid'),

  quantityKg: z
    .number({ required_error: 'Quantity wajib diisi' })
    .positive('Quantity harus lebih dari 0')
    .max(10000, 'Quantity maksimal 10.000 kg per entry')
    .multipleOf(0.1, 'Quantity maksimal 1 desimal'),

  productionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD')
    .refine((d) => {
      const date = new Date(d);
      const today = new Date();
      const maxPast = new Date();
      maxPast.setDate(today.getDate() - MAX_BACKDATE_DAYS);
      return date >= maxPast && date <= today;
    }, `Tanggal maksimal ${MAX_BACKDATE_DAYS} hari ke belakang`),

  notes: z
    .string()
    .max(255, 'Keterangan maksimal 255 karakter')
    .optional(),
});

export const updateProductionSchema = z.object({
  quantityKg: z
    .number()
    .positive('Quantity harus lebih dari 0')
    .max(10000),
  notes: z.string().max(255).optional(),
});

export const productionQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  productId: z.string().cuid().optional(),
  status: z.enum(['DRAFT', 'CONFIRMED', 'all']).default('all'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
```

---

## 10. Error Handling

```json
{
  "success": false,
  "message": "Gagal menyimpan produksi",
  "code": "PRODUCTION_CREATE_ERROR",
  "errors": {
    "quantityKg": ["Quantity harus lebih dari 0"]
  }
}
```

### Error Catalog

| HTTP Status | Code | Kondisi | Pesan User |
|-------------|------|---------|------------|
| 400 | VALIDATION_ERROR | Input tidak valid | "Data yang dikirim tidak valid" |
| 404 | PRODUCT_NOT_FOUND | Produk tidak ditemukan | "Produk tidak ditemukan atau tidak aktif" |
| 422 | ENTRY_CONFIRMED | Edit entry yang sudah dikonfirmasi | "Produksi yang sudah dikonfirmasi tidak bisa diedit" |
| 422 | DATE_TOO_OLD | Tanggal > 7 hari lalu | "Tidak bisa input produksi lebih dari 7 hari ke belakang" |
| 500 | PRODUCTION_SAVE_ERROR | Gagal simpan (rollback) | "Gagal menyimpan. Coba lagi" |

---

## 11. Acceptance Criteria

```gherkin
Feature: Produksi Harian

  Scenario: Input produksi berhasil dan stok bertambah
    Given saya login sebagai Bagian Produksi
    And produk "Tapioka Premium" memiliki stok 200 kg
    When saya input produksi 2500 kg untuk hari ini
    Then entry produksi tersimpan dengan status DRAFT
    And stok "Tapioka Premium" bertambah menjadi 2700 kg
    And record stock_movement PRODUCTION_IN terbuat

  Scenario: Stok tidak bertambah jika produksi gagal disimpan
    Given database sedang bermasalah
    When saya mencoba input produksi
    Then tidak ada production entry yang tersimpan
    And tidak ada stock_movement yang terbuat
    And error message ditampilkan

  Scenario: Edit produksi DRAFT berhasil
    Given terdapat entry produksi DRAFT 2500 kg
    When saya mengubah quantity menjadi 2800 kg
    Then entry produksi diupdate menjadi 2800 kg
    And stok bertambah 300 kg lagi (selisih)

  Scenario: Edit produksi CONFIRMED ditolak
    Given terdapat entry produksi dengan status CONFIRMED
    When saya mencoba mengedit entry tersebut
    Then sistem menampilkan error "Produksi yang sudah dikonfirmasi tidak bisa diedit"

  Scenario: Konfirmasi produksi harian
    Given terdapat 3 entry produksi DRAFT hari ini dengan total 3800 kg
    When Bagian Produksi mengklik "Konfirmasi Produksi Hari Ini"
    And mengkonfirmasi dialog
    Then semua 3 entry berubah status menjadi CONFIRMED
    And tidak bisa diedit lagi

  Scenario: Dashboard menampilkan realisasi vs target
    Given target produksi 4000 kg/hari
    And total produksi hari ini 3200 kg
    When Owner membuka dashboard
    Then tampil progress "3.200 kg / 4.000 kg (80%)"
```

---

## 12. Database Design

```prisma
model ProductionEntry {
  id              String            @id @default(cuid())
  productId       String            @map("product_id")
  quantityKg      Decimal           @db.Decimal(10, 2) @map("quantity_kg")
  productionDate  DateTime          @map("production_date") @db.Date
  status          ProductionStatus  @default(DRAFT)
  notes           String?
  isLateEntry     Boolean           @default(false) @map("is_late_entry")
  createdByUserId String            @map("created_by_user_id")
  confirmedByUserId String?         @map("confirmed_by_user_id")
  confirmedAt     DateTime?         @map("confirmed_at")
  createdAt       DateTime          @default(now()) @map("created_at")
  updatedAt       DateTime          @updatedAt @map("updated_at")

  product         Product           @relation(fields: [productId], references: [id])
  createdBy       User              @relation("ProductionCreatedBy", fields: [createdByUserId], references: [id])
  confirmedBy     User?             @relation("ProductionConfirmedBy", fields: [confirmedByUserId], references: [id])
  stockMovement   StockMovement?    // one-to-one via referenceId

  @@index([productId])
  @@index([productionDate])
  @@index([status])
  @@index([createdByUserId])
  @@map("production_entries")
}

enum ProductionStatus {
  DRAFT
  CONFIRMED
}
```

### Relationship
```
products (1) ──────────── (N) production_entries
users (1) ─────────────── (N) production_entries (createdBy)
production_entries (1) ─── (1) stock_movements (via referenceId)
```

---

## 13. Database Impact Analysis

- Tabel baru: `production_entries`
- Relasi ke `products` dan `users`
- Relasi implisit ke `stock_movements` via `referenceId` field
- Index pada `productionDate` untuk query range tanggal
- Soft delete tidak diperlukan — CONFIRMED entry bersifat permanen

---

## 14. API Requirements

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/production` | Daftar entry produksi dengan filter | ✅ | Owner, Bagian Produksi |
| POST | `/api/production` | Tambah entry produksi | ✅ | Bagian Produksi |
| PATCH | `/api/production/:id` | Edit entry (hanya DRAFT) | ✅ | Bagian Produksi |
| POST | `/api/production/confirm-today` | Konfirmasi semua DRAFT hari ini | ✅ | Bagian Produksi |
| GET | `/api/production/summary` | Summary harian vs target | ✅ | Owner, Bagian Produksi |
| GET | `/api/production/trend` | Tren produksi 30 hari | ✅ | Owner |

### POST /api/production Request
```json
{
  "productId": "clxxxx",
  "quantityKg": 2500,
  "productionDate": "2025-01-10",
  "notes": "Shift pagi"
}
```

### Response 201
```json
{
  "success": true,
  "message": "Produksi berhasil dicatat",
  "data": {
    "entry": {
      "id": "clzzzz",
      "productId": "clxxxx",
      "productName": "Tapioka Premium",
      "quantityKg": 2500,
      "productionDate": "2025-01-10",
      "status": "DRAFT",
      "notes": "Shift pagi"
    },
    "stockUpdate": {
      "previousStock": 200,
      "addedStock": 2500,
      "currentStock": 2700
    }
  }
}
```

### GET /api/production/summary?date=2025-01-10
```json
{
  "success": true,
  "data": {
    "date": "2025-01-10",
    "targetKg": 4000,
    "totalProducedKg": 3200,
    "achievementPercentage": 80,
    "entries": [
      {
        "productName": "Tapioka Premium",
        "quantityKg": 2500,
        "status": "CONFIRMED"
      },
      {
        "productName": "Tapioka Reguler",
        "quantityKg": 700,
        "status": "DRAFT"
      }
    ]
  }
}
```

---

## 15. UI Components

### Production Page Layout
```
┌─────────────────────────────────────────────────────┐
│  Produksi Harian           [+ Tambah Produksi]      │
├─────────────────────────────────────────────────────┤
│  📅 Hari Ini: 10 Jan 2025                           │
│  Target: 4.000 kg │ Realisasi: 3.200 kg (80%)       │
│  [████████████████████░░░░░░] 80%                   │
├─────────────────────────────────────────────────────┤
│  Produk            │ Qty (kg) │ Status  │ Aksi       │
│  Tapioka Premium   │ 2.500    │ ✏ DRAFT │ [Edit][🗑] │
│  Tapioka Reguler   │ 700      │ ✏ DRAFT │ [Edit][🗑] │
├─────────────────────────────────────────────────────┤
│                    [Konfirmasi Produksi Hari Ini]    │
└─────────────────────────────────────────────────────┘

[Riwayat Produksi Tab]
[Filter: Tanggal dari-sampai | Produk | Status]
```

**Components:**
- `<ProductionProgressBar>` — Progress bar harian realisasi vs target
- `<ProductionFormModal>` — Modal input/edit produksi
- `<ProductionTable>` — Tabel entry dengan status badge
- `<ConfirmDailyDialog>` — Dialog konfirmasi dengan total summary
- `<ProductionStatusBadge>` — DRAFT (kuning) / CONFIRMED (hijau)
- `<ProductionHistoryFilter>` — Filter tanggal, produk, status

---

## 16. Edge Cases

| Edge Case | Kondisi | Solusi |
|-----------|---------|--------|
| Input produksi saat DB bermasalah | Transaction gagal | Rollback keduanya, tampilkan error |
| Multiple entry produk sama hari ini | Diizinkan (shift berbeda) | Sum semua untuk total hari ini |
| Edit entry → stok jadi negatif | Tidak mungkin (edit hanya quantity produksi masuk) | Tidak relevan |
| Konfirmasi hari sebelumnya | DRAFT dari kemarin | Izinkan konfirmasi hari mana saja |
| Tanggal weekend/hari libur | Produksi mungkin libur | Valid, tidak ada batasan hari |
| Quantity desimal (0.5 ton = 500 kg) | Input dalam kg selalu | Validasi: kelipatan 0.1 |

---

## 17. Security Requirements

- RBAC: Bagian Produksi bisa CUD; Owner hanya R
- Semua entry mencatat `createdByUserId`
- Entry CONFIRMED tidak bisa dihapus (append-only setelah konfirmasi)
- Rate limit: POST max 20 request/menit per user

---

## 18. Testing Strategy

```typescript
// Unit Tests
describe('ProductionService', () => {
  it('creates entry and triggers stock update atomically', async () => {});
  it('rolls back if stock update fails', async () => {});
  it('rejects edit on CONFIRMED entry', async () => {});
  it('confirms all DRAFT entries for today', async () => {});
  it('correctly calculates achievement percentage', async () => {});
});

// Integration Tests
describe('POST /api/production', () => {
  it('creates entry and increases stock', async () => {});
  it('returns 422 on future date', async () => {});
  it('returns 422 on date older than 7 days', async () => {});
});

// E2E Tests
test('Bagian Produksi input produksi dan stok bertambah', async ({ page }) => {});
test('Konfirmasi produksi harian berhasil', async ({ page }) => {});
test('Edit produksi CONFIRMED ditolak', async ({ page }) => {});
```

---

## 19. DevOps & Deployment

```env
PRODUCTION_TARGET_KG_PER_DAY=4000
MAX_BACKDATE_DAYS=7
```

---

## 20. Definition of Done

```markdown
- [ ] Input produksi harian selesai
- [ ] Auto-sync ke stok gudang (atomic transaction) selesai
- [ ] Edit produksi DRAFT selesai
- [ ] Konfirmasi produksi harian selesai
- [ ] Status workflow DRAFT → CONFIRMED selesai
- [ ] Riwayat produksi dengan filter selesai
- [ ] Summary harian vs target selesai
- [ ] API endpoints semua selesai
- [ ] Validasi Zod semua field selesai
- [ ] Rollback test: gagal simpan = tidak ada stok update
- [ ] Unit test ProductionService coverage > 80%
- [ ] E2E test selesai
- [ ] RBAC: Bagian Produksi CUD, Owner R
- [ ] Deploy staging berhasil
- [ ] QA sign-off
```

---

*Dokumen ini adalah PRD/SRS resmi untuk Fitur Produksi Harian CV TapioLeaf Management System.*
*Versi: 1.0.0 | Status: Draft | Last Updated: 2025-01-01*
