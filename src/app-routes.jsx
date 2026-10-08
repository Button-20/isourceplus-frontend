import { createBrowserRouter, Navigate } from "react-router-dom";

import { ENV } from "./services/lib/env";
import WaitlistPage from "./pages/public/WaitlistPage";

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
import ReviewsPage from "./pages/reviews/ReviewsPage";
import SmsPage from "./pages/sms/SmsPage";

// rfx
import RFxDetailPage from "./pages/rfx/RFxDetailPage";

// tenders
import TenderDetailPage from "./pages/tenders/TenderDetailPage";

// proforma invoices
import ProformaInvoiceDetailPage from "./pages/proforma-invoices/ProformaInvoiceDetailPage";
import ProformaInvoiceIssuedDetailPage from "./pages/proforma-invoices/ProformaInvoiceIssuedDetailPage";
import CreateProformaInvoicePage from "./pages/proforma-invoices/CreateProformaInvoicePage";
import CreateProformaInvoiceForRFxPage from "./pages/proforma-invoices/CreateProformaInvoiceForRFxPage";
import CreateProformaInvoiceForTenderPage from "./pages/proforma-invoices/CreateProformaInvoiceForTenderPage";

// purchase orders
import PurchaseOrderCreationPage from "./pages/purchase-orders/PurchaseOrderCreationPage";
import PurchaseOrderDetailPage from "./pages/purchase-orders/PurchaseOrderDetailPage";

// sales invoices
import SalesInvoiceDetailPage from "./pages/sales-invoices/SalesInvoiceDetailPage";
import CreateSalesInvoicePage from "./pages/sales-invoices/CreateSalesInvoicePage";

// payment orders
import CreatePaymentOrderPage from "./pages/payment-orders/CreatePaymentOrderPage";
import PaymentOrderDetailPage from "./pages/payment-orders/PaymentOrderDetailPage";

// waybills
import WaybillDetailPage from "./pages/waybills/WaybillDetailPage";

// subscription
import { SubscriptionCallbackPage } from "./pages/subscription/SubscriptionCallbackPage";

// legal
import { TermsPage, PrivacyPage } from "./pages/public/legal-pages";
import { BusinessOffersPage } from "./pages/business-offers/ReceivedOffersPage";
import BusinessInvitesPage from "./pages/business-invites/BusinessInvitesPage";
import EventManagementPage from "./pages/event-lists/EventManagementPage";
import FilterRedirect from "./pages/event-lists/FilterRedirect";
import InvoicesPage from "./pages/invoices/InvoicesPage";
import ClientsPage from "./pages/clients/ClientsPage";
import { FaqPage } from "./pages/public/FaqPage";
import { UseCasesPage } from "./pages/public/UseCasesPage";

const fullRoutes = [
  { path: "/", element: <LandingPage /> },
  { path: "/waitlist", element: <WaitlistPage /> },
  { path: "/pricing", element: <PricingPage /> },
  { path: "/marketplace", element: <MarketplacePage /> },
  { path: "/store", element: <Store /> },
  { path: "/about", element: <AboutPage /> },
  { path: "/terms", element: <TermsPage /> },
  { path: "/privacy", element: <PrivacyPage /> },
  { path: "/faq", element: <FaqPage /> },
  { path: "/use-cases", element: <UseCasesPage /> },
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
            // Matches the link the backend emails: /reset-password/{uid}/{token}
            path: "/reset-password/:uid/:token",
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
      { path: "subscriptions", element: <PricingPage embedded /> },
      { path: "transporter", element: <TransporterPage /> },
      { path: "companies", element: <AccountTypePage /> },
      { path: "company", element: <CompanyPage /> },
      { path: "company/edit", element: <EditCompany /> },
      { path: "transporter/edit", element: <EditTransporter /> },
      { path: "transporter/add-business-docs", element: <AddBusinessDocs /> },
      { path: "company/add-business-docs", element: <AddBusinessDocs /> },
      { path: "employee/new", element: <AddNewEmployeePage /> },
      { path: "employee/existing", element: <AddExistingEmployeePage /> },
      { path: "branches", element: <AllBranches /> },
      { path: "branches/:id", element: <BranchDetails /> },
      { path: "branches/:id/edit", element: <EditBranch /> },
      { path: "employees", element: <Employees /> },
      { path: "employees/:id", element: <EmployeeDetailPage /> },
      { path: "transporter/employees", element: <AllTransporterEmployees /> },
      { path: "company/employees", element: <CompanyEmployees /> },
      {
        path: "user/verification-docs",
        element: <ManageUserVerificationDocs />,
      },
      { path: "reviews", element: <ReviewsPage /> },
      { path: "sms", element: <SmsPage /> },
      // RFx / waybill / tender lists: one page each with filter tabs
      // (Draft · Published · Expired); old per-filter URLs redirect.
      { path: "rfxs", element: <EventManagementPage key="rfx" kind="rfx" /> },
      {
        path: "rfxs/issued",
        element: <FilterRedirect to="/dashboard/rfxs" filter="draft" />,
      },
      {
        path: "rfxs/published",
        element: <FilterRedirect to="/dashboard/rfxs" filter="published" />,
      },
      {
        path: "rfxs/expired",
        element: <FilterRedirect to="/dashboard/rfxs" filter="expired" />,
      },
      { path: "rfxs/:refNum", element: <RFxDetailPage /> },
      {
        path: "waybills",
        element: <EventManagementPage key="waybill" kind="waybill" />,
      },
      {
        path: "waybills/issued",
        element: <FilterRedirect to="/dashboard/waybills" filter="draft" />,
      },
      {
        path: "waybills/published",
        element: <FilterRedirect to="/dashboard/waybills" filter="published" />,
      },
      {
        path: "waybills/expired",
        element: <FilterRedirect to="/dashboard/waybills" filter="expired" />,
      },
      { path: "waybills/:refNum", element: <WaybillDetailPage /> },
      {
        path: "tenders",
        element: <EventManagementPage key="tender" kind="tender" />,
      },
      {
        path: "tenders/issued",
        element: <FilterRedirect to="/dashboard/tenders" filter="draft" />,
      },
      {
        path: "tenders/published",
        element: <FilterRedirect to="/dashboard/tenders" filter="published" />,
      },
      {
        path: "tenders/expired",
        element: <FilterRedirect to="/dashboard/tenders" filter="expired" />,
      },
      { path: "tenders/:refNum", element: <TenderDetailPage /> },
      // Business Offers (buyer): offers received per RFx / waybill / tender.
      // `key` remounts the page when switching kinds.
      { path: "business-offers", element: <BusinessOffersPage /> },
      // Supplier: business-invites/?biz_type=<rfx|tender|waybill> as tabs.
      { path: "business-invites", element: <BusinessInvitesPage /> },
      {
        path: "business-offers/rfx",
        element: (
          <FilterRedirect
            to="/dashboard/business-offers"
            param="type"
            filter="rfx"
          />
        ),
      },
      {
        path: "business-offers/waybills",
        element: (
          <FilterRedirect
            to="/dashboard/business-offers"
            param="type"
            filter="waybill"
          />
        ),
      },
      {
        path: "business-offers/tenders",
        element: (
          <FilterRedirect
            to="/dashboard/business-offers"
            param="type"
            filter="tender"
          />
        ),
      },
      // Proforma / sales invoices: one page each with tabs (Draft · Published · Expired).
      // Invoices: proforma + sales on one page (?type=proforma|sales), each
      // with tabs (Draft · Published · Expired). The old list URLs redirect there.
      { path: "invoices", element: <InvoicesPage /> },
      { path: "clients", element: <ClientsPage /> },
      {
        path: "proforma-invoices",
        element: (
          <FilterRedirect
            to="/dashboard/invoices"
            extra={{ type: "proforma" }}
          />
        ),
      },
      {
        path: "proforma-invoices/issued",
        element: (
          <FilterRedirect
            to="/dashboard/invoices"
            filter="draft"
            extra={{ type: "proforma" }}
          />
        ),
      },
      {
        path: "proforma-invoices/:refNum",
        element: <ProformaInvoiceDetailPage />,
      },
      {
        path: "proforma-invoices/issued/:refNum",
        element: <ProformaInvoiceIssuedDetailPage />,
      },
      {
        path: "proforma-invoices/create-offer",
        element: <CreateProformaInvoicePage />,
      },
      {
        path: "proforma-invoices/create-offer-rfx",
        element: <CreateProformaInvoiceForRFxPage />,
      },
      {
        path: "proforma-invoices/create-offer-tender",
        element: <CreateProformaInvoiceForTenderPage />,
      },
      // Purchase orders: one page with filter tabs (Draft · Published).
      {
        path: "purchase-orders",
        element: (
          <EventManagementPage key="purchaseOrder" kind="purchaseOrder" />
        ),
      },
      {
        path: "purchase-orders/issued",
        element: (
          <FilterRedirect to="/dashboard/purchase-orders" filter="draft" />
        ),
      },
      { path: "purchase-orders/:refNum", element: <PurchaseOrderDetailPage /> },
      {
        path: "purchase-orders/create-business-award/*",
        element: <PurchaseOrderCreationPage />,
      },
      {
        path: "sales-invoices",
        element: (
          <FilterRedirect to="/dashboard/invoices" extra={{ type: "sales" }} />
        ),
      },
      {
        path: "sales-invoices/issued",
        element: (
          <FilterRedirect
            to="/dashboard/invoices"
            filter="draft"
            extra={{ type: "sales" }}
          />
        ),
      },
      { path: "sales-invoices/:refNum", element: <SalesInvoiceDetailPage /> },
      {
        path: "sales-invoices/create-sales-invoice",
        element: <CreateSalesInvoicePage />,
      },
      // Payment orders: one page with tabs (Draft · Published · Expired).
      {
        path: "payment-orders",
        element: <EventManagementPage key="paymentOrder" kind="paymentOrder" />,
      },
      {
        path: "payment-orders/issued",
        element: (
          <FilterRedirect to="/dashboard/payment-orders" filter="draft" />
        ),
      },
      { path: "payment-orders/:refNum", element: <PaymentOrderDetailPage /> },
      {
        path: "payment-orders/create-payment-order",
        element: <CreatePaymentOrderPage />,
      },
    ],
  },
  { path: "/watch-now", element: <WatchNow /> },
];

// Pre-launch lockdown (see ENV.PRELAUNCH): expose ONLY the landing page and the
// waitlist; every other path — login, signup, onboarding, dashboard, the other
// public pages — redirects to the landing page so users can't reach the app
// before launch.
const prelaunchRoutes = [
  { path: "/", element: <LandingPage /> },
  { path: "/waitlist", element: <WaitlistPage /> },
  // Public information pages linked from the landing page stay reachable.
  { path: "/faq", element: <FaqPage /> },
  { path: "/use-cases", element: <UseCasesPage /> },
  { path: "/terms", element: <TermsPage /> },
  { path: "/privacy", element: <PrivacyPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
];

export const appRoutes = createBrowserRouter(
  ENV.PRELAUNCH ? prelaunchRoutes : fullRoutes,
);
