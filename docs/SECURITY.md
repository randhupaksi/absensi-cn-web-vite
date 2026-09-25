# Frontend security notes

- Every `VITE_*` value is public in the shipped JavaScript bundle. Store no API
  secret, database credential, signing key, or private upload credential there.
- Frontend route guards are not security boundaries. All data access and writes
  must be authorized by the API.
- Do not log bearer tokens, passwords, student identifiers/photos, GPS evidence,
  or other private data. Keep error messages useful without exposing internals.
- The auth session is stored in `sessionStorage` per tab; legacy persistent auth
  entries in `localStorage` are removed rather than restored. This reduces
  persistence after a tab session ends but does not protect a live token from
  same-origin malicious JavaScript or XSS.
- Clear user-specific query/cache state on logout, invalid authentication, and
  account changes.
- Keep dependencies lockfile-managed (`npm ci` for reproducible installs) and
  review dependency/security changes before release.
- `vercel.json` configures an enforcing CSP and other response headers for
  Vercel only. This policy is not automatically active on aaPanel; configure
  and validate the production host's headers separately. Test policy changes
  against boot scripts, login, API, font, image, camera, and location flows.
- The current Vercel CSP is an active defense-in-depth policy, not a strict
  script policy: `script-src` still permits `'unsafe-inline'` and `data:`.
  `script-src-attr 'none'` blocks inline event-handler attributes, but does not
  make inline script blocks safe. Tighten the policy only after the app has a
  nonce/hash-compatible boot flow and the actual hosting response is verified.
- Serve the SPA via HTTPS, apply an SPA fallback, and use an explicit API CORS
  allowlist. Host configuration is part of the security boundary.

The API remains authoritative for identity, permissions, and protected data.
Attendance evidence URLs are not public capabilities: the API requires a valid
session, completed initial password change, and access to the corresponding
student/class/unit scope. Location status is recorded as supporting evidence;
outside-radius, unavailable, and low-accuracy location do not by themselves
block check-in, by deliberate school policy.

Report suspected exposure promptly through the project owner. Do not commit
real credentials, production exports, or student evidence into the repository.
