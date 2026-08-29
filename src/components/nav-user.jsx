import { Bell, ChevronsUpDown, LogOut, Settings2, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
// import { useKindeAuth } from "@kinde-oss/kinde-auth-react"
import { Button } from "./ui/button";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/app.context";
import { useNavigate } from "react-router";

export function NavUser({ user }) {
  const { isMobile } = useSidebar();
  const { logout } = useAuth();
  const [logoutDialog, setLogoutDialog] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navigate = useNavigate()

  // `user` is the email string; derive a readable name + initials from it.
  const email = typeof user === "string" ? user : user?.email || "";
  const rawName = user?.fullname || (email ? email.split("@")[0] : "");
  const displayName = rawName
    ? rawName
        .split(/[._\- ]+/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ")
    : "User";
  const nameParts = displayName.split(/\s+/).filter(Boolean);
  const initials = (
    nameParts.length > 1
      ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
      : (nameParts[0] || email || "U").slice(0, 2)
  ).toUpperCase();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setLogoutDialog(false);
    }
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={
                      user?.profileImage ||
                      "https://www.flaticon.com/free-icons/avatar"
                    }
                    alt="profile"
                  />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {displayName}
                  </span>
                  <span className="truncate text-xs">
                    {email || "user@gmail.com"}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={
                        user?.profileImage ||
                        "https://www.flaticon.com/free-icons/avatar"
                      }
                      alt="profile"
                    />
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {displayName}
                    </span>
                    <span className="truncate text-xs">
                      {email || "user@gmail.com"}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Bell />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings2 />
                  <span onClick={()=>navigate('/onboarding/user')}>Profile Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLogoutDialog(true)}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={logoutDialog} onOpenChange={setLogoutDialog}>
        <DialogContent className="w-full max-w-sm overflow-hidden rounded-2xl p-0 font-montserrat">
          {/* Branded banner */}
          <div className="relative overflow-hidden bg-brand-gradient px-6 pb-8 pt-7 text-center text-brand-foreground">
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
            <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <LogOut className="h-7 w-7" />
            </div>
          </div>

          <div className="px-6 pb-6 -mt-4">
            <div className="rounded-2xl bg-card p-5 text-center">
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-center font-display text-lg font-bold">
                  Log out
                </DialogTitle>
                <DialogDescription className="text-center text-sm text-muted-foreground">
                  You&apos;ll be signed out of your iSource+ workspace. You can
                  sign back in anytime.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-5 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setLogoutDialog(false)}
                  disabled={loggingOut}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-brand-gradient text-brand-foreground hover:opacity-90"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging
                      out…
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2 h-4 w-4" /> Log out
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
