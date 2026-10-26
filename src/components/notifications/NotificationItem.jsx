// One notification row, shared by the header bell (compact) and the
// Notifications page (with per-row actions).
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  FileText,
  Info,
} from "lucide-react";

import { cn } from "@/lib/utils";

const TYPE_ICON = [
  [
    /error|fail|reject|cancel/i,
    AlertTriangle,
    "text-destructive bg-destructive/10",
  ],
  [/warn|expir|due/i, AlertTriangle, "text-amber-600 bg-amber-500/10"],
  [
    /success|approv|accept|paid|complete/i,
    CheckCircle2,
    "text-emerald-600 bg-emerald-500/10",
  ],
  [/info|system/i, Info, "text-brand bg-brand/10"],
];

const iconFor = (n) => {
  const hit = TYPE_ICON.find(([re]) => re.test(`${n.type} ${n.title}`));
  if (hit) return [hit[1], hit[2]];
  return n.docRef
    ? [FileText, "text-brand bg-brand/10"]
    : [Bell, "text-brand bg-brand/10"];
};

function timeAgo(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "Just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export default function NotificationItem({
  notification: n,
  compact = false,
  onOpen,
  actions,
}) {
  const [Icon, tint] = iconFor(n);
  return (
    <div
      className={cn(
        "group relative flex gap-3 transition-colors hover:bg-muted/40",
        compact ? "px-4 py-3" : "px-5 py-4",
        !n.read && "bg-brand/[0.04]",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex shrink-0 items-center justify-center rounded-lg",
          compact ? "h-8 w-8" : "h-9 w-9",
          tint,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 text-left outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring"
      >
        <span className="flex items-start gap-2">
          <span
            className={cn(
              "min-w-0 flex-1 text-sm",
              compact && "line-clamp-1",
              n.read ? "font-medium" : "font-semibold",
            )}
          >
            {n.title || "Notification"}
          </span>
          {!n.read && (
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand"
              aria-label="Unread"
            />
          )}
        </span>
        {n.message && (
          <span
            className={cn(
              "mt-0.5 block text-sm text-muted-foreground",
              compact ? "line-clamp-2 text-xs" : "line-clamp-3",
            )}
          >
            {n.message}
          </span>
        )}
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {timeAgo(n.createdAt)}
          {n.docRef && (
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground/80">
              {n.docRef}
            </span>
          )}
        </span>
      </button>
      {actions && (
        <div className="relative z-10 flex shrink-0 items-start gap-1">
          {actions}
        </div>
      )}
    </div>
  );
}
