// Single source of truth for the CSRF token.
//
// This backend exposes the token via a readable cookie that GET /api/v1/init/
// sets. The cookie is named `HTTP_X_CSRFTOKEN` here (Django's default name is
// `csrftoken`), so we read either. The value is sent back as the `X-CSRFToken`
// request header (see http.js).
//
// The token is cached in memory AND mirrored to sessionStorage so it survives
// SPA navigation and page refreshes without a refetch race. Concurrent callers
// share a single in-flight request (dedupe) so we never hammer `/init/`.

import axios from "axios";
import { getApiBaseUrl } from "./env";
import { getCookie } from "./cookies";

// Checked in order — this backend uses HTTP_X_CSRFTOKEN.
const CSRF_COOKIE_NAMES = ["HTTP_X_CSRFTOKEN", "csrftoken"];
const CSRF_STORAGE_KEY = "csrf_token";

let cachedToken = null;
let inflight = null;

function persist(token) {
  if (!token) return;
  cachedToken = token;
  try {
    sessionStorage.setItem(CSRF_STORAGE_KEY, token);
  } catch {
    /* sessionStorage unavailable (private mode) — in-memory cache still works */
  }
}

// Synchronous best-effort read: cookie first (authoritative), then caches.
export function getCsrfToken() {
  for (const name of CSRF_COOKIE_NAMES) {
    const fromCookie = getCookie(name);
    if (fromCookie) return fromCookie;
  }
  if (cachedToken) return cachedToken;
  try {
    return sessionStorage.getItem(CSRF_STORAGE_KEY);
  } catch {
    return null;
  }
}

async function fetchFromServer() {
  const { data } = await axios.get(`${getApiBaseUrl()}init/`, {
    withCredentials: true,
  });
  // Some deployments return the token in the body; this one sets the cookie.
  if (data?.csrftoken) persist(data.csrftoken);
  const token = getCsrfToken();
  if (token) persist(token); // cache the cookie value so we stop refetching
  return token;
}

// Returns a valid token, fetching once (with a single retry) if needed.
export async function ensureCsrfToken({ force = false } = {}) {
  if (!force) {
    const existing = getCsrfToken();
    if (existing) return existing;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      let token = await fetchFromServer();
      if (!token) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        token = await fetchFromServer();
      }
      return token;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function clearCsrfToken() {
  cachedToken = null;
  try {
    sessionStorage.removeItem(CSRF_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
