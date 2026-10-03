// Read-only summary of a waybill embedded in another document's payload (e.g.
// a payment order's `wb` after dispatch): tracking status, route and dates,
// vehicle + driver, consignee and the items on board.

import { Link } from "react-router-dom";
import {
  Truck,
  MapPin,
  Phone,
  User,
  Package,
  FileCheck2,
  ArrowRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { prettify } from "@/utils/choices";
import { resolveMediaUrl } from "@/services/lib/env";

const fmtDateTime = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? String(v)
    : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const label = (v) => (v ? prettify(String(v).toLowerCase()) : "—");

// tracking_status -> badge tint (light + dark).
const TRACKING_TINT = {
  PENDING:
    "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  DISPATCHED: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  IN_TRANSIT:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  DELIVERED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  RECEIVED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  CANCELLED: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

function Field({ label: name, children, className }) {
  return (
    <div className={cn("flex justify-between gap-3 py-1.5 text-sm", className)}>
      <dt className="text-muted-foreground">{name}</dt>
      <dd className="min-w-0 break-words text-right font-medium">{children}</dd>
    </div>
  );
}

function Block({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-border/60 p-4">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold">
        <Icon className="h-4 w-4 text-brand" /> {title}
      </h3>
      <dl className="divide-y divide-border/50">{children}</dl>
    </div>
  );
}

export default function WaybillPanel({ waybill }) {
  if (!waybill || typeof waybill !== "object") return null;

  const tracking = String(waybill.tracking_status || "").toUpperCase();
  const items = Array.isArray(waybill.items) ? waybill.items : [];
  const logo = resolveMediaUrl(waybill.issuing_company_display_logo);

  return (
    <div className="rounded-2xl border border-border/70 bg-card">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand/10 text-brand">
            {logo ? (
              <img src={logo} alt="" className="h-full w-full object-contain" />
            ) : (
              <Truck className="h-5 w-5" />
            )}
          </span>
          <div>
            <h2 className="font-display text-base font-semibold">Waybill</h2>
            <p className="text-xs text-muted-foreground">
              {waybill.ref_num || "—"}
              {waybill.issuing_company_info
                ? ` · ${waybill.issuing_company_info}`
                : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {waybill.doubles_as_gdn && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
              <FileCheck2 className="h-3.5 w-3.5" /> Doubles as GDN
            </span>
          )}
          {tracking && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                TRACKING_TINT[tracking] || TRACKING_TINT.PENDING,
              )}
            >
              {label(tracking)}
            </span>
          )}
          {waybill.ref_num && (
            <Link
              to={`/dashboard/waybills/${waybill.ref_num}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
            >
              Open waybill <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Block icon={MapPin} title="Shipment">
            <Field label="Origin">{waybill.origin || "—"}</Field>
            <Field label="Destination">{waybill.destination || "—"}</Field>
            <Field label="Waybill type">{label(waybill.waybill_type)}</Field>
            <Field label="Delivery">{label(waybill.do_delivery)}</Field>
            <Field label="Issued by">{label(waybill.issued_by_party)}</Field>
            <Field label="Priority">{label(waybill.priority)}</Field>
          </Block>

          <Block icon={Truck} title="Vehicle & driver">
            <Field label="Vehicle number">
              {waybill.vehicle_number || "—"}
            </Field>
            <Field label="Driver name">{waybill.driver_name || "—"}</Field>
            <Field label="Driver phone">
              {waybill.driver_phone ? (
                <a
                  href={`tel:${waybill.driver_phone}`}
                  className="inline-flex items-center gap-1 text-brand hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" /> {waybill.driver_phone}
                </a>
              ) : (
                "—"
              )}
            </Field>
            <Field label="Departure">
              {fmtDateTime(waybill.departure_datetime)}
            </Field>
            <Field label="Delivery deadline">
              {fmtDateTime(waybill.delivery_deadline)}
            </Field>
            <Field label="Expected delivery">
              {fmtDateTime(waybill.expected_delivery_date)}
            </Field>
          </Block>

          <Block icon={User} title="Consignee">
            <Field label="Name">{waybill.consignee_name || "—"}</Field>
            <Field label="Phone">
              {waybill.consignee_phone ? (
                <a
                  href={`tel:${waybill.consignee_phone}`}
                  className="inline-flex items-center gap-1 text-brand hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" /> {waybill.consignee_phone}
                </a>
              ) : (
                "—"
              )}
            </Field>
            <Field label="Status">{label(waybill.status)}</Field>
            <Field label="Created">{fmtDateTime(waybill.created_at)}</Field>
            <Field label="Updated">{fmtDateTime(waybill.updated_at)}</Field>
          </Block>
        </div>

        {/* Items on board */}
        <div>
          <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold">
            <Package className="h-4 w-4 text-brand" /> Items ({items.length})
          </h3>
          {items.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">#</th>
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="px-4 py-2.5 font-medium">Description</th>
                    <th className="px-4 py-2.5 text-right font-medium">Qty</th>
                    <th className="px-4 py-2.5 font-medium">Unit</th>
                    <th className="px-4 py-2.5 font-medium">
                      Special handling
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {items.map((it, i) => (
                    <tr key={it.id ?? i} className="align-top">
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-4 py-2.5 font-medium">
                        {it.name || "N/A"}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {it.description || "N/A"}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {it.quantity ?? "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        {it.unit_of_measure || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {Array.isArray(it.special_handles) &&
                        it.special_handles.length > 0
                          ? it.special_handles
                              .map((h) =>
                                typeof h === "string"
                                  ? h
                                  : h?.handling_description,
                              )
                              .filter(Boolean)
                              .join("; ")
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No items on this waybill.
            </p>
          )}
        </div>

        {waybill.note && (
          <p className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            {waybill.note}
          </p>
        )}
      </div>
    </div>
  );
}
