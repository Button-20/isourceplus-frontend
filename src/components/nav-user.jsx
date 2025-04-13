import { Bell, ChevronsUpDown, LogOut, Settings2 } from "lucide-react";
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

export function NavUser({ user }) {
  const { isMobile } = useSidebar();
  const { logout } = useAuth()
  const [logoutDialog, setLogoutDialog] = useState(false);

  const handleLogout =async () => {
	await logout()
	setLogoutDialog(false);
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
                  <AvatarImage src={user?.profileImage || "https://www.flaticon.com/free-icons/avatar"} alt="profile" />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user?.fullname || "User Name"}
                  </span>
                  <span className="truncate text-xs">{user || "user@gmail.com"}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.profileImage || "https://www.flaticon.com/free-icons/avatar"} alt="profile" />
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.fullname || "User Name"}
                    </span>
                    <span className="truncate text-xs">{user || "user@gmail.com"}</span>
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
                  Profile Settings
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
        <DialogContent className="w-full max-w-[320px] rounded-2xl p-0">
          <div className="p-6">
            <div
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-50"
              style={{ borderRadius: "55% 45% 48% 52% / 58% 43% 57% 42% " }}
            >
              <LogOut className="h-6 w-6 text-red-500" />
            </div>
            <DialogHeader className="space-y-2 text-center">
              <DialogTitle className="text-xl font-semibold text-center">
                Logout
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground text-center">
                Are you sure you want to logout?
              </DialogDescription>
            </DialogHeader>

            <div className="flex w-full gap-3 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                size="lg"
                onClick={() => setLogoutDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600"
                size="lg"
                onClick={handleLogout}
              >
                Yes, logout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
