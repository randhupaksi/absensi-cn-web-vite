# Frontend repository instructions

- This repository contains the React/Vite SPA only. The Go API is a separate
  sibling Git repository; do not assume workspace-root files ship with this
  repository.
- Read `README.md` and the relevant `docs/` page before changing architecture,
  API integration, deployment, or security behavior.
- Follow existing TypeScript, React, service, feature, and design-token patterns.
  Keep API calls in `src/services/`; use TanStack Query for remote state.
- The API is authoritative for identity, permissions, attendance, review state,
  and persisted totals. UI route guards are not authorization.
- Clear private query data at logout/session/account boundaries. Never put
  secrets or private credentials in `VITE_*` variables.
- Preserve unrelated work and inspect `git status` before editing or staging.
  Do not commit or push unless the user explicitly requests it.
- For focused changes, run relevant checks. Before a frontend release use
  `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`; run
  `npm run test:e2e` for affected critical browser flows. Report checks actually
  run; do not imply these run automatically (there is no repo CI workflow).
- Never add real student data, tokens, credentials, photos, or production dumps
  to source, tests, logs, or documentation.
