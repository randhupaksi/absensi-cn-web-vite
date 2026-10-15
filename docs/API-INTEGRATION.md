# API integration contract

The Go API is maintained in the sibling `absensi-cn-api` Git repository. Its
router is the source of truth for endpoint paths and role middleware. When both
repositories are checked out beside each other, read
`../absensi-cn-api/docs/API-REFERENCE.md`. In an isolated frontend clone,
inspect the API repository's `internal/router/router.go`, handlers, services,
and tests before changing integration code.

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
- Support live updates use `fetch` with a bearer header to open the short-lived
  SSE stream; do not replace it with `EventSource`, which cannot send the
  standard authorization header. Browser-push subscription is separate from
  stream connectivity and requires an explicit user action/permission.

## Endpoint boundary

The client consumes public health/meta/attendance-window data, authentication,
student attendance/history, teacher/homeroom/BK workflows, admin management,
private uploads, notifications, and support/reset flows. Paths and DTO fields
must be taken from the API router and target service module, not inferred from
frontend page names. Private upload URLs remain API requests with bearer auth;
they are not static assets or public links.

## Session and privacy

Protected requests use a bearer token. On logout, invalid session, or account
switch, clear private query state as well as auth state. Do not log tokens,
passwords, student photos, or unnecessary personal data. Do not copy secrets
into `.env` values prefixed with `VITE_`.

The frontend stores the auth session in `localStorage` when available and uses
`sessionStorage` only as a fallback. This preserves cross-tab and browser-restart
convenience but can leave a token on shared devices until logout or app cleanup;
the API still rejects an expired token. Both stores are readable by same-origin
JavaScript, so this does not protect against XSS. A future `HttpOnly; Secure` cookie flow requires
coordinated API/frontend changes and CSRF review. The app clears TanStack Query
state when the auth session changes, so new users do not inherit cached private
data.

## Correlation and errors

The API returns `X-Request-ID` and `X-Trace-ID` response headers and includes a
request ID in its standard JSON envelope when available. Preserve safe request
context in support/debug reports, but avoid displaying raw internal errors or
sensitive values to end users. Retry only transient, safe-to-repeat requests;
never blindly replay a non-idempotent write. In particular, do not retry
`LOGIN_THROTTLED` or `LOGIN_IN_PROGRESS` automatically; honor `Retry-After` and
present the cooldown or short in-progress message. A concurrent login for the
same portal identifier is not another failed-password attempt.

## Coordination checklist

When a contract changes, update both repositories in a compatible sequence:
API DTO/validation/handler and tests; frontend service/types/forms and tests;
then endpoint documentation. For attendance, authorization, review identity,
status transitions, and calculated totals, the API remains authoritative.
