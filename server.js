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
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createProxyMiddleware } from "http-proxy-middleware";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 10000;
// Canonical backend host. Override with the API_TARGET env var on Render.
const API_TARGET = process.env.API_TARGET || "https://www.isourceplus.net";

const app = express();

// Reverse-proxy every /api request to the backend. Registered BEFORE any body
// parser so POST/PATCH bodies stream through untouched.
app.use(
  createProxyMiddleware({
    pathFilter: "/api",
    target: API_TARGET,
    changeOrigin: true,
    secure: true,
    xfwd: true,
    on: {
      proxyReq: (proxyReq) => {
        // Present the request to Django as same-origin so its HTTPS CSRF
        // referer/origin checks pass.
        proxyReq.setHeader("origin", API_TARGET);
        proxyReq.setHeader("referer", `${API_TARGET}/`);
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
  // eslint-disable-next-line no-console
  console.log(`Serving dist/ + proxying /api -> ${API_TARGET} on :${PORT}`);
});
