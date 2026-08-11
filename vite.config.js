import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // import.meta.dirname (Node 20.11+) avoids the __dirname warning under
      // Vite's native ESM config loader and stays cross-platform.
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Proxy API calls to the backend so requests are same-origin in dev and
      // the HttpOnly auth cookies are stored/sent (cross-origin cookies from
      // localhost → isourceplus.net would be dropped by the browser).
      "/api": {
        target: "https://isourceplus.net",
        changeOrigin: true,
        secure: false,
        // Make the backend's cookies host-only for localhost.
        cookieDomainRewrite: "",
        configure: (proxy) => {
          // The backend sets its auth cookies with `Secure` / `SameSite=None`
          // for its own HTTPS origin. Over http://localhost the browser drops
          // those, so strip `Secure` and downgrade `SameSite` to `Lax` — this
          // only affects the dev proxy, never production.
          proxy.on("proxyRes", (proxyRes) => {
            const setCookie = proxyRes.headers["set-cookie"];
            if (setCookie) {
              proxyRes.headers["set-cookie"] = setCookie.map((cookie) =>
                cookie
                  .replace(/;\s*Secure/gi, "")
                  .replace(/;\s*SameSite=None/gi, "; SameSite=Lax"),
              );
            }
          });
        },
      },
    },
  },
});
