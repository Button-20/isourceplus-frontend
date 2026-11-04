// Subscription management for the signed-in company: what it's on (fresh from
// GET subscriptions/{id}/), and the actions — change plan (upgrade), cancel,
// reactivate and update the payment method — plus its subscription history.
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowUpRight,
  CreditCard,
  ExternalLink,
  History,
  Loader2,
  Mail,
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

function Detail({ label, children }) {
  if (!children) return null;
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{children}</dd>
    </div>
  );
}

export default function SubscriptionManager({
  overview,
  loading,
  error,
  planType,
  onRefresh,
  onChangePlan,
}) {
  const { current, cancelled, history = [] } = overview || {};
  const sub = current || cancelled;
  const [busy, setBusy] = useState("");
  // "cancel" | "reactivate" | "card" while its dialog is open.
  const [dialog, setDialog] = useState(null);
  const [cardLink, setCardLink] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-border/70 bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="font-medium">Couldn&apos;t load your subscription</p>
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
  if (!sub) return null;

  const status = sub.status;
  const renewing = Boolean(current) && status !== "NOT_RENEW";
  const canReactivate = status === "NOT_RENEW" || status === "CANCELLED";
  const nextPayment = fmtDate(sub.next_payment_date);
  const trialEnds = sub.is_trial ? fmtDate(sub.trial_ends_at) : "";

  const note =
    status === "ATTENTION"
      ? "The last payment didn't go through. Update your payment method to keep your plan."
      : status === "NOT_RENEW"
        ? `Cancelled — your plan stays active${nextPayment ? ` until ${nextPayment}` : " until the end of the paid period"}. Reactivate to keep it.`
        : status === "CANCELLED"
          ? "This subscription was cancelled. Reactivate it, or choose a plan below."
          : status === "PROCESSING"
            ? "Your payment is being processed."
            : sub.is_upgrading
              ? "Your plan change is being processed."
              : "";

  const close = () => {
    if (busy) return;
    setDialog(null);
    setCardLink("");
  };

  const changeRenewal = async (on) => {
    setBusy(on ? "reactivate" : "cancel");
    try {
      await (on ? reactivateSubscription(sub.id) : cancelSubscription(sub.id));
      toast.success(
        on
          ? "Your subscription is active again."
          : `Subscription cancelled.${nextPayment ? ` Your plan stays active until ${nextPayment}.` : ""}`,
      );
      setDialog(null);
      onRefresh();
    } catch (err) {
      toast.error(
        subscriptionErrorMessage(
          err,
          on
            ? "Couldn't reactivate your subscription."
            : "Couldn't cancel your subscription.",
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
      const link = await requestCardUpdate(sub.id);
      if (link) setCardLink(link);
      else {
        await requestCardUpdate(sub.id, { email: true });
        toast.success("We've emailed you a link to update your card.");
        setDialog(null);
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
      await requestCardUpdate(sub.id, { email: true });
      toast.success("We've emailed you a link to update your card.");
      setDialog(null);
    } catch (err) {
      toast.error(
        subscriptionErrorMessage(err, "Couldn't email the card update link."),
      );
      console.error("Card update email error:", err);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {current ? "Your subscription" : "Your last subscription"}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-bold">
              {titleCase(sub.plan) || "Plan"}
            </h2>
            <StatusBadge status={status} />
            {sub.is_trial && (
              <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
                Trial
              </span>
            )}
          </div>
          {note && (
            <p
              className={cn(
                "mt-1.5 text-sm",
                status === "ATTENTION"
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-muted-foreground",
              )}
            >
              {note}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading || Boolean(busy)}
            aria-label="Refresh subscription"
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          {current && (
            <Button
              size="sm"
              className="bg-brand-gradient text-brand-foreground hover:opacity-90"
              onClick={onChangePlan}
              disabled={Boolean(busy)}
            >
              <ArrowUpRight className="mr-1.5 h-4 w-4" />
              Change plan
            </Button>
          )}
          {current && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialog("card")}
              disabled={Boolean(busy)}
            >
              <CreditCard className="mr-1.5 h-4 w-4" />
              Update payment method
            </Button>
          )}
          {renewing && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDialog("cancel")}
              disabled={Boolean(busy)}
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              Cancel subscription
            </Button>
          )}
          {canReactivate && (
            <Button
              size="sm"
              className="bg-brand-gradient text-brand-foreground hover:opacity-90"
              onClick={() => setDialog("reactivate")}
              disabled={Boolean(busy)}
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Reactivate
            </Button>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 border-t border-border/60 px-6 py-4 sm:grid-cols-3 lg:grid-cols-6">
        <Detail label="Plan type">{titleCase(planType)}</Detail>
        <Detail label="Billed to">{sub.entity_name}</Detail>
        <Detail label="Started">{fmtDate(sub.start_date)}</Detail>
        <Detail label="Trial ends">{trialEnds}</Detail>
        <Detail
          label={status === "NOT_RENEW" ? "Active until" : "Next payment"}
        >
          {status === "CANCELLED" ? "" : nextPayment}
        </Detail>
        <Detail label="Branches">
          {Array.isArray(sub.branches) && sub.branches.length > 0
            ? sub.branches.length
            : ""}
        </Detail>
      </dl>

      {history.length > 1 && (
        <div className="border-t border-border/60">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="flex w-full items-center gap-2 px-6 py-3 text-left text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <History className="h-4 w-4" />
            {showHistory ? "Hide" : "Show"} subscription history (
            {history.length})
          </button>
          {showHistory && (
            <div className="overflow-x-auto px-6 pb-4">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Plan</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Started</th>
                    <th className="py-2 pr-4 font-medium">
                      Next / last payment
                    </th>
                  </tr>
                </thead>
                <tbody className="[&>tr]:border-t [&>tr]:border-border/60">
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="py-2 pr-4">
                        {titleCase(h.plan) || "—"}
                        {h.is_trial && (
                          <span className="ml-1.5 text-xs text-brand">
                            (trial)
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        <StatusBadge status={h.status} />
                      </td>
                      <td className="py-2 pr-4">
                        {fmtDate(h.start_date || h.created_at) || "—"}
                      </td>
                      <td className="py-2 pr-4">
                        {fmtDate(h.next_payment_date) || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Cancel / reactivate */}
      <Dialog
        open={dialog === "cancel" || dialog === "reactivate"}
        onOpenChange={(o) => !o && close()}
      >
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialog === "cancel"
                ? "Cancel your subscription?"
                : "Reactivate your subscription?"}
            </DialogTitle>
            <DialogDescription>
              {dialog === "cancel"
                ? `It won't renew${nextPayment ? ` on ${nextPayment}` : ""}. You keep your ${titleCase(sub.plan)} plan until then, and can reactivate it at any time before it ends.`
                : `Your ${titleCase(sub.plan)} plan will renew automatically${nextPayment && status !== "CANCELLED" ? ` on ${nextPayment}` : ""} using your saved payment method.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={Boolean(busy)}>
              {dialog === "cancel" ? "Keep subscription" : "Not now"}
            </Button>
            {dialog === "cancel" ? (
              <Button
                variant="destructive"
                onClick={() => changeRenewal(false)}
                disabled={Boolean(busy)}
              >
                {busy === "cancel" && (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                )}
                Cancel subscription
              </Button>
            ) : (
              <Button
                className="bg-brand-gradient text-brand-foreground hover:opacity-90"
                onClick={() => changeRenewal(true)}
                disabled={Boolean(busy)}
              >
                {busy === "reactivate" && (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                )}
                Reactivate
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update payment method */}
      <Dialog open={dialog === "card"} onOpenChange={(o) => !o && close()}>
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
                onClick={() => setTimeout(close, 0)}
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
