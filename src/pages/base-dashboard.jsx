import { Navigate, Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { Link } from "react-router-dom";
import { Home, Truck, ShoppingCart } from "lucide-react";
import { useCallback, useMemo } from "react";
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

export function BaseDashBoard() {
  const {user,token} = useAuth();
  const location = useLocation()

  

  if (!user && !token  ) {
    return <Navigate state={{from:location}} to="/login" replace />; 
  }

  const user1 = { role: "buyer" };
  const generateNavLinks = useCallback((userRole) => {
    if (userRole === "buyer") {
      return [{ title: "Home", url: "/dashboard/", icon: Home },];
    }

    return [{ title: "Home", url: "/dashboard/", icon: Home }];
  }, []);

  const navLinks = useMemo(() => {
    return generateNavLinks(user1.role);
  }, [user1, generateNavLinks]);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to={"/dashboard"}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    {user1.role === "buyer" && (
                      <ShoppingCart className="size-4" />
                    )}
                    {user1.role === "supplier" && <Truck className="size-4" />}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Source-Plus</span>
                    <span className="truncate text-xs">{user1.role}</span>
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
      </Sidebar>

      <main style={{ width: "100%" }}>
        <SidebarTrigger className="m-5 mb-0" />
        <div className="p-5 pt-5">
          <Outlet />
        </div>
      </main>

      <Toaster />
    </SidebarProvider>
  );
}
