import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { appRoutes } from "./app-routes";
import "./index.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { AppProvider } from "./contexts/app.context";
import { Toaster } from "sonner";
import { ApiContextProvider } from "./contexts/api.context";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppProvider>
      <ApiContextProvider>
        <RouterProvider router={appRoutes} />
        <Toaster position="top-right" richColors />
      </ApiContextProvider>
    </AppProvider>
  </StrictMode>
);
