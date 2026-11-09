// The company's subscriptions as cards. Each card can be viewed in full
// (fresh from GET subscriptions/{id}/) and cancelled (POST …/deactivate/) or
// reactivated (POST …/activate/). The plan the company holds now also gets
// "Change plan" and "Update payment method".
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowUpRight,
  CreditCard,
  ExternalLink,
  Eye,
  Loader2,
  Mail,
  PackageOpen,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  SUBSCRIPTION_STATUS_LABELS,
  cancelSubscription,
  getSubscription,
  reactivateSubscription,
  requestCardUpdate,
  subscriptionErrorMessage,
} from "@/services/api/subscriptions.service";

const fmtDate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const titleCase = (s) =>
  s ? String(s).charAt(0) + String(s).slice(1).toLowerCase() : "";

// Statuses that still renew, so can be cancelled.
const CANCELLABLE = ["ACTIVE", "ATTENTION", "PROCESSING"];
// Statuses that can be switched back on.
const REACTIVATABLE = ["NOT_RENEW", "CANCELLED"];

const STATUS_STYLES = {
  ACTIVE: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  ATTENTION: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  PROCESSING: "bg-brand/10 text-brand",
  NOT_RENEW: "bg-muted text-muted-foreground",
  COMPLETED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-destructive/10 text-destructive",
};

function StatusBadge({ status }) {
  if (!status) return null;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] || "bg-muted text-muted-foreground",
      )}
    >
      {SUBSCRIPTION_STATUS_LABELS[status] || titleCase(status)}
    </span>
  );
}

function Detail({ label, children, className }) {
  if (!children && children !== 0) return null;
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium break-words">{children}</dd>
    </div>
  );
}

// One line on what this subscription's status means for the company.
function statusNote(sub) {
  const until = fmtDate(sub.next_payment_date);
  switch (sub.status) {
    case "ATTENTION":
      return "The last payment didn't go through. Update your payment method to keep the plan.";
    case "NOT_RENEW":
      return `Cancelled — stays active${until ? ` until ${until}` : " until the end of the paid period"}.`;
    case "CANCELLED":
      return "This subscription was cancelled.";
    case "PROCESSING":
      return "The payment is being processed.";
    default:
      return sub.is_upgrading ? "A plan change is being processed." : "";
  }
}

function SubscriptionCard({
  sub,
  isCurrent,
  busy,
  onView,
  onCancel,
  onReactivate,
}) {
  const nextPayment = fmtDate(sub.next_payment_date);
  const note = statusNote(sub);
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-card p-5",
        isCurrent ? "border-brand/40 ring-1 ring-brand/20" : "border-border/70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {isCurrent ? "Current plan" : "Subscription"}
          </p>
          <h3 className="mt-0.5 font-display text-lg font-bold">
            {titleCase(sub.plan) || "Plan"}
          </h3>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <StatusBadge status={sub.status} />
          {sub.is_trial && (
            <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
              Trial
            </span>
          )}
        </div>
      </div>

      <dl className="mt-4 grid flex-1 grid-cols-2 content-start gap-3">
        <Detail label="Started">
          {fmtDate(sub.start_date || sub.created_at)}
        </Detail>
        <Detail
          label={sub.status === "NOT_RENEW" ? "Active until" : "Next payment"}
        >
          {sub.status === "CANCELLED" || sub.status === "COMPLETED"
            ? ""
            : nextPayment}
        </Detail>
        <Detail label="Trial ends">
          {sub.is_trial ? fmtDate(sub.trial_ends_at) : ""}
        </Detail>
        <Detail label="Billed to">{sub.entity_name}</Detail>
      </dl>

      {note && (
        <p
          className={cn(
            "mt-3 text-xs",
            sub.status === "ATTENTION"
              ? "text-amber-700 dark:text-amber-300"
              : "text-muted-foreground",
          )}
        >
          {note}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(sub)}
          disabled={Boolean(busy)}
        >
          <Eye className="mr-1.5 h-4 w-4" />
          View
        </Button>
        {CANCELLABLE.includes(sub.status) && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onCancel(sub)}
            disabled={Boolean(busy)}
          >
            <XCircle className="mr-1.5 h-4 w-4" />
            Cancel
          </Button>
        )}
        {REACTIVATABLE.includes(sub.status) && (
          <Button
            size="sm"
            className="bg-brand-gradient text-brand-foreground hover:opacity-90"
            onClick={() => onReactivate(sub)}
            disabled={Boolean(busy)}
          >
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Reactivate
          </Button>
        )}
      </div>
    </div>
  );
}

// Full details of one subscription, read fresh from GET subscriptions/{id}/.
function ViewSubscriptionDialog({ sub, planType, onClose, onCancel }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sub?.id) return;
    let cancelled = false;
    setDetail(sub);
    setError("");
    setLoading(true);
    getSubscription(sub.id)
      .then((d) => !cancelled && d && setDetail(d))
      .catch((err) => {
        if (cancelled) return;
        setError(
          subscriptionErrorMessage(
            err,
            "Couldn't load the latest details — showing what we have.",
          ),
        );
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [sub]);

  const d = detail || sub || {};
  const nextPayment = fmtDate(d.next_payment_date);
  const branches = Array.isArray(d.branches) ? d.branches.length : null;

  return (
    <Dialog open={Boolean(sub)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="font-montserrat sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {titleCase(d.plan) || "Subscription"}
            <StatusBadge status={d.status} />
            {d.is_trial && (
              <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
                Trial
              </span>
            )}
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </DialogTitle>
          <DialogDescription>
            {statusNote(d) || "Your subscription details."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}

        <dl className="grid grid-cols-2 gap-4 rounded-xl border border-border/60 p-4">
          <Detail label="Plan">{titleCase(d.plan)}</Detail>
          <Detail label="Plan type">{titleCase(planType)}</Detail>
          <Detail label="Status">
            {SUBSCRIPTION_STATUS_LABELS[d.status] || titleCase(d.status)}
          </Detail>
          <Detail label="Billed to">{d.entity_name}</Detail>
          <Detail label="Started">{fmtDate(d.start_date)}</Detail>
          <Detail
            label={d.status === "NOT_RENEW" ? "Active until" : "Next payment"}
          >
            {d.status === "CANCELLED" || d.status === "COMPLETED"
              ? ""
              : nextPayment}
          </Detail>
          <Detail label="Trial">{d.is_trial ? "Yes" : "No"}</Detail>
          <Detail label="Trial ends">
            {d.is_trial ? fmtDate(d.trial_ends_at) : ""}
          </Detail>
          <Detail label="Branches covered">{branches}</Detail>
          <Detail label="Plan change">
            {d.is_upgrading ? "In progress" : ""}
          </Detail>
          <Detail label="Created">{fmtDate(d.created_at)}</Detail>
          <Detail label="Last updated">{fmtDate(d.updated_at)}</Detail>
          <Detail label="Subscription ID" className="col-span-2">
            {d.id && (
              <span className="font-mono text-xs text-muted-foreground">
                {d.id}
              </span>
            )}
          </Detail>
        </dl>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {CANCELLABLE.includes(d.status) && (
            <Button variant="destructive" onClick={() => onCancel(d)}>
              <XCircle className="mr-1.5 h-4 w-4" />
              Cancel subscription
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SubscriptionManager({
  overview,
  loading,
  error,
  planType,
  showEmpty = false,
  onRefresh,
  onChangePlan,
}) {
  const { current, history = [] } = overview || {};
  const [busy, setBusy] = useState("");
  const [viewing, setViewing] = useState(null);
  // { sub, mode: "cancel" | "reactivate" } while confirming.
  const [confirm, setConfirm] = useState(null);
  const [cardOpen, setCardOpen] = useState(false);
  const [cardLink, setCardLink] = useState("");

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-border/70 bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="font-medium">Couldn&apos;t load your subscriptions</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw
            className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")}
          />
          Try again
        </Button>
      </div>
    );
  }

  if (history.length === 0) {
    if (!showEmpty || !overview) return null;
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <PackageOpen className="h-5 w-5" />
        </span>
        <p className="mt-3 font-display text-base font-semibold">
          No subscription yet
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Choose a plan below to subscribe or start a trial. Your subscription
          will show here.
        </p>
        <Button
          size="sm"
          className="mt-4 bg-brand-gradient text-brand-foreground hover:opacity-90"
          onClick={onChangePlan}
        >
          Choose a plan
        </Button>
      </div>
    );
  }

  // The current plan first, then the rest newest first.
  const cards = current
    ? [current, ...history.filter((h) => h.id !== current.id)]
    : history;

  const closeCard = () => {
    if (busy) return;
    setCardOpen(false);
    setCardLink("");
  };

  const changeRenewal = async () => {
    const { sub, mode } = confirm;
    setBusy(mode);
    try {
      await (mode === "reactivate"
        ? reactivateSubscription(sub.id)
        : cancelSubscription(sub.id));
      const until = fmtDate(sub.next_payment_date);
      toast.success(
        mode === "reactivate"
          ? "Your subscription is active again."
          : `Subscription cancelled.${until ? ` Your plan stays active until ${until}.` : ""}`,
      );
      setConfirm(null);
      setViewing(null);
      onRefresh();
    } catch (err) {
      toast.error(
        subscriptionErrorMessage(
          err,
          mode === "reactivate"
            ? "Couldn't reactivate the subscription."
            : "Couldn't cancel the subscription.",
        ),
      );
      console.error("Subscription renewal error:", err);
    } finally {
      setBusy("");
    }
  };

  const getCardLink = async () => {
    setBusy("link");
    try {
      const link = await requestCardUpdate(current.id);
      if (link) setCardLink(link);
      else {
        await requestCardUpdate(current.id, { email: true });
        toast.success("We've emailed you a link to update your card.");
        setCardOpen(false);
      }
    } catch (err) {
      toast.error(
        subscriptionErrorMessage(err, "Couldn't get the card update link."),
      );
      console.error("Card update error:", err);
    } finally {
      setBusy("");
    }
  };

  const emailCardLink = async () => {
    setBusy("email");
    try {
      await requestCardUpdate(current.id, { email: true });
      toast.success("We've emailed you a link to update your card.");
      setCardOpen(false);
    } catch (err) {
      toast.error(
        subscriptionErrorMessage(err, "Couldn't email the card update link."),
      );
      console.error("Card update email error:", err);
    } finally {
      setBusy("");
    }
  };

  const confirmSub = confirm?.sub;
  const confirmUntil = fmtDate(confirmSub?.next_payment_date);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold">
            Your subscriptions
          </h2>
          <p className="text-sm text-muted-foreground">
            View a subscription&apos;s details, or cancel one you no longer
            need.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading || Boolean(busy)}
            aria-label="Refresh subscriptions"
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          {current && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCardOpen(true)}
                disabled={Boolean(busy)}
              >
                <CreditCard className="mr-1.5 h-4 w-4" />
                Update payment method
              </Button>
              <Button
                size="sm"
                className="bg-brand-gradient text-brand-foreground hover:opacity-90"
                onClick={onChangePlan}
                disabled={Boolean(busy)}
              >
                <ArrowUpRight className="mr-1.5 h-4 w-4" />
                Change plan
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((sub) => (
          <SubscriptionCard
            key={sub.id}
            sub={sub}
            isCurrent={current?.id === sub.id}
            busy={busy}
            onView={setViewing}
            onCancel={(s) => setConfirm({ sub: s, mode: "cancel" })}
            onReactivate={(s) => setConfirm({ sub: s, mode: "reactivate" })}
          />
        ))}
      </div>

      <ViewSubscriptionDialog
        sub={viewing}
        planType={planType}
        onClose={() => setViewing(null)}
        onCancel={(s) => setConfirm({ sub: s, mode: "cancel" })}
      />

      {/* Cancel / reactivate */}
      <Dialog
        open={Boolean(confirm)}
        onOpenChange={(o) => !o && !busy && setConfirm(null)}
      >
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirm?.mode === "reactivate"
                ? "Reactivate this subscription?"
                : "Cancel this subscription?"}
            </DialogTitle>
            <DialogDescription>
              {confirm?.mode === "reactivate"
                ? `Your ${titleCase(confirmSub?.plan)} plan will renew automatically${confirmUntil && confirmSub?.status !== "CANCELLED" ? ` on ${confirmUntil}` : ""} using your saved payment method.`
                : `It won't renew${confirmUntil ? ` on ${confirmUntil}` : ""}. You keep your ${titleCase(confirmSub?.plan)} plan until then, and can reactivate it before it ends.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirm(null)}
              disabled={Boolean(busy)}
            >
              {confirm?.mode === "reactivate" ? "Not now" : "Keep subscription"}
            </Button>
            {confirm?.mode === "reactivate" ? (
              <Button
                className="bg-brand-gradient text-brand-foreground hover:opacity-90"
                onClick={changeRenewal}
                disabled={Boolean(busy)}
              >
                {busy === "reactivate" && (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                )}
                Reactivate
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={changeRenewal}
                disabled={Boolean(busy)}
              >
                {busy === "cancel" && (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                )}
                Cancel subscription
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update payment method */}
      <Dialog open={cardOpen} onOpenChange={(o) => !o && closeCard()}>
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update payment method</DialogTitle>
            <DialogDescription>
              Your card is changed on Paystack&apos;s secure page. Open it now,
              or have the link emailed to you.
            </DialogDescription>
          </DialogHeader>
          {cardLink ? (
            <Button
              asChild
              className="w-full bg-brand-gradient text-brand-foreground hover:opacity-90"
            >
              <a
                href={cardLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setTimeout(closeCard, 0)}
              >
                <ExternalLink className="mr-1.5 h-4 w-4" />
                Open the secure page
              </a>
            </Button>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                className="bg-brand-gradient text-brand-foreground hover:opacity-90"
                onClick={getCardLink}
                disabled={Boolean(busy)}
              >
                {busy === "link" ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-1.5 h-4 w-4" />
                )}
                Update now
              </Button>
              <Button
                variant="outline"
                onClick={emailCardLink}
                disabled={Boolean(busy)}
              >
                {busy === "email" ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-1.5 h-4 w-4" />
                )}
                Email me the link
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
