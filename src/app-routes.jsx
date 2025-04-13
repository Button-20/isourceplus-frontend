import { createBrowserRouter } from "react-router-dom";

import { LandingPage } from "./pages/landing-page";
import { AboutPage } from "./pages/about-page";
import { LoginPage, SignUpPage } from "./pages/auth-pages";
import { MarketplacePage } from "./pages/marketplace-page";
import {
  ProtectedAuthRoute,
  ProtectedOnBoardingRoute,
} from "./components/protected-routes";
import {
  OnBoardingOrgRolePage,
  OnBoardingOrgDetailsPage,
  OnBoardingOrgVerificationPage,
  OnBoardingOrgSubscriptionPlanPage,
  OnBoardingOrgAdminAccountPage,
} from "./pages/onboarding-pages";
import { BaseDashBoard } from "./pages/base-dashboard";
import { DashBoardHome } from "./pages/dashboard-home";
import WatchNow from "./pages/watch_now_page.pages";
import Store from "./pages/store";

export const appRoutes = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/marketplace", element: <MarketplacePage /> },
  { path: "/store", element: <Store /> },
  { path: "/about", element: <AboutPage /> },

  {
    element: <ProtectedAuthRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/signup", element: <SignUpPage /> },
    ],
  },
  {
    path: "/onboarding",
    element: <ProtectedOnBoardingRoute />,
    children: [
      { index: true, element: <OnBoardingOrgRolePage /> },
      { path: "details", element: <OnBoardingOrgDetailsPage /> },
      { path: "verification", element: <OnBoardingOrgVerificationPage /> },
      { path: "subscription", element: <OnBoardingOrgSubscriptionPlanPage /> },
      { path: "account", element: <OnBoardingOrgAdminAccountPage /> },
    ],
  },
  {
    path: "/dashboard",
    element: <BaseDashBoard />,
    children: [{ index: true, element: <DashBoardHome /> }],
  },
  { path: "/watch-now", element: <WatchNow /> },
]);
