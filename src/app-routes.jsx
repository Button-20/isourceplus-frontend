import { createBrowserRouter, Navigate } from "react-router-dom";

import { LandingPage } from "./pages/landing-page";
import { AboutPage } from "./pages/about-page";
import { LoginPage, SignUpPage } from "./pages/auth-pages";
import { MarketplacePage } from "./pages/marketplace-page";
import {
  ProtectedAuthRoute,
  ProtectedOnBoardingRoute,
} from "./components/protected-routes";
import { BaseDashBoard } from "./pages/base-dashboard";
import { DashBoardHome } from "./pages/dashboard-home";
import WatchNow from "./pages/watch_now_page.pages";
import Store from "./pages/store";
import { ForgotPasswordPage } from "./pages/forgot-password";
import { ResetPasswordConfirmPage } from "./pages/reset_password_confirm";
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
import CompanyEmployees from "./pages/CompanyEmployees";
import EmployeeDetailPage from "./components/EmployeeDetailPage";
import AddBusinessDocs from "./pages/AddBusinessDocs";
import ManageUserVerificationDocs from "./pages/ManageUserVerificationDocs";
import RFxPage from "./pages/RFxPage";
import RFxDetailPage from "./pages/RFxDetailPage";
import WaybillDetailPage from "./pages/WaybillDetailPage";
import ProformaInvoicesPage from "./pages/ProformaInvoicesPage";
import ProformaInvoiceDetailPage from "./pages/ProformaInvoiceDetailPage";
import CreateProformaInvoicePage from "./pages/CreateProformaInvoicePage";
import PurchaseOrderCreationPage from "./pages/PurchaseOrderCreationPage"; 
import PurchaseOrderDetailPage from "./pages/PurchaseOrderDetailPage";
import WaybillsPage from "./pages/Waybills";
import ProformaInvoiceCreationPage from "./pages/ProformaInvoiceCreationPage";
import IssuedWaybillsPage from "./pages/IssuedWaybillsPage";
import AllWaybillsPage from "./pages/AllWaybillsPage";
import IssuedProformaInvoicesPage from "./pages/IssuedProformaInvoicesPage";
import ProformaInvoiceIssuedDetailPage from "./pages/ProformaInvoiceIssuedDetailPage";

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
      { path: "transporter/add-business-docs", element: <AddBusinessDocs /> },
      { path: "company/add-business-docs", element: <AddBusinessDocs /> },
      { path: "employee/new", element: <AddNewEmployeePage /> },
      { path: "employee/existing", element: <AddExistingEmployeePage /> },
      { path: "branches/new", element: <AddBranch /> },
      { path: "branches", element: <AllBranches /> },
      { path: "branches/:id", element: <BranchDetails /> },
      { path: "employees", element: <Employees /> },
      { path: "employees/:id", element: <EmployeeDetailPage /> },
      { path: "transporter/employees", element: <AllTransporterEmployees /> },
      { path: "company/employees", element: <CompanyEmployees /> },
      { path: "user/verification-docs", element: <ManageUserVerificationDocs /> },
      { path: "rfxs", element: <RFxPage /> },
      { path: "rfxs/:refNum", element: <RFxDetailPage /> },
      { path: "waybills", element: <AllWaybillsPage /> },
      { path: "waybills/issued", element: <IssuedWaybillsPage /> },
      { path: "waybills/:refNum", element: <WaybillDetailPage /> },
      { path: "proforma-invoices", element: <ProformaInvoicesPage /> },
      { path: "proforma-invoices/issued", element: <IssuedProformaInvoicesPage /> },
      { path: "proforma-invoices/:refNum", element: <ProformaInvoiceDetailPage /> },
      { path: "proforma-invoices/issued/:refNum", element: <ProformaInvoiceIssuedDetailPage /> },
      { path: "proforma-invoices/create-offer", element: <CreateProformaInvoicePage /> },
      { path: "purchase-orders/create-business-award/*", element: <PurchaseOrderCreationPage /> }, 
      { path: "purchase-orders/:refNum", element: <PurchaseOrderDetailPage /> },
      { path: "proforma-invoices/create-offer/*", element: <ProformaInvoiceCreationPage /> },
    ],
  },
  { path: "/watch-now", element: <WatchNow /> },
]);