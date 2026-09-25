# API integration contract

The Go API is maintained in the sibling `absensi-cn-api` Git repository. Its
router is the source of truth for endpoint paths and role middleware. In the
full Absensi CN workspace, the shared API reference is at
`../docs/API-REFERENCE.md`; that file is outside this standalone frontend repo
and may not exist in an isolated clone. If it is unavailable, inspect the API
repository's `internal/router/router.go`, handlers, services, and tests before
changing integration code.

## Client conventions

- `VITE_API_BASE_URL` supplies the API base path and is a public build-time
  setting, not a secret.
- Use the shared Axios client in `src/services/api/` so authorization,
  correlation metadata, and transient failure handling stay consistent.
- Put endpoint request/response mapping in the corresponding service module;
  keep components focused on UI behavior.
- Preserve API field names, HTTP status, stable error codes, identifiers,
  pagination metadata, and role/scope meaning. Do not treat client-side role
  checks as authorization.
- For mutations, avoid duplicate submissions and invalidate the smallest set of
  affected TanStack Query keys. Do not present optimistic state as authoritative
  when the server result may reject or normalize the change.

## Session and privacy

Protected requests use a bearer token. On logout, invalid session, or account
switch, clear private query state as well as auth state. Do not log tokens,
passwords, student photos, or unnecessary personal data. Do not copy secrets
into `.env` values prefixed with `VITE_`.

The current frontend keeps the auth session in `sessionStorage` per tab and
deletes the legacy `localStorage` entry; do not reintroduce persistent token
storage. This does not mitigate active XSS. The app clears TanStack Query state
when the auth session changes, so new users do not inherit cached private data.

## Correlation and errors

The API returns `X-Request-ID` and `X-Trace-ID` response headers and includes a
request ID in its standard JSON envelope when available. Preserve safe request
context in support/debug reports, but avoid displaying raw internal errors or
sensitive values to end users. Retry only transient, safe-to-repeat requests;
never blindly replay a non-idempotent write. In particular, do not retry
`LOGIN_THROTTLED` automatically; honor `Retry-After` and present the cooldown.

## Coordination checklist

When a contract changes, update both repositories in a compatible sequence:
API DTO/validation/handler and tests; frontend service/types/forms and tests;
then endpoint documentation. For attendance, authorization, review identity,
status transitions, and calculated totals, the API remains authoritative.
