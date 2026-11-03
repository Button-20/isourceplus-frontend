// Vercel Function: reverse-proxies /api/* to the backend (the Vercel
// counterpart of server.js). vercel.json rewrites every /api/* request here;
// the original path and query survive the rewrite in `request.url`.
//
// Why a function rather than a plain vercel.json rewrite to the backend: the
// backend's HttpOnly auth cookies must be stored first-party on THIS origin.
// The backend marks them `SameSite=None` without `Secure` (browsers reject
// that) and may scope them to its own Domain, so the Set-Cookie headers are
// rewritten here, the same as server.js does. The logout endpoint also needs
// the HttpOnly refresh cookie injected into its JSON body.
//
// Limits: Vercel caps a function's request body at 4.5 MB, so larger uploads
// fail with 413. WebSockets can't be proxied on Vercel at all; the
// notification socket connects to the backend directly (VITE_WS_URL).

const API_TARGET = (
  process.env.API_TARGET || "https://app.isourceplus.net"
).replace(/\/+$/, "");
const REFRESH_COOKIE = "isource-plus-refresh-token";
const LOGOUT_PATH = "/api/v1/account_auth/logout";

// Request headers that describe this hop, not the request. Content-Length is
// recomputed by fetch from the buffered body.
const DROP_REQUEST_HEADERS = [
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "keep-alive",
  "upgrade",
];
// fetch() decompresses the upstream body, so its encoding/length no longer
// apply; Set-Cookie is re-added after rewriting.
const DROP_RESPONSE_HEADERS = [
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
  "keep-alive",
  "set-cookie",
];

const readCookie = (header, name) => {
  const match = (header || "").match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? match[1] : null;
};

// Bind the cookie to this origin and make SameSite=None cookies valid (we
// serve over HTTPS).
const rewriteSetCookie = (cookie) => {
  let c = cookie.replace(/;\s*Domain=[^;]+/i, "");
  if (/;\s*SameSite=None/i.test(c) && !/;\s*Secure/i.test(c)) c += "; Secure";
  return c;
};

async function handler(request) {
  const incoming = new URL(request.url);
  const target = `${API_TARGET}${incoming.pathname}${incoming.search}`;

  const headers = new Headers(request.headers);
  DROP_REQUEST_HEADERS.forEach((h) => headers.delete(h));
  // Present the request to Django as same-origin so its HTTPS CSRF
  // referer/origin checks pass, and point the forwarded host at the backend
  // so it matches ALLOWED_HOSTS (see server.js).
  headers.set("origin", API_TARGET);
  headers.set("referer", `${API_TARGET}/`);
  headers.set("x-forwarded-host", new URL(API_TARGET).host);
  headers.set("x-forwarded-proto", "https");

  let body;
  if (!["GET", "HEAD"].includes(request.method)) {
    body = await request.arrayBuffer();
    // Logout needs the refresh token in its body; page JS can't read the
    // HttpOnly cookie, but the proxy can.
    const token = readCookie(headers.get("cookie"), REFRESH_COOKIE);
    if (token && incoming.pathname.replace(/\/+$/, "") === LOGOUT_PATH) {
      let json = {};
      try {
        json = body.byteLength
          ? JSON.parse(new TextDecoder().decode(body))
          : {};
      } catch {
        json = null;
      }
      if (json && typeof json === "object" && !json[REFRESH_COOKIE]) {
        json[REFRESH_COOKIE] = token;
        body = JSON.stringify(json);
        headers.set("content-type", "application/json");
      }
    }
  }

  let upstream;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    });
  } catch (err) {
    console.error("[api proxy] upstream request failed:", err);
    return Response.json(
      { detail: "The server couldn't be reached. Please try again." },
      { status: 502 },
    );
  }

  const out = new Headers(upstream.headers);
  DROP_RESPONSE_HEADERS.forEach((h) => out.delete(h));
  upstream.headers
    .getSetCookie()
    .forEach((c) => out.append("set-cookie", rewriteSetCookie(c)));
  // Keep backend redirects (e.g. Django's APPEND_SLASH) on this origin.
  const location = out.get("location");
  if (location?.startsWith(API_TARGET)) {
    out.set("location", location.slice(API_TARGET.length) || "/");
  }

  return new Response(
    [204, 304].includes(upstream.status) || request.method === "HEAD"
      ? null
      : upstream.body,
    { status: upstream.status, statusText: upstream.statusText, headers: out },
  );
}

export const GET = handler;
export const HEAD = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
