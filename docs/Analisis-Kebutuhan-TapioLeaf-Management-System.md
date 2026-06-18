# Analisis Kebutuhan Sistem
# CV TapioLeaf Management System

**Versi Dokumen:** 1.0.0
**Tanggal:** 2025-01-01
**Status:** Draft
**Sumber:** PRD-01 s/d PRD-05

---

## Daftar Isi

1. [Gambaran Umum Sistem](#1-gambaran-umum-sistem)
2. [Konteks Bisnis](#2-konteks-bisnis)
3. [Aktor dan Peran](#3-aktor-dan-peran)
4. [Ringkasan Fitur](#4-ringkasan-fitur)
5. [Analisis Kebutuhan Fungsional](#5-analisis-kebutuhan-fungsional)
6. [Analisis Kebutuhan Non-Fungsional](#6-analisis-kebutuhan-non-fungsional)
7. [Ketergantungan Antar Modul](#7-ketergantungan-antar-modul)
8. [Analisis Risiko](#8-analisis-risiko)
9. [Prioritas Pengembangan](#9-prioritas-pengembangan)
10. [Kesimpulan](#10-kesimpulan)

---

## 1. Gambaran Umum Sistem

CV TapioLeaf Management System adalah sistem manajemen operasional terpadu berbasis web yang dirancang untuk mendukung seluruh alur operasional CV TapioLeaf — sebuah perusahaan pengolahan singkong menjadi tepung tapioka. Sistem ini menggantikan proses manual (catatan buku) yang selama ini digunakan untuk mengelola produksi, stok, penjualan, dan monitoring bisnis.

Sistem dibangun menggunakan **SvelteKit** sebagai framework utama dengan **PostgreSQL** (Neon) sebagai basis data, dan **Prisma ORM** sebagai lapisan akses data. Arsitektur ini memungkinkan Server-Side Rendering (SSR) yang cepat dan aman untuk lingkungan operasional multi-pengguna.

### Ruang Lingkup Sistem (v1.0)

Sistem mencakup **5 modul utama** yang saling terintegrasi:

| No | Modul | Kode PRD | Status |
|----|-------|----------|--------|
| 1 | Authentication & Otorisasi | PRD-01 | Draft |
| 2 | Dashboard Monitoring | PRD-02 | Draft |
| 3 | Manajemen Produk | PRD-03 | Draft |
| 4 | Manajemen Stok Gudang | PRD-04 | Draft |
| 5 | Produksi Harian | PRD-05 | Draft |

---

## 2. Konteks Bisnis

### 2.1 Profil Perusahaan

CV TapioLeaf bergerak di bidang pengolahan singkong menjadi tepung tapioka dengan kapasitas produksi hingga **4.000 kg (4 ton) per hari**. Produk dijual dalam berbagai varian kemasan dan grade kualitas, dengan pelanggan utama dari kalangan UMKM dan distributor.

### 2.2 Masalah Bisnis yang Diselesaikan

Sebelum sistem ini dibangun, operasional CV TapioLeaf menghadapi sejumlah masalah mendasar yang berdampak langsung pada efisiensi dan akurasi data:

| Kategori | Masalah Utama | Dampak Bisnis |
|----------|---------------|---------------|
| **Keamanan** | Tidak ada kontrol akses pengguna | Data sensitif dapat diakses sembarang pihak |
| **Monitoring** | Data stok, produksi, dan penjualan tidak terintegrasi | Pengambilan keputusan Owner terlambat |
| **Produk** | Tidak ada master data produk terpusat | Harga dan kode produk tidak konsisten |
| **Gudang** | Pencatatan stok manual di buku gudang | Selisih stok fisik vs catatan tidak terdeteksi |
| **Produksi** | Pencatatan produksi harian masih manual | Tidak ada sinkronisasi real-time ke stok gudang |

### 2.3 Tujuan Strategis Sistem

- Mendigitalisasi seluruh alur operasional dari produksi hingga penjualan
- Menyediakan visibilitas data real-time bagi Owner
- Menghilangkan double-entry data antar departemen
- Membangun fondasi audit trail yang dapat dipertanggungjawabkan
- Mendukung skalabilitas bisnis ke depan

---

## 3. Aktor dan Peran

Sistem menerapkan **Role-Based Access Control (RBAC)** dengan 4 peran pengguna aktif dan 1 peran sistem:

| Role | Nama Peran | Akses Modul | Tanggung Jawab Utama |
|------|-----------|-------------|----------------------|
| `owner` | Owner | Semua modul (read-only untuk operasional) | Monitoring, pengambilan keputusan |
| `admin_penjualan` | Admin Penjualan | Manajemen Produk, Penjualan | Kelola master produk, proses transaksi |
| `petugas_gudang` | Petugas Gudang | Manajemen Stok Gudang | Catat pergerakan stok, adjustment |
| `bagian_produksi` | Bagian Produksi | Produksi Harian | Input dan konfirmasi hasil produksi harian |
| `sistem` | Sistem (Internal) | Semua modul | Trigger otomatis (sinkronisasi stok dari produksi) |

### Matriks Akses Modul

| Modul | Owner | Admin Penjualan | Petugas Gudang | Bagian Produksi |
|-------|-------|-----------------|----------------|-----------------|
| Authentication | ✅ | ✅ | ✅ | ✅ |
| Dashboard Monitoring | ✅ | 🔶 (terbatas) | ❌ | ❌ |
| Manajemen Produk | 👁️ | ✅ | 👁️ | ❌ |
| Manajemen Stok Gudang | 👁️ | ❌ | ✅ | ❌ |
| Produksi Harian | 👁️ | ❌ | ❌ | ✅ |

> Keterangan: ✅ Akses penuh | 👁️ Baca saja | 🔶 Akses terbatas | ❌ Tidak ada akses

---

## 4. Ringkasan Fitur

### 4.1 Fitur 1 — Authentication (PRD-01)

**Tujuan:** Memastikan keamanan akses sistem dan pembatasan hak pengguna berdasarkan role.

**Fitur Utama:**
- Login dengan email dan password (Argon2id hashing)
- Session management berbasis cookie HTTP-only (8 jam timeout)
- Role-Based Access Control (RBAC) untuk 4 role pengguna
- Route guard via `hooks.server.ts` SvelteKit
- Rate limiting: 5 percobaan gagal → kunci 15 menit
- Audit log setiap aktivitas login/logout
- Auto-expire session dan notifikasi sebelum expired

**Batasan (Out of Scope v1.0):** Registrasi mandiri, OAuth/SSO, 2FA, password recovery via SMS, biometric authentication.

---

### 4.2 Fitur 2 — Dashboard Monitoring (PRD-02)

**Tujuan:** Menyediakan ringkasan eksekutif bisnis real-time bagi Owner dalam satu tampilan terpadu.

**Fitur Utama:**
- KPI card: total penjualan hari ini, stok saat ini, produksi hari ini
- Grafik tren penjualan dan produksi (7 hari / 30 hari)
- Indikator stok kritis (badge merah/kuning untuk produk di bawah minimum)
- Daftar 5 transaksi penjualan terbaru
- Filter periode: hari ini, minggu ini, bulan ini
- Perbandingan data dengan periode sebelumnya

**Target Performa:** Dashboard load < 2 detik, data freshness real-time via SSR.

**Batasan (Out of Scope v1.0):** Edit data dari dashboard, dashboard per role lain, push notification mobile.

---

### 4.3 Fitur 3 — Manajemen Produk (PRD-03)

**Tujuan:** Menyediakan master data produk sebagai referensi terpusat untuk seluruh modul sistem.

**Fitur Utama:**
- CRUD produk dengan kode otomatis (auto-generate) atau manual
- Kategorisasi produk untuk filtering dan pelaporan
- Penetapan harga jual sebagai acuan transaksi
- Upload gambar produk (JPG/PNG, max 2MB, resize 800x800px)
- Status produk aktif/nonaktif (soft delete)
- Pencarian dan filter berdasarkan nama, kode, kategori, status
- Pengaturan stok minimum per produk (trigger alert gudang)

**Target Performa:** Response time CRUD < 1 detik, 0 duplikasi kode produk.

**Batasan (Out of Scope v1.0):** Manajemen bahan baku, Bill of Materials, multi-harga per customer tier, varian produk, barcode/QR, bulk import CSV.

---

### 4.4 Fitur 4 — Manajemen Stok Gudang (PRD-04)

**Tujuan:** Mencatat seluruh pergerakan stok secara real-time dan menyediakan audit trail yang lengkap.

**Fitur Utama:**
- Input stok masuk manual (dari produksi atau sumber lain)
- Input stok keluar manual (distribusi, retur penjualan)
- Stock adjustment dengan alasan wajib (positif/negatif)
- Saldo stok real-time per produk dengan indikator kritis
- Riwayat lengkap pergerakan stok per produk (filter by tanggal, tipe)
- Notifikasi visual stok kritis (di bawah minimum)
- Laporan stok snapshot

**Target Performa:** Akurasi selisih stok < 0.1%, notifikasi kritis < 1 menit setelah trigger, 100% pergerakan tercatat.

**Batasan (Out of Scope v1.0):** Gudang multi-lokasi, barcode scanning, FIFO/LIFO accounting, IoT timbangan, stok bahan baku.

---

### 4.5 Fitur 5 — Produksi Harian (PRD-05)

**Tujuan:** Mencatat hasil produksi harian secara digital dan otomatis menyinkronkan ke stok gudang.

**Fitur Utama:**
- Input hasil produksi harian per produk (dalam satuan kg)
- Otomatis trigger stok masuk (`PRODUCTION_IN`) ke modul gudang saat produksi disimpan
- Status produksi: DRAFT (bisa diedit) → CONFIRMED (terkunci)
- Riwayat produksi 30 hari dengan filter tanggal dan produk
- Perbandingan realisasi vs target kapasitas (4.000 kg/hari)
- Konfirmasi/finalisasi produksi harian oleh Bagian Produksi

**Target Performa:** 100% produksi harian tercatat, sinkronisasi ke stok 100%, waktu entry < 2 menit.

**Batasan (Out of Scope v1.0):** Manajemen bahan baku & formula, manajemen mesin/downtime, shift management, biaya produksi, QC checklist, IoT sensor.

---

## 5. Analisis Kebutuhan Fungsional

### 5.1 Kebutuhan Fungsional per Modul

#### Autentikasi & Keamanan

| ID | Kebutuhan | Prioritas |
|----|-----------|-----------|
| KF-AUTH-01 | Sistem harus memvalidasi kredensial pengguna (email + password hash Argon2id) | Critical |
| KF-AUTH-02 | Sistem harus membuat session token 32 bytes dengan expiry 8 jam | Critical |
| KF-AUTH-03 | Sistem harus menerapkan cookie HTTP-only, Secure, SameSite=Strict | Critical |
| KF-AUTH-04 | Sistem harus memproteksi semua route berdasarkan role via middleware | Critical |
| KF-AUTH-05 | Sistem harus mengunci akun setelah 5 kali login gagal (15 menit) | High |
| KF-AUTH-06 | Sistem harus mencatat setiap event login/logout ke tabel audit log | High |
| KF-AUTH-07 | Sistem harus menginvalidasi session dan hapus cookie saat logout | High |

#### Dashboard Monitoring

| ID | Kebutuhan | Prioritas |
|----|-----------|-----------|
| KF-DASH-01 | Sistem harus menampilkan KPI card: penjualan, stok, produksi hari ini | Critical |
| KF-DASH-02 | Sistem harus menampilkan grafik tren penjualan dan produksi 7/30 hari | High |
| KF-DASH-03 | Sistem harus menampilkan indikator visual stok kritis | High |
| KF-DASH-04 | Sistem harus mendukung filter periode (hari ini/minggu/bulan) | Medium |
| KF-DASH-05 | Sistem harus menampilkan 5 transaksi penjualan terbaru | Medium |

#### Manajemen Produk

| ID | Kebutuhan | Prioritas |
|----|-----------|-----------|
| KF-PROD-01 | Sistem harus mendukung CRUD produk dengan validasi input | Critical |
| KF-PROD-02 | Sistem harus men-generate kode produk unik otomatis | Critical |
| KF-PROD-03 | Sistem harus mendukung kategorisasi produk | High |
| KF-PROD-04 | Sistem harus mendukung upload gambar produk (max 2MB, resize 800x800px) | Medium |
| KF-PROD-05 | Sistem harus menerapkan soft delete (nonaktif, bukan hapus permanen) | High |
| KF-PROD-06 | Sistem harus mendukung pengaturan stok minimum per produk | High |

#### Manajemen Stok Gudang

| ID | Kebutuhan | Prioritas |
|----|-----------|-----------|
| KF-STK-01 | Sistem harus mencatat stok masuk dan keluar dengan user + timestamp | Critical |
| KF-STK-02 | Sistem harus menghitung saldo stok real-time berdasarkan histori pergerakan | Critical |
| KF-STK-03 | Sistem harus mendukung stock adjustment dengan alasan wajib | High |
| KF-STK-04 | Sistem harus menampilkan notifikasi visual saat stok < minimum | High |
| KF-STK-05 | Sistem harus menyediakan riwayat pergerakan stok dengan filter | High |

#### Produksi Harian

| ID | Kebutuhan | Prioritas |
|----|-----------|-----------|
| KF-PROD-H-01 | Sistem harus memungkinkan input hasil produksi per produk per hari | Critical |
| KF-PROD-H-02 | Sistem harus otomatis membuat stock_movement PRODUCTION_IN saat produksi disimpan | Critical |
| KF-PROD-H-03 | Sistem harus mendukung status DRAFT dan CONFIRMED dengan aturan edit | High |
| KF-PROD-H-04 | Sistem harus menampilkan perbandingan realisasi vs target 4.000 kg/hari | High |
| KF-PROD-H-05 | Sistem harus menyimpan riwayat produksi dengan filter tanggal/produk | Medium |

---

## 6. Analisis Kebutuhan Non-Fungsional

### 6.1 Performa

| Kebutuhan | Target | Modul Terkait |
|-----------|--------|---------------|
| Dashboard load time | < 2 detik | Dashboard |
| Response time CRUD | < 1 detik | Produk, Stok, Produksi |
| Notifikasi stok kritis | < 1 menit setelah trigger | Stok Gudang |
| Waktu entry produksi | < 2 menit per sesi | Produksi Harian |
| Login success rate | > 99% untuk kredensial valid | Authentication |

### 6.2 Keamanan

- Password di-hash menggunakan **Argon2id**
- Session token bersifat cryptographically random (32 bytes)
- Cookie menggunakan flag **HttpOnly**, **Secure**, **SameSite=Strict**
- Rate limiting per IP + email untuk mencegah brute force
- Semua query menggunakan **Prisma parameterized query** (mencegah SQL injection)
- XSS dicegah oleh default escaping SvelteKit
- HTTPS wajib (enforced via Nginx reverse proxy)

### 6.3 Keandalan & Audit

- 100% pergerakan stok tercatat dengan user dan timestamp
- 100% aktivitas login/logout tersimpan di audit log
- Akurasi selisih stok < 0.1% dari total stok tercatat
- Backup database harian dengan retensi 30 hari untuk auth_logs

### 6.4 Kemudahan Penggunaan

- Antarmuka responsif (web & mobile browser)
- Pesan error yang informatif namun tidak membocorkan data sensitif
- Notifikasi visual berbasis warna (merah/kuning untuk kondisi kritis)
- Waktu pengisian form produksi < 2 menit

### 6.5 Pemeliharaan & Skalabilitas

- Arsitektur modular (setiap fitur adalah modul independen)
- Environment variables terdokumentasi untuk tiap deployment
- Docker-ready dengan multi-stage build
- Unit test coverage target > 80%
- Logging output dalam format JSON untuk integrasi monitoring

---

## 7. Ketergantungan Antar Modul

Berikut adalah peta ketergantungan fungsional antar modul dalam sistem:

```
┌─────────────────────────────────────────────────────┐
│               Authentication (PRD-01)                │
│  (Fondasi — semua modul bergantung pada ini)         │
└──────────────────────┬──────────────────────────────┘
                       │
       ┌───────────────┼────────────────┐
       ▼               ▼                ▼
┌────────────┐  ┌─────────────┐  ┌──────────────┐
│ Manajemen  │  │  Produksi   │  │  Dashboard   │
│  Produk    │  │  Harian     │  │  Monitoring  │
│ (PRD-03)  │  │  (PRD-05)   │  │  (PRD-02)    │
└─────┬──────┘  └──────┬──────┘  └──────┬───────┘
      │                │                │
      │    ┌───────────┘                │
      ▼    ▼                            │
┌────────────────┐                      │
│   Manajemen    │◄─────────────────────┘
│  Stok Gudang   │  (baca data stok)
│   (PRD-04)    │
└────────────────┘
```

### Alur Ketergantungan Kritis

**Alur 1: Produksi → Stok Gudang (Otomatis)**
Saat Bagian Produksi menyimpan hasil produksi harian (PRD-05), sistem secara otomatis membuat entri `stock_movement` bertipe `PRODUCTION_IN` di modul Stok Gudang (PRD-04). Ini menghilangkan kebutuhan double-entry.

**Alur 2: Produk sebagai Master Data**
Modul Manajemen Produk (PRD-03) menjadi referensi utama bagi modul Stok Gudang (PRD-04), Produksi Harian (PRD-05), dan Dashboard (PRD-02). Produk harus terdaftar terlebih dahulu sebelum dapat digunakan di modul lain.

**Alur 3: Dashboard membaca semua modul**
Dashboard Monitoring (PRD-02) membaca data dari Stok Gudang, Produksi Harian, dan modul Penjualan (belum dalam scope v1.0 ini) untuk menghasilkan KPI dan grafik tren.

**Alur 4: Stok minimum sebagai trigger alert**
Nilai `minimumStock` yang diatur di Manajemen Produk (PRD-03) digunakan oleh Stok Gudang (PRD-04) sebagai ambang batas notifikasi kritis, dan oleh Dashboard (PRD-02) sebagai indikator visual.

---

## 8. Analisis Risiko

| No | Risiko | Dampak | Kemungkinan | Mitigasi |
|----|--------|--------|-------------|----------|
| R-01 | Sinkronisasi produksi ke stok gagal (transaksi DB rollback) | Tinggi | Sedang | Implementasi database transaction atomik (Prisma `$transaction`) |
| R-02 | Session tidak diinvalidasi saat pengguna dinonaktifkan | Tinggi | Rendah | Validasi status `isActive` user pada setiap request |
| R-03 | Race condition saat dua pengguna update stok bersamaan | Sedang | Sedang | Optimistic locking atau database-level constraint |
| R-04 | Upload gambar produk gagal namun data produk tersimpan | Rendah | Sedang | Handle upload terpisah, gambar opsional |
| R-05 | Data produksi dikonfirmasi dengan data salah | Tinggi | Rendah | Status DRAFT editable, konfirmasi memerlukan aksi eksplisit |
| R-06 | Pengguna admin penjualan tidak aktif meninggalkan sesi terbuka | Sedang | Sedang | Session timeout otomatis 8 jam + notifikasi |
| R-07 | Penumpukan data audit log menyebabkan performa turun | Rendah | Rendah | Retensi 30 hari + indeks pada kolom timestamp dan user_id |

---

## 9. Prioritas Pengembangan

Berdasarkan ketergantungan antar modul dan nilai bisnis, urutan pengembangan yang direkomendasikan adalah:

### Fase 1 — Fondasi (Wajib Diselesaikan Pertama)
1. **Authentication (PRD-01)** — fondasi keamanan seluruh sistem
2. **Manajemen Produk (PRD-03)** — master data yang dibutuhkan semua modul lain

### Fase 2 — Operasional Inti
3. **Manajemen Stok Gudang (PRD-04)** — membutuhkan master produk dari Fase 1
4. **Produksi Harian (PRD-05)** — bergantung pada produk dan stok gudang

### Fase 3 — Visibilitas & Monitoring
5. **Dashboard Monitoring (PRD-02)** — mengagregasi data dari semua modul sebelumnya

### Ringkasan Prioritas User Story

| Prioritas | Jumlah US | Modul |
|-----------|-----------|-------|
| Critical | 16 | Auth (4), Produk (2), Stok (3), Produksi (2), Dashboard (2) + lainnya |
| High | ~20 | Tersebar di semua modul |
| Medium | ~10 | Terutama Dashboard dan fitur pendukung |

---

## 10. Kesimpulan

CV TapioLeaf Management System v1.0 terdiri dari 5 modul yang saling terintegrasi untuk mendigitalisasi operasional perusahaan tepung tapioka secara end-to-end. Sistem ini menyelesaikan permasalahan utama yang selama ini menghambat efisiensi operasional, yakni: ketiadaan kontrol akses, pencatatan manual yang rawan selisih, tidak adanya master data produk terpusat, serta absennya visibilitas real-time bagi Owner.

**Poin kritis yang perlu diperhatikan dalam pengembangan:**

- Modul **Authentication** dan **Manajemen Produk** harus selesai terlebih dahulu karena seluruh modul lain bergantung padanya.
- **Sinkronisasi otomatis Produksi → Stok Gudang** adalah fitur bisnis paling kritikal yang harus diimplementasikan menggunakan transaksi database atomik untuk mencegah inkonsistensi data.
- **RBAC** harus diterapkan secara konsisten di semua route untuk memastikan tidak ada akses lintas peran yang tidak sah.
- Semua PRD masih berstatus **Draft** — diperlukan review dan sign-off dari Owner sebelum development dimulai.

---

*Dokumen ini merupakan ringkasan analisis kebutuhan berdasarkan PRD-01 hingga PRD-05 CV TapioLeaf Management System.*
*Versi: 1.0.0 | Status: Draft | Tanggal: 2025-01-01*
