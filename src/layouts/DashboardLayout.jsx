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
  Wallet,
} from "lucide-react";
import { assets } from "@/assets/assets";
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
import {
  MdOutlineDocumentScanner,
  MdOutlinePeopleAlt,
} from "react-icons/md";

export function DashboardLayout() {
  const {
    user,
    token,
    loading,
    jobTitle,
    sidebarLoading,
    authAxios,
    fetchProfileInfo,
    userProfileId,
    companyId,
    transporterId,
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileVerified, setProfileVerified] = useState(null);

  // Kick unauthenticated users back to login.
  useEffect(() => {
    if (!user || !token) {
      navigate("/login", { state: { from: location }, replace: true });
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
      navigate("/onboarding/user", { state: { from: location }, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileVerified, user, token]);

  // Sidebar navigation — always fully populated. Backend permissions still
  // guard the actual routes, so showing the full workspace is safe and gives
  // every role a complete sidebar.
  const companiesSubmenu = [
    ...(!companyId && !transporterId
      ? [{ title: "Account Type", url: "/dashboard/companies" }]
      : []),
    { title: "Edit Company", url: "/dashboard/company/edit" },
    { title: "Edit Transporter", url: "/dashboard/transporter/edit" },
  ];

  const employeesSubmenu = [
    { title: "Add Employee", url: "/dashboard/employee/new/" },
    { title: "Company Employees", url: "/dashboard/company/employees" },
    { title: "Transport Employees", url: "/dashboard/transporter/employees" },
  ];

  const navLinks = [
    { title: "Home", url: "/dashboard/", icon: Home },
    { title: "Subscriptions", icon: ShoppingCart, url: "/pricing" },
    {
      title: "Companies & Transporters",
      icon: Building2,
      submenu: companiesSubmenu,
    },
    { title: "Employees", icon: MdOutlinePeopleAlt, submenu: employeesSubmenu },
    { title: "Branches", icon: TruckIcon, url: "/dashboard/branches" },
    {
      title: "RFx Management",
      icon: FileText,
      submenu: [
        { title: "View All RFxs", url: "/dashboard/rfxs" },
        { title: "Create RFx", url: "/dashboard/rfxs/new" },
        { title: "Issued RFxs", url: "/dashboard/rfxs/issued" },
      ],
    },
    {
      title: "Tender Management",
      icon: Gavel,
      submenu: [
        { title: "View All Tenders", url: "/dashboard/tenders" },
        { title: "Create Tender", url: "/dashboard/tenders/new" },
        { title: "Issued Tenders", url: "/dashboard/tenders/issued" },
      ],
    },
    {
      title: "Proforma Invoices",
      icon: ReceiptText,
      submenu: [
        { title: "All Proforma Invoices", url: "/dashboard/proforma-invoices" },
        {
          title: "Issued Proforma Invoices",
          url: "/dashboard/proforma-invoices/issued",
        },
      ],
    },
    {
      title: "Purchase Orders",
      icon: FilePlus,
      submenu: [
        { title: "All Purchase Orders", url: "/dashboard/purchase-orders" },
        {
          title: "Issued Purchase Orders",
          url: "/dashboard/purchase-orders/issued",
        },
      ],
    },
    {
      title: "Sales Invoices",
      icon: Wallet,
      submenu: [
        { title: "All Sales Invoices", url: "/dashboard/sales-invoices" },
        {
          title: "Issued Sales Invoices",
          url: "/dashboard/sales-invoices/issued",
        },
      ],
    },
    {
      title: "Waybills",
      icon: TruckIcon,
      submenu: [
        { title: "All Waybills", url: "/dashboard/waybills" },
        { title: "Issued Waybills", url: "/dashboard/waybills/issued" },
      ],
    },
    {
      title: "Payment Orders",
      icon: Wallet,
      url: "/dashboard/payment-orders/issued",
    },
    {
      title: "Add ID Documents",
      icon: MdOutlineDocumentScanner,
      url: "/dashboard/user/verification-docs",
    },
  ];

  // Redirecting to /login (see effect above).
  if (!user || !token) {
    return null;
  }

  // Only the onboarding check gates the full page, and it always resolves
  // (success, 404, or a timed-out/failed request that fails open).
  if (profileVerified === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
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
        {sidebarLoading ? (
          <div className=" font-montserrat flex h-full w-full items-center justify-center bg-sidebar-background">
            <Loader2 className="animate-spin h-8 w-8 text-sidebar-foreground" />
          </div>
        ) : (
          <>
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size="lg" asChild>
                    <Link to={"/dashboard"} className="gap-2">
                      <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-brand-gradient font-display text-sm font-bold text-brand-foreground">
                        iS
                      </div>
                      <img
                        src={assets.ISlogo}
                        alt="iSource+"
                        className="h-6 w-auto group-data-[collapsible=icon]:hidden"
                      />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
              <NavMain items={navLinks} pathname={location.pathname} />
              <NavSecondary className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
              <NavUser user={user} />
            </SidebarFooter>
          </>
        )}
      </Sidebar>
      <main style={{ width: "100%" }}>
        <SidebarTrigger className="m-5 mb-0" />
        <div className="p-5 pt-5">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </SidebarProvider>
  );
}
