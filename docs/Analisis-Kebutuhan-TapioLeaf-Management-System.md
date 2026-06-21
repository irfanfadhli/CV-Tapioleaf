# Analisis Kebutuhan Sistem — CV TapioLeaf Management System

**Versi Dokumen:** 2.0.0
**Tanggal:** 2026-06-21
**Status:** Final (implemented)

---

## 1. Gambaran Umum Sistem

CV TapioLeaf Management System adalah sistem manajemen operasional terpadu berbasis web yang mencakup seluruh alur bisnis — dari penerimaan bahan baku (singkong) dari supplier, produksi tepung tapioka, manajemen stok gudang, katalog produk, hingga penjualan online dengan integrasi payment gateway.

Sistem dibangun menggunakan **SvelteKit 5** (runes mode) dengan **PostgreSQL (Neon/Supabase)** sebagai basis data, **Drizzle ORM** sebagai lapisan akses data, **Tailwind CSS v4** + **shadcn-svelte** untuk UI, dan **Better Auth** untuk autentikasi.

### Modul yang Telah Diimplementasikan

| No | Modul | Status | Deskripsi |
|----|-------|--------|-----------|
| 1 | Authentication & Otorisasi | ✅ | Google OAuth, RBAC (5 roles), admin whitelist, audit log |
| 2 | Manajemen Produk | ✅ | CRUD produk, kategori, upload gambar (Supabase S3), soft delete |
| 3 | Manajemen Stok Gudang | ✅ | Stok masuk/keluar, riwayat pergerakan, alert stok kritis |
| 4 | Produksi Harian | ✅ | Catat produksi, progress bar 4 ton/hari, DRAFT→CONFIRMED, auto-stock sync |
| 5 | Supplier | ✅ | CRUD supplier, soft delete dengan FK protection |
| 6 | Penerimaan Singkong | ✅ | Gross→Tara→Net→Refraction→Final auto-calc, live form, daily summary |
| 7 | Dashboard Admin | ✅ | KPI cards, margin per produk chart, periode filter, PDF report |
| 8 | Dashboard Customer | ✅ | Welcome card, recent orders, quick links ke katalog/pesanan |
| 9 | Katalog Produk | ✅ | Public catalog with search, stock indicator, pagination |
| 10 | Orders & Xendit | ✅ | Checkout, invoice creation, webhook callback, order history |
| 11 | Landing Page | ✅ | Company profile, produk, visi-misi, proses produksi, kontak |

---

## 2. Arsitektur Teknis

### Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | SvelteKit 5 (runes: $state, $derived, $props) |
| UI Framework | Tailwind CSS v4 + shadcn-svelte |
| Database | PostgreSQL (Neon via Supabase pooler) |
| ORM | Drizzle ORM |
| Auth | Better Auth + Google OAuth |
| Storage | Supabase S3-compatible (jatuh ke Vercel Blob, lalu lokal) |
| Payment | Xendit |
| Charts | SVG-based (zero dependencies) |
| PDF | PDFKit |
| Icons | Lucide Svelte |

### Struktur Database

```sql
-- Auth (Better Auth)
user, session, account, verification

-- Master Data
product_categories, products, suppliers

-- Operasional
cassava_receipts, production_entries, stock_movements

-- Penjualan
orders, order_items

-- Audit & Log
auth_logs
```

### Alur Data End-to-End

```
Supplier → Penerimaan Singkong → Produksi Harian (4 ton/hari)
                                           ↓
                                    Gudang (stock movements)
                                           ↓
                           Kategori Produk → Produk → Katalog
                                                       ↓
                                              Customer Order
                                                       ↓
                                              Xendit Payment
                                                       ↓
                                              Gudang (stock out)
```

---

## 3. Aktor dan Peran (RBAC)

| Role | Akses |
|------|-------|
| `owner` | Full access — semua modul |
| `admin_penjualan` | Dashboard, Produk, Kategori, Orders |
| `petugas_gudang` | Gudang, Supplier, Penerimaan Singkong |
| `bagian_produksi` | Produksi Harian |
| `pembeli_umkm` | Account, Orders, Katalog |

---

## 4. Fitur per Modul

### 4.1 Authentication (Better Auth + Google OAuth)
- Login via Google OAuth dengan `prompt=select_account`
- Role default: `pembeli_umkm`
- Admin auto-promotion via `ADMIN_EMAILS` env var
- Route guard di `hooks.server.ts` berdasarkan role
- Session via HTTP-only cookies
- Custom sign-out yang membersihkan semua Better Auth cookies

### 4.2 Manajemen Produk
- CRUD produk + kategori
- Upload gambar ke Supabase S3 (fallback Vercel Blob → lokal)
- Soft delete (`deletedAt`)
- Toggle status aktif/non-aktif
- Harga modal (`costPrice`) untuk kalkulasi margin
- Search, sort, pagination

### 4.3 Manajemen Stok Gudang
- Stok masuk (`MANUAL_IN`) dan stok keluar (`MANUAL_OUT`)
- Event sourcing: stok = SUM(quantity_change)
- Auto-negate untuk stok keluar
- Alert stok kritis (stok < minimum_stock)
- Edit dan delete riwayat pergerakan
- Riwayat dengan filter

### 4.4 Produksi Harian
- Target: 4.000 kg/hari dengan progress bar
- Status: DRAFT → CONFIRMED
- Auto-create stock movement (`PURCHASE_IN`) saat create
- Riwayat muncul setelah konfirmasi
- Menampilkan stok singkong tersedia dari cassava_receipts

### 4.5 Supplier
- CRUD supplier (nama, telepon, alamat)
- Delete dengan pengecekan FK (tidak bisa hapus jika punya receipt)
- Tampilan card grid

### 4.6 Penerimaan Singkong
- Kalkulasi otomatis: Gross → Tara → Net → Refraction → Final → Total Cost
- Live form dengan Svelte 5 $derived
- Summary cards (total gross, refraksi, final, biaya)
- Edit dan delete receipt
- Supplier management inline

### 4.7 Dashboard Admin
- 4 KPI cards: Penjualan, Produksi, Stok, Pendapatan (+margin %)
- Margin per produk chart (sorted by margin descending)
- Period filter: Hari Ini / Minggu Ini / Bulan Ini
- Recent transactions
- Stock alert banner
- PDF report download
- Widget isolation via Promise.allSettled

### 4.8 Katalog & Orders
- Public product catalog dengan search dan pagination
- Checkout flow: customer login → pilih produk → checkout → Xendit invoice
- Xendit webhook callback untuk update status payment
- Order history untuk customer
- Detail order dengan status badge

### 4.9 Landing Page
- Hero section dengan logo
- Produk Kami (product grid)
- Tentang Kami (company bio + tabel informasi)
- Visi & Misi
- Proses Produksi
- Komitmen Kualitas
- Kontak + Google Maps
- Navbar responsif dengan hamburger menu

---

## 5. Ketergantungan Antar Modul

```
                    ┌──────────────────┐
                    │   Authentication  │
                    │   (Better Auth)   │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌────────────┐ ┌────────────┐ ┌──────────────┐
      │  Supplier  │ │  Produk    │ │   Landing    │
      │           │ │  + Kategori│ │   Page +     │
      └─────┬─────┘ └──────┬─────┘ │   Catalog    │
            │              │       └──────────────┘
            ▼              ▼
      ┌────────────┐ ┌────────────┐
      │  Cassava   │ │  Produksi  │
      │  Receiving │ │  Harian    │
      └────────────┘ └──────┬─────┘
                            │ (auto stock)
                            ▼
                      ┌────────────┐
                      │   Gudang   │◄── Orders
                      │  (Stock)   │     (stock out)
                      └────────────┘
                            │
                            ▼
                    ┌────────────────┐
                    │   Dashboard    │
                    │   (Analytics)  │
                    └────────────────┘
```

### Alur Kritis

1. **Penerimaan Singkong → Produksi**: Cassava receipts menyediakan bahan baku untuk produksi. Stok singkong tersedia ditampilkan di halaman produksi.

2. **Produksi → Gudang**: Setiap entry produksi secara otomatis membuat stock movement `PURCHASE_IN` ke gudang.

3. **Gudang → Produk**: Stok gudang dihitung per produk via SUM(quantity_change) dan ditampilkan di katalog.

4. **Orders → Gudang**: Saat order dibayar via Xendit, callback webhook mengupdate status order.

---

## 6. Keamanan

- Semua route dilindungi oleh RBAC di `hooks.server.ts`
- Session via HTTP-only, secure, SameSite cookies
- Google OAuth hanya untuk login (no email/password)
- Admin emails di-whitelist via `ADMIN_EMAILS` env var
- Xendit webhook diverifikasi via `XENDIT_WEBHOOK_TOKEN`
- API endpoint dashboard hanya untuk role owner & admin_penjualan
- File upload divalidasi (tipe + ukuran)

---

## 7. Teknologi & Deployment

- **Hosting**: Vercel (via `@sveltejs/adapter-vercel`)
- **Database**: PostgreSQL (Supabase pooler via `pg`)
- **Storage**: Supabase S3-compatible (produksi), local (dev)
- **CI/CD**: Vercel auto-deploy dari git
- **Environment Variables**: 30+ env vars untuk konfigurasi

---

## 8. Status & Rekomendasi

### Sudah Diimplementasikan ✅
- Auth, RBAC, route guards
- Produk, kategori, upload gambar
- Gudang, stock movements, critical alerts
- Produksi harian dengan target 4 ton
- Supplier CRUD
- Penerimaan singkong dengan auto-calc
- Admin dashboard dengan margin chart + PDF
- Landing page, katalog publik
- Customer account, orders
- Xendit payment integration
- PDF report generation

### Potensi Pengembangan Selanjutnya
- Production batch integration (link cassava receipts ke produksi)
- Payment tracking untuk supplier
- Export Excel/CSV
- Notifikasi real-time (WebSocket/SSE)
- Mobile app / PWA
- Multi-warehouse support
