# Frontend architecture

This document describes the Vite SPA in this repository. API behavior and
deployment details live in the separate `absensi-cn-api` repository.

## Runtime shape

`src/main.tsx` mounts the React application. `src/App.tsx` owns browser routes,
lazy-loaded pages, role redirects, route-level error boundaries, and loading
fallbacks. Shared providers initialize application state, including TanStack
Query and authentication state. Role-specific pages are grouped under
`src/pages/`; reusable domain behavior belongs under `src/features/`.

```text
Browser
  └─ React Router / route guards
      ├─ role pages and shared components
      ├─ providers (auth, query, theme, notifications)
      └─ service modules → shared Axios client → API
```

`src/services/` is the boundary for HTTP requests and endpoint-specific mapping.
The shared client configures the base URL, authorization, request correlation,
and safe handling of transient failures. Keep transport details out of page
components where a service or feature hook is appropriate.

## Server and client state

- TanStack Query owns remote/server state. Mutations invalidate the narrowest
  affected keys; do not fabricate authoritative attendance or review data.
- React state is suitable for ephemeral UI state such as open panels, drafts,
  selected filters, and local transitions.
- Authentication state is private to the current session. Logout, invalid
  authentication, and account/role changes must not leave another user's cached
  server data visible; clear or replace private query state as auth code does.
- Treat frontend route checks as usability controls only. The API must authorize
  every protected operation independently.

## Configuration and API

`VITE_API_BASE_URL` is embedded into the build. It may be an absolute API URL or
a same-origin `/api/...` path. In development Vite proxies `/api` to
`VITE_DEV_PROXY_TARGET` (default `http://localhost:8080`). Never place secrets
in `VITE_*` variables: values are readable by every browser user.

Preserve API payload fields, status codes, role/scope semantics, identifiers,
and server-calculated totals. Consult `API-INTEGRATION.md` and the API
repository's endpoint reference before changing a service contract.

## UI boundaries

- Prefer existing design tokens, shared controls, and feature patterns.
- Data views should represent loading, success, empty, recoverable error, and
  unavailable-service states distinctly.
- Keep keyboard focus visible; use semantic controls and labels for icon-only
  actions; check contrast in both themes and narrow mobile widths.
- Camera, location, and upload flows need permission-denied, unsupported,
  loading, failure, and retry states.

## Relevant source map

| Concern | Location |
| --- | --- |
| Routes and lazy-loading | `src/App.tsx` |
| Application entry | `src/main.tsx`, `src/providers/` |
| API transport and endpoint services | `src/services/` |
| Domain and role features | `src/features/`, `src/pages/` |
| Shared types and validation | `src/types/`, `src/lib/validations/` |
| Global styles and tokens | `src/index.css` |
| Unit/component tests | `src/**/*.test.*` |
| Browser tests | `e2e/` |
