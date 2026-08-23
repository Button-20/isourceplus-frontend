import { createBrowserRouter, Navigate } from "react-router-dom";

import {
  ProtectedAuthRoute,
  ProtectedOnBoardingRoute,
} from "./components/protected-routes";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import EmailVerifyKeyPage from "./components/EmailVerifyKeyPage";
import EmployeeDetailPage from "./components/EmployeeDetailPage";

// public
import { LandingPage } from "./pages/public/landing-page";
import { AboutPage } from "./pages/public/about-page";
import { MarketplacePage } from "./pages/public/marketplace-page";
import Store from "./pages/public/store";
import WatchNow from "./pages/public/watch_now_page.pages";
import { PricingPage } from "./pages/public/PricingPage";

// auth
import { LoginPage, SignUpPage } from "./pages/auth/auth-pages";
import { ForgotPasswordPage } from "./pages/auth/forgot-password";
import { ResetPasswordConfirmPage } from "./pages/auth/reset_password_confirm";

// onboarding
import ProfilePage from "./pages/onboarding/ProfilePage";
import AccountTypePage from "./pages/onboarding/AccountTypePage";
import MobileVerificationPage from "./pages/onboarding/MobileVerificationPage";
import EmailVerificationPage from "./pages/onboarding/EmailVerificationPage";

// dashboard
import { DashBoardHome } from "./pages/dashboard/dashboard-home";

// companies / transporters
import CompanyPage from "./pages/companies/CompanyPage";
import EditCompany from "./pages/companies/EditCompany";
import TransporterPage from "./pages/transporters/TransporterPage";
import EditTransporter from "./pages/transporters/EditTransporter";

// branches
import AddBranch from "./pages/branches/AddBranch";
import AllBranches from "./pages/branches/AllBranches";
import BranchDetails from "./pages/branches/BranchDetails";
import EditBranch from "./pages/branches/EditBranch";

// employees
import AddNewEmployeePage from "./pages/employees/AddNewEmployeePage";
import AddExistingEmployeePage from "./pages/employees/AddExistingEmployeePage";
import Employees from "./pages/employees/Employees";
import CompanyEmployees from "./pages/employees/CompanyEmployees";
import AllTransporterEmployees from "./pages/employees/TransporterEmployees";

// verification docs
import AddBusinessDocs from "./pages/verification-docs/AddBusinessDocs";
import ManageUserVerificationDocs from "./pages/verification-docs/ManageUserVerificationDocs";

// rfx
import RFxPage from "./pages/rfx/RFxPage";
import RFxCreationPage from "./pages/rfx/RFxCreationPage";
import RFxIssuedPage from "./pages/rfx/RFxIssuedPage";
import RFxDetailPage from "./pages/rfx/RFxDetailPage";

// tenders
import TenderPage from "./pages/tenders/TenderPage";
import TenderCreationPage from "./pages/tenders/TenderCreationPage";
import TenderDetailPage from "./pages/tenders/TenderDetailPage";

// proforma invoices
import ProformaInvoicesPage from "./pages/proforma-invoices/ProformaInvoicesPage";
import ProformaInvoiceDetailPage from "./pages/proforma-invoices/ProformaInvoiceDetailPage";
import ProformaInvoiceIssuedDetailPage from "./pages/proforma-invoices/ProformaInvoiceIssuedDetailPage";
import IssuedProformaInvoicesPage from "./pages/proforma-invoices/IssuedProformaInvoicesPage";
import CreateProformaInvoicePage from "./pages/proforma-invoices/CreateProformaInvoicePage";
import CreateProformaInvoiceForRFxPage from "./pages/proforma-invoices/CreateProformaInvoiceForRFxPage";
import CreateProformaInvoiceForTenderPage from "./pages/proforma-invoices/CreateProformaInvoiceForTenderPage";

// purchase orders
import PurchaseOrdersPage from "./pages/purchase-orders/PurchaseOrdersPage";
import PurchaseOrderCreationPage from "./pages/purchase-orders/PurchaseOrderCreationPage";
import PurchaseOrderDetailPage from "./pages/purchase-orders/PurchaseOrderDetailPage";
import IssuedPurchaseOrdersPage from "./pages/purchase-orders/IssuedPurchaseOrdersPage";

// sales invoices
import SalesInvoicesPage from "./pages/sales-invoices/SalesInvoicesPage";
import SalesInvoiceDetailPage from "./pages/sales-invoices/SalesInvoiceDetailPage";
import CreateSalesInvoicePage from "./pages/sales-invoices/CreateSalesInvoicePage";
import IssuedSalesInvoicesPage from "./pages/sales-invoices/IssuedSalesInvoicesPage";

// payment orders
import PaymentOrdersPage from "./pages/payment-orders/PaymentOrdersPage";
import CreatePaymentOrderPage from "./pages/payment-orders/CreatePaymentOrderPage";
import PaymentOrderDetailPage from "./pages/payment-orders/PaymentOrderDetailPage";

// waybills
import AllWaybillsPage from "./pages/waybills/AllWaybillsPage";
import IssuedWaybillsPage from "./pages/waybills/IssuedWaybillsPage";
import WaybillDetailPage from "./pages/waybills/WaybillDetailPage";

// subscription
import { SubscriptionCallbackPage } from "./pages/subscription/SubscriptionCallbackPage";

export const appRoutes = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/pricing", element: <PricingPage /> },
  { path: "/marketplace", element: <MarketplacePage /> },
  { path: "/store", element: <Store /> },
  { path: "/about", element: <AboutPage /> },
  { path: "/subscription/callback", element: <SubscriptionCallbackPage /> },

  {
    element: <ProtectedAuthRoute />,
    children: [
      {
        element: <AuthLayout />,
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
    ],
  },
  {
    path: "/onboarding",
    element: <ProtectedOnBoardingRoute />,
    children: [
      { index: true, element: <Navigate to={"user"} /> },
      { path: "user", element: <ProfilePage /> },
      { path: "account-type", element: <AccountTypePage /> },
      { path: "mobile-verification", element: <MobileVerificationPage /> },
      { path: "email-verification", element: <EmailVerificationPage /> },
      { path: "email-verify/:key", element: <EmailVerifyKeyPage /> },
    ],
  },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashBoardHome /> },
      { path: "transporter", element: <TransporterPage /> },
      { path: "companies", element: <AccountTypePage /> },
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
      { path: "branches/:id/edit", element: <EditBranch /> },
      { path: "employees", element: <Employees /> },
      { path: "employees/:id", element: <EmployeeDetailPage /> },
      { path: "transporter/employees", element: <AllTransporterEmployees /> },
      { path: "company/employees", element: <CompanyEmployees /> },
      { path: "user/verification-docs", element: <ManageUserVerificationDocs /> },
      { path: "rfxs", element: <RFxPage /> },
      { path: "rfxs/new", element: <RFxCreationPage /> },
      { path: "rfxs/issued", element: <RFxIssuedPage /> },
      { path: "rfxs/:refNum", element: <RFxDetailPage /> },
      { path: "waybills", element: <AllWaybillsPage /> },
      { path: "waybills/issued", element: <IssuedWaybillsPage /> },
      { path: "waybills/:refNum", element: <WaybillDetailPage /> },
      { path: "tenders", element: <TenderPage /> },
      { path: "tenders/new", element: <TenderCreationPage /> },
      { path: "tenders/issued", element: <TenderPage /> },
      { path: "tenders/:refNum", element: <TenderDetailPage /> },
      { path: "proforma-invoices", element: <ProformaInvoicesPage /> },
      { path: "proforma-invoices/issued", element: <IssuedProformaInvoicesPage /> },
      { path: "proforma-invoices/:refNum", element: <ProformaInvoiceDetailPage /> },
      { path: "proforma-invoices/issued/:refNum", element: <ProformaInvoiceIssuedDetailPage /> },
      { path: "proforma-invoices/create-offer", element: <CreateProformaInvoicePage /> },
      { path: "proforma-invoices/create-offer-rfx", element: <CreateProformaInvoiceForRFxPage /> },
      { path: "proforma-invoices/create-offer-tender", element: <CreateProformaInvoiceForTenderPage /> },
      { path: "purchase-orders", element: <PurchaseOrdersPage /> },
      { path: "purchase-orders/issued", element: <IssuedPurchaseOrdersPage /> },
      { path: "purchase-orders/:refNum", element: <PurchaseOrderDetailPage /> },
      { path: "purchase-orders/create-business-award/*", element: <PurchaseOrderCreationPage /> },
      { path: "sales-invoices", element: <SalesInvoicesPage /> },
      { path: "sales-invoices/issued", element: <IssuedSalesInvoicesPage /> },
      { path: "sales-invoices/:refNum", element: <SalesInvoiceDetailPage /> },
      { path: "sales-invoices/create-sales-invoice", element: <CreateSalesInvoicePage /> },
      { path: "payment-orders/issued", element: <PaymentOrdersPage /> },
      { path: "payment-orders/:refNum", element: <PaymentOrderDetailPage /> },
      { path: "payment-orders/create-payment-order", element: <CreatePaymentOrderPage /> },
    ],
  },
  { path: "/watch-now", element: <WatchNow /> },
]);