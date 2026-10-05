// Supplier "Business Invitations": RFxs / tenders / waybills the supplier was
// invited to — GET business-invites/?biz_type=<rfx|tender|waybill>, one tab
// each (?biz_type= in the URL). Rows link to the event, where the sales
// manager's "Send offer" action already lives.
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  Gavel,
  Inbox,
  Info,
  Loader2,
  MailOpen,
  RefreshCw,
  Truck,
} from "lucide-react";

import Pagination from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { prettify } from "@/utils/choices";
import { normalizeStatus } from "@/utils/status";
import {
  INVITE_TYPES,
  isMissingRoute,
  listBusinessInvites,
} from "@/services/api/invites.service";

const TAB_ORDER = ["rfx", "tender", "waybill"];
const TAB_ICONS = { rfx: FileText, tender: Gavel, waybill: Truck };

const STATUS_TINT = [
  [
    /^(draft|pending|awaiting|new|invited)/,
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  ],
  [
    /^(published|active|open|approved|accepted|awarded|responded)/,
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  ],
  [
    /^(cancel|reject|declin|fail|expired)/,
    "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  ],
];
const NEUTRAL_TINT =
  "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300";

function StatusPill({ status }) {
  const s = normalizeStatus(status);
  if (!s) return <span className="text-muted-foreground">—</span>;
  const tint = STATUS_TINT.find(([re]) => re.test(s))?.[1] || NEUTRAL_TINT;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tint,
      )}
    >
      {prettify(s)}
    </span>
  );
}

const fmtDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? String(v)
    : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

export default function BusinessInvitesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("biz_type");
  const bizType = TAB_ORDER.includes(requested) ? requested : "rfx";
  const cfg = INVITE_TYPES[bizType];

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });
  const [emptyMessage, setEmptyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // null | "missing" | { status, message }

  useEffect(() => {
    setPage(1);
  }, [bizType]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listBusinessInvites(bizType, { page });
      setRows(res.items);
      setPagination({
        count: res.count,
        next: res.next,
        previous: res.previous,
      });
      setEmptyMessage(res.emptyMessage);
    } catch (err) {
      setRows([]);
      if (isMissingRoute(err)) {
        setError("missing");
      } else {
        const status = err.response?.status;
        const body = err.response?.data;
        const detail =
          body && typeof body === "object" ? body.detail || body.message : null;
        setError({
          status,
          message:
            detail ||
            (status >= 500
              ? "The invitations service ran into a problem. Please try again shortly."
              : "Couldn't load your invitations."),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [bizType, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="w-full space-y-6 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <MailOpen className="h-3.5 w-3.5" /> Business invitations
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
              Received invitations
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/85">
              RFxs, tenders and waybills buyers have invited you to. Open one to
              respond with your offer.
            </p>
          </div>
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
        </div>
      </div>

      {/* Type tabs */}
      <div
        role="tablist"
        aria-label="Invitation type"
        className="flex flex-wrap gap-2"
      >
        {TAB_ORDER.map((key) => {
          const active = key === bizType;
          const Icon = TAB_ICONS[key];
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() =>
                setSearchParams({ biz_type: key }, { replace: true })
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand text-brand-foreground shadow-sm"
                  : "border border-border/70 bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {INVITE_TYPES[key].label}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-brand" /> Loading{" "}
            {cfg.plural}…
          </div>
        ) : error === "missing" ? (
          <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Info className="h-5 w-5" />
            </span>
            <p className="mt-3 font-medium">
              Invitations aren&apos;t available yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              This list will fill in as soon as the service is enabled.
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <p className="mt-3 font-medium">Couldn&apos;t load {cfg.plural}</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {error.message}
              {error.status ? ` (error ${error.status})` : ""}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={load}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Try again
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 font-medium">No {cfg.plural} yet</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {emptyMessage ||
                "When a buyer invites you, the invitation appears here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Buyer</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Submission due</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((r) => (
                  <tr
                    key={r.key ?? r.ref}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="whitespace-nowrap px-5 py-3 font-medium">
                      {r.ref || "—"}
                    </td>
                    <td className="px-5 py-3">{r.title}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {r.company}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                      {fmtDate(r.deadline)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      {r.ref && (
                        <Link
                          to={cfg.detailUrl(r.ref)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                        >
                          View &amp; respond{" "}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
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
    </div>
  );
}
