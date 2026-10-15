# Absensi CN Browser E2E

This suite tests the real frontend in desktop Chromium and Pixel 5 emulation. All API responses come from synthetic fixtures; this is not a Go/MySQL integration test and does not prove server-side authorization.

## Running the suite

From the `absensi-cn-web-vite` repository root, with dependencies and the Playwright browser already installed:

```sh
npm run test:e2e:typecheck
npm run test:e2e
# Select a project or file. Use the local CLI to keep shell argument forwarding consistent:
node node_modules/playwright/cli.js test --project=chromium e2e/student.spec.ts
node node_modules/playwright/cli.js test --project=mobile-chromium
node node_modules/playwright/cli.js test --list
```

Use a Node version supported by `package.json` (22.x or >=24). The runner builds its own bundle in `.e2e-dist` and starts a preview at **127.0.0.1:4173**; it does not use an already-running server. The legacy build also runs, so setup may take several minutes. The port must be free. The API, database, Docker, and migrations do not need to be started. The test command does not add dependencies or download a browser.

JSON results are written to `test-results/e2e-results.json`. Screenshots and DOM context are attached to failures. Traces are saved on the first retry. CI retries up to twice; review flaky results instead of treating them as proof of stability.

## Isolation

- `global-setup.ts` builds and stops the preview within the test runner. `vite.config.ts` uses the application configuration with a test-specific bundle environment and proxy.
- `fixture.ts` installs routing on the **browser context**, protecting tabs and popups too. Only the preview origin may pass through; `/api/*` and `/uploads/*` must be mocked. An unmapped API request fails the test.
- All `DELETE` requests are blocked and fail the test, even if a mock handler exists. No migrations, backend startup, history deletion, account deletion, or database reset occurs.
- External Chromium DNS is blocked, background networking is reduced, WebSockets are closed, and service workers are disabled. Requests to external domains and other local service ports are cancelled before sending. Isolation tests use a `.invalid` domain and local ports that remain blocked by the interceptor.
- Physical cameras and real device location are not accessed. The camera uses a canvas stream labelled `SYNTHETIC E2E`; test coordinates are 0,0. Device permissions are denied by default.
- Every test gets a new context, mock map, and session. The browser date is fixed to September 30, 2026, in Asia/Jakarta; timers keep running so app debounce/retry/loading behavior is still tested.
- Tokens, names, NIS values, photos, tickets, import files, and passwords are synthetic. No school account or dataset is read. Attached request audits contain method/path only, never passwords or request bodies.

## Flow map from the implementation

Mapping sources: `src/App.tsx`, related pages and form components, `src/services/*`, frontend response types, and the sibling API router/contract discovered during setup. BK is **a TEACHER with `has_bk_scope`**, not a separate role. Homeroom/subject scope follows `/teacher/me` and the assignments returned by the API.

Every endpoint in the table uses the `/api/v1` prefix, except `/uploads/*`.

| Page / role | Browser flow | Mocked API | Spec |
| --- | --- | --- | --- |
| Public `/`, `/login/student`, `/login/staff`, `/randhu` | Landing, help navigation from both portals/back, developer profile, theme, alias/fallback redirects including the removed `/deveran` route, desktop/mobile, legacy CSP smoke | GET `/public/attendance-window` | `smoke`, `public-and-access` |
| STUDENT, TEACHER, ADMIN login | Empty/invalid input, portal payload, success to role dashboard, session reload, loading/duplicate submit, rate limit, errors | POST `/auth/login`; GET role dashboard | `auth` |
| `/auth/change-password` | Initial-password gate, length/confirmation validation, success/failure | POST `/auth/change-password` | `auth` |
| `/dashboard/student` | Camera denied, photo/cancel/retake, present/permission/sick leave, captured/denied/unavailable location, multipart, pending, failure/retry, duplicate conflict, 429 queue, school holiday | GET `/student/today`, `/student/dashboard`; POST `/student/daily-report` | `student` |
| Student `/history`, `/profile` | API identity, profile loading/403, history/search/empty state, protected photo, empty export, offline/online regression | GET `/student/history`, `/student/profile`, `/uploads/e2e/photo.png` | `student` |
| Teacher `/dashboard/teacher` | Capability-aware menus, separate BK scope, dashboard data | GET `/teacher/me`, `/teacher/homeroom/dashboard`, `/teacher/subject-assignments`, `/teacher/subject/current-session`, `/bk/dashboard` for applicable scope | `staff`, `public-and-access` |
| Teacher `/homeroom/students` | Class roster/search/student detail, empty state, 403 | GET `/teacher/homeroom`, `/teacher/homeroom/students`, `/teacher/homeroom/students/:id` | `staff` |
| Teacher `/homeroom/attendance` | API filters, correction-note validation, success/error, query invalidation | GET `/teacher/homeroom/attendance-overview`; PATCH `/teacher/homeroom/attendance/:id/review` | `staff` |
| Teacher `/homeroom/submissions` | Empty/403, review requires a note, success/error, refreshed data | GET `/teacher/homeroom/submissions-overview`; PATCH `/teacher/homeroom/submissions/:id/review` | `staff` |
| Teacher `/subject/schedule`, `/subject/session` | Schedule to active session, empty/error, edit topic/notes, save draft, finalize, draft error | GET `/teacher/subject-assignments`, `/teacher/subject/schedule-day-status`, `/teacher/subject/current-session`, `/teacher/subject/attendance`; PUT `/teacher/subject/sessions/:id/draft`; POST `/teacher/subject/attendance/validate` | `staff` |
| Teacher `/subject/history`, `/subject/recap` | Status filters, open session/back, assignment/period selection, populated/empty/403 recap | GET `/teacher/subject/sessions`, `/teacher/subject/recap` and assignment lookups | `staff` |
| BK `/bk/students`, `/bk/attendance`, `/bk/submissions`, `/bk/counseling` | BK teacher scope, empty/403, counseling search, validate/create notes | GET `/bk/*-overview`; POST `/bk/students/:id/counseling-notes` | `staff`, `public-and-access` |
| Admin dashboard, `/analytics` | Summary data, empty/error analytics | GET `/admin/dashboard`, `/admin/analytics/attendance`, academic lookups | `admin` |
| Admin `/students`, `/teachers`, `/classes`, `/subjects`, `/holidays`, `/users`, `/admins` | List/search/empty/error, unit/major tabs, mock subject validation/create, holiday validation/cancel | GET endpoints listed in `defaultReads()`; POST `/admin/subjects` | `admin` |
| Admin student/teacher imports | Reject invalid/oversized files, synthetic XLSX upload, partial results | POST `/admin/import/siswa`, `/admin/import/guru` | `admin` |
| Admin `/support` | Search and open only the ticket returned by the mock | GET `/admin/support/tickets`, `/admin/support/tickets/:reference` | `admin` |
| Public `/support` | Two-portal validation, create ticket, pending/error, track code, invalid code, reply, ticket session/reload | POST `/public/support/tickets`, `/public/support/tickets/access`, `/public/support/tickets/:reference/access`, `/public/support/tickets/:reference/messages` | `support` |
| Public `/support/reset-password` | Approved ticket → reset session → password validation → login; missing/expired/rejected token | POST `/public/support/tickets/:reference/reset-session`, `/public/support/password/reset` | `support` |
| Student/teacher `/support` | Empty list, validate/create ticket, ticket details | GET/POST `/support/tickets`, GET `/support/tickets/:reference`, `/support/notifications`, disabled push-key endpoint | `support` |
| All protected pages | No session, wrong role, BK without scope, 401, logout, corrupt/legacy session, browser back after session removal | No private API call for roles rejected by the route guard; explicit 403 for scope | `public-and-access` |

`fixtures.ts` is the complete inventory of mocked GET responses, with domain types for identity/attendance/subjects/tickets. Mutations are registered per test; there is no generic success handler. Payload/query/bearer assertions check frontend integration with the API contract, not just visible text.

## Deliberate limits and coverage gaps

- **History deletion, startup migrations, and priority between BK and homeroom decisions are not defined as expected behavior.** They are not executed; business rules require separate confirmation.
- Mocked 403 responses test frontend behavior. Authorization, SQL, tenant isolation, cross-account races, and database consistency require separate backend tests in a synthetic environment.
- The suite does not access physical hardware, real geofencing, push providers, a real SSE server, SMTP, or external services. Pixel 5 emulation is not a physical Android device; Safari/Firefox and legacy browser engines are not tested.
- Sensitive admin operations (bulk delete/deactivation/direct account reset), all academic CRUD combinations, chained BK/homeroom review, and late session opening are outside current coverage.
- PDF/XLSX format variations, real-time notifications/conversation pagination, and every period/filter combination are not fully covered. Test count does not imply 100% coverage.
- Application failures must remain visible in the results. Do not use `force`, `test.fail`, `skip`, or change assertions to match a bug just to make the suite green. Record confirmed findings and validation results after a complete run.

## Browser E2E findings

1. **The password visibility button cannot be clicked.** Playwright locates the button, but the `#password` input intercepts pointer events. The test uses a normal user click and checks the input type; it does not use `force` or modify application CSS.
2. **Generic 503 responses do not show the expected service outage feedback.** A login response with status 503 and code `SERVER_UNAVAILABLE` does not display the expected localized service-outage message. The test does not treat a general outage as maintenance. This affects both student and staff portals.
3. **The offline warning fails on first load.** After the profile loads, `context.setOffline(true)` triggers a lazy import of `SystemStatusAlert`. The browser audit records the alert chunk and its dependencies failing with `net::ERR_INTERNET_DISCONNECTED`, so the alert does not appear. The test uses a fresh context and blocks the service worker as part of suite isolation.
4. **Six persistence assertions in `auth.spec.ts` no longer match the application contract.** The source intentionally stores the session in `localStorage` with `sessionStorage` as a fallback, while these assertions still expect `localStorage` to be empty after login. This is a test specification failure, not evidence that login persistence is broken. Update the assertions separately to verify session reload according to the current contract.

The first three findings were reproduced against the local build; application fixes are outside this documentation update. Screenshots, DOM context, and `mock-network-audit` are available in the test report. A Google Fonts request attempted by the page was blocked by the harness; no external font was downloaded.

## Change inventory

- New suites: `auth.spec.ts`, `public-and-access.spec.ts`, `student.spec.ts`, `staff.spec.ts`, `support.spec.ts`, `admin.spec.ts`.
- New harness/data: `fixture.ts`, `fixtures.ts`, `global-setup.ts`, `vite.config.ts`, `tsconfig.json`; documentation: this `README.md`.
- `smoke.spec.ts`: all four existing tests and assertions were retained; imports use the isolation fixture, and the CSP route uses a fallback without following fetch redirects.
- `../playwright.config.ts`: two projects, browser isolation, local server lifecycle, reporting, and timeouts.
- `../package.json`: `test:e2e` and `test:e2e:typecheck` scripts; no dependency or lockfile changes.
- `../.gitignore`: ignores `.e2e-dist`.

Application source, backend, database, migrations, and deployment configuration were not changed. No commit or push was made. The pre-existing backend change in `internal/modules/support/live.go` was left intact.

## Latest validation results — October 15, 2026

Command run: `npm run test:e2e`. **114 scenarios × 2 projects = 228 executions**, taking about 9 minutes 49 seconds including setup. Results were read from `test-results/e2e-results.json`:

| Spec | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: |
| `smoke.spec.ts` (existing) | 8 | 0 | 0 |
| `auth.spec.ts` | 28 | 12 | 0 |
| `public-and-access.spec.ts` | 46 | 0 | 0 |
| `student.spec.ts` | 32 | 2 | 0 |
| `staff.spec.ts` | 48 | 0 | 0 |
| `admin.spec.ts` | 30 | 0 | 0 |
| `support.spec.ts` | 22 | 0 | 0 |
| **Total** | **214** | **14** | **0** |

No registered test was left unrun; the feature gaps above are not test cases. Six auth failures are the student/staff 503 case and the password button in both projects; six more are the outdated `localStorage` assertions that must be aligned with the current persistence contract. Two student failures are the offline alert. The runner exit code was **1**, matching the 14 failed assertions. No tests were marked as expected failures. Reported flaky tests: 0; runner errors: 0. All 228 request audits are available, and requests to an unmocked API total **0**.

Additional validation passed:

```sh
node node_modules/typescript/bin/tsc -p e2e/tsconfig.json
node node_modules/oxlint/bin/oxlint e2e playwright.config.ts
git diff --check
```

Global setup also completed `tsc -b` and the E2E-specific Vite build. The build emitted existing warnings about chunk size and legacy-plugin cost; they were not changed during the test work. The run used Node **v23.8.0** on Windows, outside the repository’s supported engine range. CI and reruns on Node 22/24 were not performed. Use a supported Node version for CI.
