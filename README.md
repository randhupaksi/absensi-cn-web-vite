# Absensi CN Web

Frontend web untuk **Absensi CN**, sistem manajemen kehadiran sekolah bagi SMP,
SMA, dan SMK Citra Negara. Aplikasi ini menyediakan landing page, dua portal
login, dan dashboard sesuai peran untuk siswa, guru mata pelajaran, wali kelas,
BK, serta admin.

Project ini dibuat oleh **Randhu Paksi Membumi** sebagai Fullstack Developer,
System Analyst, UI/UX Designer, Frontend Engineer, dan Backend Engineer.

## Teknologi utama

- **React 19** dan **TypeScript** untuk antarmuka aplikasi.
- **Vite 8** untuk development server dan production build.
- **React Router** untuk routing SPA dan navigasi antar halaman.
- **Tailwind CSS 4** untuk sistem styling dan design token.
- **TanStack Query** untuk pengambilan, cache, serta invalidasi data API.
- **React Hook Form + Zod** untuk form dan validasi input.

Library utama lain yang digunakan adalah Radix Select dan Base UI untuk kontrol
interaktif, Motion untuk animasi, Recharts untuk visualisasi dashboard, Sonner
untuk notifikasi, jsPDF untuk laporan, dan Axios sebagai HTTP client.

## Fitur yang tersedia

### Umum dan autentikasi

- Landing page sistem kehadiran sekolah.
- Portal login yang dipisahkan untuk siswa dan staff.
- Redirect dashboard berdasarkan role pengguna setelah login.
- Logout yang kembali ke portal login sesuai peran sebelumnya.
- Scroll kembali ke atas ketika berpindah section atau halaman.
- Responsive layout untuk desktop dan mobile, termasuk tampilan tabel menjadi
  kartu informasi pada area yang membutuhkan keterbacaan mobile.

### Siswa

- Dashboard kehadiran harian.
- Check-in berbasis foto dengan dukungan lokasi perangkat sebagai bukti tambahan.
- Riwayat absensi dan status kehadiran.
- Profil siswa.
- Pengajuan izin, sakit, atau dispensasi berikut dokumen/foto pendukung.

### Guru dan wali kelas

- Dashboard kerja guru yang menyesuaikan peran guru mapel dan wali kelas.
- Daftar siswa kelas dan ringkasan kehadiran.
- Absensi kelas serta proses review wali kelas.
- Sesi mapel aktif untuk validasi kehadiran selama jam pelajaran.
- Rekap kehadiran mapel dan riwayat sesi mapel.
- Detail sesi, koreksi status kehadiran, topik pertemuan, dan catatan pengajaran.
- Cetak laporan untuk rekap mapel dan sesi mapel.
- Review pengajuan siswa sesuai otorisasi wali kelas.

### BK

- Dashboard dan monitoring siswa lintas kelas sesuai scope BK.
- Tinjauan absensi, detail siswa, dan riwayat kehadiran.
- Review absensi serta pengajuan yang memerlukan tindak lanjut.
- Catatan konseling siswa.

### Admin

- Dashboard operasional sekolah.
- Manajemen profil siswa, penempatan kelas, guru, pengguna, dan admin.
- Struktur akademik: unit sekolah SMP/SMA/SMK, jurusan/program, tahun ajaran,
  kelas, wali kelas, dan assignment mapel.
- Pengelolaan mapel, jadwal, ruangan, dan perubahan jadwal.
- Filter, pencarian, pagination, modal CRUD, import Excel, serta cetak laporan.
- Filter kelas menurut jenjang dan program/jurusan.

## Prasyarat

Sebelum menjalankan frontend, siapkan:

| Kebutuhan | Keterangan |
| --- | --- |
| Node.js | Wajib. Gunakan Node.js LTS terbaru, **v22 atau lebih baru direkomendasikan**. |
| npm | Sudah terpasang bersama Node.js. |
| Backend API | Wajib untuk login dan data nyata. Jalankan `absensi-cn-api` pada port yang sesuai. |
| Git | Opsional bila project diperoleh melalui clone repository. |

Verifikasi Node.js dan npm di PowerShell:

```powershell
node --version
npm --version
```

Jika perintah tersebut tidak ditemukan, instal Node.js LTS terlebih dahulu dari
website resmi Node.js, lalu tutup dan buka kembali terminal.

> Project ini tidak memakai PHP. Tidak perlu menginstal XAMPP untuk menjalankan
> frontend. XAMPP hanya dapat dipakai bila Anda memilih menggunakannya sebagai
> cara menjalankan MySQL untuk backend Go.

## Menjalankan frontend dari nol

Langkah berikut ditulis untuk Windows PowerShell.

### 1. Jalankan backend API terlebih dahulu

Buka terminal pertama:

```powershell
cd C:\path\ke\absensi-cn-web\absensi-cn-api
go run ./cmd/api
```

Pastikan health check API dapat diakses:

```text
http://localhost:8080/api/v1/health
```

Baca [README API](../absensi-cn-api/README.md) untuk panduan instalasi Go,
MySQL, database, dan seed lokal.

### 2. Masuk ke folder frontend

Buka terminal kedua:

```powershell
cd C:\path\ke\absensi-cn-web\absensi-cn-web-vite
```

### 3. Buat file environment

Salin template environment:

```powershell
Copy-Item .env.example .env
```

Isi `.env` untuk mengarah ke API lokal:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

`VITE_*` dibaca oleh browser dan masuk ke production bundle. Jangan menyimpan
password, JWT secret, API key rahasia, atau kredensial database di file `.env`
frontend.

### 4. Instal dependency

Gunakan `npm ci` untuk instalasi yang konsisten berdasarkan `package-lock.json`:

```powershell
npm ci
```

Gunakan `npm install` hanya bila Anda memang menambah, menghapus, atau mengubah
dependency di `package.json`.

### 5. Jalankan development server

```powershell
npm run dev
```

Vite akan menampilkan URL lokal, umumnya:

```text
http://localhost:5173
```

Buka URL tersebut di browser. Jangan tutup terminal development server selama
aplikasi masih digunakan.

## Alur menjalankan seluruh project

Gunakan dua terminal agar frontend dan API berjalan bersamaan.

| Terminal | Folder | Perintah | Alamat |
| --- | --- | --- | --- |
| API | `absensi-cn-api` | `go run ./cmd/api` | `http://localhost:8080` |
| Web | `absensi-cn-web-vite` | `npm run dev` | `http://localhost:5173` |

Hubungan keduanya ditentukan oleh:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

Jika port API diubah, misalnya menjadi `8081`, ubah nilai ini menjadi
`http://localhost:8081/api/v1` dan ubah `APP_ALLOWED_ORIGINS` pada API bila URL
frontend juga berubah.

## Rute utama

| Rute | Kegunaan |
| --- | --- |
| `/` | Landing page. |
| `/login/student` | Login khusus siswa menggunakan NIS dan password. |
| `/login/staff` | Login khusus guru, wali kelas, BK, dan admin. |
| `/dashboard/siswa` | Dashboard siswa. |
| `/dashboard/teacher` | Dashboard guru dengan akses mapel/wali kelas/BK sesuai role. |
| `/dashboard/admin` | Dashboard admin. |
| `/dashboard/admin/classes` | Struktur akademik, unit sekolah, jurusan, dan kelas. |
| `/dashboard/admin/students` | Profil dan penempatan kelas siswa. |
| `/dashboard/admin/subjects` | Mapel, assignment, jadwal, ruangan, dan perubahan jadwal. |

Routing memakai SPA. Membuka ulang URL dashboard secara langsung tetap didukung
oleh konfigurasi rewrite di `vercel.json` ketika dideploy ke Vercel.

## Struktur folder penting

```text
src/
  App.tsx                 # registry route, lazy loading, dan redirect
  pages/                  # halaman per role
  features/               # fitur berdasarkan domain dan role
  components/             # komponen reusable, modal, UI, router adapter
  services/               # API client dan service endpoint
  providers/              # TanStack Query dan provider aplikasi
  types/                  # type TypeScript bersama
  lib/validations/        # schema Zod
  index.css               # token visual dan CSS global
public/                   # logo, favicon, dan asset statis
```

## Perintah pengembangan dan validasi

```powershell
# Menjalankan development server
npm run dev

# Memeriksa type TypeScript
npm run typecheck

# Menjalankan linter
npm run lint

# Membuat production build
npm run build

# Menjalankan hasil production build secara lokal
npm run preview
```

Urutan yang disarankan sebelum push perubahan frontend:

```powershell
npm run typecheck
npm run lint
npm run build
```

## Troubleshooting

| Gejala | Penyebab umum | Solusi |
| --- | --- | --- |
| `node` atau `npm` tidak dikenali | Node.js belum terinstal atau terminal belum dibuka ulang | Instal Node.js LTS, lalu buka terminal baru. |
| Login gagal karena network error | API belum berjalan atau URL API salah | Jalankan API dan periksa `VITE_API_BASE_URL`. |
| CORS error di browser | Origin frontend belum diizinkan API | Set `APP_ALLOWED_ORIGINS=http://localhost:5173` pada API lalu restart API. |
| Halaman hanya kosong setelah update | Cache browser atau error runtime | Lihat console browser, pastikan `npm run typecheck` lulus, lalu hard refresh. |
| Port `5173` sudah digunakan | Vite lain masih berjalan | Hentikan proses lama atau gunakan URL port baru yang ditampilkan Vite. |
| Data tidak muncul | Database API belum siap atau frontend mengarah ke endpoint salah | Cek `GET /api/v1/health`, konfigurasi API, dan file `.env` frontend. |

## Build dan deployment

Production build dibuat dengan:

```powershell
npm run build
```

Hasilnya berada di folder `dist/`. Untuk deployment Vercel:

1. Hubungkan repository atau deploy folder frontend ini.
2. Tambahkan environment variable `VITE_API_BASE_URL` yang mengarah ke API
   deployment, misalnya `https://api.domain-sekolah.id/api/v1`.
3. Tambahkan domain frontend deployment ke `APP_ALLOWED_ORIGINS` pada API.
4. Deploy ulang frontend dan API setelah perubahan environment.

Jangan mengubah endpoint API, role permission, atau format payload hanya dari
frontend. Kontrak API, otorisasi, dan validasi bisnis tetap ditentukan backend.

## Kepemilikan

Copyright 2026 Randhu Paksi Membumi. All rights reserved.
