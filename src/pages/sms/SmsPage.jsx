import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Coins,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  getSentSmsHistory,
  getSmsBalance,
  getSmsPlans,
  getSmsTransactions,
  purchaseSmsUnits,
  sendSms,
} from "@/services/api/sms.service";

// SMS resale: buy units from a plan, then send single or bulk messages.
// The API response shapes weren't specified, so every field is read
// defensively (see the normalisers below) — adjust the key lists once the real
// payloads are confirmed.

// ---------------------------------------------------------------- helpers ---
const asList = (d) =>
  Array.isArray(d)
    ? d
    : Array.isArray(d?.results)
      ? d.results
      : Array.isArray(d?.data)
        ? d.data
        : [];

const pick = (o, keys, fallback = null) => {
  for (const k of keys) {
    const v = o?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return fallback;
};

const num = (v) => {
  // Treat missing values as null (not 0) — Number(null)/Number("") are 0, which
  // otherwise makes an absent unit count render as "0" instead of "—".
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const formatDateTime = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? String(v)
    : d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const money = (v, currency = "GHS") => {
  const n = num(v);
  return n === null
    ? "—"
    : `${currency} ${n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
};

const readBalance = (d) =>
  typeof d === "number"
    ? d
    : num(
        pick(d, [
          "balance",
          "sms_count",
          "units",
          "sms_units",
          "sms_balance",
          "credits",
          "available_units",
          "remaining",
        ]),
      );

const normalizePlan = (p) => ({
  id: pick(p, ["id", "plan_id", "uuid", "code"]),
  name: pick(p, ["name", "title", "plan_name"], "SMS plan"),
  units: num(pick(p, ["sms_count", "units", "sms_units", "credits", "quantity", "number_of_sms"])),
  pricePerSms: pick(p, ["price_per_sms", "unit_price"]),
  price: pick(p, ["price", "amount", "cost"]),
  currency: pick(p, ["currency"], "GHS"),
  description: pick(p, ["description", "details"], ""),
});

const normalizeTransaction = (t) => ({
  id: pick(t, ["id", "reference", "transaction_id"]),
  date: pick(t, ["created_at", "created", "date", "timestamp"]),
  type: pick(t, ["transaction_type", "type"], ""),
  description: pick(t, ["description", "detail", "note"], "—"),
  units: num(pick(t, ["sms_count", "units", "sms_units", "credits", "quantity"])),
});

// PURCHASE adds units (credit), everything else (SEND) consumes them (debit).
const isCredit = (type) => /purchase|credit|top.?up|buy/i.test(type || "");

const normalizeSent = (s) => {
  const rec = pick(s, ["recipients", "recipient", "to", "phone_numbers"], []);
  const recipients = Array.isArray(rec) ? rec : rec ? [rec] : [];
  return {
    id: pick(s, ["id", "message_id", "reference"]),
    date: pick(s, ["created_at", "sent_at", "created", "date", "timestamp"]),
    recipients,
    message: pick(s, ["message", "text", "body"], ""),
    status: pick(s, ["status", "state"], "—"),
    units: num(pick(s, ["sms_count", "units", "units_used", "cost", "credits_used"])),
  };
};

// Accept numbers separated by commas, spaces, semicolons or new lines and
// normalise Ghanaian numbers to the international 233XXXXXXXXX form the API
// expects. Duplicates are dropped.
const parseRecipients = (raw) => {
  const seen = new Set();
  raw.split(/[\s,;]+/).forEach((tok) => {
    let d = tok.replace(/\D/g, "");
    if (!d) return;
    if (d.startsWith("00")) d = d.slice(2);
    if (d.length === 10 && d.startsWith("0")) d = `233${d.slice(1)}`;
    if (d.length === 9) d = `233${d}`;
    if (d.length >= 11 && d.length <= 15) seen.add(d);
  });
  return Array.from(seen);
};

// A standard GSM-7 SMS segment is 160 characters.
const SEGMENT = 160;
const segmentsFor = (text) => (text.length ? Math.ceil(text.length / SEGMENT) : 0);

const statusTone = (s) => {
  const v = String(s || "").toLowerCase();
  if (/(purchase|credit|success|paid|delivered|complete|approved)/.test(v))
    return "bg-emerald-500/10 text-emerald-400";
  if (/(send|sent|debit)/.test(v)) return "bg-brand/10 text-brand";
  if (/(pend|process|queue)/.test(v)) return "bg-amber-500/10 text-amber-400";
  if (/(fail|error|declin|reject|cancel)/.test(v))
    return "bg-destructive/10 text-destructive";
  return "bg-muted text-muted-foreground";
};

function StatusPill({ value }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        statusTone(value),
      )}
    >
      {String(value || "—").replace(/_/g, " ")}
    </span>
  );
}

function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
        <Icon className="h-6 w-6 text-brand" />
      </div>
      <p className="mt-4 font-semibold">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TableSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ----------------------------------------------------------------- page -----
export default function SmsPage() {
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [recipientsRaw, setRecipientsRaw] = useState("");
  const [sending, setSending] = useState(false);

  const loadBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      setBalance(readBalance(await getSmsBalance()));
    } catch {
      toast.error("Couldn't load your SMS balance.");
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      setPlans(asList(await getSmsPlans()).map(normalizePlan));
    } catch {
      toast.error("Couldn't load SMS plans.");
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      setTransactions(asList(await getSmsTransactions()).map(normalizeTransaction));
    } catch {
      toast.error("Couldn't load SMS transactions.");
    } finally {
      setTxLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      setHistory(asList(await getSentSmsHistory()).map(normalizeSent));
    } catch {
      toast.error("Couldn't load sent SMS history.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBalance();
    loadPlans();
    loadTransactions();
    loadHistory();
  }, [loadBalance, loadPlans, loadTransactions, loadHistory]);

  // --- send ---
  const recipients = useMemo(() => parseRecipients(recipientsRaw), [recipientsRaw]);
  const segments = segmentsFor(message);
  const estimatedUnits = recipients.length * segments;
  const overBalance = balance !== null && estimatedUnits > balance;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return toast.error("Write a message first.");
    if (!recipients.length)
      return toast.error("Add at least one valid recipient number.");
    if (overBalance)
      return toast.error(
        "Not enough SMS units for this send. Buy more units first.",
      );
    setSending(true);
    try {
      const res = await sendSms({ message: message.trim(), recipients });
      // We submitted `recipients`, so that's the reliable count. Only override
      // with an explicit POSITIVE sent-count from the response (avoid ambiguous
      // "count", and never let a 0/absent field report "Sent to 0 recipients").
      const reported = num(pick(res, ["sent", "sent_count", "total_sent", "recipient_count"]));
      const sent = reported && reported > 0 ? reported : recipients.length;
      toast.success(
        `Sent to ${sent} recipient${sent === 1 ? "" : "s"}.`,
      );
      setMessage("");
      setRecipientsRaw("");
      loadBalance();
      loadHistory();
    } catch (err) {
      const data = err.response?.data;
      toast.error(
        data?.detail ||
          data?.message?.[0] ||
          data?.recipients?.[0] ||
          (typeof data === "string" ? data : null) ||
          "Couldn't send the SMS. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  // --- purchase ---
  const handlePurchase = async (plan) => {
    if (!plan.id) return toast.error("This plan has no id to purchase.");
    setPurchasingId(plan.id);
    try {
      const res = await purchaseSmsUnits(plan.id);
      // If the backend hands back a payment checkout link, follow it.
      const checkout = pick(res, [
        "authorization_url",
        "payment_url",
        "checkout_url",
        "url",
      ]);
      if (typeof checkout === "string" && /^https?:\/\//.test(checkout)) {
        window.location.assign(checkout);
        return;
      }
      toast.success(`Purchased ${plan.name}.`);
      loadBalance();
      loadTransactions();
    } catch (err) {
      const data = err.response?.data;
      toast.error(
        data?.detail ||
          data?.plan_id?.[0] ||
          (typeof data === "string" ? data : null) ||
          "Couldn't complete the purchase. Please try again.",
      );
    } finally {
      setPurchasingId(null);
    }
  };

  const refreshAll = () => {
    loadBalance();
    loadPlans();
    loadTransactions();
    loadHistory();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header — flat brand block */}
      <div className="flex flex-col gap-5 rounded-2xl bg-brand-gradient p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">SMS</h1>
            <p className="mt-1 max-w-md text-sm text-white/85">
              Buy SMS units and send single or bulk messages to your customers,
              suppliers and transporters.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-5 py-4">
          <Coins className="h-6 w-6" />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/80">
              Available units
            </p>
            {balanceLoading ? (
              <Skeleton className="mt-1 h-7 w-20 bg-white/30" />
            ) : (
              <p className="font-display text-2xl font-bold tabular-nums">
                {balance == null ? "—" : balance.toLocaleString()}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={refreshAll}
            aria-label="Refresh"
            className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Tabs defaultValue="send">
        <TabsList className="h-auto flex-wrap rounded-full bg-muted/40 p-1">
          <TabsTrigger value="send" className="rounded-full">
            Send
          </TabsTrigger>
          <TabsTrigger value="plans" className="rounded-full">
            Buy units
          </TabsTrigger>
          <TabsTrigger value="transactions" className="rounded-full">
            Transactions
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-full">
            Sent history
          </TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------------- send */}
        <TabsContent value="send" className="mt-5">
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <form
              onSubmit={handleSend}
              className="space-y-5 rounded-2xl border border-border bg-card p-6"
            >
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium">Message</label>
                  <span className="text-xs text-muted-foreground">
                    {message.length} chars · {segments} segment
                    {segments === 1 ? "" : "s"} per recipient
                  </span>
                </div>
                <Textarea
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message…"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium">Recipients</label>
                  <span className="text-xs text-muted-foreground">
                    {recipients.length} valid number
                    {recipients.length === 1 ? "" : "s"}
                  </span>
                </div>
                <Textarea
                  rows={4}
                  value={recipientsRaw}
                  onChange={(e) => setRecipientsRaw(e.target.value)}
                  placeholder={"0555943014, 0594700610\n233241234567"}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  One or many — separate with commas, spaces or new lines. Local
                  numbers (0XX…) are converted to 233… automatically.
                </p>
                {recipients.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {recipients.slice(0, 8).map((r) => (
                      <span
                        key={r}
                        className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand"
                      >
                        {r}
                      </span>
                    ))}
                    {recipients.length > 8 && (
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                        +{recipients.length - 8} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p
                  className={cn(
                    "text-sm",
                    overBalance ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  Estimated cost:{" "}
                  <span className="font-semibold text-foreground">
                    {estimatedUnits.toLocaleString()} unit
                    {estimatedUnits === 1 ? "" : "s"}
                  </span>
                  {overBalance && " — exceeds your balance"}
                </p>
                <Button
                  type="submit"
                  disabled={sending || !message.trim() || !recipients.length}
                  className="bg-brand-gradient text-white hover:opacity-90"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send to {recipients.length || 0} recipient
                      {recipients.length === 1 ? "" : "s"}
                    </>
                  )}
                </Button>
              </div>
            </form>

            <aside className="space-y-4 rounded-2xl border border-border bg-card p-6 text-sm">
              <p className="font-semibold">How units work</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  1 unit sends one 160-character segment to one recipient.
                </li>
                <li>Longer messages use more segments per recipient.</li>
                <li>Bulk sends multiply by the number of recipients.</li>
              </ul>
              <p className="text-muted-foreground">
                Running low?{" "}
                <span className="font-medium text-foreground">Buy units</span>{" "}
                from a plan in the next tab.
              </p>
            </aside>
          </div>
        </TabsContent>

        {/* --------------------------------------------------------- plans */}
        <TabsContent value="plans" className="mt-5">
          {plansLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))}
            </div>
          ) : plans.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const busy = purchasingId === plan.id;
                return (
                  <div
                    key={String(plan.id ?? plan.name)}
                    className="flex flex-col rounded-2xl border border-border bg-card p-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                      {plan.name}
                    </p>
                    <p className="mt-3 font-display text-3xl font-bold tabular-nums">
                      {plan.units == null ? "—" : plan.units.toLocaleString()}
                      <span className="ml-1.5 text-base font-medium text-muted-foreground">
                        units
                      </span>
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {money(plan.price, plan.currency)}
                    </p>
                    {num(plan.pricePerSms) !== null && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {money(plan.pricePerSms, plan.currency)} per SMS
                      </p>
                    )}
                    {plan.description && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                    )}
                    <Button
                      type="button"
                      onClick={() => handlePurchase(plan)}
                      disabled={busy || purchasingId !== null}
                      className="mt-5 bg-brand-gradient text-white hover:opacity-90"
                    >
                      {busy ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />{" "}
                          Processing…
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="h-4 w-4" /> Buy
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={ShoppingBag}
              title="No SMS plans available"
              hint="Plans will appear here once they're published."
            />
          )}
        </TabsContent>

        {/* -------------------------------------------------- transactions */}
        <TabsContent value="transactions" className="mt-5">
          {txLoading ? (
            <TableSkeleton />
          ) : transactions.length ? (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Units</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, i) => {
                    const credit = isCredit(t.type);
                    const signed =
                      t.units == null ? null : credit ? t.units : -t.units;
                    return (
                      <tr
                        key={String(t.id ?? i)}
                        className="border-t border-border"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatDateTime(t.date)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill value={t.type} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {t.description}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-3 text-right font-medium tabular-nums",
                            signed == null
                              ? ""
                              : signed >= 0
                                ? "text-emerald-400"
                                : "text-foreground",
                          )}
                        >
                          {signed == null
                            ? "—"
                            : `${signed > 0 ? "+" : ""}${signed.toLocaleString()}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Coins}
              title="No transactions yet"
              hint="Your unit purchases will show up here."
            />
          )}
        </TabsContent>

        {/* ------------------------------------------------------- history */}
        <TabsContent value="history" className="mt-5">
          {historyLoading ? (
            <TableSkeleton />
          ) : history.length ? (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Sent</th>
                    <th className="px-4 py-3">Recipients</th>
                    <th className="px-4 py-3">Message</th>
                    <th className="px-4 py-3 text-right">Units</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((s, i) => (
                    <tr
                      key={String(s.id ?? i)}
                      className="border-t border-border align-top"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDateTime(s.date)}
                      </td>
                      <td className="px-4 py-3">
                        {s.recipients.length ? (
                          <span title={s.recipients.join(", ")}>
                            {s.recipients[0]}
                            {s.recipients.length > 1 && (
                              <span className="text-muted-foreground">
                                {" "}
                                +{s.recipients.length - 1} more
                              </span>
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="max-w-md px-4 py-3 text-muted-foreground">
                        <span className="line-clamp-2" title={s.message}>
                          {s.message || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {s.units == null ? "—" : s.units.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill value={s.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Send}
              title="Nothing sent yet"
              hint="Messages you send will be listed here."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
