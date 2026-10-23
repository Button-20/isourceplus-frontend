// "Support": the user's helpdesk tickets (GET my-tickets/) and filing new
// ones. Tickets are matched on the company email, so everyone in the same
// company sees the same list. The FAQ assistant answers common questions
// before a ticket is needed.
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Inbox,
  LifeBuoy,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";

import Pagination from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import TicketStatus from "@/components/support/TicketStatus";
import NewTicketModal from "@/components/support/NewTicketModal";
import FaqChatbot from "@/components/faq/FaqChatbot";
import { cn } from "@/lib/utils";
import {
  TICKET_PRIORITY,
  helpdeskErrorMessage,
  listMyTickets,
} from "@/services/api/helpdesk.service";

const fmt = (v) => {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "—";
};

export default function SupportPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listMyTickets({ page });
      setRows(res.items);
      setPagination({
        count: res.count,
        next: res.next,
        previous: res.previous,
      });
    } catch (err) {
      setRows([]);
      setError(helpdeskErrorMessage(err, "Couldn't load your tickets."));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="w-full space-y-6 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <LifeBuoy className="h-3.5 w-3.5" /> Support
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
              Help &amp; support
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/85">
              File a ticket and track it here. Replies go to your company email.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={load}
              disabled={loading}
              className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <RefreshCw
                className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")}
              />
              Refresh
            </Button>
            <Button
              onClick={() => setNewOpen(true)}
              className="bg-white text-brand hover:bg-white/90"
            >
              <Plus className="mr-1.5 h-4 w-4" /> New ticket
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-brand" /> Loading
            tickets…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <p className="mt-3 font-medium">Couldn&apos;t load tickets</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {error}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={load}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Try again
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 font-medium">No tickets yet</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Something not working? File a ticket and our team will follow up.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setNewOpen(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" /> New ticket
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Ticket</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Priority</th>
                  <th className="px-5 py-3 font-medium">Last updated</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((t) => (
                  <tr
                    key={t.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="whitespace-nowrap px-5 py-3 font-medium">
                      #{t.id}
                    </td>
                    <td className="max-w-md px-5 py-3">
                      <span className="line-clamp-1">{t.title}</span>
                    </td>
                    <td className="px-5 py-3">
                      <TicketStatus status={t.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                      {TICKET_PRIORITY[t.priority] || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                      {fmt(t.modified || t.created)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <Link
                        to={`/dashboard/support/${t.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                      >
                        View <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!error &&
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

      <NewTicketModal
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={() => {
          setPage(1);
          load();
        }}
      />

      <FaqChatbot onShowInFaq={(hit) => navigate(`/faq#${hit.sectionId}`)} />
    </div>
  );
}
