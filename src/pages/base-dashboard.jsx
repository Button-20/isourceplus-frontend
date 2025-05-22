import { Navigate, Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { Link } from "react-router-dom";
import { Home, Truck, ShoppingCart, Loader2 } from "lucide-react";
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
  MdPeopleAlt,
  MdPeopleOutline,
  MdPersonAdd,
  MdPersonAddAlt,
} from "react-icons/md";

export function BaseDashBoard() {
  const { user, token, loading, jobTitle, sidebarLoading, setSidebarLoading } =
    useAuth();
  const [profileId, setProfileId] = useState(null);

  const location = useLocation();

  // useEffect(() => {
  //   if (jobTitle && jobTitle !== null) {
  //     console.log("job_title", jobTitle);
  //   }
  // }, [profileId]);

  const generateNavLinks = useCallback((userRole) => {
   
      return [
        { title: "Home", url: "/dashboard/", icon: Home },
        {
          title: "Add Employee",
          url: "/dashboard/employee/new/",
          icon: MdPersonAddAlt,
        },
        { title: "Employees", url: "/employees", icon: MdPersonAddAlt },
      ];
    

   
  }, []);

  const navLinks = useMemo(() => {
    return generateNavLinks(jobTitle);
  }, [jobTitle, generateNavLinks]);

  if (loading) {
    return (
      <div className=" flex">
        loading dashboard<Loader2 className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  if (!user && !token) {
    return <Navigate state={{ from: location }} to="/login" replace />;
  }

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
                        <span className="truncate font-semibold">Source-Plus</span>
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

      <Toaster />
    </SidebarProvider>
  );
}
