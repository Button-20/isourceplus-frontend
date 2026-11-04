// Two-factor authentication (TOTP) and single sign-on (SwaggerHub
// "2fa_sso_api", 2026-11-04). The spec lists these under /account_auth/; like
// the other auth routes they're served under /api/v1/.
//
//   GET  account_auth/2fa/status/          → { is_enabled }
//   POST account_auth/2fa/enroll/          → { totp_secret, provisioning_uri,
//                                              qr_code } (pending until confirmed)
//   POST account_auth/2fa/enroll/confirm/  { code } → { message, backup_codes }
//   POST account_auth/2fa/disable/         { password, code } → { message }
//   POST account_auth/2fa/backup-codes/    { password, code } → { backup_codes }
//   POST account_auth/2fa/verify/          { pending_token, code } → tokens
//        (finishes a login that answered two_fa_required: true)
//
//   GET  account_auth/sso/redirect/{provider}/  → 302 to the identity provider
//   GET  account_auth/sso/callback/             (the provider returns here; the
//        backend redirects to the frontend with a one-time code)
//   POST account_auth/sso/exchange/        { code } → tokens
//
// Not deployed yet (2026-11-04): every route above answers an HTML 404.
// `code` accepts a TOTP code or a backup code.
import http from "@/services/lib/http";
import { ensureCsrfToken } from "@/services/lib/csrf";
import { getApiBaseUrl } from "@/services/lib/env";

export async function getTwoFactorStatus() {
  const { data } = await http.get("account_auth/2fa/status/");
  return Boolean(data?.is_enabled);
}

export async function startTwoFactorEnrollment() {
  await ensureCsrfToken();
  const { data } = await http.post("account_auth/2fa/enroll/", {});
  return data;
}

export async function confirmTwoFactorEnrollment(code) {
  await ensureCsrfToken();
  const { data } = await http.post("account_auth/2fa/enroll/confirm/", {
    code: code.trim(),
  });
  return {
    message: data?.message || "",
    backupCodes: data?.backup_codes || [],
  };
}

export async function disableTwoFactor({ password, code }) {
  await ensureCsrfToken();
  const { data } = await http.post("account_auth/2fa/disable/", {
    password,
    code: code.trim(),
  });
  return data?.message || "";
}

export async function rotateBackupCodes({ password, code }) {
  await ensureCsrfToken();
  const { data } = await http.post("account_auth/2fa/backup-codes/", {
    password,
    code: code.trim(),
  });
  return data?.backup_codes || [];
}

// The enrollment QR as an <img> src: a data URI, inline SVG, or bare base64.
export function qrCodeSrc(qr) {
  if (!qr || typeof qr !== "string") return "";
  const v = qr.trim();
  if (/^(data:|https?:)/i.test(v)) return v;
  if (v.startsWith("<svg"))
    return `data:image/svg+xml;utf8,${encodeURIComponent(v)}`;
  return `data:image/png;base64,${v}`;
}

// The login's pending 2FA token (its field name isn't in the spec).
export const pendingTokenOf = (data) =>
  data?.pending_token || data?.two_fa_token || data?.temp_token || "";

// Single sign-on. Provider ids aren't in the spec; these match the buttons.
export const SSO_PROVIDERS = ["linkedin", "google", "facebook"];

export const ssoRedirectUrl = (provider) =>
  `${getApiBaseUrl()}account_auth/sso/redirect/${encodeURIComponent(provider)}/`;

// Whether the backend will hand this provider off (a redirect) — checked
// before leaving the page so a missing route doesn't strand the user on the
// server's 404 page.
export async function ssoAvailable(provider) {
  try {
    const res = await fetch(ssoRedirectUrl(provider), {
      redirect: "manual",
      credentials: "include",
    });
    return (
      res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400)
    );
  } catch {
    return false;
  }
}

// `unavailable` is the message for a route that isn't live yet (the server's
// HTML 404 page).
export function twoFactorErrorMessage(
  err,
  fallback,
  unavailable = "Two-factor authentication isn't available on the server yet.",
) {
  const status = err?.response?.status;
  const body = err?.response?.data;
  if (status === 404 && typeof body === "string") return unavailable;
  if (body && typeof body === "object") {
    const first = (v) => (Array.isArray(v) ? v[0] : v);
    return (
      first(body.detail) ||
      first(body.message) ||
      first(body.code) ||
      first(body.password) ||
      first(body.non_field_errors) ||
      first(body.pending_token) ||
      fallback
    );
  }
  return fallback;
}
