import { createBrowserRouter, Navigate } from "react-router-dom";

import { LandingPage } from "./pages/landing-page";
import { AboutPage } from "./pages/about-page";
import { LoginPage, SignUpPage } from "./pages/auth-pages";
import { MarketplacePage } from "./pages/marketplace-page";
import {
  ProtectedAuthRoute,
  ProtectedOnBoardingRoute,
} from "./components/protected-routes";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { DashBoardHome } from "./pages/dashboard-home";
import WatchNow from "./pages/watch_now_page.pages";
import Store from "./pages/store";
import { ForgotPasswordPage } from "./pages/forgot-password";
import { ResetPasswordConfirmPage } from "./pages/reset_password_confirm";
import ProfilePage from "./pages/ProfilePage";
import TransporterPage from "./pages/TransporterPage";
import CompanyPage from "./pages/CompanyPage";
import AccountTypePage from "./pages/AccountTypePage";
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
import IssuedWaybillsPage from "./pages/IssuedWaybillsPage";
import AllWaybillsPage from "./pages/AllWaybillsPage";
import IssuedProformaInvoicesPage from "./pages/IssuedProformaInvoicesPage";
import ProformaInvoiceIssuedDetailPage from "./pages/ProformaInvoiceIssuedDetailPage";
import RFxIssuedPage from "./pages/RFxIssuedPage";
import RFxCreationPage from "./pages/RFxCreationPage";
import CreateProformaInvoiceForRFxPage from "./pages/CreateProformaInvoiceForRFxPage";
import TenderPage from "./pages/TenderPage";
import TenderCreationPage from "./pages/TenderCreationPage";
import TenderDetailPage from "./pages/TenderDetailPage";
import CreateProformaInvoiceForTenderPage from "./pages/CreateProformaInvoiceForTenderPage";
import SalesInvoicesPage from "./pages/SalesInvoicesPage";
import SalesInvoiceDetailPage from "./pages/SalesInvoiceDetailPage";
import CreateSalesInvoicePage from "./pages/CreateSalesInvoicePage";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";
import IssuedPurchaseOrdersPage from "./pages/IssuedPurchaseOrdersPage";
import PaymentOrderDetailPage from "./pages/PaymentOrderDetailPage";
import CreatePaymentOrderPage from "./pages/CreatePaymentOrderPage";
import PaymentOrdersPage from "./pages/PaymentOrdersPage";
import IssuedSalesInvoicesPage from "./pages/IssuedSalesInvoicesPage";
import EditBranch from "./pages/EditBranch";
import { PricingPage } from "./pages/PricingPage";
import { SubscriptionCallbackPage } from "./pages/SubscriptionCallbackPage";

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