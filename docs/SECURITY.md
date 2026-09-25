# Frontend security notes

- Every `VITE_*` value is public in the shipped JavaScript bundle. Store no API
  secret, database credential, signing key, or private upload credential there.
- Frontend route guards are not security boundaries. All data access and writes
  must be authorized by the API.
- Do not log bearer tokens, passwords, student identifiers/photos, GPS evidence,
  or other private data. Keep error messages useful without exposing internals.
- Clear user-specific query/cache state on logout, invalid authentication, and
  account changes.
- Keep dependencies lockfile-managed (`npm ci` for reproducible installs) and
  review dependency/security changes before release.
- `vercel.json` configures an enforcing CSP and other response headers for
  Vercel only. This policy is not automatically active on aaPanel; configure
  and validate the production host's headers separately. Test policy changes
  against boot scripts, login, API, font, image, camera, and location flows.
- Serve the SPA via HTTPS, apply an SPA fallback, and use an explicit API CORS
  allowlist. Host configuration is part of the security boundary.

Report suspected exposure promptly through the project owner. Do not commit
real credentials, production exports, or student evidence into the repository.
