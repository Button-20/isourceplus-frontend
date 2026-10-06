import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { Link } from "react-router-dom";
import {
  Home,
  ShoppingCart,
  Loader2,
  TruckIcon,
  Building2,
  FileText,
  FilePlus,
  Gavel,
  ReceiptText,
  MailOpen,
  Wallet,
  Star,
  MessageSquare,
  Handshake,
} from "lucide-react";
import Logo from "@/components/common/Logo";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/services/context/app.context";
import ViewModeToggle from "@/components/dashboard/ViewModeToggle";
import { MdOutlineDocumentScanner, MdOutlinePeopleAlt } from "react-icons/md";

export function DashboardLayout() {
  const {
    user,
    token,
    loading,
    authAxios,
    fetchProfileInfo,
    userProfileId,
    companyId,
    transporterId,
    jobTitle,
    viewMode,
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileVerified, setProfileVerified] = useState(null);

  // Kick unauthenticated users back to login. No return-url is carried, so
  // logging out (and logging back in) lands on the dashboard, not the last page.
  useEffect(() => {
    if (!user || !token) {
      navigate("/login", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  // Populate the sidebar's job title (non-blocking — never gates the page).
  useEffect(() => {
    if (user && token && userProfileId) {
      fetchProfileInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfileId, user, token]);

  // Verify the user has completed onboarding. Fail OPEN on anything other than
  // a genuine "profile not found" (404), and time the request out, so a slow or
  // flaky request can never trap the user on an infinite loading spinner.
  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      if (!user || !token) return;
      if (!userProfileId) {
        if (!cancelled) setProfileVerified(false);
        return;
      }
      try {
        await authAxios.get(`user-profiles/${userProfileId}/`, {
          timeout: 15000,
        });
        if (!cancelled) setProfileVerified(true);
      } catch (err) {
        if (!cancelled) {
          setProfileVerified(err.response?.status === 404 ? false : true);
        }
      }
    };
    verify();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfileId, user, token]);

  // Send users without a profile to onboarding.
  useEffect(() => {
    if (user && token && profileVerified === false) {
      navigate("/onboarding/user", {
        state: { from: location },
        replace: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileVerified, user, token]);

  // Role / organization flags. A transporter follows its own experience;
  // company users (buyers/suppliers) follow the Buyer/Supplier view toggle.
  const normalizedJob = (jobTitle || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const isTransporter =
    Boolean(transporterId) || normalizedJob === "logistics manager";
  const isSupplierRole = normalizedJob === "sales manager";
  // A company user by role (drives the org nav before ids finish loading).
  const isCompanyRole =
    Boolean(companyId) ||
    normalizedJob === "sales manager" ||
    normalizedJob === "lead buyer";

  // A single top-level org nav (no sub-nav), decided by ROLE so it's correct
  // immediately (a logistics manager sees "Edit Transporter" even before the
  // transporter id finishes loading). Only a user with no org and no known
  // role sees "Account Type".
  const orgNav = isTransporter
    ? {
        title: "Edit Transporter",
        icon: Building2,
        url: "/dashboard/transporter/edit",
      }
    : isCompanyRole
      ? {
          title: "Edit Company",
          icon: Building2,
          url: "/dashboard/company/edit",
        }
      : { title: "Account Type", icon: Building2, url: "/dashboard/companies" };

  // A single Employees entry that points at the company or transporter roster
  // depending on which kind of organization the user belongs to.
  const employeesUrl = transporterId
    ? "/dashboard/transporter/employees"
    : "/dashboard/company/employees";

  // The sidebar is organized into labeled sections. Transaction navs carry a
  // `key` so they can be hidden per view/role (see HIDDEN_KEYS below).
  const NAV_SECTIONS = [
    {
      label: "Overview",
      items: [{ title: "Home", url: "/dashboard/", icon: Home }],
    },
    {
      label: "Procurement",
      // Suppliers sell rather than procure.
      supplierLabel: "Sales Management",
      items: [
        {
          title: "RFx Management",
          icon: FileText,
          key: "rfx",
          url: "/dashboard/rfxs",
          // One page with filter tabs (All · Draft · Published · Expired).
          matchPrefix: "/dashboard/rfxs",
        },
        {
          title: "Tender Management",
          icon: Gavel,
          key: "tenders",
          url: "/dashboard/tenders",
          // One page with filter tabs (All · Draft · Published · Expired).
          matchPrefix: "/dashboard/tenders",
        },
        {
          title: "Invoices",
          icon: ReceiptText,
          key: "invoices",
          url: "/dashboard/invoices",
          // One page with Proforma / Sales tabs; detail pages keep their URLs.
          matchPrefix: [
            "/dashboard/invoices",
            "/dashboard/proforma-invoices",
            "/dashboard/sales-invoices",
          ],
        },
        {
          title: "Purchase Orders",
          icon: FilePlus,
          key: "purchase-orders",
          url: "/dashboard/purchase-orders",
          // One page with filter tabs (All · Draft).
          matchPrefix: "/dashboard/purchase-orders",
        },
        {
          title: "Waybills",
          icon: TruckIcon,
          key: "waybills",
          url: "/dashboard/waybills",
          // One page with filter tabs (All · Draft · Published · Expired).
          matchPrefix: "/dashboard/waybills",
        },
        {
          title: "Payment Orders",
          icon: Wallet,
          key: "payment-orders",
          url: "/dashboard/payment-orders",
          // One page with filter tabs (All · Draft).
          matchPrefix: "/dashboard/payment-orders",
        },
      ],
    },
    {
      // Suppliers: RFxs / tenders / waybills they were invited to
      // (business-invites/?biz_type=…), one page with the types as tabs.
      // Transporters: waybill invitations only (biz_type=waybill).
      label: "Business Invitations",
      items: [
        {
          title: "Received Invitations",
          // Transporters are only invited to waybills.
          transporterTitle: "Waybill Invitations",
          icon: MailOpen,
          key: "business-invites",
          url: "/dashboard/business-invites",
          matchPrefix: "/dashboard/business-invites",
        },
      ],
    },
    {
      // Supplier-only: the purchase orders buyers have awarded to this
      // supplier. Opening one lets a sales manager raise the sales invoice.
      label: "Awarded Businesses",
      items: [
        {
          title: "Purchase Orders",
          icon: FilePlus,
          key: "awarded-businesses",
          url: "/dashboard/purchase-orders",
          matchPrefix: "/dashboard/purchase-orders",
        },
      ],
    },
    {
      // Buyer-only: offers (proforma invoices) received against this buyer's
      // RFxs, waybills and tenders — each page lists the buyer's events and
      // the offers each one received (…/{ref}/received-offers/).
      label: "Business Offers",
      items: [
        {
          // One page; RFx · Waybill · Tender are tabs (?type=).
          title: "Received Offers",
          icon: ReceiptText,
          key: "business-offers",
          url: "/dashboard/business-offers",
          matchPrefix: "/dashboard/business-offers",
        },
      ],
    },
    {
      label: "Organization",
      items: [
        orgNav,
        { title: "Employees", icon: MdOutlinePeopleAlt, url: employeesUrl },
        { title: "Branches", icon: TruckIcon, url: "/dashboard/branches" },
        // Companies and transporters add the organisations they work with.
        ...(isTransporter || isCompanyRole
          ? [
              {
                // Buyers keep suppliers; suppliers and transporters keep clients.
                title: "My Suppliers",
                supplierTitle: "My Clients",
                transporterTitle: "My Clients",
                icon: Handshake,
                url: "/dashboard/clients",
              },
            ]
          : []),
      ],
    },
    {
      label: "Account",
      items: [
        {
          title: "Subscriptions",
          icon: ShoppingCart,
          url: "/dashboard/subscriptions",
        },
        {
          title: "Add ID Documents",
          icon: MdOutlineDocumentScanner,
          url: "/dashboard/user/verification-docs",
        },
        { title: "Reviews", icon: Star, url: "/dashboard/reviews" },
        { title: "SMS", icon: MessageSquare, url: "/dashboard/sms" },
      ],
    },
  ];

  // Exception (hidden) routes per view/role. A transporter follows its own set;
  // company users follow the Buyer/Supplier view toggle. Untagged entries
  // (Home, Subscriptions, Employees, Branches, etc.) are always shown.
  // Suppliers keep RFx + Tender (the business invitations they respond to) but
  // not the buyer-only "Issued …" sub-items (see `buyerOnly`).
  const HIDDEN_KEYS = {
    buyer: [
      "invoices",
      "payment-orders",
      "awarded-businesses",
      "business-invites",
    ],
    // Suppliers respond to RFxs/tenders via Business Invitations instead.
    supplier: ["rfx", "tenders", "purchase-orders", "business-offers"],
    transporter: [
      "rfx",
      "tenders",
      "purchase-orders",
      "waybills",
      "business-offers",
      "awarded-businesses",
    ],
  };
  // Buyer/Supplier view toggle visibility: only suppliers (sales managers) see
  // it. Buyers and transporters never do.
  const showViewToggle = !isTransporter && isSupplierRole;
  const hidden = new Set(
    isTransporter
      ? HIDDEN_KEYS.transporter
      : HIDDEN_KEYS[viewMode] || HIDDEN_KEYS.buyer,
  );
  // Filter each section by the hidden keys, then drop any section left empty so
  // its label never renders on its own.
  const isSupplierView = !isTransporter && viewMode === "supplier";
  const navSections = NAV_SECTIONS.map((section) => ({
    ...section,
    label:
      isSupplierView && section.supplierLabel
        ? section.supplierLabel
        : section.label,
    items: section.items
      .filter((item) => !item.key || !hidden.has(item.key))
      .map((item) => {
        if (isTransporter && item.transporterTitle) {
          return { ...item, title: item.transporterTitle };
        }
        if (!isSupplierView) return item;
        const next = item.supplierTitle
          ? { ...item, title: item.supplierTitle }
          : item;
        return next.submenu
          ? { ...next, submenu: next.submenu.filter((sub) => !sub.buyerOnly) }
          : next;
      }),
  })).filter((section) => section.items.length > 0);

  // Redirecting to /login (see effect above).
  if (!user || !token) {
    return null;
  }

  // Only the onboarding check gates the full page, and it always resolves
  // (success, 404, or a timed-out/failed request that fails open).
  if (profileVerified === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  // Redirecting to onboarding (see effect above).
  if (profileVerified === false) {
    return null;
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        {/* The sidebar is always fully rendered — its nav is static and doesn't
            depend on the job title, so we never blank it while background
            profile data loads (that caused a visible reload/flicker). */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to={"/dashboard"} className="gap-2">
                  {/* White lockup (onDark) — the sidebar is a blue panel (light)
                      or dark (dark theme), so the mark/wordmark stay white in
                      both. to={null} avoids nesting an <a>. When the rail
                      collapses to icons, show the mark only. */}
                  <Logo
                    onDark
                    to={null}
                    showWordmark={false}
                    imgClassName="h-8 w-auto"
                    className="hidden group-data-[collapsible=icon]:inline-flex"
                  />
                  <Logo
                    onDark
                    to={null}
                    imgClassName="h-9 w-auto"
                    className="group-data-[collapsible=icon]:hidden"
                  />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain sections={navSections} pathname={location.pathname} />
          <NavSecondary className="mt-auto" />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
      </Sidebar>
      <main style={{ width: "100%" }}>
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/10 bg-header px-5 py-3 text-header-foreground">
          <SidebarTrigger className="text-header-foreground hover:bg-white/10 hover:text-header-foreground" />
          <div className="flex items-center gap-2">
            {showViewToggle && <ViewModeToggle />}
            <ThemeToggle className="text-header-foreground hover:bg-white/10 hover:text-header-foreground" />
          </div>
        </header>
        {/* Content fills the available width, then centers on very large
            screens (capped at max-w-screen-2xl) so it never stretches too wide. */}
        <div className="mx-auto w-full max-w-screen-2xl p-5 pt-5">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </SidebarProvider>
  );
}
