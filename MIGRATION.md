# Architecture Migration Guide

This project is being reorganized to a clean, service-oriented layout (mirroring
the `peerpays-admin` structure). The **foundation is done**; the remaining
per-feature pages move incrementally using the recipe below. Nothing is broken in
the meantime — compatibility shims keep old import paths working.

## Target structure

```
src/
  services/
    lib/          # http.js (single axios client), csrf.js, auth.js, env.js, cookies.js
    api/          # one <domain>.service.js per domain (auth, users, companies, rfx, ...)
    context/      # app.context.jsx (auth/user React state; delegates to lib + api)
  layouts/        # DashboardLayout.jsx, AuthLayout.jsx
  pages/          # route screens (see "Pages" below for the eventual app/ auth/ marketing split)
  components/
    ui/           # shadcn primitives (unchanged)
    landing/      # marketing one-page sections
    <feature>/    # feature-grouped components (companies/, rfx/, ...)
```

## What already changed (foundation pass)

- **One HTTP client** — `src/services/lib/http.js`. It attaches the Bearer token
  and injects `X-CSRFToken` on **all** unsafe methods (POST/PUT/PATCH/DELETE),
  and refreshes-and-retries on 401 `token_not_valid`.
- **One CSRF source of truth** — `src/services/lib/csrf.js` (`ensureCsrfToken`,
  `getCsrfToken`). Cookie-first, `/api/v1/init/` body fallback, cached in memory +
  sessionStorage. The old cookie-vs-body split and POST-only gap are gone.
- **Auth service** — `src/services/api/auth.service.js` (login/signup/refresh/logout).
- **Context slimmed** — real implementation now at
  `src/services/context/app.context.jsx`. `useAuth()` shape is unchanged;
  `authAxios` is now the shared `http` client.
- **Layouts** — `DashboardLayout` (was `pages/base-dashboard.jsx`) and `AuthLayout`.
- **Removed** — empty Zustand stores, unused `utility/apiClient.js`, and the
  `swr` + `@kinde-oss/kinde-auth-react` dependencies (both unused).

### Compatibility shims (delete once all imports are migrated)

| Old path | Now re-exports | Migrate imports to |
|---|---|---|
| `@/contexts/app.context` | services/context/app.context | `@/services/context/app.context` |
| `@/utils/apiService` (default `api`) | services/lib/http | `@/services/lib/http` |
| `@/utility/getCookie` | services/lib/cookies | `@/services/lib/cookies` |

## Recipe: migrating one feature (e.g. `companies`)

1. **Create the service** — `src/services/api/companies.service.js`. Move the raw
   axios/`authAxios` calls currently inside the page(s) into plain async functions
   that use the shared client:
   ```js
   import http from "@/services/lib/http";
   export const getCompany = (id) => http.get(`companies/${id}/`).then((r) => r.data);
   export const updateCompany = (id, payload) =>
     http.patch(`companies/${id}/`, payload).then((r) => r.data);
   ```
   Do **not** hand-attach `X-CSRFToken` — the client does it. Delete any
   `getCookie("csrftoken")` header code as you go.
2. **Group components** — move feature components into
   `src/components/companies/` (e.g. `CompanyForm.jsx`).
3. **Update the page** — have the page call the service functions instead of bare
   `axios`/`BASE_URL`. Keep using `useAuth()` for state.
4. **Fix imports** — switch that file's context/cookie/api imports to the new
   `@/services/...` paths.

## Pages reorg (optional, low priority)

Eventually group `src/pages/` into `app/` (dashboard + onboarding), `auth/`, and
`marketing/` (landing, about, pricing, marketplace, store). Because ~70 files
import each other and the router references them, do this in small batches and
run `npm run build` after each batch. Not required for the app to work.

## Known follow-ups

- Google sign-in (`googleLogin`) is currently a safe stub (`toast.info`). Wire it
  to a real provider when ready.
- Migrate the ~15 pages still importing `@/utility/getCookie` and the ~30 still
  importing `@/utils/apiService`, then delete the three shim files above.
