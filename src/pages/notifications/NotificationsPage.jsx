// "Notifications": the inbox (GET notifications/all/), the archive
// (notifications/archived/) and notification settings. New notifications
// arrive over the socket (or polling) via NotificationsProvider; the inbox
// reloads when they do.
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  Bell,
  CheckCheck,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  RefreshCw,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

import Pagination from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import NotificationItem from "@/components/notifications/NotificationItem";
import NotificationSettings from "@/components/notifications/NotificationSettings";
import { cn } from "@/lib/utils";
import {
  archiveAllNotifications,
  listArchivedNotifications,
  listNotifications,
  notificationErrorMessage,
  notificationLink,
  unarchiveNotification,
} from "@/services/api/notifications.service";
import { useNotifications } from "@/services/context/notifications.context";

const TABS = [
  ["inbox", Inbox, "Inbox"],
  ["archived", Archive, "Archived"],
  ["settings", Settings, "Settings"],
];

function RowAction({ icon: Icon, label, onClick, busy }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={busy}
      aria-label={label}
      title={label}
      className="h-8 w-8 text-muted-foreground hover:text-foreground"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
    </Button>
  );
}

export default function NotificationsPage() {
  const ctx = useNotifications();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some(([k]) => k === params.get("tab"))
    ? params.get("tab")
    : "inbox";
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });
  const [emptyMessage, setEmptyMessage] = useState("");
  // The server is still on the plain notifications/ list (no archive or
  // mark-as-unread routes yet) — see notifications.service.
  const [legacy, setLegacy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const revision = ctx?.revision ?? 0;
  const unread = ctx?.unread ?? 0;

  const load = useCallback(async () => {
    if (tab === "settings") return;
    setLoading(true);
    setError("");
    try {
      const res = await (tab === "archived"
        ? listArchivedNotifications({ page })
        : listNotifications({ page }));
      setRows(res.items);
      setEmptyMessage(res.emptyMessage);
      setLegacy(Boolean(res.legacy));
      setPagination({
        count: res.count,
        next: res.next,
        previous: res.previous,
      });
    } catch (err) {
      setRows([]);
      setError(
        notificationErrorMessage(err, "Couldn't load your notifications."),
      );
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    load();
  }, [load]);

  // New notifications (socket / poll) refresh the inbox in place.
  useEffect(() => {
    if (revision && tab === "inbox") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision]);

  const switchTab = (key) => {
    setPage(1);
    setParams(key === "inbox" ? {} : { tab: key }, { replace: true });
  };

  const patchRow = (id, fields) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...fields } : r)));
  const dropRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setPagination((p) => ({ ...p, count: Math.max(0, p.count - 1) }));
  };

  const run = async (id, fn, fallback) => {
    setBusyId(id);
    try {
      const detail = await fn();
      if (detail) toast.success(detail);
      return true;
    } catch (err) {
      toast.error(notificationErrorMessage(err, fallback));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const open = (n) => {
    if (!n.read) {
      patchRow(n.id, { read: true });
      ctx?.markRead(n.id);
    }
    const link = notificationLink(n);
    if (link) navigate(link);
  };

  const toggleRead = async (n) => {
    if (n.read) {
      if (
        await run(n.id, () => ctx.markUnread(n.id), "Couldn't mark as unread.")
      )
        patchRow(n.id, { read: false });
    } else {
      patchRow(n.id, { read: true });
      ctx?.markRead(n.id);
    }
  };

  const archive = async (n) => {
    if (await run(n.id, () => ctx.archive(n.id), "Couldn't archive it."))
      dropRow(n.id);
  };

  const restore = async (n) => {
    if (
      await run(n.id, () => unarchiveNotification(n.id), "Couldn't restore it.")
    ) {
      dropRow(n.id);
      ctx?.refresh();
    }
  };

  const markAll = async () => {
    setBulkBusy(true);
    try {
      await ctx?.markAllRead(rows.map((r) => r.id));
      setRows((prev) => prev.map((r) => ({ ...r, read: true })));
    } finally {
      setBulkBusy(false);
    }
  };

  const archiveAll = async () => {
    setBulkBusy(true);
    try {
      const detail = await archiveAllNotifications();
      toast.success(detail || "Notifications archived.");
      setConfirmOpen(false);
      setPage(1);
      await load();
      ctx?.refresh();
    } catch (err) {
      toast.error(notificationErrorMessage(err, "Couldn't archive them."));
    } finally {
      setBulkBusy(false);
    }
  };

  const onBrand =
    "border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white";

  return (
    <div className="w-full space-y-6 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <Bell className="h-3.5 w-3.5" /> Notifications
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
              Notifications
            </h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-white/85">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  ctx?.mode === "live" ? "bg-emerald-300" : "bg-white/50",
                )}
              />
              {ctx?.mode === "live"
                ? "Live — new notifications appear instantly."
                : "Checking for new notifications every minute."}
              {unread > 0 && ` ${unread} unread.`}
            </p>
          </div>
          {tab !== "settings" && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={load}
                disabled={loading}
                className={onBrand}
              >
                <RefreshCw
                  className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")}
                />
                Refresh
              </Button>
              {tab === "inbox" && (
                <>
                  <Button
                    variant="outline"
                    onClick={markAll}
                    disabled={bulkBusy || !unread}
                    className={onBrand}
                  >
                    <CheckCheck className="mr-1.5 h-4 w-4" /> Mark all read
                  </Button>
                  {!legacy && (
                    <Button
                      onClick={() => setConfirmOpen(true)}
                      disabled={bulkBusy || rows.length === 0}
                      className="bg-white text-brand hover:bg-white/90"
                    >
                      <Archive className="mr-1.5 h-4 w-4" /> Archive all
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div
          role="tablist"
          className="flex gap-1 overflow-x-auto border-b border-border/70 px-3 pt-3"
        >
          {TABS.map(([key, Icon, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => switchTab(key)}
              className={cn(
                "-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors",
                tab === key
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" /> {label}
              {key === "inbox" && unread > 0 && (
                <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "settings" ? (
          <NotificationSettings />
        ) : loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-brand" /> Loading
            notifications…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <p className="mt-3 font-medium">Couldn&apos;t load notifications</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {error}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={load}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Try again
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            {tab === "archived" ? (
              <Archive className="h-8 w-8 text-muted-foreground/60" />
            ) : (
              <Inbox className="h-8 w-8 text-muted-foreground/60" />
            )}
            <p className="mt-3 font-medium">
              {tab === "archived" ? "Nothing archived" : "You're all caught up"}
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {emptyMessage ||
                (tab !== "archived"
                  ? "New notifications about your documents will show up here."
                  : legacy
                    ? "Archiving isn't available on the server yet."
                    : "Notifications you archive will be kept here.")}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {rows.map((n) => (
              <li key={n.id}>
                <NotificationItem
                  notification={n}
                  onOpen={() => open(n)}
                  actions={
                    tab === "archived" ? (
                      <RowAction
                        icon={ArchiveRestore}
                        label="Move back to inbox"
                        busy={busyId === n.id}
                        onClick={() => restore(n)}
                      />
                    ) : legacy ? (
                      !n.read && (
                        <RowAction
                          icon={MailOpen}
                          label="Mark as read"
                          onClick={() => toggleRead(n)}
                        />
                      )
                    ) : (
                      <>
                        <RowAction
                          icon={n.read ? Mail : MailOpen}
                          label={n.read ? "Mark as unread" : "Mark as read"}
                          busy={busyId === n.id}
                          onClick={() => toggleRead(n)}
                        />
                        <RowAction
                          icon={Archive}
                          label="Archive"
                          busy={busyId === n.id}
                          onClick={() => archive(n)}
                        />
                      </>
                    )
                  }
                />
              </li>
            ))}
          </ul>
        )}

        {tab !== "settings" &&
          !error &&
          rows.length > 0 &&
          (pagination.next || pagination.previous) && (
            <Pagination
              count={pagination.count}
              page={page}
              setPage={setPage}
              next={pagination.next}
              previous={pagination.previous}
            />
          )}
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={(o) => !bulkBusy && setConfirmOpen(o)}
      >
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Archive all notifications?</DialogTitle>
            <DialogDescription>
              Every notification in your inbox moves to Archived, not just the
              ones on this page. You can move any of them back later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={bulkBusy}
            >
              Cancel
            </Button>
            <Button onClick={archiveAll} disabled={bulkBusy}>
              {bulkBusy ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Archive className="mr-1.5 h-4 w-4" />
              )}
              Archive all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
