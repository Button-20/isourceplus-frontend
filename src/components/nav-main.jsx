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

// Modified: Added pathname prop for active link detection
export function NavMain({ items, pathname }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items?.map((item) => {
          // Added: Determine if top-level link is active
          const isTopLevelActive = item.url === pathname || 
            (item.submenu && item.submenu.some(sub => pathname.startsWith(sub.url)));
          // Added: Determine if Collapsible should be open
          const isSubmenuActive = item.submenu && item.submenu.some(sub => sub.url === pathname);

          return (
            <Collapsible 
              key={item.title} 
              asChild 
              defaultOpen={isSubmenuActive || isTopLevelActive}
            >
              <SidebarMenuItem>
                {/* Modified: Added active styles and aria-current for top-level link */}
                <SidebarMenuButton 
                  asChild 
                  tooltip={item.title}
                  className={`transition-colors duration-200 ${
                    isTopLevelActive 
                      ? "bg-gray-100 text-gray-900 font-semibold border-l-4 border-gray-900" 
                      : "hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  }`}
                >
                  <a 
                    href={item.url ?? "#"}
                    aria-current={isTopLevelActive ? "page" : undefined}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
                {item.submenu && (
                  <>
                    {/* No changes to CollapsibleTrigger */}
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRight />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>

                    {/* No changes to CollapsibleContent structure */}
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.submenu.map(sub => (
                          <SidebarMenuSubItem key={sub.title}>
                            {/* Modified: Added active styles and aria-current for submenu link */}
                            <SidebarMenuSubButton 
                              asChild
                              className={`transition-colors duration-200 pl-8 ${
                                sub.url === pathname
                                  ? "bg-gray-200 text-gray-900 font-medium border-l-4 border-gray-900 pl-10"
                                  : "hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                              }`}
                            >
                              <Link 
                                to={sub.url}
                                aria-current={sub.url === pathname ? "page" : undefined}
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