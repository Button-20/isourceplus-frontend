// Production server for the Render Web Service deployment.
//
// Serves the built SPA (dist/) AND reverse-proxies /api to the backend, so the
// browser only ever talks to THIS origin. That keeps the backend's HttpOnly
// auth cookies first-party — the browser stores them on login and sends them on
// every request. A Render *static-site* proxy does NOT relay the upstream
// Set-Cookie reliably, which is why authenticated calls (e.g. the profile
// PATCH) came back 401 in production. This mirrors the Vite dev proxy
// (vite.config.js), which is why auth already works locally.

import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 10000;
// Canonical backend host. Override with the API_TARGET env var on Render.
const API_TARGET = process.env.API_TARGET || "https://www.isourceplus.net";
// The backend's HttpOnly refresh-token cookie, and the logout endpoint path.
const REFRESH_COOKIE = "isource-plus-refresh-token";
const LOGOUT_PATH = "/api/v1/account_auth/logout";

const app = express();

// The logout endpoint requires the refresh token in the request BODY, but the
// token lives in an HttpOnly cookie the browser's JS cannot read. The proxy
// CAN read the cookie (it's just a request header here), so parse logout's
// small JSON body and inject the refresh token into it. Scoped to the logout
// path only, so every other request (multipart uploads, etc.) still streams
// through the proxy untouched.
app.use(LOGOUT_PATH, express.json(), (req, _res, next) => {
  const cookies = req.headers.cookie || "";
  const match = cookies.match(
    new RegExp(`(?:^|;\\s*)${REFRESH_COOKIE}=([^;]+)`),
  );
  if (match && !(req.body && req.body.refresh)) {
    req.body = { ...(req.body || {}), refresh: decodeURIComponent(match[1]) };
  }
  next();
});

// Reverse-proxy every /api request to the backend.
app.use(
  createProxyMiddleware({
    pathFilter: "/api",
    target: API_TARGET,
    changeOrigin: true,
    secure: true,
    xfwd: true,
    on: {
      proxyReq: (proxyReq, req) => {
        // Present the request to Django as same-origin so its HTTPS CSRF
        // referer/origin checks pass.
        proxyReq.setHeader("origin", API_TARGET);
        proxyReq.setHeader("referer", `${API_TARGET}/`);
        // Re-stream a body we parsed above (logout) with a correct
        // Content-Length. No-op for the streaming requests (no req.body).
        if (req.body && Object.keys(req.body).length > 0) {
          fixRequestBody(proxyReq, req);
        }
      },
      proxyRes: (proxyRes) => {
        // Rewrite Set-Cookie so the backend's HttpOnly auth cookies are stored
        // first-party on THIS origin:
        //   1. drop any Domain so the browser binds them to the render host;
        //   2. the backend marks them `SameSite=None` but omits `Secure`, which
        //      browsers reject — we serve over HTTPS, so add `Secure`.
        // Both are done here (not via the library's cookieDomainRewrite option,
        // which runs a competing pass that races with this handler). Mutate the
        // array IN PLACE — reassigning the property isn't picked up downstream.
        const setCookie = proxyRes.headers["set-cookie"];
        if (!Array.isArray(setCookie)) return;
        for (let i = 0; i < setCookie.length; i += 1) {
          let c = setCookie[i].replace(/;\s*Domain=[^;]+/i, "");
          if (/;\s*SameSite=None/i.test(c) && !/;\s*Secure/i.test(c)) {
            c += "; Secure";
          }
          setCookie[i] = c;
        }
      },
    },
  }),
);

// Health check for Render (and uptime monitors). Fast, no proxying.
app.get("/healthz", (_req, res) => res.status(200).json({ status: "ok" }));

// Static assets from the Vite build.
const distDir = path.join(__dirname, "dist");
app.use(express.static(distDir));

// SPA fallback: any other GET returns index.html so client-side routing works.
// (Express 5 rejects "*" string route patterns, so use a plain middleware.)
app.use((req, res, next) => {
  if (req.method !== "GET") return next();
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(PORT, () => {
  const indexPresent = fs.existsSync(path.join(distDir, "index.html"));
  // eslint-disable-next-line no-console
  console.log(
    `[server] listening on :${PORT} | proxy /api -> ${API_TARGET} | ` +
      `distDir=${distDir} | index.html present=${indexPresent}`,
  );
});
