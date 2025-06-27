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
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
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
import { FaPeopleArrows, FaSalesforce } from "react-icons/fa";
import {
  MdAdd,
  MdAdminPanelSettings,
  MdEditDocument,
  MdOutlineDocumentScanner,
  MdOutlinePeopleAlt,
  MdPeopleAlt,
  MdPeopleOutline,
  MdPersonAdd,
  MdPersonAddAlt,
} from "react-icons/md";
import { IoIosDocument, IoMdDocument } from "react-icons/io";

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
  } = useAuth();
  // const [profileId, setProfileId] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfileInfo();
  }, [authAxios]);

  if (loading || sidebarLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  let companiesSubmenu = [
    { title: "Account Type", url: "/dashboard/companies" },
  ];

  if (jobTitle === "admin") {
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

  if (jobTitle === "admin") {
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
  if (["admin", "lead buyer", "sales manager"].includes(jobTitle)) {
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
      // {
      //   title: "Add Employee",
      //   url: "/dashboard/employee/new/",
      //   icon: MdPersonAddAlt,
      // },
      // { title: "Employees", url: "/dashboard/employees", icon: MdPersonAddAlt },
      {
        title: "Branches ",
        icon: TruckIcon,
        submenu: [
          { title: "Add a Branch", url: "/dashboard/branches/new" },
          { title: "View all Branches", url: "/dashboard/branches" },
        ],
      },
       {
        title: "Add ID Documents",
        icon: MdOutlineDocumentScanner,
        url: "dashboard/user/verification-docs"
      },
    ];
  } else {
    navLinks = [{ title: "Home", url: "/dashboard/", icon: Home }];
  }

  if (!user && !token) {
    return <Navigate state={{ from: location }} to="/login" replace />;
  }
  console.log("jobTitle", jobTitle);

  return (
    <SidebarProvider>
      {/* Sidebar with loading state */}
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
                        {jobTitle === "admin" && (
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

      {/* Main content area - always visible */}
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

      {/* <Toaster /> */}
    </SidebarProvider>
  );
}
