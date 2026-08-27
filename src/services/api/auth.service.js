// Auth domain service. All network + storage side effects for authentication
// live here; the React context (app.context) wraps these to update UI state.
//
// This backend uses HttpOnly cookie auth: the login/signup responses carry the
// user's identity (id / profile_id / user_email), NOT bearer tokens. The auth
// cookies are set by the server and sent automatically via `withCredentials`.
// Access/refresh tokens are still persisted if a deployment returns them.

import { authStorage } from "@/services/lib/auth";
import { ensureCsrfToken } from "@/services/lib/csrf";
import http, { registerRefreshHandler } from "@/services/lib/http";

function persistSession(data) {
  authStorage.setSession({
    access: data.access,
    refresh: data.refresh,
    userEmail: data.user_email,
    profileId: data.profile_id,
    userId: data.id,
  });
}

export async function loginRequest({ email, password }) {
  await ensureCsrfToken();
  const { data } = await http.post("account_auth/login/", {
    email: email.trim(),
    password,
  });
  persistSession(data);
  return data;
}

export async function signupRequest({ email, password1, password2 }) {
  await ensureCsrfToken();
  const { data } = await http.post("account_auth/registration/", {
    email: email.trim(),
    password1,
    password2,
  });
  persistSession(data);
  return data;
}

// Rotates the session. With cookie auth the refresh token is in an HttpOnly
// cookie, so the body is empty; if a refresh token was stored (bearer backend)
// it is sent instead. Resolves truthy on success so the HTTP client can replay
// the request that triggered the refresh. `_retry: true` stops the response
// interceptor from trying to refresh this very call.
export async function refreshSession() {
  await ensureCsrfToken();
  const refresh = authStorage.getRefreshToken();
  const { data } = await http.post(
    "account_auth/token/refresh/",
    refresh ? { refresh } : {},
    { _retry: true },
  );
  if (data?.access) authStorage.setAccessToken(data.access);
  // Persist a rotated refresh token if the backend returns one, so logout (which
  // requires the refresh token in its body) always has the current value.
  if (data?.refresh) authStorage.setSession({ refresh: data.refresh });
  return true;
}

export async function logoutRequest() {
  await ensureCsrfToken();
  // The logout endpoint requires the refresh token in the body (it returns
  // "Refresh token is required" otherwise). Send the stored token when we have
  // it; the empty-body fallback covers backends that read it from the cookie.
  const refresh = authStorage.getRefreshToken();
  // The backend rejected the `refresh` key with "Refresh token is required",
  // so it expects `isource-plus-refresh-token`. Send both common names to be safe; a custom
  // view reads whichever it wants and ignores the other.
  const body = refresh ? { "isource-plus-refresh-token": refresh } : {};
  return http.post("account_auth/logout/", body, { _retry: true });
}

// Wire the refresh flow into the HTTP client's 401 handler.
registerRefreshHandler(refreshSession);
