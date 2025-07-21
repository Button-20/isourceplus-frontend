import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { Link } from "react-router-dom";
import {
  Home,
  Truck,
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
import { useAuth } from "@/contexts/app.context";
import { FaSalesforce } from "react-icons/fa";
import {
  MdAdd,
  MdAdminPanelSettings,
  MdEditDocument,
  MdOutlineDocumentScanner,
  MdOutlinePeopleAlt,
} from "react-icons/md";

export function BaseDashBoard() {
  const {
    user,
    token,
    loading,
    jobTitle,
    sidebarLoading,
    setSidebarLoading,
    profileLoading,
    authAxios,
    fetchProfileInfo,
    userProfileId,
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileVerified, setProfileVerified] = useState(null);

  useEffect(() => {
    if (user && token && userProfileId) {
      fetchProfileInfo();
    }
  }, [authAxios, userProfileId, user, token]);

  useEffect(() => {
    const verifyProfile = async () => {
      if (!user || !token || !userProfileId) {
        setProfileVerified(false);
        return;
      }
      try {
        await authAxios.get(`user-profiles/${userProfileId}/`);
        setProfileVerified(true);
      } catch (error) {
        console.error("Profile does not exist:", error);
        setProfileVerified(false);
      }
    };
    verifyProfile();
  }, [userProfileId, authAxios, user, token]);

  useEffect(() => {
    if (!loading && !sidebarLoading) {
      if (!user || !token) {
        navigate("/login", { state: { from: location }, replace: true });
      } else if (profileVerified === false) {
        navigate("/onboarding/user", {
          state: { from: location },
          replace: true,
        });
      }
    }
  }, [
    loading,
    sidebarLoading,
    user,
    token,
    profileVerified,
    navigate,
    location,
  ]);

  let companiesSubmenu = [
    { title: "Account Type", url: "/dashboard/companies" },
  ];

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
        submenu: [
          { title: "Add a Branch", url: "/dashboard/branches/new" },
          { title: "View all Branches", url: "/dashboard/branches" },
        ],
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
  }

  if (jobTitle === "lead buyer" || jobTitle === "sales manager") {
    navLinks.push({
      title: "Issued Waybills",
      icon: FilePlus,
      url: "/dashboard/waybills/issued",
    });
    navLinks.push({
      title: "Proforma Invoices",
      icon: FileText,
      url: "/dashboard/proforma-invoices",
    });
    navLinks.push({
      title: "RFx Management",
      icon: FileText,
      submenu: [
        { title: "View All RFxs", url: "/dashboard/rfxs" },
        { title: "View Issued RFxs", url: "/dashboard/rfxs/issued" },
        ...(jobTitle === "lead buyer"
          ? [{ title: "Create RFx", url: "/dashboard/rfxs/new" }]
          : []),
      ],
    });
  }

  if (loading || sidebarLoading || profileVerified === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  if (!user || !token || !profileVerified) {
    return null;
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        {sidebarLoading ? (
          <div className="flex h-full w-full items-center justify-center bg-sidebar-background">
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
              <NavMain items={navLinks} />
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