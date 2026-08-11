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
  // In dev, use a same-origin relative path so the Vite proxy forwards requests
  // to the backend — this keeps the HttpOnly auth cookies first-party (they
  // would be dropped on a cross-origin localhost → isourceplus.net request).
  // In prod the app is served from the same origin as the API, so the absolute
  // URL is same-origin too.
  API_BASE_URL: raw.DEV ? "/api/v1/" : `${SERVER_URL}api/v1/`,
};

export const getApiBaseUrl = () => ENV.API_BASE_URL;

export const isDevelopment = () => Boolean(raw.DEV);
