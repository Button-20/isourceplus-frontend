import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function NavMain({ items, pathname }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items?.map((item) => {
          const isTopLevelActive =
            item.url === pathname ||
            (item.submenu &&
              item.submenu.some((sub) => pathname.startsWith(sub.url)));

          const activeClasses = cn(
            "transition-colors duration-200",
            isTopLevelActive && "border-l-2 border-brand font-semibold",
          );

          // Leaf item — a plain navigation link.
          if (!item.submenu) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isTopLevelActive}
                  className={activeClasses}
                >
                  <Link
                    to={item.url || "#"}
                    aria-current={isTopLevelActive ? "page" : undefined}
                  >
                    <item.icon />
                    <span className="truncate">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          // Parent item — the whole row toggles its sub-nav.
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isTopLevelActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isTopLevelActive}
                    className={activeClasses}
                  >
                    <item.icon />
                    <span className="truncate">{item.title}</span>
                    <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                  <SidebarMenuSub>
                    {item.submenu.map((sub) => (
                      <SidebarMenuSubItem key={sub.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={sub.url === pathname}
                        >
                          <Link
                            to={sub.url}
                            aria-current={
                              sub.url === pathname ? "page" : undefined
                            }
                          >
                            <span className="truncate">{sub.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
