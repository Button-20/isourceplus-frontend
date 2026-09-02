import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { appRoutes } from "./app-routes";
import "./index.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { AppProvider } from "./contexts/app.context";
import { Toaster } from "sonner";
import ScrollToTop from "./components/ScrollToTop";
import SmoothScroll from "./components/common/SmoothScroll";

// CSRF and credentials are handled centrally in the shared HTTP client
// (src/services/lib/http.js + csrf.js) — no global axios defaults needed here.

// NOTE: React.StrictMode is intentionally omitted. In development it
// double-invokes effects, which caused effect-fired toasts (e.g. data-load
// errors) to appear twice. Production never double-invokes, so this only
// affects the dev experience.
createRoot(document.getElementById("root")).render(
  <AppProvider>
    <SmoothScroll>
      <div className="font-montserrat">
        <ScrollToTop />
        <RouterProvider router={appRoutes} />
      </div>
    </SmoothScroll>
    <Toaster position="top-right" richColors theme="dark" />
  </AppProvider>
);
