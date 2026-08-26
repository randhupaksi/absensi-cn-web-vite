# Absensi CN Web

Frontend application for **Absensi CN**, the school attendance management system
for SMP, SMA, and SMK Citra Negara. It provides the landing page, separate login
portals, and role-aware dashboards for students, teachers, homeroom teachers, BK,
and administrators.

Built by **Randhu Paksi Membumi** as Fullstack Developer, System Analyst, UI/UX
Designer, Frontend Engineer, and Backend Engineer.

## Documentation

- [System architecture](../docs/ARCHITECTURE.md)
- [API reference](../docs/API-REFERENCE.md)
- [Operations and aaPanel deployment](../docs/OPERATIONS.md)
- [Contribution guide](../docs/CONTRIBUTING.md)

## Technology stack

- React 19 and TypeScript
- Vite 8 and React Router
- Tailwind CSS 4
- TanStack Query for fetching, caching, and invalidation
- Axios for HTTP communication
- React Hook Form and Zod for forms and validation
- Radix Select, Base UI, Motion, Recharts, Sonner, and jsPDF

## Features

### Shared and authentication

- School attendance landing page.
- Separate student and staff login portals.
- Role-aware redirects and logout behavior.
- Responsive desktop/mobile layouts, including mobile-friendly data cards.
- Theme switching, loading states, error boundaries, system alerts, and notifications.

### Student portal

- Daily attendance dashboard and attendance history.
- Photo check-in with device location evidence and geofence feedback.
- Student profile and personal password setup.
- Permission, sick-leave, and dispensation submissions with supporting files.
- Attendance correction status, validation status, and activity notifications.

### Teacher, homeroom, and BK portals

- Teacher workspace with subject and homeroom access based on scope.
- Class student lists, attendance tickets, validation, review, and correction.
- Active subject sessions, session history, recaps, teaching topics, and notes.
- BK monitoring across authorized classes, attendance review, submissions, and counseling notes.

### Admin portal

- Operational dashboard, analytics, charts, filters, and search.
- Student, staff, user, class, subject, schedule, room, and assignment management.
- School units, majors, school years, homeroom assignments, and holiday calendars.
- Excel import and PDF/Excel reporting workflows.

## Prerequisites

| Requirement | Recommendation |
| --- | --- |
| Node.js | LTS, v22 or newer recommended |
| npm | Included with Node.js |
| Backend API | Required for login and real data |
| Git | Optional when cloned from a repository |

This project does not require PHP or XAMPP. XAMPP may be used only to run MySQL
for the Go API.

Verify Node.js:

```powershell
node --version
npm --version
```

## Local development

Start the API in a separate terminal first:

```powershell
cd C:\path\to\absensi-cn-web\absensi-cn-api
go run ./cmd/api
```

Then run the frontend:

```powershell
cd C:\path\to\absensi-cn-web\absensi-cn-web-vite
Copy-Item .env.example .env
npm ci
npm run dev
```

Set this value in `.env`:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

Never store passwords, JWT secrets, private API keys, or database credentials in
frontend environment variables. `VITE_*` values are visible in the browser bundle.

The usual local URLs are:

| Service | URL |
| --- | --- |
| API | `http://localhost:8080` |
| Frontend | `http://localhost:5173` |

## Main routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/login/student` | Student login with NIS and password |
| `/login/staff` | Teacher, homeroom, BK, and admin login |
| `/dashboard/siswa` | Student dashboard |
| `/dashboard/teacher` | Teacher workspace based on role and scope |
| `/dashboard/admin` | Administrator dashboard |
| `/dashboard/admin/classes` | Academic structure and classes |
| `/dashboard/admin/students` | Student profiles and class placement |
| `/dashboard/admin/subjects` | Subjects, assignments, schedules, and rooms |

The app is an SPA. Direct dashboard URLs require a rewrite to `index.html`; the
aaPanel deployment package includes the required Nginx `try_files` rule.

## Important structure

```text
src/
  App.tsx                 # route registry, lazy loading, and redirects
  pages/                  # role-based pages
  features/               # domain and role features
  components/             # reusable UI, modals, and adapters
  services/               # API clients and endpoint services
  providers/              # Query and application providers
  types/                  # shared TypeScript types
  lib/validations/        # Zod schemas
  index.css               # visual tokens and global CSS
public/                   # logos, favicon, and static assets
```

## Development and validation

```powershell
npm run dev
npm run typecheck
npm run lint
npm run build
npm run preview
```

Recommended pre-push sequence:

```powershell
npm run typecheck
npm run lint
npm run build
```

## Build and aaPanel deployment

Build the production bundle on the laptop:

```powershell
npm run build
tar -czf "..\aaPanel-deploy\frontend-dist.tar.gz" -C dist .
```

Upload the archive to the aaPanel website document root and extract it directly
there. Node.js is not required on the production server. Configure the API
origin through `VITE_API_BASE_URL` before building; do not put secrets in it.

For the complete API build, upload, restart, backup, rollback, and verification
procedure, read [OPERATIONS.md](../docs/OPERATIONS.md).

## Troubleshooting

| Symptom | Likely cause | Solution |
| --- | --- | --- |
| `node` or `npm` is not recognized | Node.js is missing or the terminal is old | Install Node.js LTS and open a new terminal. |
| Network error during login | API is stopped or the API URL is wrong | Start the API and check `VITE_API_BASE_URL`. |
| CORS error | Frontend origin is not allowed by the API | Update `APP_ALLOWED_ORIGINS` and restart the API. |
| Blank page after an update | Browser cache or runtime error | Check the browser console, run typecheck, then hard refresh. |
| Port `5173` is busy | Another Vite process is running | Stop it or use the port shown by Vite. |
| Data is missing | API/database is unavailable | Check `/api/v1/health` and both environment files. |

Do not change API payloads, routes, or authorization assumptions only from the
frontend. The backend remains the source of truth for business rules and access.

## Ownership

Copyright 2026 Randhu Paksi Membumi. All rights reserved.
