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

// One sidebar row — a leaf link or a collapsible parent with a sub-nav.
function NavItem({ item, pathname }) {
  const isTopLevelActive =
    item.url === pathname ||
    (item.submenu && item.submenu.some((sub) => pathname.startsWith(sub.url)));

  // Active state is the filled light-blue pill from SidebarMenuButton's
  // data-[active=true] styles (bg-sidebar-accent + brand text) — matches the
  // mockup. Just add a semibold weight on top.
  const activeClasses = cn(
    "transition-colors duration-200",
    isTopLevelActive && "font-semibold",
  );

  // Leaf item — a plain navigation link.
  if (!item.submenu) {
    return (
      <SidebarMenuItem>
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
            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-sidebar-foreground/70 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <SidebarMenuSub>
            {item.submenu.map((sub) => (
              <SidebarMenuSubItem key={sub.title}>
                <SidebarMenuSubButton asChild isActive={sub.url === pathname}>
                  <Link
                    to={sub.url}
                    aria-current={sub.url === pathname ? "page" : undefined}
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
}

// Sidebar navigation, grouped into labeled sections. `sections` is
// [{ label, items }]; each item is a leaf ({title,url,icon}) or a parent
// ({title,icon,submenu:[{title,url}]}).
export function NavMain({ sections = [], pathname }) {
  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.label}>
          <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
          <SidebarMenu>
            {section.items.map((item) => (
              <NavItem key={item.title} item={item} pathname={pathname} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
