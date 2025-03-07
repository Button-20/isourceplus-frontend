import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Link } from "react-router-dom";
import { Send, LifeBuoy } from "lucide-react";


const items = [
	{
		title: "Support",
		url: "#",
		icon: LifeBuoy,
	},
	{
		title: "Feedback",
		url: "#",
		icon: Send,
	},
]


export function NavSecondary({ ...props }) {
	return (
		(<SidebarGroup {...props}>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton asChild size="sm">
								<Link to={item.url}>
									<item.icon />
									<span>{item.title}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>)
	);
}
