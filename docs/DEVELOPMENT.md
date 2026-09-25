# Frontend development

## Requirements and setup

Use Node.js `>=22 <23` or `>=24` and npm `>=10` (see `package.json`). From this
repository root:

```powershell
Copy-Item .env.example .env
npm ci
npm run dev
```

The API is a separate repository/service. Set `VITE_API_BASE_URL` in `.env` to
the desired API base, normally `http://localhost:8080/api/v1`. When using a
relative `/api/...` URL, the Vite development proxy forwards requests to
`VITE_DEV_PROXY_TARGET` (default `http://localhost:8080`).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite development server |
| `npm run typecheck` | TypeScript project checks |
| `npm run lint` | Oxlint checks |
| `npm test` | Vitest unit/component tests |
| `npm run test:coverage` | Tests with V8 coverage |
| `npm run build` | Typecheck and production Vite build into `dist/` |
| `npm run test:e2e` | Build then Playwright against Vite Preview |
| `npm run preview` | Serve the existing production build locally |

Playwright runs desktop Chromium and Pixel 5 emulation. Install Chromium on a
new machine with `npx playwright install chromium`. The current E2E suite is a
browser-level frontend suite; it does not provision a production-like database
or replace API integration tests.

## Before proposing a change

Use the narrowest relevant checks during iteration. Before a frontend release,
the recommended local gate is:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Run `npm run test:e2e` for changes affecting critical browser flows, routing,
responsive behavior, or client/server interaction. Review snapshots and test
artifacts before treating a browser test as meaningful. There is currently no
repository CI workflow; these commands run only when invoked locally unless a
separate CI system is configured.

## Change guidance

- Keep API contract changes coordinated with the API repository; update the
  service, types, validation, tests, and documentation together.
- Keep query invalidation scoped and ensure private data is cleared at auth
  boundaries.
- Avoid global CSS or shared component changes for a page-specific need unless
  the design system itself should change.
- Do not add test-only routes, credentials, or debug behavior to a production
  build.
