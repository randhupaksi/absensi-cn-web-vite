# Browser E2E ABSENSI CN

Suite ini menguji frontend asli melalui browser Chromium desktop dan emulasi Pixel 5. Semua respons API berasal dari fixture sintetis; ini bukan pengujian integrasi Go/MySQL atau bukti otorisasi server.

## Menjalankan

Dari root repository `absensi-cn-web-vite`, dengan dependency dan browser Playwright yang sudah tersedia:

```sh
npm run test:e2e:typecheck
npm run test:e2e
# Pilih proyek/file, melalui CLI lokal agar forwarding argumen shell konsisten:
node node_modules/playwright/cli.js test --project=chromium e2e/student.spec.ts
node node_modules/playwright/cli.js test --project=mobile-chromium
node node_modules/playwright/cli.js test --list
```

Gunakan versi Node yang didukung `package.json` (22.x atau >=24). Runner membangun bundle sendiri ke `.e2e-dist`, kemudian menjalankan preview pada **127.0.0.1:4173**, tanpa memakai server yang sudah berjalan. Build legacy juga dijalankan sehingga persiapan dapat memerlukan beberapa menit. Port tersebut harus kosong. Tidak perlu menyalakan API, database, Docker, atau menjalankan migrasi. Tidak ada dependency baru atau browser yang diunduh oleh perintah test.

Hasil JSON: `test-results/e2e-results.json`; screenshot dan konteks DOM tersedia untuk kegagalan. Trace disimpan pada retry pertama. Di CI, retry maksimal dua kali; hasil flaky harus ditinjau, bukan dianggap bukti stabilitas.

## Isolasi

- `global-setup.ts` membangun dan menghentikan preview dalam proses runner. `vite.config.ts` memakai konfigurasi aplikasi dengan environment bundle dan proxy khusus test.
- `fixture.ts` memasang routing pada **browser context**, sehingga tab/popup juga terlindungi. Hanya origin preview boleh lewat; `/api/*` dan `/uploads/*` wajib dijawab mock. API yang belum dipetakan menyebabkan test gagal.
- Semua `DELETE` diblokir dan menyebabkan test gagal, termasuk jika ada handler mock. Tidak ada operasi migrasi, startup backend, hapus histori, penghapusan akun, atau reset database.
- DNS eksternal Chromium diblokir, background networking dikurangi, WebSocket ditutup, service worker dinonaktifkan. Request domain luar dan port layanan lokal lain dibatalkan sebelum dikirim. Tes isolasi menggunakan domain `.invalid` dan port lokal yang tetap diblokir interceptor.
- Kamera fisik dan lokasi asli tidak dipanggil. Kamera menggunakan stream canvas bertuliskan `SYNTHETIC E2E`; koordinat uji 0,0. Default izin perangkat ditolak.
- Setiap test mendapat context, mock map, dan session baru. Tanggal browser dikunci ke 30 September 2026, Asia/Jakarta; timer tetap berjalan agar debounce/retry/loading aplikasi tetap diuji.
- Token, nama, NIS, foto, tiket, file import, dan password seluruhnya dibuat untuk test. Tidak membaca akun/dataset sekolah. Audit request yang dilampirkan hanya memuat method/path, bukan password atau body.

## Peta alur dari implementasi

Sumber pemetaan: `src/App.tsx`, halaman dan komponen form terkait, `src/services/*`, tipe respons frontend, serta router/kontrak API sibling saat discovery. BK adalah **TEACHER dengan `has_bk_scope`**, bukan role baru. Scope wali kelas/mapel mengikuti `/teacher/me` dan penugasan yang dikembalikan API.

Semua endpoint pada tabel menggunakan prefix `/api/v1`, kecuali `/uploads/*`.

| Halaman / role | Alur browser | API yang dimock | Spec |
| --- | --- | --- | --- |
| Publik `/`, `/login/student`, `/login/staff`, `/deveran`, `/randhu` | Landing, navigasi bantuan kedua portal/back, profil developer/log publik, tema, redirect alias/fallback, desktop/mobile, CSP smoke lama | GET `/public/attendance-window` | `smoke`, `public-and-access` |
| Login STUDENT, TEACHER, ADMIN | Input kosong/salah, payload portal, sukses ke dashboard role, reload session, loading/duplicate, rate limit, error | POST `/auth/login`; GET dashboard role | `auth` |
| `/auth/change-password` | Gate password awal, validasi panjang/konfirmasi, sukses/gagal | POST `/auth/change-password` | `auth` |
| `/dashboard/student` | Kamera ditolak, foto/cancel/ambil ulang, hadir/izin/sakit, lokasi captured/denied/unavailable, multipart, pending, gagal/retry, konflik duplikat, antrean 429, hari libur | GET `/student/today`, `/student/dashboard`; POST `/student/daily-report` | `student` |
| Siswa `/history`, `/profile` | Identitas API, loading/403 profil, histori/search/empty, foto terlindungi, export kosong, regresi offline/online | GET `/student/history`, `/student/profile`, `/uploads/e2e/photo.png` | `student` |
| Guru `/dashboard/teacher` | Menu sesuai capability, scope BK terpisah, data dashboard | GET `/teacher/me`, `/teacher/homeroom/dashboard`, `/teacher/subject-assignments`, `/teacher/subject/current-session`, `/bk/dashboard` sesuai scope | `staff`, `public-and-access` |
| Guru `/homeroom/students` | Daftar/search/detail siswa kelas, kosong, 403 | GET `/teacher/homeroom`, `/teacher/homeroom/students`, `/teacher/homeroom/students/:id` | `staff` |
| Guru `/homeroom/attendance` | Filter API, validasi catatan koreksi, sukses/error, invalidasi data | GET `/teacher/homeroom/attendance-overview`; PATCH `/teacher/homeroom/attendance/:id/review` | `staff` |
| Guru `/homeroom/submissions` | Kosong/403, review wajib catatan, sukses/error, data setelah refresh | GET `/teacher/homeroom/submissions-overview`; PATCH `/teacher/homeroom/submissions/:id/review` | `staff` |
| Guru `/subject/schedule`, `/subject/session` | Jadwal ke sesi aktif, kosong/error, edit topik/catatan, draft, finalisasi, error draft | GET `/teacher/subject-assignments`, `/teacher/subject/schedule-day-status`, `/teacher/subject/current-session`, `/teacher/subject/attendance`; PUT `/teacher/subject/sessions/:id/draft`; POST `/teacher/subject/attendance/validate` | `staff` |
| Guru `/subject/history`, `/subject/recap` | Filter status, buka sesi/back, pilih assignment/mode periode, rekap populated/empty/403 | GET `/teacher/subject/sessions`, `/teacher/subject/recap` beserta lookup penugasan | `staff` |
| BK `/bk/students`, `/bk/attendance`, `/bk/submissions`, `/bk/counseling` | Scope guru BK, kosong/403, pencarian konseling, validasi/buat catatan | GET `/bk/*-overview`; POST `/bk/students/:id/counseling-notes` | `staff`, `public-and-access` |
| Admin dashboard, `/analytics` | Data ringkasan, analitik kosong/error | GET `/admin/dashboard`, `/admin/analytics/attendance`, lookup akademik | `admin` |
| Admin `/students`, `/teachers`, `/classes`, `/subjects`, `/holidays`, `/users`, `/admins` | List/search/empty/error, tab unit/jurusan, validasi dan buat mapel mock, validasi/cancel libur | GET endpoint eksplisit di `defaultReads()`; POST `/admin/subjects` | `admin` |
| Admin import siswa/guru | File salah/terlalu besar ditolak, upload XLSX sintetis, hasil parsial | POST `/admin/import/siswa`, `/admin/import/guru` | `admin` |
| Admin `/support` | Cari dan buka tiket yang dikembalikan mock | GET `/admin/support/tickets`, `/admin/support/tickets/:reference` | `admin` |
| Publik `/support` | Validasi dua portal, buat tiket, pending/error, lacak kode, salah kode, balas, session tiket/reload | POST `/public/support/tickets`, `/public/support/tickets/access`, `/public/support/tickets/:reference/access`, `/public/support/tickets/:reference/messages` | `support` |
| Publik `/support/reset-password` | Tiket disetujui → sesi reset → validasi password → login, token hilang/expired/ditolak | POST `/public/support/tickets/:reference/reset-session`, `/public/support/password/reset` | `support` |
| Siswa/guru `/support` | List kosong, validasi/buat tiket, detail | GET/POST `/support/tickets`, GET `/support/tickets/:reference`, `/support/notifications`, endpoint push-key nonaktif | `support` |
| Seluruh halaman terlindungi | Tanpa sesi, role berbeda, BK tanpa scope, 401, logout, session rusak/legacy, back setelah session hilang | Tidak ada private API untuk role yang ditolak route guard; 403 eksplisit untuk scope | `public-and-access` |

`fixtures.ts` adalah inventori lengkap respons GET, dengan tipe domain untuk identitas/absensi/mapel/tiket. Mutasi didaftarkan per test; tidak ada handler sukses umum. Assertion payload/query/bearer memeriksa integrasi frontend dengan kontrak API, bukan hanya teks tampilan.

## Batas dan gap yang disengaja

- **Penghapusan histori, migrasi startup, dan prioritas keputusan BK vs wali kelas tidak ditetapkan sebagai expected behavior.** Tidak dieksekusi. Perlu konfirmasi aturan bisnis terpisah.
- Mock 403 menguji reaksi frontend; otorisasi, SQL, isolasi tenant, race antar akun, dan konsistensi database harus diuji di backend dengan lingkungan sintetis tersendiri.
- Tidak mengakses hardware, geofence nyata, push provider, SSE server nyata, SMTP, atau layanan eksternal. Emulasi Pixel 5 bukan perangkat Android fisik; Safari/Firefox dan engine legacy belum diuji.
- Operasi admin sensitif (hapus/nonaktifkan massal/reset akun langsung), seluruh kombinasi CRUD akademik, review berantai BK/walas, dan pembukaan sesi terlambat belum menjadi cakupan suite.
- Export PDF/XLSX berisi banyak variasi format, notifikasi realtime/pagination percakapan, dan semua kombinasi periode/filter bukan cakupan lengkap. Jangan menyimpulkan 100% coverage dari jumlah kasus.
- Kegagalan karena aplikasi harus tetap terlihat dalam hasil run. Jangan memakai `force`, `test.fail`, `skip`, atau mengganti assertion menjadi perilaku bug agar suite hijau. Temuan terkonfirmasi dan hasil validasi dicatat setelah run lengkap.

## Temuan aplikasi yang dipertahankan sebagai test gagal

1. **Tombol tampilkan password tidak bisa diklik.** Playwright menemukan tombol tetapi input `#password` menghalangi pointer. Pada `src/features/auth/components/premium-input.tsx:93`, input memiliki `z-[1]`; wrapper trailing pada baris 100 tidak memiliki stacking level yang mengatasinya. Test memakai klik pengguna biasa dan memeriksa perubahan tipe input. Tidak memakai `force` atau mengubah CSS aplikasi.
2. **503 generik ditampilkan sebagai pembaruan versi.** Dua respons login 503 dengan kode `SERVER_UNAVAILABLE` seharusnya memberikan feedback gangguan layanan. `system-status-events.ts` sudah membuat judul gangguan, tetapi `src/components/errors/system-status-alert.tsx:117` selalu menampilkan “Web sedang update versi terbaru” untuk `isServerOutage`. Test tidak menganggap gangguan umum sebagai maintenance. Terjadi pada portal siswa dan staff.
3. **Peringatan offline gagal pada pemuatan pertama.** Setelah profil selesai dimuat, `context.setOffline(true)` memicu lazy import `SystemStatusAlert` dari `src/providers/app-providers.tsx:20`. Audit browser mencatat chunk `system-status-alert` dan dependensinya gagal dengan `net::ERR_INTERNET_DISCONNECTED`; alert tidak tampil. Reproduksi menggunakan context baru dan service worker diblokir sesuai isolasi suite. Bagian pemulihan online dalam test belum tercapai karena assertion alert gagal terlebih dahulu.

Ketiganya direproduksi pada bundle build lokal; perbaikan aplikasi berada di luar izin tugas ini. Screenshot, DOM, dan `mock-network-audit` tersedia pada laporan run. Request font Google yang dicoba halaman diblokir oleh harness; font eksternal tidak diunduh.

## Inventori perubahan

- Suite baru: `auth.spec.ts`, `public-and-access.spec.ts`, `student.spec.ts`, `staff.spec.ts`, `support.spec.ts`, `admin.spec.ts`.
- Harness/data baru: `fixture.ts`, `fixtures.ts`, `global-setup.ts`, `vite.config.ts`, `tsconfig.json`; dokumentasi: `README.md` ini.
- `smoke.spec.ts`: empat test lama dan seluruh assertion dipertahankan; import menggunakan fixture isolasi, route CSP memakai fallback dan tidak mengikuti redirect fetch.
- `../playwright.config.ts`: dua proyek, isolasi browser, lifecycle server lokal, laporan, batas waktu.
- `../package.json`: `test:e2e` dan `test:e2e:typecheck`; tidak mengubah dependency/lockfile.
- `../.gitignore`: mengabaikan `.e2e-dist`.

Source aplikasi, backend, database, migrasi, dan konfigurasi deployment tidak diubah. Tidak ada commit/push. Perubahan backend `internal/modules/support/live.go` yang sudah ada sebelum pekerjaan dibiarkan utuh.

## Hasil validasi terakhir — 1 Oktober 2026

Perintah aktual: `node node_modules/playwright/cli.js test`. **113 skenario × 2 proyek = 226 eksekusi**, durasi sekitar 7 menit 53 detik termasuk persiapan. Hasil dari `test-results/e2e-results.json`:

| Spec | Lulus | Gagal | Dilewati |
| --- | ---: | ---: | ---: |
| `smoke.spec.ts` (lama) | 8 | 0 | 0 |
| `auth.spec.ts` | 34 | 6 | 0 |
| `public-and-access.spec.ts` | 44 | 0 | 0 |
| `student.spec.ts` | 32 | 2 | 0 |
| `staff.spec.ts` | 48 | 0 | 0 |
| `admin.spec.ts` | 30 | 0 | 0 |
| `support.spec.ts` | 22 | 0 | 0 |
| **Total** | **218** | **8** | **0** |

Tidak ada test yang belum dijalankan dalam suite terdaftar; gap fitur di atas belum menjadi kasus test. Enam kegagalan auth adalah 503 siswa/staff dan tombol password pada dua proyek; dua kegagalan siswa adalah alert offline. Runner exit code **1**, sesuai delapan assertion yang gagal. Test tidak ditandai expected failure. Flaky menurut laporan: 0; error runner: 0. Seluruh 226 audit tersedia dan total request API tanpa mock: **0**.

Validasi tambahan lulus:

```sh
node node_modules/typescript/bin/tsc -p e2e/tsconfig.json
node node_modules/oxlint/bin/oxlint e2e playwright.config.ts
git diff --check
```

Global setup juga menyelesaikan `tsc -b` dan Vite build khusus E2E. Build memberi peringatan ukuran chunk/biaya plugin legacy yang sudah berasal dari konfigurasi aplikasi; tidak diubah dalam tugas test ini. Run dilakukan lokal Windows memakai Node **v23.8.0** yang tersedia (di luar rentang engines repo); CI dan pengulangan pada Node 22/24 belum dijalankan. Gunakan versi yang didukung untuk run CI.
