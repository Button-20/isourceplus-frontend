import { createBrowserRouter, Navigate } from "react-router-dom";

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
import { ForgotPasswordPage } from "./pages/forgot-password";
import { ResetPasswordConfirmPage } from "./pages/reset_password_confirm";
import OnboardingPage from "./pages/OnboardingPage";
import ProfilePage from "./pages/ProfilePage";
import TransporterPage from "./pages/TransporterPage";
import CompanyPage from "./pages/CompanyPage";
import CompanyChoices from "./pages/CompanyChoices";
import LastPathTracker from "./components/util/LastPathTracker";
import MobileVerificationPage from "./pages/MobileVerificationPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import EmailVerifyKeyPage from "./components/EmailVerifyKeyPage";
import AddNewEmployeePage from "./pages/AddNewEmployeePage";
import AddExistingEmployeePage from "./pages/AddExistingEmployeePage";
import AddBranch from "./pages/AddBranch";
import AllBranches from "./pages/AllBranches";
import Employees from "./pages/Employees";
import EditCompany from "./pages/EditCompany";
import EditTransporter from "./pages/EditTransporter";
import BranchDetails from "./pages/BranchDetails";
import AllTransporterEmployees from "./pages/TransporterEmployees";

export const appRoutes = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/marketplace", element: <MarketplacePage /> },
  { path: "/store", element: <Store /> },
  { path: "/about", element: <AboutPage /> },

  {
    element: (
      <>
        <LastPathTracker />
        <ProtectedAuthRoute />
      </>
    ),
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/signup", element: <SignUpPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      {
        path: "/password/reset/confirm/:uid/:token",
        element: <ResetPasswordConfirmPage />,
      },
    ],
  },
  {
    path: "/onboarding",
    element: <ProtectedOnBoardingRoute />,
    children: [
      { index: true, element: <Navigate to={"user"} /> },
      { path: "user", element: <ProfilePage /> },
      { path: "mobile-verification", element: <MobileVerificationPage /> },
      { path: "email-verification", element: <EmailVerificationPage /> },
      { path: "email-verify/:key", element: <EmailVerifyKeyPage /> },
      
      // { path: "details", element: <OnBoardingOrgDetailsPage /> },
      // { path: "verification", element: <OnBoardingOrgVerificationPage /> },
      // { path: "subscription", element: <OnBoardingOrgSubscriptionPlanPage /> },
      // { path: "account", element: <OnBoardingOrgAdminAccountPage /> },
    ],
  },
  {
    path: "/dashboard",
    element: <BaseDashBoard />,
    children: [
      { index: true, element: <DashBoardHome /> },
      { path: "transporter", element: <TransporterPage /> },
      { path: "companies", element: <CompanyChoices /> },
      { path: "company", element: <CompanyPage /> },
      { path: "company/edit", element: <EditCompany /> },
      { path: "transporter/edit", element: <EditTransporter /> },
      { path: "employee/new", element: <AddNewEmployeePage /> },
      { path: "employee/existing", element: <AddExistingEmployeePage /> },
      { path: "branches/new", element: <AddBranch /> },
      { path: "branches", element: <AllBranches /> },
      { path: "branches/:id", element: <BranchDetails /> },
      { path: "employees", element: <Employees /> },
      { path: "transporter/employees", element: <AllTransporterEmployees /> },
    ],
  },
  { path: "/watch-now", element: <WatchNow /> },
]);
