// Centralized environment access.
// Vite exposes variables on import.meta.env. Reading them from one place avoids
// the previous bug where the production base URL resolved to "undefinedapi/v1/"
// because VITE_SECURE_URL was referenced but never defined in .env.

const raw = import.meta.env;

const DEFAULT_SERVER_URL = "https://isourceplus.net/";

const withTrailingSlash = (url) => (url.endsWith("/") ? url : `${url}/`);

// VITE_SECURE_URL is an optional override; VITE_SERVER_URL is the default; both
// fall back to the known production host so the app never builds a broken URL.
const SERVER_URL = withTrailingSlash(
  raw.VITE_SECURE_URL || raw.VITE_SERVER_URL || DEFAULT_SERVER_URL,
);

export const ENV = {
  MODE: raw.MODE,
  DEV: raw.DEV,
  PROD: raw.PROD,
  SERVER_URL,
  // ALWAYS use a same-origin relative path. The backend authenticates with
  // HttpOnly cookies, which are only sent when the request is first-party
  // (same origin as the page). Any cross-origin absolute URL turns those into
  // third-party cookies, which modern browsers strip — so the `Cookie` header
  // never reaches the API and `token/refresh/` returns 401.
  //
  //   - Dev:  Vite's server.proxy forwards `/api` → isourceplus.net.
  //   - Prod: the static host (Render) rewrites `/api/*` → isourceplus.net via
  //           render.yaml, so the browser only ever talks to our own origin.
  //
  // This is why login/refresh work locally: keep prod on the same relative
  // path and it stays first-party there too.
  API_BASE_URL: "/api/v1/",
};

export const getApiBaseUrl = () => ENV.API_BASE_URL;

export const isDevelopment = () => Boolean(raw.DEV);
