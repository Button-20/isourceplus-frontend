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
import { Link } from "react-router";

export function NavMain({ items }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items?.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.title}>
                {/* parent toggle: link or “#” */}
                <a href={item.url ?? "#"}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
              {item.submenu && (
               <>
                 {/* arrow trigger */}
                 <CollapsibleTrigger asChild>
                   <SidebarMenuAction className="data-[state=open]:rotate-90">
                     <ChevronRight />
                     <span className="sr-only">Toggle</span>
                   </SidebarMenuAction>
                 </CollapsibleTrigger>

                 {/* submenu links */}
                 <CollapsibleContent>
                   <SidebarMenuSub>
                     {item.submenu.map(sub => (
                       <SidebarMenuSubItem key={sub.title}>
                         <SidebarMenuSubButton asChild>
                           <Link to={sub.url} className="pl-8">
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
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
