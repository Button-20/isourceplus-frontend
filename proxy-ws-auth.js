// WebSocket auth bridge shared by the Vite dev proxy (vite.config.js) and the
// production proxy (server.js).
//
// The notification socket (wss://…/ws/notifications/) authenticates with a JWT
// access token — `?token=` for browsers, or an `Authorization: Bearer` header.
// Here the access token lives in an HttpOnly cookie that page JS can't read,
// and browsers can't add headers to a WebSocket handshake. The proxy CAN read
// the cookie (the same-origin upgrade request carries it), so it forwards it
// to the backend as both — unless the client already sent a token.

const JWT_RE = /^[\w-]+\.[\w-]+\.[\w-]+$/;
// The backend's access-token cookie (its refresh cookie is
// `isource-plus-refresh-token`); any other JWT-shaped access/auth cookie is
// accepted as a fallback in case the name differs.
const ACCESS_COOKIE = "isource-plus-access-token";

export function accessTokenFromCookies(cookieHeader = "") {
  const cookies = {};
  cookieHeader.split(/;\s*/).forEach((pair) => {
    const i = pair.indexOf("=");
    if (i > 0) {
      try {
        cookies[pair.slice(0, i)] = decodeURIComponent(pair.slice(i + 1));
      } catch {
        cookies[pair.slice(0, i)] = pair.slice(i + 1);
      }
    }
  });
  if (JWT_RE.test(cookies[ACCESS_COOKIE] || "")) return cookies[ACCESS_COOKIE];
  const fallback = Object.entries(cookies).find(
    ([name, value]) =>
      /access|auth/i.test(name) && !/refresh/i.test(name) && JWT_RE.test(value),
  );
  return fallback ? fallback[1] : null;
}

// `proxyReqWs` handler: present the upgrade as same-origin (Channels' origin
// validator) and attach the access token.
export function injectWsAuth(proxyReq, req, target) {
  proxyReq.setHeader("origin", target);
  const url = new URL(req.url || "/", "http://proxy.local");
  if (url.searchParams.get("token")) return;
  const token = accessTokenFromCookies(req.headers.cookie || "");
  if (!token) return;
  proxyReq.setHeader("authorization", `Bearer ${token}`);
  url.searchParams.set("token", token);
  proxyReq.path = `${url.pathname}${url.search}`;
}
