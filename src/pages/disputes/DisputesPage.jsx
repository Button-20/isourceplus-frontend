// "Escrow disputes": the disputes this company raised, one status per tab
// (GET escrow-disputes/raised-disputes/?status=…, status required). Disputes
// are raised from a purchase order's escrow panel.
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, Gavel, Inbox, Loader2, RefreshCw } from "lucide-react";

import Pagination from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DISPUTE_STATUSES,
  RESOLUTION_LABELS,
  disputeErrorMessage,
  disputeStatusLabel,
  listRaisedDisputes,
  reasonLabel,
} from "@/services/api/escrow-dispute.service";

const STATUS_TINT = {
  OPEN: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  UNDER_REVIEW: "bg-brand/10 text-brand",
  SPLIT: "bg-muted text-foreground",
};

const fmt = (v) => {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "—";
};

const money = (v) => {
  if (v == null || v === "") return "—";
  const n = Number(v);
  return Number.isNaN(n)
    ? String(v)
    : n.toLocaleString("en-GH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
};

export default function DisputesPage() {
  const [params, setParams] = useSearchParams();
  const status = DISPUTE_STATUSES.some((s) => s.value === params.get("status"))
    ? params.get("status")
    : "OPEN";
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listRaisedDisputes({ status, page });
      setRows(res.items);
      setPagination({
        count: res.count,
        next: res.next,
        previous: res.previous,
      });
    } catch (err) {
      setRows([]);
      setError(disputeErrorMessage(err, "Couldn't load your disputes."));
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const selectStatus = (value) => {
    setPage(1);
    setParams(value === "OPEN" ? {} : { status: value }, { replace: true });
  };

  return (
    <div className="w-full space-y-6 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <Gavel className="h-3.5 w-3.5" /> Escrow
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
              Escrow disputes
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/85">
              Disputes your company raised. The escrow stays frozen until each
              one is resolved. Raise a new one from the purchase order&apos;s
              escrow panel.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={load}
            disabled={loading}
            className="self-start border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white sm:self-auto"
          >
            <RefreshCw
              className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div
          role="tablist"
          className="flex gap-1 overflow-x-auto border-b border-border/70 px-3 pt-3"
        >
          {DISPUTE_STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              role="tab"
              aria-selected={status === s.value}
              onClick={() => selectStatus(s.value)}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors",
                status === s.value
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-brand" /> Loading
            disputes…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <p className="mt-3 font-medium">Couldn&apos;t load disputes</p>
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
            <p className="mt-3 font-medium">
              No {disputeStatusLabel(status).toLowerCase()} disputes
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              If something goes wrong with an order, raise a dispute from its
              escrow panel to freeze the funds.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Dispute</th>
                  <th className="px-5 py-3 font-medium">Escrow</th>
                  <th className="px-5 py-3 font-medium">Reason</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Outcome</th>
                  <th className="px-5 py-3 font-medium">Raised</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((d) => (
                  <tr
                    key={d.dispute_id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="whitespace-nowrap px-5 py-3 font-medium">
                      {d.dispute_id}
                      {d.raised_by && (
                        <span className="block text-xs font-normal text-muted-foreground">
                          by {d.raised_by}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                      {d.escrow || "—"}
                    </td>
                    <td className="px-5 py-3">{reasonLabel(d.reason)}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums">
                      {money(d.amount_in_dispute)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
                          STATUS_TINT[d.status] ||
                            "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                        )}
                      >
                        {disputeStatusLabel(d.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {RESOLUTION_LABELS[d.resolution_action] ||
                        d.resolution_action ||
                        "—"}
                      {d.resolved_at && (
                        <span className="block text-xs">
                          {fmt(d.resolved_at)}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                      {fmt(d.created_at)}
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
