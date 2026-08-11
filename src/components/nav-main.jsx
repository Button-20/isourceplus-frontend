import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
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
          const isSubmenuActive =
            item.submenu && item.submenu.some((sub) => sub.url === pathname);

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isSubmenuActive || isTopLevelActive}
            >
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isTopLevelActive}
                  className={cn(
                    "transition-colors duration-200",
                    isTopLevelActive &&
                      "border-l-2 border-brand font-semibold",
                  )}
                >
                  {item.url ? (
                    <Link
                      to={item.url}
                      aria-current={isTopLevelActive ? "page" : undefined}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  ) : (
                    <a href="#" aria-current={isTopLevelActive ? "page" : undefined}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  )}
                </SidebarMenuButton>
                {item.submenu && (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRight />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
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
                                {sub.title}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                )}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
