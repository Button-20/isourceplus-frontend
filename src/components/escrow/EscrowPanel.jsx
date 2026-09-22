import {
  ShieldCheck,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { prettify } from "@/utils/choices";

// Format a decimal-string amount ("11850.00") with its currency ("GHS").
// Falls back to the raw value if it isn't a number.
function money(value, currency = "GHS") {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return `${currency} ${n.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

// status -> badge colours (dark-safe tints).
const STATUS_STYLES = {
  CREATED: "bg-slate-500/15 text-slate-300",
  SECURED: "bg-emerald-500/15 text-emerald-300",
  FROZEN: "bg-sky-500/15 text-sky-300",
  PARTIAL_RELEASED: "bg-amber-500/15 text-amber-300",
  FULLY_RELEASED: "bg-emerald-500/15 text-emerald-300",
  REFUNDED: "bg-rose-500/15 text-rose-300",
  DISPUTED: "bg-rose-500/15 text-rose-300",
};

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-display text-base font-semibold", accent)}>
        {value}
      </p>
    </div>
  );
}

function FeeRow({ label, value, currency, strong }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className={cn("text-muted-foreground", strong && "font-medium text-foreground")}>
        {label}
      </span>
      <span className={cn("tabular-nums", strong && "font-semibold text-foreground")}>
        {money(value, currency)}
      </span>
    </div>
  );
}

// Renders a secured/created EscrowTransaction: status, amounts, fee breakdown,
// ledger entries and release conditions. `escrow` is the API's EscrowTransaction.
export default function EscrowPanel({ escrow }) {
  if (!escrow) return null;
  const currency = escrow.currency || "GHS";
  const status = escrow.escrow_status || "CREATED";
  const ledger = Array.isArray(escrow.ledger_entries)
    ? escrow.ledger_entries
    : [];
  const conditions = Array.isArray(escrow.release_conditions)
    ? escrow.release_conditions
    : [];

  return (
    <div className="rounded-2xl border border-border/70 bg-card">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold">Escrow</h2>
            <p className="text-xs text-muted-foreground">
              {escrow.escrow_id || "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {escrow.is_balanced === false && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-medium text-rose-300">
              <AlertTriangle className="h-3.5 w-3.5" /> Unbalanced
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              STATUS_STYLES[status] || "bg-slate-500/15 text-slate-300",
            )}
          >
            {prettify(status)}
          </span>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {/* Amount stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            label="Escrow amount"
            value={money(escrow.escrow_amount, currency)}
          />
          <Stat
            label="On hold"
            value={money(escrow.amount_on_hold, currency)}
            accent="text-amber-300"
          />
          <Stat
            label="Released"
            value={money(escrow.amount_released, currency)}
            accent="text-emerald-300"
          />
          <Stat
            label="Refunded"
            value={money(escrow.amount_refunded, currency)}
            accent="text-rose-300"
          />
        </div>

        {/* Fees + parties */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 p-4">
            <h3 className="mb-1 font-display text-sm font-semibold">
              Fee breakdown
            </h3>
            <div className="divide-y divide-border/50">
              <FeeRow
                label="Gross amount"
                value={escrow.escrow_amount}
                currency={currency}
              />
              <FeeRow
                label="Platform fee (3%)"
                value={escrow.platform_fee}
                currency={currency}
              />
              <FeeRow
                label="Escrow fee (1%)"
                value={escrow.escrow_fee}
                currency={currency}
              />
              <FeeRow
                label="Bank charges"
                value={escrow.bank_charges}
                currency={currency}
              />
              <FeeRow
                label="Net payable to supplier"
                value={escrow.net_payable}
                currency={currency}
                strong
              />
            </div>
          </div>

          <div className="rounded-xl border border-border/60 p-4">
            <h3 className="mb-2 font-display text-sm font-semibold">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Payment method</dt>
                <dd className="text-right">{escrow.payment_method || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Payment reference</dt>
                <dd className="break-all text-right">
                  {escrow.payment_ref || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Secured on</dt>
                <dd className="text-right">{fmtDate(escrow.date_secured)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Auto-release due</dt>
                <dd className="text-right">
                  {fmtDate(escrow.date_release_due)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Release conditions */}
        {conditions.length > 0 && (
          <div>
            <h3 className="mb-2 font-display text-sm font-semibold">
              Release conditions
            </h3>
            <ul className="space-y-2">
              {conditions.map((c, i) => (
                <li
                  key={c.condition_id || i}
                  className="flex items-center gap-3 rounded-xl border border-border/60 px-4 py-3 text-sm"
                >
                  {c.is_met ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {prettify(c.condition_type || "")}
                    </p>
                    {c.is_met && c.met_by && (
                      <p className="text-xs text-muted-foreground">
                        Met by {c.met_by}
                        {c.met_at ? ` · ${fmtDate(c.met_at)}` : ""}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-medium",
                      c.is_met ? "text-emerald-400" : "text-muted-foreground",
                    )}
                  >
                    {c.is_met ? "Met" : "Pending"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ledger */}
        {ledger.length > 0 && (
          <div>
            <h3 className="mb-2 font-display text-sm font-semibold">
              Ledger entries
            </h3>
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Type</th>
                    <th className="px-4 py-2.5 font-medium">Amount</th>
                    <th className="px-4 py-2.5 font-medium">From → To</th>
                    <th className="px-4 py-2.5 font-medium">Balance after</th>
                    <th className="px-4 py-2.5 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {ledger.map((row, i) => {
                    const isCredit = row.type === "CREDIT";
                    return (
                      <tr key={row.ledger_id || i}>
                        <td className="px-4 py-2.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 font-medium",
                              isCredit
                                ? "text-emerald-400"
                                : "text-rose-400",
                            )}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="h-4 w-4" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4" />
                            )}
                            {row.type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 tabular-nums">
                          {money(row.amount, currency)}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          <span className="text-foreground">
                            {row.from_account || "—"}
                          </span>{" "}
                          → {row.to_account || "—"}
                          {row.narration && (
                            <span className="block text-xs">
                              {row.narration}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums">
                          {money(row.balance_after, currency)}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {fmtDate(row.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
