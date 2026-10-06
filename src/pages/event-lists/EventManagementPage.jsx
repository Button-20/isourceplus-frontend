// One list page per event kind (RFx / tender / waybill) with filter tabs —
// All · Draft · Published · Expired — instead of separate sidebar pages.
// The active tab lives in ?filter=<key>; ?new=1 opens the create wizard.
// Status shows the payload's own `status`.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  FilePlus,
  FileText,
  ReceiptText,
  Wallet,
  Gavel,
  Inbox,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Truck,
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
import ArchiveAllButton from "@/components/archive/ArchiveAllButton";
import RFxCreateModal from "@/components/rfx/RFxCreateModal";
import TenderCreateModal from "@/components/tenders/TenderCreateModal";
import WaybillCreateModal from "@/components/waybills/WaybillCreateModal";
import { useAuth } from "@/services/context/app.context";
import { cn } from "@/lib/utils";
import { prettify } from "@/utils/choices";
import { normalizeStatus } from "@/utils/status";
import { formatMoney } from "@/utils/money";
import {
  EVENT_KINDS,
  FILTER_LABELS,
  deleteEvent,
  fetchEventList,
  isEventOwner,
  isMissingRoute,
} from "@/services/api/event-lists.service";

const ICONS = {
  rfx: FileText,
  tender: Gavel,
  waybill: Truck,
  purchaseOrder: FilePlus,
  proforma: ReceiptText,
  salesInvoice: Wallet,
  paymentOrder: Wallet,
};
const CREATE_MODALS = {
  rfx: RFxCreateModal,
  tender: TenderCreateModal,
  waybill: WaybillCreateModal,
};

// Header copy per kind, for owners (buyer side) vs everyone else.
const COPY = {
  rfx: {
    owner: {
      pill: "RFx management",
      title: "Requests for quotation",
      blurb: "Track your RFQs, RFPs and RFIs and compare supplier responses.",
    },
    other: {
      pill: "RFx",
      title: "RFx invitations",
      blurb:
        "Browse RFQs, RFPs and RFIs from buyers and respond competitively with your proforma invoice.",
    },
  },
  tender: {
    owner: {
      pill: "Tender management",
      title: "Tenders",
      blurb: "Publish tenders to the market and review supplier submissions.",
    },
    other: {
      pill: "Tender",
      title: "Tender invitations",
      blurb:
        "Browse tenders published to the market and submit your competitive bid.",
    },
  },
  waybill: {
    owner: {
      pill: "Waybills",
      title: "Waybills",
      blurb: "Create waybills and invite cargo transporters to bid.",
    },
    other: {
      pill: "Waybills",
      title: "Waybill invitations",
      blurb: "Waybills open for delivery offers from cargo transporters.",
    },
  },
  purchaseOrder: {
    owner: {
      pill: "Purchase orders",
      title: "Purchase orders",
      blurb: "Purchase orders you've issued to suppliers from awarded offers.",
    },
    other: {
      pill: "Purchase orders",
      title: "Purchase orders",
      blurb: "Purchase orders awarded to your organization.",
    },
  },
  proforma: {
    owner: {
      pill: "Proforma invoices",
      title: "Proforma invoices",
      blurb:
        "Proforma invoices — your quotations served on buyers' RFxs, tenders and waybills.",
    },
    other: {
      pill: "Proforma invoices",
      title: "Proforma invoices",
      blurb: "Proforma invoices you've received.",
    },
  },
  salesInvoice: {
    owner: {
      pill: "Sales invoices",
      title: "Sales invoices",
      blurb:
        "Sales invoices raised against the purchase orders you've received.",
    },
    other: {
      pill: "Sales invoices",
      title: "Sales invoices",
      blurb: "Sales invoices you've received.",
    },
  },
  paymentOrder: {
    owner: {
      pill: "Payment orders",
      title: "Payment orders",
      blurb: "Payment orders you've served on buyers from your sales invoices.",
    },
    other: {
      pill: "Payment orders",
      title: "Payment orders",
      blurb: "Payment orders served on your organization.",
    },
  },
};

// Kind-specific extra columns.
const EXTRA_COLUMNS = {
  rfx: [
    {
      label: "Reach",
      value: (r) =>
        r.reach
          ? [r.reach.region, r.reach.district]
              .filter(Boolean)
              .map(prettify)
              .join(", ") || "—"
          : "—",
    },
  ],
  tender: [
    {
      label: "Supplier market",
      value: (r) => (r.spend_category ? prettify(r.spend_category) : "—"),
    },
  ],
  waybill: [
    {
      label: "Route",
      value: (r) =>
        r.origin || r.destination
          ? `${r.origin || "—"} → ${r.destination || "—"}`
          : "—",
    },
  ],
  purchaseOrder: [
    {
      label: "Spend category",
      value: (r) => (r.spend_category ? prettify(r.spend_category) : "—"),
    },
    {
      label: "Total",
      align: "right",
      value: (r) => formatMoney(r.total_cost, r.currency || "GHS"),
    },
  ],
  proforma: [
    {
      label: "Total",
      align: "right",
      value: (r) => formatMoney(r.total_cost, r.currency || "GHS"),
    },
  ],
  salesInvoice: [
    {
      label: "Spend category",
      value: (r) => (r.spend_category ? prettify(r.spend_category) : "—"),
    },
    {
      label: "Total",
      align: "right",
      value: (r) =>
        formatMoney(r.total_sales_value ?? r.total_cost, r.currency || "GHS"),
    },
  ],
  paymentOrder: [
    {
      label: "Spend category",
      value: (r) => (r.spend_category ? prettify(r.spend_category) : "—"),
    },
    {
      label: "Total",
      align: "right",
      value: (r) => formatMoney(r.total_cost, r.currency || "GHS"),
    },
  ],
};

// Payload status → pill tint.
const STATUS_TINT = [
  [
    /^(draft|pending|awaiting)/,
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  ],
  [
    /^(published|active|open|approved|accepted|awarded|in.?transit|dispatched)/,
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  ],
  [
    /^(cancel|reject|declin|fail)/,
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

// `kindTabs` (optional): { label, active, tabs: [{ key, label, icon }], onSelect }
// renders a type switcher above the filter tabs (e.g. the Invoices page).
export default function EventManagementPage({ kind, kindTabs }) {
  const cfg = EVENT_KINDS[kind];
  const KindIcon = ICONS[kind];
  const CreateModal = CREATE_MODALS[kind];
  const extras = EXTRA_COLUMNS[kind];
  const { jobTitle, viewMode } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isSupplierView = viewMode === "supplier";
  const isOwner = isEventOwner(kind, jobTitle);
  // Buyer-owned kinds (RFx, tender, PO) are managed from the buyer view only;
  // seller-owned ones (proforma, sales invoice, waybill) in any view.
  const canManage = isOwner && (cfg.ownerSide === "any" || !isSupplierView);
  const copy = COPY[kind][canManage ? "owner" : "other"];
  const filters = useMemo(
    () => cfg.filtersFor({ isOwner, isSupplierView }),
    [cfg, isOwner, isSupplierView],
  );
  const requested = searchParams.get("filter");
  const filter = filters.includes(requested) ? requested : filters[0];

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
  const [createOpen, setCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const setFilter = (key) => {
    const next = new URLSearchParams(searchParams);
    if (key === filters[0]) next.delete("filter");
    else next.set("filter", key);
    setSearchParams(next, { replace: true });
  };

  // Reset to page 1 whenever the tab changes.
  useEffect(() => {
    setPage(1);
  }, [filter]);

  // ?new=1 (quick actions / old links) opens the create wizard for owners.
  useEffect(() => {
    if (searchParams.get("new") && canManage) {
      setCreateOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("new");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, canManage]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchEventList(kind, filter, { page });
      setRows(res.items);
      setPagination({
        count: res.count,
        next: res.next,
        previous: res.previous,
      });
      setEmptyMessage(res.emptyMessage);
    } catch (err) {
      setRows([]);
      setPagination({ count: 0, next: null, previous: null });
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
              ? "The service ran into a problem. Please try again shortly."
              : `Couldn't load ${cfg.plural}.`),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [kind, filter, page, cfg.plural]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteEvent(kind, toDelete.ref_num);
      toast.success(
        `${cfg.singular[0].toUpperCase()}${cfg.singular.slice(1)} deleted.`,
      );
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(
        err.response?.data?.detail || `Failed to delete ${cfg.singular}.`,
      );
    } finally {
      setDeleting(false);
    }
  };

  if (cfg.viewRoles && !cfg.viewRoles.includes(jobTitle)) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center font-montserrat">
        <div className="rounded-2xl border border-border/70 bg-card p-8">
          <p className="font-display text-lg font-semibold">Access denied</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Only lead buyers and sales managers can view {cfg.plural}.
          </p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  const showOffers = canManage && filter !== "all" && Boolean(cfg.offersUrl);
  const showDelete = canManage && filter === "draft" && cfg.canDelete !== false;
  const filterLabel = FILTER_LABELS[filter].toLowerCase();

  return (
    <div className="w-full space-y-6 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <KindIcon className="h-3.5 w-3.5" /> {copy.pill}
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
              {copy.title}
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/85">{copy.blurb}</p>
          </div>
          {canManage && (
            <div className="flex flex-wrap gap-2">
              {filter === "draft" && (
                <ArchiveAllButton
                  kind={kind}
                  tone="onBrand"
                  count={pagination.count}
                  disabled={loading || rows.length === 0}
                  onArchived={() => {
                    setPage(1);
                    load();
                  }}
                />
              )}
              {CreateModal && (
                <Button
                  onClick={() => setCreateOpen(true)}
                  className="bg-white text-brand hover:bg-white/90"
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Create {cfg.singular}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Type switcher (combined pages) */}
      {kindTabs && (
        <div
          role="tablist"
          aria-label={kindTabs.label}
          className="inline-flex flex-wrap gap-1 rounded-xl border border-border/70 bg-card p-1"
        >
          {kindTabs.tabs.map((t) => {
            const active = t.key === kindTabs.active;
            const TabIcon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => kindTabs.onSelect(t.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand text-brand-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {TabIcon && <TabIcon className="h-4 w-4" />}
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Filter tabs */}
      {filters.length > 1 && (
        <div
          role="tablist"
          aria-label={`Filter ${cfg.plural}`}
          className="flex flex-wrap gap-2"
        >
          {filters.map((key) => {
            const active = key === filter;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(key)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand text-brand-foreground shadow-sm"
                    : "border border-border/70 bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {FILTER_LABELS[key]}
              </button>
            );
          })}
        </div>
      )}

      {/* Table card */}
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
              {FILTER_LABELS[filter]} {cfg.plural} aren&apos;t available yet
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
            <p className="mt-3 font-medium">
              No {filter === "all" ? "" : `${filterLabel} `}
              {cfg.plural}
            </p>
            {emptyMessage && (
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {emptyMessage}
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Issuing company</th>
                  {extras.map((c) => (
                    <th
                      key={c.label}
                      className={cn(
                        "px-5 py-3 font-medium",
                        c.align === "right" && "text-right",
                      )}
                    >
                      {c.label}
                    </th>
                  ))}
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">
                    {filter === "expired" ? "Due date" : "Created"}
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((r) => (
                  <tr
                    key={r.id ?? r.ref_num}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="whitespace-nowrap px-5 py-3 font-medium">
                      {r.ref_num}
                    </td>
                    <td className="px-5 py-3">{r.title || "Untitled"}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {r.issuing_company_info || r.issuing_company_name || "—"}
                    </td>
                    {extras.map((c) => (
                      <td
                        key={c.label}
                        className={cn(
                          "px-5 py-3 text-muted-foreground",
                          c.align === "right" &&
                            "whitespace-nowrap text-right tabular-nums text-foreground",
                        )}
                      >
                        {c.value(r)}
                      </td>
                    ))}
                    <td className="px-5 py-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                      {fmtDate(
                        filter === "expired"
                          ? (r.submission_datetime ?? r.delivery_deadline)
                          : r.created_at,
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <span className="inline-flex items-center justify-end gap-4">
                        {showOffers && (
                          <Link
                            to={cfg.offersUrl(r.ref_num)}
                            className="text-sm font-medium text-muted-foreground hover:text-brand hover:underline"
                          >
                            Offers
                          </Link>
                        )}
                        <Link
                          to={cfg.detailUrl(r.ref_num, { filter, jobTitle })}
                          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                        >
                          View <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                        {showDelete && (
                          <button
                            type="button"
                            onClick={() => setToDelete(r)}
                            className="text-muted-foreground transition-colors hover:text-destructive"
                            aria-label={`Delete ${cfg.singular} ${r.ref_num}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </span>
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

      {canManage && CreateModal && (
        <CreateModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={() => {
            setPage(1);
            load();
          }}
        />
      )}

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {cfg.singular}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {toDelete?.title || toDelete?.ref_num}
              </span>
              ? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setToDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
