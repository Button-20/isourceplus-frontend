// Header bell: unread badge + the most recent notifications. Clicking one
// marks it read and opens its document (or the Notifications page).
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import NotificationItem from "@/components/notifications/NotificationItem";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/services/context/notifications.context";
import { notificationLink } from "@/services/api/notifications.service";

const PREVIEW = 6;

export default function NotificationBell({ className }) {
  const ctx = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  if (!ctx) return null;
  const { items, unread, loaded, unavailable, mode, markRead, markAllRead } =
    ctx;

  const openItem = (n) => {
    if (!n.read) markRead(n.id);
    setOpen(false);
    navigate(notificationLink(n) || "/dashboard/notifications");
  };

  const handleMarkAll = async () => {
    setMarking(true);
    try {
      await markAllRead();
    } finally {
      setMarking(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={
            unread ? `Notifications, ${unread} unread` : "Notifications"
          }
          title="Notifications"
          className={cn("relative", className)}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-header">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden p-0 font-montserrat"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  mode === "live" ? "bg-emerald-500" : "bg-muted-foreground/50",
                )}
              />
              {mode === "live" ? "Live" : "Updates every minute"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleMarkAll}
            disabled={!unread || marking}
            className="h-8 text-xs"
          >
            {marking ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
            )}
            Mark all read
          </Button>
        </div>

        <div
          data-lenis-prevent=""
          className="max-h-[min(26rem,60vh)] overflow-y-auto overscroll-contain"
        >
          {!loaded ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-brand" /> Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <Bell className="h-7 w-7 text-muted-foreground/50" />
              <p className="mt-2 text-sm font-medium">
                {unavailable
                  ? "Notifications are coming soon"
                  : "You're all caught up"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {unavailable
                  ? "They aren't available on the server yet."
                  : "New notifications will show up here."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.slice(0, PREVIEW).map((n) => (
                <li key={n.id}>
                  <NotificationItem
                    notification={n}
                    compact
                    onOpen={() => openItem(n)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          to="/dashboard/notifications"
          onClick={() => setOpen(false)}
          className="block border-t border-border/70 px-4 py-2.5 text-center text-sm font-medium text-brand hover:bg-muted/40"
        >
          View all notifications
        </Link>
      </PopoverContent>
    </Popover>
  );
}
