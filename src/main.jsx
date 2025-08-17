import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { appRoutes } from "./app-routes";
import "./index.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { AppProvider } from "./contexts/app.context";
import { Toaster } from "sonner";
import axios from "axios";
import ScrollToTop from "./components/ScrollToTop";

// ── AUTO‐CSRF CONFIGURATION ────────────────────────────────
// Axios will:
//  • read the 'csrftoken' cookie
//  • send it as 'X-CSRFToken' on POST/PUT/PATCH/DELETE
//  • always include cookies (so your HttpOnly 'refresh' token is sent)
axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFToken";
axios.defaults.withCredentials = true;
// ────────────────────────────────────────────────────────────

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppProvider>
      <div className="font-montserrat">
        <ScrollToTop/>
        <RouterProvider router={appRoutes} />
      </div>
      <Toaster position="top-right" richColors />
    </AppProvider>
  </StrictMode>
);
