// "Delivery notes": goods delivery notes (what the supplier dispatched) and
// goods received notes (what the buyer received), from the company's side —
// buyer or supplier, per the view toggle. Tabs: ?type=gdn|grn, then status
// (required by both lists — there's no "all"; defaults to the first).
// A buyer inspects a GRN right here (the same panel as the purchase order).
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ChevronDown,
  ClipboardCheck,
  Inbox,
  Loader2,
  PackageCheck,
  RefreshCw,
  Truck,
} from "lucide-react";

import Pagination from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import GrnInspectionPanel from "@/components/grn/GrnInspectionPanel";
import { cn } from "@/lib/utils";
import { prettify } from "@/utils/choices";
import { useAuth } from "@/services/context/app.context";
import { isBuyerView } from "@/services/api/event-lists.service";
import { GDN_STATUSES, listGdns } from "@/services/api/gdn.service";
import {
  GRN_STATUSES,
  grnErrorMessage,
  listGrns,
} from "@/services/api/grn.service";

const TYPES = {
  gdn: {
    label: "Goods delivery notes",
    short: "GDNs",
    icon: Truck,
    statuses: GDN_STATUSES,
    list: listGdns,
  },
  grn: {
    label: "Goods received notes",
    short: "GRNs",
    icon: ClipboardCheck,
    statuses: GRN_STATUSES,
    list: listGrns,
  },
};

const STATUS_TINT = {
  IN_TRANSIT: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  DELIVERED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  CANCELLED: "bg-destructive/10 text-destructive",
  DRAFT: "bg-muted text-muted-foreground",
  INSPECTED: "bg-brand/10 text-brand",
  CONFIRMED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

const fmtDate = (v, withTime = false) => {
  const d = v ? new Date(v) : null;
  if (!d || Number.isNaN(d.getTime())) return "—";
  return withTime
    ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : d.toLocaleDateString(undefined, { dateStyle: "medium" });
};

const qty = (v) => {
  if (v == null || v === "") return "—";
  const n = Number(v);
  return Number.isNaN(n) ? String(v) : n.toLocaleString();
};

function StatusPill({ status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_TINT[status] || "bg-muted text-muted-foreground",
      )}
    >
      {prettify(status || "—")}
    </span>
  );
}

function Fact({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-sm">{children || "—"}</dd>
    </div>
  );
}

function GdnDetails({ gdn }) {
  const waybillRef = gdn.waybill?.ref_num;
  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Fact label="Dispatched">{fmtDate(gdn.date_dispatched, true)}</Fact>
        <Fact label="Expected delivery">
          {fmtDate(gdn.expected_delivery_date)}
        </Fact>
        <Fact label="Waybill">
          {waybillRef ? (
            <Link
              to={`/dashboard/waybills/${encodeURIComponent(waybillRef)}`}
              className="font-medium text-brand hover:underline"
            >
              {waybillRef}
            </Link>
          ) : null}
        </Fact>
        <Fact label="From (warehouse)">{gdn.supplier_warehouse_location}</Fact>
        <Fact label="Deliver to">{gdn.delivery_address}</Fact>
        <Fact label="Buyer phone">{gdn.buyer_phone}</Fact>
        <Fact label="Transporter">{gdn.transporter_name}</Fact>
        <Fact label="Driver phone">{gdn.driver_phone}</Fact>
        <Fact label="Vehicle">{gdn.vehicle_number}</Fact>
        <Fact label="Packages">{gdn.total_packages}</Fact>
        <Fact label="Weight">{gdn.weight}</Fact>
        <Fact label="Dispatched by">{gdn.dispatched_by_name}</Fact>
      </dl>
      {gdn.special_instructions && (
        <p className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
          <span className="font-medium">Special instructions: </span>
          {gdn.special_instructions}
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-border/70">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border/70 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Item</th>
              <th className="px-4 py-2.5 text-right font-medium">Dispatched</th>
              <th className="px-4 py-2.5 font-medium">Batch</th>
              <th className="px-4 py-2.5 font-medium">Expiry</th>
              <th className="px-4 py-2.5 text-right font-medium">Unit price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {(gdn.lines || []).length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  No line items.
                </td>
              </tr>
            ) : (
              gdn.lines.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2.5">
                    {l.item_description || "Item"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">
                    {qty(l.quantity_dispatched)} {l.unit}
                  </td>
                  <td className="px-4 py-2.5">{l.batch_no || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    {fmtDate(l.expiry_date)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">
                    {l.unit_price != null ? qty(l.unit_price) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DeliveryNotesPage() {
  const { jobTitle, viewMode } = useAuth();
  const companyType = isBuyerView(jobTitle, viewMode) ? "buyer" : "supplier";
  const [params, setParams] = useSearchParams();
  const type = params.get("type") === "grn" ? "grn" : "gdn";
  const cfg = TYPES[type];
  const status = cfg.statuses.includes(params.get("status"))
    ? params.get("status")
    : cfg.statuses[0];

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await cfg.list({ companyType, status, page });
      setRows(res.items);
      setPagination({
        count: res.count,
        next: res.next,
        previous: res.previous,
      });
    } catch (err) {
      setRows([]);
      setError(grnErrorMessage(err, `Couldn't load your ${cfg.short}.`));
    } finally {
      setLoading(false);
    }
  }, [cfg, companyType, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const select = (next) => {
    setPage(1);
    setOpenId(null);
    const merged = { type, status, ...next };
    setParams(
      Object.fromEntries(
        Object.entries(merged).filter(
          ([k, v]) => v && !(k === "type" && v === "gdn"),
        ),
      ),
      { replace: true },
    );
  };

  // Buyers inspect GRNs until they're confirmed.
  const canInspect = (grn) =>
    companyType === "buyer" && grn.status !== "CONFIRMED";

  return (
    <div className="w-full space-y-6 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <PackageCheck className="h-3.5 w-3.5" /> Deliveries
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
              Delivery notes
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/85">
              {companyType === "buyer"
                ? "Goods dispatched to you and what you received — inspect each GRN before paying."
                : "Goods you dispatched and what your buyers received."}
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
          {Object.entries(TYPES).map(([key, t]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={type === key}
              onClick={() => select({ type: key, status: "" })}
              className={cn(
                "-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors",
                type === key
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 border-b border-border/60 px-5 py-3">
          {cfg.statuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => select({ status: s })}
              aria-pressed={status === s}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                status === s
                  ? "border-brand bg-brand text-white"
                  : "border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {prettify(s)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-brand" /> Loading{" "}
            {cfg.short}…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <p className="mt-3 font-medium">Couldn&apos;t load {cfg.short}</p>
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
              No {prettify(status).toLowerCase()} {cfg.label.toLowerCase()}
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {type === "gdn"
                ? "Delivery notes appear when a supplier dispatches goods through a transporter."
                : "Received notes appear when the buyer confirms goods have arrived."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {rows.map((row) => {
              const open = openId === row.id;
              const number =
                type === "gdn"
                  ? row.gdn_number || `GDN #${row.id}`
                  : row.grn_number || `GRN #${row.id}`;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : row.id)}
                    aria-expanded={open}
                    className="flex w-full flex-col gap-2 px-5 py-4 text-left transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-medium">
                        {number} <StatusPill status={row.status} />
                        {type === "grn" &&
                          row.discrepancy_type &&
                          row.discrepancy_type !== "NONE" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                              <AlertTriangle className="h-3 w-3" />
                              {prettify(row.discrepancy_type)}
                            </span>
                          )}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {type === "gdn"
                          ? [
                              `Dispatched ${fmtDate(row.date_dispatched)}`,
                              row.transporter_name,
                              row.vehicle_number,
                            ]
                              .filter(Boolean)
                              .join(" · ")
                          : [
                              `Received ${fmtDate(row.date_received)}`,
                              `${qty(row.total_quantity_received)} of ${qty(row.total_quantity_ordered)} received`,
                              row.waybill_number,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-brand">
                      {type === "grn" && canInspect(row)
                        ? "Inspect"
                        : "Details"}
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          open && "rotate-180",
                        )}
                      />
                    </span>
                  </button>
                  {open && (
                    <div className="border-t border-border/60 bg-muted/20 p-4 sm:p-5">
                      {type === "gdn" ? (
                        <GdnDetails gdn={row} />
                      ) : (
                        <GrnInspectionPanel
                          grn={row}
                          editable={canInspect(row)}
                          onSaved={(updated) =>
                            updated?.id
                              ? setRows((prev) =>
                                  prev.map((r) =>
                                    r.id === updated.id ? updated : r,
                                  ),
                                )
                              : load()
                          }
                        />
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
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
