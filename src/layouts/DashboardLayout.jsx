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
} from "lucide-react";
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
import { FaSalesforce } from "react-icons/fa";
import {
  MdAdminPanelSettings,
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

  let companiesSubmenu = [];

  if (!companyId && !transporterId) {
    companiesSubmenu.push({ title: "Account Type", url: "/dashboard/companies" });
  }

  if (jobTitle === "logistics manager") {
    companiesSubmenu.push({
      title: "Edit Transporter",
      url: "/dashboard/transporter/edit",
    });
  }

  if (jobTitle === "lead buyer" || jobTitle === "sales manager") {
    companiesSubmenu.push({
      title: "Edit Company",
      url: "/dashboard/company/edit",
    });
  }

  let employeesSubmenu = [
    { title: "Add Employee", url: "/dashboard/employee/new/" },
  ];

  if (jobTitle === "logistics manager") {
    employeesSubmenu.push({
      title: "Transport employees",
      url: "transporter/employees",
    });
  }

  if (jobTitle === "lead buyer" || jobTitle === "sales manager") {
    employeesSubmenu.push({
      title: "Company employees",
      url: "company/employees",
    });
  }

  let navLinks = [];
  if (["logistics manager", "lead buyer", "sales manager"].includes(jobTitle)) {
    navLinks = [
      { title: "Home", url: "/dashboard/", icon: Home },
      {
        title: "Subscriptions",
        icon: ShoppingCart,
        url: "/pricing",
      },
      {
        title: "Companies & Transporters",
        icon: Building2,
        submenu: companiesSubmenu,
      },
      {
        title: "Employees",
        icon: MdOutlinePeopleAlt,
        submenu: employeesSubmenu,
      },
      {
        title: "Branches",
        icon: TruckIcon,
        url: "/dashboard/branches",
      },
      {
        title: "Add ID Documents",
        icon: MdOutlineDocumentScanner,
        url: "/dashboard/user/verification-docs",
      },
    ];
  } else {
    navLinks = [{ title: "Home", url: "/dashboard/", icon: Home }];
  }

  if (jobTitle === "logistics manager") {
    navLinks.push({
      title: "All Waybills",
      icon: FilePlus,
      url: "/dashboard/waybills",
    });
    navLinks.push({
      title: "Issued Proforma Invoices",
      icon: FileText,
      url: "/dashboard/proforma-invoices/issued",
    });
    navLinks.push({
      title: "Purchase Orders",
      icon: FilePlus,
      url: "/dashboard/purchase-orders",
    });
    navLinks.push({
      title: "Sales Invoices",
      icon: FileText,
      url: "/dashboard/sales-invoices",
    });
    navLinks.push({
      title: "Payment Orders",
      icon: FileText,
      url: "/dashboard/payment-orders/issued",
    });
  }

  if (jobTitle === "lead buyer" || jobTitle === "sales manager") {
    navLinks.push({
      title: "Issued Waybills",
      icon: FilePlus,
      url: "/dashboard/waybills/issued",
    });
    navLinks.push({
      title: "RFx Management",
      icon: FileText,
      submenu: [
        { title: "View All RFxs", url: "/dashboard/rfxs" },
        ...(jobTitle === "lead buyer"
          ? [
              { title: "Create RFx", url: "/dashboard/rfxs/new" },
              { title: "View Issued RFxs", url: "/dashboard/rfxs/issued" },
            ]
          : []),
      ],
    });
    navLinks.push({
      title: "Tender Management",
      icon: FileText,
      submenu: [
        { title: "View All Tenders", url: "/dashboard/tenders" },
        ...(jobTitle === "lead buyer"
          ? [
              {
                title: "View Issued Tenders",
                url: "/dashboard/tenders/issued",
              },
              { title: "Create Tender", url: "/dashboard/tenders/new" },
            ]
          : []),
      ],
    });
    navLinks.push({
      title: "Proforma Invoices",
      icon: FileText,
      url: "/dashboard/proforma-invoices",
    });
    navLinks.push({
      title: "Purchase Orders",
      icon: FilePlus,
      url:
        jobTitle === "lead buyer"
          ? "/dashboard/purchase-orders/issued"
          : "/dashboard/purchase-orders",
    });
  }

  if (jobTitle === "sales manager") {
    navLinks.push({
      title: "Sales Invoices",
      icon: FileText,
      url: "/dashboard/sales-invoices",
    });
    navLinks.push({
      title: "Payment Orders",
      icon: FileText,
      url: "/dashboard/payment-orders/issued",
    });
  }

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
                    <Link to={"/dashboard"}>
                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                        {jobTitle === "lead buyer" && (
                          <ShoppingCart className="size-4" />
                        )}
                        {jobTitle === "sales manager" && (
                          <FaSalesforce className="size-4" />
                        )}
                        {jobTitle === "logistics manager" && (
                          <MdAdminPanelSettings className="size-4" />
                        )}
                      </div>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          Source-Plus
                        </span>
                        <span className="truncate text-xs">{jobTitle}</span>
                      </div>
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
