# FEATURE PRD / SRS
# CV TapioLeaf Management System
# Fitur 1: Authentication

**Versi:** 1.0.0
**Tanggal:** 2025-01-01
**Status:** Draft
**Author:** Tim Produk CV TapioLeaf

---

## 1. Feature Overview

### 1.1 Latar Belakang

CV TapioLeaf Management System adalah sistem manajemen operasional terpadu untuk perusahaan pengolahan singkong menjadi tepung tapioka. Sistem ini memiliki multi-role pengguna dengan tingkat akses dan tanggung jawab yang berbeda-beda. Tanpa mekanisme autentikasi yang kuat, data produksi, stok, dan transaksi keuangan rentan terhadap akses tidak sah.

### 1.2 Masalah yang Diselesaikan

| No | Masalah | Dampak |
|----|---------|--------|
| 1 | Tidak ada kontrol akses pengguna | Semua data bisa diakses siapa saja |
| 2 | Tidak ada pembatasan hak akses per role | Admin penjualan bisa ubah data gudang |
| 3 | Tidak ada audit trail login | Tidak bisa melacak aktivitas mencurigakan |
| 4 | Session tidak dikelola | Risiko session hijacking |

### 1.3 Tujuan Fitur

- Memastikan hanya pengguna terotorisasi yang dapat mengakses sistem
- Membatasi akses berdasarkan role (RBAC)
- Menyediakan session management yang aman
- Mencatat aktivitas login/logout untuk audit

### 1.4 Scope Fitur

#### In Scope
- Login dengan email dan password
- Logout dan invalidasi session
- Session management berbasis cookie HTTP-only
- Role-Based Access Control (RBAC) untuk 5 role
- Proteksi route berdasarkan role
- Audit log aktivitas autentikasi

#### Out of Scope
- Registrasi mandiri pengguna (dibuat oleh Owner/Admin)
- OAuth / SSO (Google, Microsoft)
- Two-Factor Authentication (2FA)
- Password recovery via SMS
- Biometric authentication

### 1.5 Business Impact

- **Keamanan Data:** Melindungi data bisnis sensitif dari akses tidak sah
- **Compliance:** Memastikan setiap transaksi terekam ke pengguna yang bertanggung jawab
- **Operasional:** Setiap role hanya bisa akses fitur yang relevan, mengurangi human error

### 1.6 Success Metrics

| Metric | Target |
|--------|--------|
| Login success rate | > 99% untuk kredensial valid |
| Unauthorized access attempts | 0 kejadian lolos ke sistem |
| Session timeout compliance | 100% session expired sesuai konfigurasi |
| Audit log completeness | 100% aktivitas login/logout tercatat |

---

## 2. User Story

### US-AUTH-001
```
As an Owner
I want to login ke sistem dengan email dan password
So that saya bisa memonitor seluruh operasional perusahaan
```
**Priority:** Critical
**Acceptance Notes:** Owner harus diarahkan ke dashboard monitoring setelah login berhasil.

---

### US-AUTH-002
```
As an Admin Penjualan
I want to login ke sistem
So that saya bisa mengelola produk dan transaksi penjualan
```
**Priority:** Critical
**Acceptance Notes:** Setelah login, Admin Penjualan hanya dapat mengakses modul produk dan penjualan.

---

### US-AUTH-003
```
As a Petugas Gudang
I want to login ke sistem
So that saya bisa mencatat pergerakan stok gudang
```
**Priority:** Critical
**Acceptance Notes:** Petugas Gudang hanya dapat mengakses modul stok gudang.

---

### US-AUTH-004
```
As a Bagian Produksi
I want to login ke sistem
So that saya bisa menginput hasil produksi harian
```
**Priority:** Critical
**Acceptance Notes:** Bagian Produksi hanya dapat mengakses modul produksi harian.

---

### US-AUTH-005
```
As any authenticated user
I want to logout dari sistem
So that session saya berakhir dan data aman dari akses orang lain
```
**Priority:** High
**Acceptance Notes:** Setelah logout, cookie session dihapus dan user diarahkan ke halaman login.

---

### US-AUTH-006
```
As any authenticated user
I want session saya otomatis berakhir setelah tidak aktif
So that akun saya aman jika saya lupa logout
```
**Priority:** High
**Acceptance Notes:** Session timeout setelah 8 jam tidak aktif; tampilkan notifikasi sebelum expired.

---

### US-AUTH-007
```
As any user
I want mendapat pesan error yang jelas saat login gagal
So that saya tahu apa yang salah tanpa mengungkap informasi sensitif
```
**Priority:** Medium
**Acceptance Notes:** Pesan error generik "Email atau password salah" tanpa menyebut mana yang salah.

---

### US-AUTH-008
```
As an Owner
I want melihat log aktivitas login semua pengguna
So that saya bisa memantau akses ke sistem
```
**Priority:** Medium
**Acceptance Notes:** Log menampilkan: user, timestamp, IP address, status (sukses/gagal).

---

## 3. Use Case Description

### UC-AUTH-001: Login

| Elemen | Detail |
|--------|--------|
| **Use Case ID** | UC-AUTH-001 |
| **Nama** | Login ke Sistem |
| **Actor** | Owner, Admin Penjualan, Petugas Gudang, Bagian Produksi |
| **Preconditions** | User memiliki akun aktif di sistem; User belum login |
| **Trigger** | User mengakses URL sistem dan diarahkan ke halaman login |

**Main Flow:**
1. User membuka halaman `/login`
2. User mengisi email dan password
3. User mengklik tombol "Masuk"
4. Sistem memvalidasi format input
5. Sistem memverifikasi kredensial ke database
6. Sistem membuat session baru dan menyimpan session cookie HTTP-only
7. Sistem mencatat log login sukses (timestamp, IP, user agent)
8. Sistem mengarahkan user ke dashboard sesuai role

**Alternative Flow:**
- **AF-1:** Jika user sudah login dan mengakses `/login`, sistem redirect ke dashboard
- **AF-2:** Jika user mencoba akses halaman protected tanpa login, redirect ke `/login` dengan return URL

**Exception Flow:**

| Kode | Kondisi | Respon Sistem |
|------|---------|---------------|
| EX-1 | Email tidak ditemukan | Tampilkan "Email atau password salah" |
| EX-2 | Password salah | Tampilkan "Email atau password salah" |
| EX-3 | Akun dinonaktifkan | Tampilkan "Akun Anda tidak aktif" |
| EX-4 | Rate limit tercapai (5x gagal) | Kunci akun 15 menit, tampilkan pesan |
| EX-5 | Database error | Tampilkan "Terjadi kesalahan sistem" |

**Post Conditions:**
- Session aktif tersimpan di database
- Cookie `session_id` ter-set di browser
- Log login tercatat di tabel `auth_logs`

---

### UC-AUTH-002: Logout

| Elemen | Detail |
|--------|--------|
| **Use Case ID** | UC-AUTH-002 |
| **Nama** | Logout dari Sistem |
| **Actor** | Semua authenticated user |
| **Preconditions** | User sudah login dan memiliki session aktif |

**Main Flow:**
1. User mengklik tombol "Keluar"
2. Sistem menginvalidasi session di database
3. Sistem menghapus cookie session di browser
4. Sistem mencatat log logout
5. Sistem mengarahkan user ke halaman `/login`

**Exception Flow:**

| Kode | Kondisi | Respon Sistem |
|------|---------|---------------|
| EX-1 | Session sudah expired | Redirect ke login tanpa error |
| EX-2 | Database error saat invalidasi | Tetap hapus cookie, log error server |

---

### UC-AUTH-003: Proteksi Route (RBAC)

| Elemen | Detail |
|--------|--------|
| **Use Case ID** | UC-AUTH-003 |
| **Nama** | Validasi Akses Route |
| **Actor** | Sistem (Hook SvelteKit) |
| **Preconditions** | User mencoba akses URL protected |

**Main Flow:**
1. User mengakses URL protected
2. SvelteKit `hooks.server.ts` intercept request
3. Sistem membaca session cookie
4. Sistem memvalidasi session di database
5. Sistem memeriksa role user vs izin route
6. Jika authorized: lanjutkan request
7. Jika unauthorized: return 403 atau redirect

---

## 4. Functional Requirements

| ID | Requirement | Description | Actor | Validasi |
|----|-------------|-------------|-------|----------|
| FR-AUTH-001 | Form Login | Halaman login dengan field email dan password | All Users | Email valid, password minimal 8 karakter |
| FR-AUTH-002 | Verifikasi Kredensial | Sistem memverifikasi email + password hash ke database | Sistem | Argon2 password hashing |
| FR-AUTH-003 | Session Creation | Buat session token dan simpan di database setelah login sukses | Sistem | Token random 32 bytes, expiry 8 jam |
| FR-AUTH-004 | HTTP-Only Cookie | Set session cookie dengan flag HttpOnly, Secure, SameSite=Strict | Sistem | Cookie tidak dapat diakses JavaScript |
| FR-AUTH-005 | Role Detection | Baca role user dari database dan simpan di session | Sistem | Role valid: owner, admin_penjualan, petugas_gudang, bagian_produksi |
| FR-AUTH-006 | Route Guard | Proteksi semua route protected dengan validasi session + role | Sistem | Via hooks.server.ts |
| FR-AUTH-007 | Logout | Invalidasi session di DB dan hapus cookie | All Users | Session dihapus dari tabel sessions |
| FR-AUTH-008 | Session Timeout | Auto-expire session setelah 8 jam tidak aktif | Sistem | Update `last_active` setiap request |
| FR-AUTH-009 | Rate Limiting Login | Batasi 5 percobaan login gagal, kunci 15 menit | Sistem | Berdasarkan IP + email |
| FR-AUTH-010 | Audit Log | Catat setiap event login/logout ke tabel `auth_logs` | Sistem | Include IP, user agent, timestamp |
| FR-AUTH-011 | Redirect After Login | Arahkan user ke dashboard sesuai role setelah login | Sistem | Owner→/dashboard, others→modul masing-masing |
| FR-AUTH-012 | Error Messages | Tampilkan pesan error generik yang tidak mengungkap detail | Sistem | Tidak sebutkan apakah email atau password yang salah |

---

## 5. Non-Functional Requirements

### Performance
| Requirement | Target |
|-------------|--------|
| Response time login | < 500ms (p95) |
| Session validation per request | < 50ms (p95) |
| Concurrent login sessions | Mendukung 100 concurrent users |

### Security
| Requirement | Detail |
|-------------|--------|
| Password hashing | Argon2id dengan cost factor sesuai OWASP |
| Session token | Cryptographically random, 256-bit entropy |
| Cookie flags | HttpOnly, Secure, SameSite=Strict |
| HTTPS | Wajib di seluruh endpoint |
| CSRF protection | SameSite cookie + origin validation |
| SQL Injection | Semua query via Prisma parameterized |

### Reliability
- Availability: 99.9% uptime
- Session persistence: Session tetap valid selama server restart (stored di DB)
- Graceful degradation: Jika DB down, tampilkan halaman maintenance

### Scalability
- Session di database (bukan memory), mendukung horizontal scaling
- Index pada `session_token` dan `user_id` untuk lookup cepat

### Availability
- Session tersimpan di PostgreSQL, bukan in-memory
- Backup database harian

### Accessibility
- Form login accessible (label, ARIA attributes)
- Error messages screen-reader friendly
- Keyboard navigable

---

## 6. Business Rules

| BR-ID | Rule | Description |
|-------|------|-------------|
| BR-AUTH-001 | Password Hashing | Password disimpan dalam bentuk hash Argon2id, tidak pernah plain text |
| BR-AUTH-002 | Unique Email | Setiap user harus memiliki email unik di sistem |
| BR-AUTH-003 | Role Assignment | Setiap user memiliki tepat 1 role aktif |
| BR-AUTH-004 | Session Expiry | Session otomatis invalid setelah 8 jam idle |
| BR-AUTH-005 | Rate Limiting | Maksimal 5 gagal login berturut-turut → kunci 15 menit |
| BR-AUTH-006 | Single Session | Satu user hanya bisa memiliki 1 session aktif (opsional: bisa dikonfigurasi) |
| BR-AUTH-007 | Audit Trail | Setiap event auth (login/logout/failed) wajib dicatat |
| BR-AUTH-008 | Account Status | User dengan status `inactive` tidak bisa login |
| BR-AUTH-009 | Role-Route Mapping | Setiap route protected memiliki role yang diizinkan, terdefinisi di konfigurasi |

---

## 7. User Flow

### Success Flow — Login
```
1. User buka /login
2. Input email + password
3. Klik "Masuk"
4. [Loading state aktif]
5. Validasi client-side (Zod) → OK
6. POST /api/auth/login
7. Server validasi kredensial → OK
8. Server buat session + set cookie
9. Server catat audit log
10. Response 200 + redirect URL
11. Browser redirect ke dashboard sesuai role
```

### Failed Flow — Login Gagal
```
1. User buka /login
2. Input email + password salah
3. Klik "Masuk"
4. POST /api/auth/login
5. Server: kredensial tidak cocok
6. Increment failed_attempts counter
7. Response 401 + pesan generik
8. Form tampilkan error "Email atau password salah"
9. [Jika sudah 5x] → Kunci akun 15 menit, tampilkan countdown
```

### Logout Flow
```
1. User klik tombol "Keluar"
2. Konfirmasi dialog (opsional)
3. POST /api/auth/logout
4. Server invalidasi session di DB
5. Server hapus cookie
6. Server catat audit log logout
7. Response 200
8. Browser redirect ke /login
```

### Session Expired Flow
```
1. User aktif di sistem
2. Session idle 8 jam
3. User melakukan request
4. Server: session expired
5. Server hapus session + cookie
6. Response 401
7. Browser redirect ke /login?expired=true
8. Halaman login tampilkan toast "Sesi Anda telah berakhir"
```

### Edge Flow — Unauthorized Role
```
1. User (Petugas Gudang) mencoba akses /penjualan
2. hooks.server.ts intercept
3. Validasi session → OK
4. Validasi role vs route → GAGAL
5. Response 403
6. Redirect ke /403 page dengan pesan jelas
```

---

## 8. Data Flow

### Login Request Flow
```
Browser
  └─► POST /api/auth/login
        │  { email, password }
        ▼
  SvelteKit API Route (server)
        │  Zod validation
        ▼
  AuthService.login(email, password)
        │
        ▼
  UserRepository.findByEmail(email)
        │  Prisma query
        ▼
  PostgreSQL (NeonDB)
        │  users table
        ▼
  Argon2.verify(hash, password)
        │
        ▼
  SessionRepository.create(userId, token, expiry)
        │  Prisma insert
        ▼
  PostgreSQL (sessions table)
        │
        ▼
  AuditLogService.log(event, userId, ip)
        │
        ▼
  Response: Set-Cookie + redirect URL
        │
        ▼
  Browser: Cookie stored, redirect
```

### Request Validation Flow (Per Request)
```
Incoming Request
  └─► hooks.server.ts
        │  Read cookie session_token
        ▼
  SessionRepository.findValid(token)
        │  Prisma query + expiry check
        ▼
  Inject session → event.locals
        │
        ▼
  Route handler
        │  Check event.locals.user.role vs allowed_roles
        ▼
  Continue or 403
```

---

## 9. Validation Rules

```typescript
// schemas/auth.schema.ts

import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email wajib diisi' })
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid')
    .max(255, 'Email terlalu panjang'),

  password: z
    .string({ required_error: 'Password wajib diisi' })
    .min(8, 'Password minimal 8 karakter')
    .max(128, 'Password terlalu panjang'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Untuk change password (jika dikembangkan)
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8),
    newPassword: z
      .string()
      .min(8, 'Password baru minimal 8 karakter')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password harus mengandung huruf besar, huruf kecil, dan angka'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  });
```

---

## 10. Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Deskripsi error yang user-friendly",
  "errors": {
    "field": ["Pesan validasi per field"]
  },
  "code": "ERROR_CODE"
}
```

### Error Catalog

| HTTP Status | Code | Kondisi | Pesan User |
|-------------|------|---------|------------|
| 400 | VALIDATION_ERROR | Input tidak valid | "Data yang dikirim tidak valid" |
| 401 | INVALID_CREDENTIALS | Email/password salah | "Email atau password salah" |
| 401 | SESSION_EXPIRED | Session kadaluarsa | "Sesi Anda telah berakhir, silakan login kembali" |
| 401 | INVALID_SESSION | Token tidak valid | "Sesi tidak valid, silakan login kembali" |
| 403 | FORBIDDEN | Role tidak diizinkan | "Anda tidak memiliki akses ke halaman ini" |
| 423 | ACCOUNT_LOCKED | Rate limit tercapai | "Akun dikunci sementara. Coba lagi dalam 15 menit" |
| 500 | INTERNAL_ERROR | Server error | "Terjadi kesalahan sistem. Tim teknis telah diberitahu" |

### Retry Strategy
- Login error 401: Tidak auto-retry (user action diperlukan)
- Session check 500: Retry 1x dengan exponential backoff 1s
- Database timeout: Retry 2x, fallback ke error page

### Logging Strategy
```typescript
// Semua auth events di-log dengan struktur:
{
  level: 'info' | 'warn' | 'error',
  event: 'login_success' | 'login_failed' | 'logout' | 'session_expired' | 'unauthorized_access',
  userId: string | null,
  email: string,
  ip: string,
  userAgent: string,
  timestamp: ISO8601,
  metadata: {}
}
```

---

## 11. Acceptance Criteria

### Skenario Sukses — Login

```gherkin
Feature: Authentication Login

  Scenario: Login berhasil sebagai Owner
    Given saya adalah Owner dengan akun aktif
    And saya berada di halaman /login
    When saya mengisi email "owner@tapioleaf.com" dan password yang benar
    And saya mengklik tombol "Masuk"
    Then sistem harus memverifikasi kredensial
    And sistem harus membuat session baru
    And saya harus diarahkan ke /dashboard
    And cookie session harus ter-set dengan flag HttpOnly dan Secure

  Scenario: Login berhasil sebagai Petugas Gudang
    Given saya adalah Petugas Gudang dengan akun aktif
    When saya login dengan kredensial yang benar
    Then saya harus diarahkan ke /gudang
    And saya tidak bisa mengakses /penjualan
```

### Skenario Gagal — Login

```gherkin
  Scenario: Login gagal karena password salah
    Given saya berada di halaman /login
    When saya mengisi email valid dan password salah
    And saya mengklik "Masuk"
    Then sistem menampilkan pesan "Email atau password salah"
    And tidak ada informasi yang mengungkap apakah email atau password yang salah
    And saya tetap di halaman /login

  Scenario: Akun terkunci setelah 5 percobaan gagal
    Given saya telah gagal login 4 kali
    When saya gagal login untuk ke-5 kalinya
    Then akun saya dikunci selama 15 menit
    And sistem menampilkan "Akun dikunci sementara. Coba lagi dalam 15 menit"
```

### Skenario Unauthorized

```gherkin
  Scenario: Akses halaman yang tidak diizinkan
    Given saya login sebagai Petugas Gudang
    When saya mencoba mengakses /laporan
    Then sistem mengarahkan ke halaman 403
    And menampilkan pesan "Anda tidak memiliki akses ke halaman ini"

  Scenario: Akses dengan session expired
    Given session saya telah expired
    When saya mencoba mengakses halaman manapun
    Then sistem mengarahkan ke /login?expired=true
    And menampilkan toast "Sesi Anda telah berakhir"
```

---

## 12. Database Design

### Prisma Schema

```prisma
// schema.prisma

model User {
  id             String    @id @default(cuid())
  email          String    @unique
  passwordHash   String    @map("password_hash")
  name           String
  role           UserRole
  isActive       Boolean   @default(true) @map("is_active")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  deletedAt      DateTime? @map("deleted_at") // soft delete

  sessions       Session[]
  authLogs       AuthLog[]

  @@index([email])
  @@index([role])
  @@map("users")
}

model Session {
  id          String   @id @default(cuid())
  token       String   @unique
  userId      String   @map("user_id")
  expiresAt   DateTime @map("expires_at")
  lastActive  DateTime @default(now()) @map("last_active")
  ipAddress   String?  @map("ip_address")
  userAgent   String?  @map("user_agent")
  createdAt   DateTime @default(now()) @map("created_at")

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@index([expiresAt])
  @@map("sessions")
}

model AuthLog {
  id          String      @id @default(cuid())
  userId      String?     @map("user_id")
  email       String
  event       AuthEvent
  ipAddress   String?     @map("ip_address")
  userAgent   String?     @map("user_agent")
  metadata    Json?
  createdAt   DateTime    @default(now()) @map("created_at")

  user        User?       @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([email])
  @@index([event])
  @@index([createdAt])
  @@map("auth_logs")
}

model LoginAttempt {
  id          String   @id @default(cuid())
  identifier  String   // email:ip composite
  attempts    Int      @default(0)
  lockedUntil DateTime? @map("locked_until")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([identifier])
  @@map("login_attempts")
}

enum UserRole {
  OWNER
  ADMIN_PENJUALAN
  PETUGAS_GUDANG
  BAGIAN_PRODUKSI
  PEMBELI_UMKM
}

enum AuthEvent {
  LOGIN_SUCCESS
  LOGIN_FAILED
  LOGOUT
  SESSION_EXPIRED
  ACCOUNT_LOCKED
  UNAUTHORIZED_ACCESS
}
```

### Relationship Diagram
```
users (1) ──────── (N) sessions
users (1) ──────── (N) auth_logs
```

### Cascade Rules
- `User` deleted → `Session` deleted (Cascade)
- `User` deleted → `AuthLog.userId` set null (SetNull, preserve logs)

### Index Strategy
| Tabel | Kolom | Alasan |
|-------|-------|--------|
| users | email | Login lookup |
| sessions | token | Session validation per request |
| sessions | expiresAt | Cleanup expired sessions |
| auth_logs | createdAt | Report & pagination |

---

## 13. Database Impact Analysis

### Migration Impact
- Tabel baru: `users`, `sessions`, `auth_logs`, `login_attempts`
- Tidak ada breaking change (initial migration)
- Data seed: 1 Owner account wajib ada setelah migration

### Query Performance
- Session validation: Single index scan pada `token` — O(1)
- Login lookup: Single index scan pada `email` — O(1)
- Auth log query: Composite index `userId + createdAt` untuk pagination

### Rollback Strategy
```bash
# Rollback migration terakhir
npx prisma migrate resolve --rolled-back "nama_migration"
```

---

## 14. API Requirements

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/api/auth/login` | Login dengan email + password | ❌ | Public |
| POST | `/api/auth/logout` | Logout dan invalidasi session | ✅ | All |
| GET | `/api/auth/me` | Ambil data user yang sedang login | ✅ | All |
| GET | `/api/auth/logs` | Ambil audit log aktivitas | ✅ | Owner |

### POST /api/auth/login

**Request Body:**
```json
{
  "email": "owner@tapioleaf.com",
  "password": "SecurePass123"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": "clxxxxx",
      "name": "Pak Budi",
      "email": "owner@tapioleaf.com",
      "role": "OWNER"
    },
    "redirectTo": "/dashboard"
  }
}
```

**Response 401:**
```json
{
  "success": false,
  "message": "Email atau password salah",
  "code": "INVALID_CREDENTIALS"
}
```

### POST /api/auth/logout

**Request:** Cookie session (otomatis dikirim browser)

**Response 200:**
```json
{
  "success": true,
  "message": "Logout berhasil"
}
```

### GET /api/auth/me

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "clxxxxx",
    "name": "Pak Budi",
    "email": "owner@tapioleaf.com",
    "role": "OWNER",
    "isActive": true
  }
}
```

---

## 15. UI Components

### LoginPage (`/src/routes/(auth)/login/+page.svelte`)

**Layout:**
- Centered card di tengah halaman
- Logo CV TapioLeaf di atas form
- Background: subtle gradient/pattern

**Form Fields:**
```
┌─────────────────────────────┐
│        CV TapioLeaf         │
│     Sistem Manajemen        │
├─────────────────────────────┤
│  Email                      │
│  [________________________] │
│  Password                   │
│  [__________________] [👁]  │
│                             │
│  [      MASUK            ]  │
│                             │
│  ⚠ Email atau password salah │
└─────────────────────────────┘
```

**State:**
| State | Tampilan |
|-------|----------|
| Default | Form kosong, tombol enabled |
| Loading | Spinner di tombol, field disabled |
| Error | Alert merah di bawah form |
| Locked | Countdown timer, form disabled |

**Components:**
- `<FormField>` — reusable field dengan label + error
- `<PasswordInput>` — input password dengan toggle visibility
- `<Button>` — loading state aware
- `<Alert>` — error/warning display

---

## 16. Edge Cases

| Edge Case | Kondisi | Solusi |
|-----------|---------|--------|
| Double Submit | User klik "Masuk" dua kali cepat | Disable tombol setelah klik pertama |
| Tab Terbuka | Session expired di tab lain, lanjut pakai | Intercept 401, redirect ke login |
| Cookie Disabled | Browser blokir cookie | Tampilkan pesan "Aktifkan cookie untuk menggunakan sistem" |
| CSRF Attack | Form submit dari domain lain | SameSite=Strict cookie mencegah ini |
| SQL Injection di Login | Karakter khusus di input | Prisma parameterized query, Zod validation |
| Large Concurrent Login | Banyak user login bersamaan | Connection pool + index pada email |
| Stale Session | Token valid tapi user dinonaktifkan | Cek `isActive` user saat setiap session validation |
| Clock Skew | Server time berbeda | Gunakan UTC untuk semua timestamp |

---

## 17. Security Requirements

### SvelteKit-Specific Implementation

```typescript
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth/session';

export const handle: Handle = async ({ event, resolve }) => {
  // 1. Extract session token dari cookie
  const sessionToken = event.cookies.get('session_token');

  // 2. Validasi session
  if (sessionToken) {
    const session = await validateSession(sessionToken);
    if (session) {
      event.locals.user = session.user;
      event.locals.session = session;
    }
  }

  // 3. Proteksi route berdasarkan config
  const routeConfig = getRouteConfig(event.url.pathname);
  if (routeConfig?.protected) {
    if (!event.locals.user) {
      return redirect(302, `/login?redirect=${event.url.pathname}`);
    }
    if (routeConfig.roles && !routeConfig.roles.includes(event.locals.user.role)) {
      return new Response('Forbidden', { status: 403 });
    }
  }

  return resolve(event);
};
```

### Security Checklist
- [x] Password hashed dengan Argon2id
- [x] Session token cryptographically random
- [x] Cookie: HttpOnly, Secure, SameSite=Strict
- [x] HTTPS enforced (via reverse proxy/Nginx)
- [x] Rate limiting per IP + email
- [x] Generic error messages (tidak reveal email vs password)
- [x] Audit log setiap event auth
- [x] SQL injection prevention via Prisma ORM
- [x] XSS prevention via SvelteKit default escaping
- [x] CSRF prevention via SameSite cookie

---

## 18. Testing Strategy

### Unit Testing (Vitest)

```typescript
// tests/unit/auth.service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { AuthService } from '$lib/server/auth/auth.service';

describe('AuthService.login', () => {
  it('should return user and session on valid credentials', async () => {
    // ...
  });

  it('should throw INVALID_CREDENTIALS on wrong password', async () => {
    // ...
  });

  it('should lock account after 5 failed attempts', async () => {
    // ...
  });

  it('should reject inactive user', async () => {
    // ...
  });
});

describe('SessionService', () => {
  it('should create valid session token', async () => {});
  it('should invalidate expired sessions', async () => {});
  it('should return null for invalid token', async () => {});
});
```

### Integration Testing (Vitest)

```typescript
// tests/integration/auth.api.test.ts
describe('POST /api/auth/login', () => {
  it('returns 200 and sets cookie on valid login', async () => {});
  it('returns 401 on invalid credentials', async () => {});
  it('returns 400 on invalid email format', async () => {});
  it('returns 423 on locked account', async () => {});
});
```

### E2E Testing (Playwright)

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('Owner dapat login dan melihat dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'owner@tapioleaf.com');
  await page.fill('[name="password"]', 'TestPassword123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});

test('Login dengan kredensial salah menampilkan error', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'owner@tapioleaf.com');
  await page.fill('[name="password"]', 'wrongpassword');
  await page.click('button[type="submit"]');
  await expect(page.locator('.error-message')).toBeVisible();
});

test('Petugas Gudang tidak bisa akses halaman penjualan', async ({ page }) => {
  // Login as Petugas Gudang
  // Navigate to /penjualan
  // Expect 403 page
});
```

---

## 19. DevOps & Deployment

### Environment Variables
```env
# .env.production
DATABASE_URL="postgresql://user:pass@neon.db/tapioleaf"
SESSION_SECRET="minimum-32-chars-random-string-here"
SESSION_EXPIRY_HOURS=8
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
NODE_ENV=production
```

### Docker Setup
```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json .
RUN npm ci --production
EXPOSE 3000
CMD ["node", "build"]
```

### Monitoring
- Log semua auth events ke stdout (JSON format)
- Alert jika login failure rate > 20/menit (indikasi brute force)
- Monitor session table growth

### Backup
- PostgreSQL backup harian (termasuk `auth_logs`)
- Retention 30 hari untuk auth_logs

---

## 20. Definition of Done

```markdown
- [ ] Form login selesai dibuat dengan validasi Zod
- [ ] API POST /api/auth/login selesai dan tertest
- [ ] API POST /api/auth/logout selesai dan tertest
- [ ] Session management dengan HTTP-only cookie selesai
- [ ] Rate limiting login selesai (5 attempt, lock 15 menit)
- [ ] hooks.server.ts route guard selesai untuk semua route
- [ ] RBAC konfigurasi semua role selesai
- [ ] Audit log tercatat untuk semua event auth
- [ ] Unit test coverage > 80%
- [ ] Integration test API auth selesai
- [ ] E2E test login/logout/forbidden selesai
- [ ] Security review: cookie flags, password hash, CSRF
- [ ] Environment variables terdokumentasi
- [ ] Docker build berhasil
- [ ] Deploy ke staging berhasil
- [ ] QA sign-off selesai
- [ ] Dokumentasi teknis diupdate
```

---

*Dokumen ini adalah PRD/SRS resmi untuk Fitur Authentication CV TapioLeaf Management System.*
*Versi: 1.0.0 | Status: Draft | Last Updated: 2025-01-01*
