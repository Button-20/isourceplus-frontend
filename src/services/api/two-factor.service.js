// Two-factor authentication (TOTP) and single sign-on (SwaggerHub
// "2fa_sso_api" + the backend's sso-2fa-integration.md, 2026-11-04). All under
// /api/v1/.
//
//   GET  account_auth/2fa/status/          → { is_enabled }
//   POST account_auth/2fa/enroll/          → { totp_secret, provisioning_uri,
//                                              qr_code } (pending until confirmed)
//   POST account_auth/2fa/enroll/confirm/  { code } → { message, backup_codes }
//   POST account_auth/2fa/disable/         { password, code } → { message }
//   POST account_auth/2fa/backup-codes/    { password, code } → { backup_codes }
//   POST account_auth/2fa/verify/          { pending_token, code } → tokens
//        (finishes a login that answered { two_fa_required: true,
//        pending_token, pending_token_expires_in: 300 }). 400 bad code,
//        401 expired pending token, 429 locked out (5 misses → 5 minutes).
//
// Enterprise SSO (OpenID Connect; the only provider slug is "default"):
//   GET  account_auth/sso/redirect/default/  → 302 to the identity provider
//   GET  account_auth/sso/callback/          (the IdP returns here; the backend
//        redirects to the frontend /sso/callback?code=… or ?error=<message>)
//   POST account_auth/sso/exchange/          { code } → tokens or 2FA challenge
//        (the code is single-use and lasts 5 minutes)
//
// Google / LinkedIn / Facebook are a separate, older social-login flow:
//   GET  auth/{provider}/  → 302 to the provider
//
// `code` accepts a TOTP code or a backup code.
import http from "@/services/lib/http";
import { ensureCsrfToken } from "@/services/lib/csrf";
import { getApiBaseUrl } from "@/services/lib/env";
import { apiErrorMessage, messageFromBody } from "@/services/lib/api-error";

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

// The login's pending 2FA token.
export const pendingTokenOf = (data) => data?.pending_token || "";

// Enterprise SSO's only provider slug.
export const SSO_PROVIDER = "default";

export const ssoRedirectUrl = (provider = SSO_PROVIDER) =>
  `${getApiBaseUrl()}account_auth/sso/redirect/${encodeURIComponent(provider)}/`;

// The older social sign-in: google | linkedin | facebook.
export const socialLoginUrl = (provider) =>
  `${getApiBaseUrl()}auth/${encodeURIComponent(provider)}/`;

// Whether `url` hands the browser off (a redirect) — checked before leaving
// the page so the user never lands on a bare error page. → { ok, message }
// with the backend's reason when it won't (e.g. "SSO is not configured for
// this provider.").
export async function probeRedirect(url) {
  try {
    const res = await fetch(url, {
      redirect: "manual",
      credentials: "include",
    });
    if (
      res.type === "opaqueredirect" ||
      (res.status >= 300 && res.status < 400)
    )
      return { ok: true };
    let body = "";
    try {
      body = await res.text();
      body = JSON.parse(body);
    } catch {
      /* plain text or HTML */
    }
    return { ok: false, message: messageFromBody(body) };
  } catch {
    return { ok: false, message: "" };
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
  return apiErrorMessage(err, fallback);
}
