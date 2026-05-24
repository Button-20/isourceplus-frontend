import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    host: "127.0.0.1",
    proxy: {
      "/api": {
        target: "http://isourceplus.net",
        changeOrigin: true,
        secure: false,
        headers: {
          host: "isourceplus.net", // ← tells backend the correct host
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "/",
});
