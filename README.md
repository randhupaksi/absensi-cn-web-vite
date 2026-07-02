# Absensi CN Web — React Vite

Frontend SPA Absensi CN untuk siswa, guru/wali kelas, BK, dan admin. Project ini merupakan migrasi feature-parity dari frontend Next.js ke React 19 + Vite, dengan backend Go yang sama.

## Stack

- React 19 + TypeScript
- Vite 8
- React Router
- Tailwind CSS 4
- TanStack Query dan TanStack Table
- React Hook Form + Zod
- Motion, Recharts, jsPDF, dan Sonner

## Menjalankan project

```bash
npm install
copy .env.example .env
npm run dev
```

Atur API backend di `.env`:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

## Validasi

```bash
npm run typecheck
npm run lint
npm run build
```

## Deployment

Project dapat dideploy sebagai SPA di Vercel. `vercel.json` sudah mengarahkan seluruh deep link ke `index.html`. Tambahkan `VITE_API_BASE_URL` pada environment Vercel dan pastikan origin domain frontend diizinkan oleh konfigurasi CORS API Railway.

## Feature parity

Route yang tersedia mencakup landing page, login, dashboard siswa, dashboard guru/walas dan manajemen mapel, dashboard BK, serta seluruh manajemen admin. Services, types, validation, report PDF, import Excel, tabel, modal, dan protected API assets menggunakan kontrak API yang sama dengan frontend sebelumnya.
