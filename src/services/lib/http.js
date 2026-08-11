// The one and only axios instance for the app.
//
// Replaces the three divergent clients that existed before (context `authAxios`,
// utils/apiService.jsx hardcoded to 127.0.0.1, and the unused utility/apiClient.js).
//
//   Request:  attach Bearer token + inject X-CSRFToken on ALL unsafe methods
//             (POST/PUT/PATCH/DELETE) — not just POST.
//   Response: on 401 `token_not_valid`, refresh once and retry the original
//             request; give up (logout) if refresh fails.
//
// The refresh + logout implementations are registered by the auth service so
// this module stays dependency-light and free of circular imports.

import axios from "axios";
import { getApiBaseUrl } from "./env";
import { authStorage } from "./auth";
import { ensureCsrfToken, getCsrfToken } from "./csrf";

const UNSAFE_METHODS = new Set(["post", "put", "patch", "delete"]);

let refreshHandler = null;
let logoutHandler = null;

export const registerRefreshHandler = (fn) => {
  refreshHandler = fn;
};
export const registerLogoutHandler = (fn) => {
  logoutHandler = fn;
};

const http = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

http.interceptors.request.use(async (config) => {
  const token = authStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const method = (config.method || "get").toLowerCase();
  if (UNSAFE_METHODS.has(method)) {
    const csrf = getCsrfToken() || (await ensureCsrfToken());
    if (csrf) config.headers["X-CSRFToken"] = csrf;
  }
  return config;
});

// Don't attempt a refresh-retry for the auth endpoints themselves (login,
// logout, refresh, registration) — a 401 there is a real failure, not an
// expired session, and retrying would loop.
const isAuthEndpoint = (url = "") => /account_auth\//.test(url);

http.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const status = err.response?.status;

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !isAuthEndpoint(original.url) &&
      refreshHandler
    ) {
      original._retry = true;
      try {
        // Cookie-based refresh rotates the HttpOnly access cookie server-side;
        // a successful refresh means we can simply replay the original request.
        const refreshed = await refreshHandler();
        if (refreshed) return http(original);
      } catch {
        /* fall through to logout */
      }
      if (logoutHandler) await logoutHandler();
    }

    return Promise.reject(err);
  },
);

export default http;
