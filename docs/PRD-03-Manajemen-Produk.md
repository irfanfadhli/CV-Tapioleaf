# FEATURE PRD / SRS
# CV TapioLeaf Management System
# Fitur 3: Manajemen Produk

**Versi:** 1.0.0
**Tanggal:** 2025-01-01
**Status:** Draft
**Author:** Tim Produk CV TapioLeaf

---

## 1. Feature Overview

### 1.1 Latar Belakang

CV TapioLeaf menghasilkan tepung tapioka dalam berbagai varian (ukuran kemasan, grade kualitas) dan produk turunan lainnya. Tanpa manajemen produk yang terstruktur, konsistensi data harga, kode produk, dan kategorisasi sulit dijaga, mengakibatkan kesalahan pada transaksi penjualan dan ketidakakuratan laporan.

### 1.2 Masalah yang Diselesaikan

| No | Masalah | Dampak |
|----|---------|--------|
| 1 | Tidak ada master data produk terpusat | Harga tidak konsisten antar transaksi |
| 2 | Tidak ada kode produk unik | Sulit tracking stok per SKU |
| 3 | Tidak ada manajemen kategori | Laporan per kategori tidak bisa dibuat |
| 4 | Tidak ada katalog digital | UMKM tidak tahu produk yang tersedia |
| 5 | Gambar produk tidak terdokumentasi | Katalog online tidak representatif |

### 1.3 Tujuan Fitur

- Menyediakan master data produk sebagai referensi seluruh modul
- Memastikan kode produk unik dan konsisten
- Mendukung kategori produk untuk filtering dan pelaporan
- Menyediakan upload gambar produk untuk katalog UMKM
- Mengatur harga jual yang menjadi acuan transaksi

### 1.4 Scope Fitur

#### In Scope
- CRUD produk (Create, Read, Update, Delete/Soft Delete)
- Kode produk otomatis (auto-generate) atau manual
- Kategorisasi produk
- Penetapan harga jual
- Upload gambar produk (single image)
- Status produk (aktif/nonaktif)
- Pencarian dan filter produk
- Stok minimum per produk (untuk alert)

#### Out of Scope
- Manajemen bahan baku (modul terpisah)
- Bill of Materials (BoM)
- Multi-harga per customer tier (future)
- Manajemen varian produk (future)
- Barcode/QR code generation (future)
- Bulk import produk via CSV (future)

### 1.5 Business Impact

- **Konsistensi Data:** Semua modul (stok, penjualan, laporan) mengacu ke master produk yang sama
- **Katalog Digital:** Produk aktif otomatis muncul di katalog UMKM
- **Pelaporan:** Kategori produk memungkinkan laporan per segmen

### 1.6 Success Metrics

| Metric | Target |
|--------|--------|
| Data produk terpusat | 100% produk terdaftar di sistem |
| Kode produk unik | 0 duplikasi kode |
| Gambar produk | > 80% produk memiliki gambar |
| Response time CRUD | < 1 detik |

---

## 2. User Story

### US-PROD-001
```
As an Admin Penjualan
I want menambah produk baru ke sistem
So that produk tersebut bisa digunakan dalam transaksi penjualan
```
**Priority:** Critical
**Acceptance Notes:** Form validasi wajib: nama, kode, harga, kategori. Kode bisa auto-generate.

---

### US-PROD-002
```
As an Admin Penjualan
I want melihat daftar semua produk dengan filter dan pencarian
So that saya bisa menemukan produk dengan cepat
```
**Priority:** Critical
**Acceptance Notes:** Filter by: kategori, status. Search by: nama, kode produk.

---

### US-PROD-003
```
As an Admin Penjualan
I want mengedit informasi produk (nama, harga, deskripsi)
So that data produk selalu akurat dan terkini
```
**Priority:** High
**Acceptance Notes:** Perubahan harga tidak mempengaruhi transaksi yang sudah terjadi.

---

### US-PROD-004
```
As an Admin Penjualan
I want menonaktifkan produk yang sudah tidak dijual
So that produk tidak muncul di pilihan transaksi baru tapi riwayatnya terjaga
```
**Priority:** High
**Acceptance Notes:** Soft delete — produk nonaktif tidak muncul di form transaksi baru.

---

### US-PROD-005
```
As an Admin Penjualan
I want mengupload gambar untuk setiap produk
So that katalog UMKM menampilkan produk secara visual menarik
```
**Priority:** Medium
**Acceptance Notes:** Format JPG/PNG, max 2MB, resize otomatis ke 800x800px.

---

### US-PROD-006
```
As an Admin Penjualan
I want mengelola kategori produk
So that produk dapat dikelompokkan dan dilaporkan per kategori
```
**Priority:** Medium
**Acceptance Notes:** CRUD kategori; tidak bisa hapus kategori yang masih memiliki produk.

---

### US-PROD-007
```
As an Owner
I want melihat semua produk beserta info stok terkini
So that saya bisa memantau kondisi inventori secara keseluruhan
```
**Priority:** Medium
**Acceptance Notes:** Tampilkan stok saat ini di samping info produk.

---

### US-PROD-008
```
As an Admin Penjualan
I want mengatur stok minimum per produk
So that sistem dapat memberikan alert saat stok di bawah ambang
```
**Priority:** Medium
**Acceptance Notes:** Field minimumStock di form produk; digunakan oleh modul gudang dan dashboard.

---

## 3. Use Case Description

### UC-PROD-001: Tambah Produk Baru

| Elemen | Detail |
|--------|--------|
| **Use Case ID** | UC-PROD-001 |
| **Nama** | Tambah Produk Baru |
| **Actor** | Admin Penjualan |
| **Preconditions** | Admin Penjualan sudah login; minimal 1 kategori sudah tersedia |
| **Trigger** | Admin klik tombol "Tambah Produk" |

**Main Flow:**
1. Admin klik tombol "+ Tambah Produk"
2. Sistem tampilkan form produk (modal atau halaman baru)
3. Admin isi: nama, kategori, harga jual, satuan, stok minimum
4. Kode produk otomatis ter-generate (bisa diubah manual)
5. Admin opsional upload gambar
6. Admin isi deskripsi (opsional)
7. Admin klik "Simpan"
8. Sistem validasi semua field
9. Sistem cek keunikan kode produk
10. Sistem simpan ke database
11. Jika ada gambar: upload ke storage, simpan URL
12. Sistem tampilkan notifikasi sukses
13. Tabel produk di-refresh

**Alternative Flow:**
- **AF-1:** Admin pilih "Generate Kode Otomatis" → sistem buat kode format `PROD-YYYYMMDD-NNN`

**Exception Flow:**

| Kode | Kondisi | Respon Sistem |
|------|---------|---------------|
| EX-1 | Kode produk duplikat | "Kode produk sudah digunakan" |
| EX-2 | Nama produk kosong | "Nama produk wajib diisi" |
| EX-3 | Harga ≤ 0 | "Harga harus lebih dari 0" |
| EX-4 | File gambar > 2MB | "Ukuran gambar maksimal 2MB" |
| EX-5 | Kategori tidak ada | "Pilih kategori yang valid" |

---

### UC-PROD-002: Edit Produk

| Elemen | Detail |
|--------|--------|
| **Use Case ID** | UC-PROD-002 |
| **Nama** | Edit Produk |
| **Actor** | Admin Penjualan |
| **Preconditions** | Produk sudah ada di sistem |

**Main Flow:**
1. Admin klik icon edit pada baris produk
2. Form pre-filled dengan data produk saat ini
3. Admin ubah field yang diinginkan
4. Admin klik "Perbarui"
5. Sistem validasi perubahan
6. Sistem simpan perubahan (termasuk timestamp `updatedAt`)
7. Notifikasi sukses

**Catatan Bisnis:**
- Perubahan harga TIDAK mengubah harga di transaksi yang sudah terjadi
- Kode produk tidak bisa diubah setelah produk digunakan dalam transaksi

---

### UC-PROD-003: Nonaktifkan / Aktifkan Produk

| Elemen | Detail |
|--------|--------|
| **Use Case ID** | UC-PROD-003 |
| **Nama** | Toggle Status Produk |
| **Actor** | Admin Penjualan |
| **Preconditions** | Produk sudah ada |

**Main Flow:**
1. Admin klik toggle status atau tombol "Nonaktifkan"
2. Sistem tampilkan konfirmasi dialog
3. Admin konfirmasi
4. Sistem update `isActive = false` (soft)
5. Produk tidak muncul di:
   - Form transaksi penjualan baru
   - Katalog UMKM
6. Notifikasi sukses

---

## 4. Functional Requirements

| ID | Requirement | Description | Actor | Validasi |
|----|-------------|-------------|-------|----------|
| FR-PROD-001 | Tambah Produk | Form tambah produk dengan semua field yang diperlukan | Admin Penjualan | Nama, kategori, harga, satuan wajib |
| FR-PROD-002 | Kode Auto-Generate | Kode produk otomatis format PROD-[YYYYMMDD]-[NNN] | Sistem | Unique constraint di DB |
| FR-PROD-003 | Edit Produk | Ubah data produk yang sudah ada | Admin Penjualan | Kode tidak bisa diubah jika sudah ada di transaksi |
| FR-PROD-004 | Soft Delete | Nonaktifkan produk tanpa hapus data | Admin Penjualan | isActive flag |
| FR-PROD-005 | Upload Gambar | Upload 1 gambar produk per produk | Admin Penjualan | JPG/PNG, max 2MB |
| FR-PROD-006 | Resize Gambar | Otomatis resize gambar ke 800x800px | Sistem | Sharp library |
| FR-PROD-007 | Daftar Produk | Tabel produk dengan pagination, search, filter | Admin, Owner | Default: tampilkan aktif saja |
| FR-PROD-008 | Search Produk | Cari produk by nama atau kode | Admin, Owner | Case-insensitive, partial match |
| FR-PROD-009 | Filter Kategori | Filter daftar produk berdasarkan kategori | Admin, Owner | Multi-select filter |
| FR-PROD-010 | Filter Status | Filter produk aktif/nonaktif | Admin, Owner | Default: aktif |
| FR-PROD-011 | CRUD Kategori | Buat, edit, hapus kategori produk | Admin Penjualan | Hapus tidak bisa jika ada produk |
| FR-PROD-012 | Stok Minimum | Field stok minimum per produk untuk alert | Admin Penjualan | Bilangan bulat >= 0 |
| FR-PROD-013 | Satuan Produk | Pilihan satuan: kg, ton, sak, pcs | Admin Penjualan | Enum predefined |
| FR-PROD-014 | Pagination | Tabel produk dengan pagination 10/20/50 per halaman | Admin, Owner | Default 20 per halaman |

---

## 5. Non-Functional Requirements

### Performance
| Requirement | Target |
|-------------|--------|
| Daftar produk load | < 1 detik untuk 100 produk |
| CRUD operasi | < 500ms |
| Upload gambar | < 3 detik untuk 2MB file |
| Search response | < 300ms |

### Security
- Upload file: validasi MIME type di server (bukan hanya ekstensi)
- Simpan file di direktori di luar web root atau gunakan cloud storage
- File nama di-sanitize untuk mencegah path traversal
- RBAC: hanya Admin Penjualan dan Owner yang bisa akses

### Scalability
- Gambar disimpan di object storage (lokal VPS atau Cloudflare R2)
- Pagination untuk daftar produk > 100 item

---

## 6. Business Rules

| BR-ID | Rule | Description |
|-------|------|-------------|
| BR-PROD-001 | Kode Unik | Kode produk harus unik di seluruh sistem, case-insensitive |
| BR-PROD-002 | Harga Positif | Harga jual wajib > 0 |
| BR-PROD-003 | Soft Delete | Produk tidak pernah dihapus permanen; hanya dinonaktifkan |
| BR-PROD-004 | Kode Terkunci | Kode produk tidak bisa diubah setelah ada dalam transaksi |
| BR-PROD-005 | Kategori Aktif | Hanya kategori aktif yang bisa dipilih saat tambah/edit produk |
| BR-PROD-006 | Stok Referensi | Stok minimum digunakan oleh modul gudang untuk notifikasi alert |
| BR-PROD-007 | Katalog Sync | Produk dengan `isActive = true` otomatis muncul di katalog UMKM |
| BR-PROD-008 | Harga Historis | Perubahan harga tidak retroaktif — transaksi lama pakai harga saat transaksi |

---

## 7. User Flow

### Create Produk — Success Flow
```
1. Admin klik "+ Tambah Produk"
2. Modal/halaman form terbuka
3. Sistem generate kode otomatis (bisa diubah)
4. Admin isi nama produk
5. Admin pilih kategori
6. Admin isi harga jual (Rp)
7. Admin pilih satuan (kg/sak/dll)
8. Admin isi stok minimum
9. Admin upload gambar (opsional)
10. Admin isi deskripsi (opsional)
11. Admin klik "Simpan"
12. [Loading state]
13. Validasi client-side OK
14. POST /api/products
15. Server validasi + cek kode duplikat
16. Simpan ke DB + upload gambar
17. Response 201
18. Toast "Produk berhasil ditambahkan"
19. Tabel refresh, produk baru muncul
```

### Edit Harga — Business Rule Flow
```
1. Admin edit harga produk dari Rp 5000 → Rp 6000
2. Sistem simpan perubahan dengan timestamp
3. Transaksi BARU menggunakan harga Rp 6000
4. Transaksi LAMA tetap menggunakan Rp 5000 (snapshot harga)
```

### Nonaktifkan Produk — Flow
```
1. Admin klik tombol "Nonaktifkan" pada produk
2. Dialog konfirmasi: "Produk ini tidak akan muncul di transaksi baru. Lanjutkan?"
3. Admin klik "Ya, Nonaktifkan"
4. PATCH /api/products/:id/toggle-status
5. isActive = false
6. Toast "Produk dinonaktifkan"
7. Produk masih muncul di list dengan label "Nonaktif"
8. Produk tidak muncul di dropdown transaksi baru
```

---

## 8. Data Flow

### Create Product Flow
```
Browser Form
  └─► POST /api/products (multipart/form-data)
        │  { name, code, categoryId, price, unit, minStock, image?, description? }
        ▼
  Zod Validation
        │
        ▼
  ProductService.create(dto)
        │
        ├─► Check kode duplikat: ProductRepository.findByCode(code)
        ├─► Process image: ImageService.uploadAndResize(file)
        │     └─► Simpan ke /uploads/products/
        └─► ProductRepository.create(data)
              │  Prisma insert
              ▼
        PostgreSQL
              │
              ▼
  Response 201 + product data
        │
        ▼
  Browser: toast sukses + refresh tabel
```

---

## 9. Validation Rules

```typescript
// schemas/product.schema.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z
    .string({ required_error: 'Nama produk wajib diisi' })
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter')
    .trim(),

  code: z
    .string()
    .regex(/^[A-Z0-9\-]+$/, 'Kode hanya boleh huruf besar, angka, dan tanda hubung')
    .min(3, 'Kode minimal 3 karakter')
    .max(20, 'Kode maksimal 20 karakter')
    .optional(), // auto-generate jika tidak diisi

  categoryId: z
    .string({ required_error: 'Kategori wajib dipilih' })
    .cuid('ID kategori tidak valid'),

  price: z
    .number({ required_error: 'Harga wajib diisi' })
    .positive('Harga harus lebih dari 0')
    .max(100_000_000, 'Harga terlalu besar'),

  unit: z.enum(['KG', 'TON', 'SAK', 'PCS'], {
    errorMap: () => ({ message: 'Satuan tidak valid' })
  }),

  minimumStock: z
    .number()
    .int('Stok minimum harus bilangan bulat')
    .min(0, 'Stok minimum tidak boleh negatif')
    .default(0),

  description: z
    .string()
    .max(500, 'Deskripsi maksimal 500 karakter')
    .optional(),
});

export const updateProductSchema = createProductSchema.partial().omit({ code: true });

export const productQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().cuid().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('active'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  sort: z.enum(['name', 'code', 'price', 'createdAt']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

// Validasi upload gambar (server-side)
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
```

---

## 10. Error Handling

```json
{
  "success": false,
  "message": "Validasi gagal",
  "code": "VALIDATION_ERROR",
  "errors": {
    "name": ["Nama produk wajib diisi"],
    "price": ["Harga harus lebih dari 0"],
    "code": ["Kode produk sudah digunakan"]
  }
}
```

### Error Catalog

| HTTP Status | Code | Kondisi | Pesan User |
|-------------|------|---------|------------|
| 400 | VALIDATION_ERROR | Input tidak valid | "Data yang dikirim tidak valid" |
| 409 | DUPLICATE_CODE | Kode sudah ada | "Kode produk sudah digunakan" |
| 404 | PRODUCT_NOT_FOUND | Produk tidak ada | "Produk tidak ditemukan" |
| 422 | CODE_LOCKED | Kode tidak bisa diubah | "Kode produk tidak bisa diubah setelah ada dalam transaksi" |
| 413 | FILE_TOO_LARGE | Gambar > 2MB | "Ukuran file maksimal 2MB" |
| 415 | INVALID_FILE_TYPE | Bukan JPG/PNG | "Format gambar harus JPG, PNG, atau WebP" |
| 409 | CATEGORY_HAS_PRODUCTS | Hapus kategori berisi produk | "Kategori tidak bisa dihapus karena masih memiliki produk" |

---

## 11. Acceptance Criteria

```gherkin
Feature: Manajemen Produk

  Scenario: Tambah produk baru berhasil
    Given saya login sebagai Admin Penjualan
    And terdapat kategori "Tepung Tapioka" di sistem
    When saya mengisi form produk: nama "Tapioka Premium 25kg", harga 150000, satuan SAK
    And saya klik "Simpan"
    Then produk baru muncul di daftar produk
    And kode produk otomatis ter-generate
    And toast "Produk berhasil ditambahkan" muncul

  Scenario: Kode produk duplikat ditolak
    Given terdapat produk dengan kode "PROD-001"
    When saya mencoba tambah produk baru dengan kode "PROD-001"
    Then sistem menampilkan error "Kode produk sudah digunakan"
    And produk tidak tersimpan

  Scenario: Edit harga produk tidak mengubah transaksi lama
    Given produk "Tapioka Reguler" dengan harga Rp 100.000
    And terdapat transaksi terdahulu dengan produk ini seharga Rp 100.000
    When Admin mengubah harga menjadi Rp 120.000
    Then transaksi lama tetap menampilkan Rp 100.000
    And transaksi baru menggunakan Rp 120.000

  Scenario: Upload gambar produk berhasil
    Given saya mengisi form produk dengan semua field wajib
    When saya mengupload gambar "produk.jpg" berukuran 1.5MB
    Then gambar tersimpan dan di-resize ke 800x800px
    And URL gambar tersimpan di database

  Scenario: Nonaktifkan produk
    Given terdapat produk aktif "Tapioka Grade B"
    When Admin mengklik "Nonaktifkan" dan konfirmasi
    Then produk tidak muncul di dropdown transaksi baru
    And produk masih muncul di daftar produk dengan label "Nonaktif"
    And riwayat transaksi produk tetap tersedia
```

---

## 12. Database Design

```prisma
model Product {
  id            String          @id @default(cuid())
  code          String          @unique
  name          String
  description   String?
  price         Decimal         @db.Decimal(15, 2)
  unit          ProductUnit
  minimumStock  Int             @default(0) @map("minimum_stock")
  imageUrl      String?         @map("image_url")
  isActive      Boolean         @default(true) @map("is_active")
  categoryId    String          @map("category_id")
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @updatedAt @map("updated_at")
  deletedAt     DateTime?       @map("deleted_at") // soft delete

  category      ProductCategory @relation(fields: [categoryId], references: [id])
  stockMovements StockMovement[]
  transactionItems TransactionItem[]

  @@index([code])
  @@index([categoryId])
  @@index([isActive])
  @@index([name])
  @@map("products")
}

model ProductCategory {
  id        String    @id @default(cuid())
  name      String    @unique
  isActive  Boolean   @default(true) @map("is_active")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  products  Product[]

  @@map("product_categories")
}

enum ProductUnit {
  KG
  TON
  SAK
  PCS
}
```

### Relationship
```
product_categories (1) ──────── (N) products
products (1) ──────────────── (N) stock_movements
products (1) ──────────────── (N) transaction_items
```

### Index Strategy
| Kolom | Alasan |
|-------|--------|
| code | Lookup unik, cek duplikat |
| name | Full-text search |
| isActive | Filter produk aktif (most common query) |
| categoryId | Filter per kategori |

---

## 13. Database Impact Analysis

- Tabel baru: `products`, `product_categories`
- `products` adalah **master table** yang direferensi oleh `stock_movements` dan `transaction_items`
- Soft delete: kolom `deletedAt` — query default filter `deletedAt IS NULL`
- Harga disimpan sebagai `Decimal(15,2)` untuk akurasi finansial

---

## 14. API Requirements

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/products` | Daftar produk dengan filter & pagination | ✅ | Owner, Admin |
| POST | `/api/products` | Tambah produk baru | ✅ | Admin Penjualan |
| GET | `/api/products/:id` | Detail produk | ✅ | Owner, Admin |
| PATCH | `/api/products/:id` | Edit produk | ✅ | Admin Penjualan |
| PATCH | `/api/products/:id/toggle-status` | Aktifkan/nonaktifkan | ✅ | Admin Penjualan |
| DELETE | `/api/products/:id` | Soft delete produk | ✅ | Admin Penjualan |
| POST | `/api/products/:id/image` | Upload gambar | ✅ | Admin Penjualan |
| GET | `/api/product-categories` | Daftar kategori | ✅ | Owner, Admin |
| POST | `/api/product-categories` | Tambah kategori | ✅ | Admin Penjualan |
| PATCH | `/api/product-categories/:id` | Edit kategori | ✅ | Admin Penjualan |
| DELETE | `/api/product-categories/:id` | Hapus kategori | ✅ | Admin Penjualan |

### GET /api/products Response
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "clxxxx",
        "code": "PROD-20250101-001",
        "name": "Tapioka Premium 25kg",
        "price": 150000,
        "unit": "SAK",
        "minimumStock": 50,
        "imageUrl": "/uploads/products/prod-001.webp",
        "isActive": true,
        "category": { "id": "clyyy", "name": "Tepung Tapioka" },
        "currentStock": 120
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

### POST /api/products Request Body (multipart/form-data)
```
name: "Tapioka Premium 25kg"
code: "PROD-001" (opsional, auto-generate jika kosong)
categoryId: "clyyy"
price: 150000
unit: "SAK"
minimumStock: 50
description: "Tepung tapioka grade premium, kemasan 25kg"
image: [File]
```

---

## 15. UI Components

### Product List Page (`/src/routes/(app)/produk/+page.svelte`)

```
┌────────────────────────────────────────────────────┐
│  Manajemen Produk               [+ Tambah Produk]  │
├────────────────────────────────────────────────────┤
│  🔍 [Cari nama/kode...]  [Kategori ▼] [Status ▼]  │
├────────────────────────────────────────────────────┤
│  Gambar │ Nama          │ Kode      │ Harga │ Stok  │
│  [img]  │ Tapioka Prem  │ PROD-001  │ 150k  │ 120  │
│         │               │           │       │[Edit][⋮]│
└────────────────────────────────────────────────────┘
```

**Components:**
- `<ProductTable>` — Tabel dengan sortable columns
- `<ProductFormModal>` — Modal create/edit dengan Zod validation
- `<ImageUploader>` — Drag-drop + preview gambar
- `<CategorySelect>` — Dropdown kategori dengan opsi "Tambah Baru"
- `<ProductStatusBadge>` — Badge hijau (Aktif) / abu (Nonaktif)
- `<ConfirmDialog>` — Dialog konfirmasi nonaktifkan produk
- `<SearchInput>` — Debounced search input (300ms)
- `<Pagination>` — Pagination komponen

---

## 16. Edge Cases

| Edge Case | Kondisi | Solusi |
|-----------|---------|--------|
| Kode auto-generate collision | Dua user tambah produk bersamaan | Unique constraint di DB + retry generate |
| Gambar corrupt | File rusak diupload | Validasi file signature (magic bytes) di server |
| Edit produk saat dipakai transaksi | Ubah nama produk | Izinkan — nama bisa berubah, kode tidak |
| Hapus kategori dengan produk | Kategori masih punya produk aktif | Tolak hapus, tampilkan jumlah produk |
| Stok minimum 0 | Tidak ada alert yang diinginkan | Valid — stok minimum 0 = tidak perlu alert |
| Nama produk duplikat | Nama boleh sama, kode yang harus unik | Izinkan nama sama, validasi hanya di kode |
| Search kosong | Field search dikosongkan | Return semua produk (dengan filter aktif lain) |

---

## 17. Security Requirements

- Upload file: validasi MIME type server-side dengan `file-type` library
- Sanitasi nama file upload (hapus karakter khusus, path traversal)
- RBAC: hanya Admin Penjualan yang bisa CUD; Owner dan Admin bisa R
- Rate limit: POST/PATCH max 20 request/menit per user
- XSS: sanitasi field description (strip HTML tags)

---

## 18. Testing Strategy

```typescript
// Unit Tests
describe('ProductService', () => {
  it('generates unique product code in format PROD-YYYYMMDD-NNN', () => {});
  it('rejects duplicate product code', async () => {});
  it('soft deletes product correctly', async () => {});
  it('does not allow category deletion with products', async () => {});
});

// Integration Tests
describe('POST /api/products', () => {
  it('creates product with auto-generated code', async () => {});
  it('returns 409 on duplicate code', async () => {});
  it('returns 400 on missing required fields', async () => {});
});

// E2E Tests (Playwright)
test('Admin dapat tambah produk baru dengan gambar', async ({ page }) => {});
test('Search produk menampilkan hasil yang relevan', async ({ page }) => {});
test('Nonaktifkan produk menyembunyikan dari transaksi baru', async ({ page }) => {});
```

---

## 19. DevOps & Deployment

```env
UPLOAD_DIR=/app/uploads/products
MAX_UPLOAD_SIZE_MB=2
IMAGE_RESIZE_WIDTH=800
IMAGE_RESIZE_HEIGHT=800
```

### File Storage Strategy
- Development: Local filesystem di `/app/uploads/`
- Production: Cloudflare R2 atau direktori VPS dengan Nginx serving

---

## 20. Definition of Done

```markdown
- [ ] CRUD produk selesai (create, read, update, soft delete)
- [ ] Auto-generate kode produk selesai
- [ ] Upload dan resize gambar produk selesai
- [ ] CRUD kategori produk selesai
- [ ] Search dan filter produk selesai
- [ ] Pagination selesai
- [ ] Stok minimum field selesai
- [ ] Toggle status aktif/nonaktif selesai
- [ ] API endpoints semua selesai dan tertest
- [ ] Validasi Zod semua field selesai
- [ ] Error handling semua kasus selesai
- [ ] Unit test ProductService coverage > 80%
- [ ] E2E test CRUD produk selesai
- [ ] RBAC ditest: Owner read-only, Admin CUD
- [ ] File upload security ditest
- [ ] Deploy staging berhasil
- [ ] QA sign-off
```

---

*Dokumen ini adalah PRD/SRS resmi untuk Fitur Manajemen Produk CV TapioLeaf Management System.*
*Versi: 1.0.0 | Status: Draft | Last Updated: 2025-01-01*
