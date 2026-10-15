# Frontend deployment

## Current delivery model

This repository builds a static SPA. The current workflow is manual: build on
the development laptop, upload the generated `dist/` files through aaPanel (or
the selected static host), then verify the website. There is no configured
GitHub Actions deployment or automatic production deploy in this repository.
Do not infer production readiness or deploy merely from a successful build.

## Build

Choose the production API URL before building. For the current same-origin
aaPanel deployment, use `/api/v1`; Nginx then owns the HTTPS connection and
proxies requests to the local Go API. Vite embeds `VITE_API_BASE_URL` in
generated JavaScript, so changing the server-side environment after build does
not change the bundle.

```powershell
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

Inspect `dist/` and confirm the intended API URL and release contents before
upload. Never put credentials or private keys in frontend environment values.

## Static host requirements

- Serve `dist/` over HTTPS.
- For unknown application paths, internally serve `/index.html` (SPA fallback).
- Do not rewrite missing static assets to a successful HTML response if the
  host can distinguish existing files from route paths.
- Keep hashed `/assets/` files cacheable as immutable; use shorter or revalidate
  caching for `index.html` so a new deployment is picked up.
- Proxy both `/api` and `/api/` to the Go API. Proxy `/uploads/` too: attendance
  evidence is authenticated API content, never a public static directory.
- Every Nginx location that proxies to the API must send
  `X-Forwarded-Proto $scheme`. Do not use `$http_x_forwarded_proto`, because it
  is supplied by the client and could make plain HTTP appear secure to the API.
- Preserve `Authorization` for `/uploads/` and the support SSE location. The
  SSE location also needs buffering disabled; see the API repository's
  `docs/SUPPORT-OPERATIONS.md`.
- The API must allow the exact browser origin in `APP_ALLOWED_ORIGINS` and use
  HTTPS when the site is HTTPS.
- `vercel.json` applies only to Vercel. It configures an enforcing Content
  Security Policy (CSP), other response headers, and an SPA rewrite. These are
  not automatically applied by aaPanel/Nginx; configure equivalent rules on
  that host and validate them there. In particular, do not assume a successful
  Vercel CSP rollout means a separately hosted aaPanel site has the same policy.
  The current policy is defense in depth and still allows `'unsafe-inline'` and
  `data:` in `script-src`; do not describe it as a strict script CSP.

Example Nginx SPA fallback (adapt to the existing site config; do not replace
production configuration blindly). Keep missing generated assets as 404s so
the browser does not receive `index.html` as JavaScript or CSS:

```nginx
location ^~ /assets/ {
    try_files $uri =404;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

Apply an equivalent missing-file rule to any other public static-asset paths
used by the app. Configure the response security headers separately; this
example only shows SPA routing and missing generated-asset handling.

Minimal proxy shape (merge it into the active vhost/rewrite configuration; do
not paste it over an existing production config blindly):

```nginx
location ^~ /api/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header Authorization $http_authorization;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location ^~ /uploads/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header Authorization $http_authorization;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Also add `location = /api` with the same proxy headers if the API root is used.
The `^~ /api/` block does not match the exact `/api` path.

## Manual release and rollback

1. Record the source commit and confirm the release diff and checks.
2. Build with the intended production API URL; retain a copy of the exact
   artifact and record its checksum.
3. Preserve the current document root or release directory for rollback.
4. Upload/extract the new `dist/` contents to the configured web root. Ensure
   stale hashed assets are handled consistently with the cache policy.
5. Verify the landing page, direct navigation to a nested route, login page,
   browser console/network, API connectivity, and mobile layout.
6. If the release is faulty, restore the previous artifact and confirm the
   previous `index.html` and assets are again served.

Run `nginx -t` and reload Nginx only when its configuration changed. A static
frontend artifact replacement alone does not require an Nginx restart; use a
hard refresh or fresh browser session to verify the new `index.html` is served.

These are operational recommendations, not an automated aaPanel integration.
Coordinate API deploys separately; schema/API compatibility may affect the
release order. For data-affecting backend work, use the API repository's
operations and backup procedures.
