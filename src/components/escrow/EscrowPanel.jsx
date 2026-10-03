import {
  ShieldCheck,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Clock,
  ExternalLink,
  Landmark,
  Smartphone,
  Truck,
  XCircle,
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

// Tints that read on the light theme and keep their dark variants.
const TINT = {
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  emerald:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

// escrow status -> badge tint.
const STATUS_STYLES = {
  CREATED: TINT.slate,
  SECURED: TINT.emerald,
  FROZEN: TINT.sky,
  PARTIAL_RELEASED: TINT.amber,
  FULLY_RELEASED: TINT.emerald,
  REFUNDED: TINT.rose,
  DISPUTED: TINT.rose,
};

// KYC status -> badge tint + icon.
const KYC_STYLES = {
  VERIFIED: { tint: TINT.emerald, Icon: BadgeCheck },
  PENDING: { tint: TINT.amber, Icon: Clock },
  REJECTED: { tint: TINT.rose, Icon: XCircle },
  FAILED: { tint: TINT.rose, Icon: XCircle },
};

// Human labels for the backend's release-condition codes; anything unknown
// falls back to a prettified version of the code.
const CONDITION_LABELS = {
  GRN_CONFIRMATION: {
    title: "GRN confirmation",
    hint: "Buyer confirms the goods received note.",
  },
  GDN_CONFIRMATION: {
    title: "GDN confirmation",
    hint: "Supplier confirms the goods delivery note.",
  },
  "48HR_AUTO_RELEASE": {
    title: "48-hour auto release",
    hint: "Funds release automatically 48 hours after delivery if no dispute is raised.",
  },
  BUYER_APPROVAL: {
    title: "Buyer approval",
    hint: "Buyer approves release of the funds.",
  },
};
const conditionLabel = (type) =>
  CONDITION_LABELS[type] || { title: prettify(type || ""), hint: "" };

// Party type -> icon.
const PARTY_ICONS = {
  buyer: Building2,
  supplier: Building2,
  transporter: Truck,
};

// Show only the tail of an account number: "•••• 5242".
const maskAccount = (value) => {
  const v = String(value ?? "").replace(/\s+/g, "");
  if (!v) return "—";
  return v.length <= 4 ? v : `•••• ${v.slice(-4)}`;
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
      <span
        className={cn(
          "text-muted-foreground",
          strong && "font-medium text-foreground",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums",
          strong && "font-semibold text-foreground",
        )}
      >
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
  const parties = Array.isArray(escrow.party_verifications)
    ? escrow.party_verifications
    : [];
  const metCount = conditions.filter((c) => c.is_met).length;

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
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                TINT.rose,
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" /> Unbalanced
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              STATUS_STYLES[status] || TINT.slate,
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
            accent="text-amber-600 dark:text-amber-300"
          />
          <Stat
            label="Released"
            value={money(escrow.amount_released, currency)}
            accent="text-emerald-600 dark:text-emerald-300"
          />
          <Stat
            label="Refunded"
            value={money(escrow.amount_refunded, currency)}
            accent="text-rose-600 dark:text-rose-300"
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

        {/* Party verifications (KYC of each party to the escrow) */}
        {parties.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="font-display text-sm font-semibold">
                Party verifications
              </h3>
              <span className="text-xs text-muted-foreground">
                {parties.filter((p) => p.kyc_status === "VERIFIED").length} of{" "}
                {parties.length} verified
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {parties.map((party, i) => {
                const kyc = String(party.kyc_status || "").toUpperCase();
                const { tint, Icon: KycIcon } = KYC_STYLES[kyc] || {
                  tint: TINT.slate,
                  Icon: Clock,
                };
                const PartyIcon =
                  PARTY_ICONS[String(party.party_type || "").toLowerCase()] ||
                  Building2;
                return (
                  <div
                    key={party.id || i}
                    className="rounded-xl border border-border/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                          <PartyIcon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            {party.party_type || "Party"}
                          </p>
                          <p className="truncate font-medium">
                            {party.company_name || "—"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                          tint,
                        )}
                      >
                        <KycIcon className="h-3.5 w-3.5" />
                        {kyc ? prettify(kyc.toLowerCase()) : "Unknown"}
                      </span>
                    </div>

                    <dl className="mt-3 space-y-1.5 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Party type</dt>
                        <dd className="text-right">
                          {party.party_type
                            ? prettify(String(party.party_type).toLowerCase())
                            : "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">TIN</dt>
                        <dd className="text-right tabular-nums">
                          {party.tin_number || "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">ID verified</dt>
                        <dd
                          className={cn(
                            "flex items-center gap-1 text-right",
                            party.id_verified
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground",
                          )}
                        >
                          {party.id_verified ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Yes
                            </>
                          ) : (
                            "No"
                          )}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="flex items-center gap-1 text-muted-foreground">
                          <Landmark className="h-3.5 w-3.5" /> Bank account
                        </dt>
                        <dd className="min-w-0 text-right">
                          <span className="block truncate">
                            {party.bank_account_name || "—"}
                          </span>
                          {party.bank_account_number && (
                            <span className="block text-xs tabular-nums text-muted-foreground">
                              {maskAccount(party.bank_account_number)}
                            </span>
                          )}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="flex items-center gap-1 text-muted-foreground">
                          <Smartphone className="h-3.5 w-3.5" /> Mobile money
                        </dt>
                        <dd className="text-right tabular-nums">
                          {party.momo_number || "—"}
                        </dd>
                      </div>
                      {party.id && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">
                            Verification ID
                          </dt>
                          <dd className="text-right text-xs text-muted-foreground">
                            {party.id}
                          </dd>
                        </div>
                      )}
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Escrow ID</dt>
                        <dd className="text-right text-xs text-muted-foreground">
                          {party.escrow || escrow.escrow_id || "—"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Release conditions */}
        {conditions.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="font-display text-sm font-semibold">
                Release conditions
              </h3>
              <span className="text-xs text-muted-foreground">
                {metCount} of {conditions.length} met
              </span>
            </div>
            <ul className="space-y-2">
              {conditions.map((c, i) => {
                const { title, hint } = conditionLabel(c.condition_type);
                return (
                  <li
                    key={c.condition_id || i}
                    className="flex items-start gap-3 rounded-xl border border-border/60 px-4 py-3 text-sm"
                  >
                    {c.is_met ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{title}</p>
                      {hint && (
                        <p className="text-xs text-muted-foreground">{hint}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {c.condition_id ? `${c.condition_id} · ` : ""}
                        {c.is_met
                          ? `Met${c.met_by ? ` by ${c.met_by}` : ""}${
                              c.met_at ? ` · ${fmtDate(c.met_at)}` : ""
                            }`
                          : "Awaiting confirmation"}
                      </p>
                      {c.evidence_url && (
                        <a
                          href={c.evidence_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> View evidence
                        </a>
                      )}
                    </div>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        c.is_met ? TINT.emerald : TINT.amber,
                      )}
                    >
                      {c.is_met ? "Met" : "Pending"}
                    </span>
                  </li>
                );
              })}
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
                              isCredit ? "text-emerald-400" : "text-rose-400",
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
