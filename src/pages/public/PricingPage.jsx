import { useCallback, useEffect, useState } from "react";
import {
  Check,
  MessageSquare,
  Building,
  AlertCircle,
  CreditCard,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import ScrollToTop from "@/components/ScrollToTop";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import { useAuth } from "@/services/context/app.context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  buyerPlans,
  supplierPlans,
  transporterPlans,
  commonFeatures,
  planTabs,
  PLAN_INTERVALS,
  BONUS_SMS,
} from "@/data/pricing-plans";
import { isBuyerView } from "@/services/api/event-lists.service";
import {
  SUBSCRIPTION_STATUS_LABELS,
  findCheckout,
  getCurrentSubscription,
  requestCardUpdate,
  saveCheckout,
  setAutoRenew,
  startSubscriptionCheckout,
  subscriptionErrorMessage,
  upgradeSubscription,
} from "@/services/api/subscriptions.service";

const PLANS_BY_TAB = {
  buyer: buyerPlans,
  supplier: supplierPlans,
  transporter: transporterPlans,
};

const intervalOf = (value) =>
  PLAN_INTERVALS.find((i) => i.value === value) || PLAN_INTERVALS[0];

const ghs = (n) =>
  `GHS ${Number(n).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (v) => {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleDateString(undefined, { dateStyle: "medium" })
    : null;
};

const titleCase = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

const defaultIntervals = (plans) =>
  plans.reduce((acc, plan) => ({ ...acc, [plan.name]: "quarterly" }), {});

export function PricingPage({ embedded = false }) {
  const navigate = useNavigate();
  const {
    authAxios,
    user,
    companyId,
    transporterId,
    token,
    userProfileId,
    fetchProfileInfo,
    jobTitle,
    viewMode,
  } = useAuth();

  // The signed-in company's own plan family, shown first.
  const userRole = transporterId
    ? "transporter"
    : user && companyId
      ? isBuyerView(jobTitle, viewMode)
        ? "buyer"
        : "supplier"
      : null;

  const [activeTab, setActiveTab] = useState(userRole || "buyer");
  const [showComparison, setShowComparison] = useState(false);
  const [selectedIntervals, setSelectedIntervals] = useState(() =>
    defaultIntervals(PLANS_BY_TAB[userRole || "buyer"]),
  );
  // { plan, mode: "subscribe" | "trial" | "upgrade" } while confirming.
  const [pending, setPending] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [subscription, setSubscription] = useState(null);
  const [subLoading, setSubLoading] = useState(false);

  const plans = PLANS_BY_TAB[activeTab];
  const opportunityLabel =
    activeTab === "buyer" ? "Competitive Offers" : "Business Opportunities";
  const opportunityOf = (p) =>
    activeTab === "buyer" ? p.competitiveOffers : p.businessOpportunities;

  useEffect(() => {
    // Embedded in the dashboard the profile is already loaded; re-fetching here
    // toggles sidebarLoading and makes the sidebar flicker to a spinner.
    if (!embedded && user && token && userProfileId) {
      fetchProfileInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authAxios, userProfileId, user, token]);

  // Open on the company's own plans once its role is known.
  useEffect(() => {
    if (userRole) {
      setActiveTab(userRole);
      setSelectedIntervals(defaultIntervals(PLANS_BY_TAB[userRole]));
    }
  }, [userRole]);

  const loadSubscription = useCallback(async () => {
    if (!user || !token) {
      setSubscription(null);
      return;
    }
    setSubLoading(true);
    try {
      setSubscription(await getCurrentSubscription());
    } catch (err) {
      // No subscription yet (or none visible): show the plain plan cards.
      console.error("Subscription load error:", err);
      setSubscription(null);
    } finally {
      setSubLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const selectTab = (tab) => {
    setActiveTab(tab);
    setSelectedIntervals(defaultIntervals(PLANS_BY_TAB[tab]));
  };

  const isCurrentPlan = (plan) =>
    Boolean(subscription) &&
    activeTab === userRole &&
    String(subscription.plan || "").toUpperCase() === plan.name.toUpperCase();

  const begin = (plan, mode) => {
    if (!user) {
      toast.error("Please log in to subscribe.", {
        icon: <AlertCircle className="w-5 h-5" />,
      });
      navigate("/login");
      return;
    }

    if ((activeTab === "buyer" || activeTab === "supplier") && !companyId) {
      toast.error("Please complete company onboarding to subscribe.", {
        icon: <AlertCircle className="w-5 h-5" />,
      });
      navigate("/dashboard/company/edit");
      return;
    }

    if (activeTab === "transporter" && !transporterId) {
      toast.error("Please complete transporter onboarding to subscribe.", {
        icon: <AlertCircle className="w-5 h-5" />,
      });
      navigate("/dashboard/transporter/edit");
      return;
    }

    setPending({ plan, mode });
  };

  // Trials are quarterly only.
  const pendingInterval = pending
    ? pending.mode === "trial"
      ? "quarterly"
      : selectedIntervals[pending.plan.name]
    : "quarterly";

  // Hand over to Paystack; /subscription/callback completes it on return.
  const goToCheckout = (checkout, details) => {
    saveCheckout(checkout, details);
    window.location.assign(checkout.authorization_url);
  };

  const confirm = async () => {
    const { plan, mode } = pending;
    const details = {
      plan_name: plan.name.toUpperCase(),
      plan_type: activeTab,
      plan_interval: pendingInterval,
      is_trial: mode === "trial",
    };
    setIsLoading(true);
    try {
      if (mode === "upgrade") {
        const res = await upgradeSubscription({
          planName: plan.name,
          planType: activeTab,
          planInterval: pendingInterval,
        });
        if (res.checkout) {
          goToCheckout(res.checkout, details);
          return;
        }
        toast.success(`You're now on the ${plan.name} plan.`);
        setPending(null);
        loadSubscription();
        return;
      }
      const checkout = await startSubscriptionCheckout({
        planName: plan.name,
        planType: activeTab,
        planInterval: pendingInterval,
        isTrial: mode === "trial",
      });
      goToCheckout(checkout, details);
    } catch (error) {
      // An unfinished earlier payment comes back with its Paystack link.
      const open = findCheckout(error.response?.data);
      toast.error(
        subscriptionErrorMessage(
          error,
          mode === "upgrade"
            ? "Couldn't change your plan. Please try again or contact support."
            : "Couldn't start the payment. Please try again or contact support.",
        ),
        {
          icon: <AlertCircle className="w-5 h-5" />,
          ...(open && {
            action: {
              label: "Continue payment",
              onClick: () => goToCheckout(open, details),
            },
          }),
        },
      );
      console.error("Subscription error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const pendingTitle = pending
    ? pending.mode === "trial"
      ? "Start your trial"
      : pending.mode === "upgrade"
        ? `Switch to ${pending.plan.name}`
        : "Confirm subscription"
    : "";

  return (
    <div className="font-montserrat">
      <ScrollToTop />
      {!embedded && <LandingNav />}

      {/* Header */}
      <section className="relative overflow-hidden bg-grid-faint">
        <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-brand-2/20 blur-3xl" />
        <div className="container relative py-16 text-center lg:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-medium text-brand">
            Pricing
          </span>
          <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Choose the plan that fits{" "}
            <span className="text-brand-gradient">your business</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Quarterly, biannual and annual plans in Ghana Cedis for buyers,
            suppliers and transporters. Save 10% biannually and 15% annually.
            All prices exclude VAT.
          </p>

          {/* Role tabs */}
          <div className="mt-8 inline-flex flex-wrap justify-center gap-2 rounded-full border border-border/70 bg-card p-1.5">
            {planTabs.map((tab) => (
              <button
                key={tab.id}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-brand-gradient text-brand-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => selectTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {subscription && (
        <section className="pb-8">
          <div className="container">
            <CurrentSubscription
              subscription={subscription}
              loading={subLoading}
              onChanged={setSubscription}
              onRefresh={loadSubscription}
            />
          </div>
        </section>
      )}

      {/* Plan cards */}
      <section className="pb-16">
        <div className="container grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const interval = intervalOf(selectedIntervals[plan.name]);
            const current = isCurrentPlan(plan);
            return (
              <div
                key={plan.name}
                className={cn(
                  "flex flex-col rounded-2xl border bg-card p-6 transition-all",
                  current
                    ? "border-emerald-500/50 ring-1 ring-emerald-500/30"
                    : plan.isPopular
                      ? "border-brand/50 shadow-xl shadow-brand/10 ring-1 ring-brand/30"
                      : "border-border/70 hover:border-brand/40 hover:shadow-lg",
                )}
              >
                {current ? (
                  <span className="mb-3 inline-flex w-fit rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    Your plan
                  </span>
                ) : (
                  plan.isPopular && (
                    <span className="mb-3 inline-flex w-fit rounded-full bg-brand-gradient px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-foreground">
                      Most popular
                    </span>
                  )
                )}
                <h2 className="font-display text-xl font-bold">{plan.name}</h2>
                {plan.description && (
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {plan.description}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-baseline gap-x-1">
                  <span className="whitespace-nowrap font-display text-3xl font-bold text-brand-gradient xl:text-4xl">
                    {ghs(plan.prices[interval.value])}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    /{interval.short}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  VAT excluded
                </p>

                {/* Billing period */}
                <div className="mt-4 space-y-2">
                  {PLAN_INTERVALS.map((opt) => (
                    <label
                      key={opt.value}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-xs transition-colors",
                        interval.value === opt.value
                          ? "border-brand/50 bg-brand/5"
                          : "border-border/60",
                      )}
                    >
                      <input
                        type="radio"
                        name={`${plan.name}-interval`}
                        value={opt.value}
                        checked={interval.value === opt.value}
                        onChange={() =>
                          setSelectedIntervals((prev) => ({
                            ...prev,
                            [plan.name]: opt.value,
                          }))
                        }
                        className="accent-[hsl(var(--brand))]"
                      />
                      <span className="text-muted-foreground">
                        {opt.label}: {ghs(plan.prices[opt.value])}
                        {opt.discount && (
                          <span className="font-medium text-brand">
                            {" "}
                            ({opt.discount})
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>

                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  <Feature icon={Check}>
                    {plan.defaultUsers} Default User
                    {plan.defaultUsers > 1 ? "s" : ""}
                  </Feature>
                  <Feature icon={Check}>
                    GHS {plan.addOnFee}/user/mo Add-On
                  </Feature>
                  <Feature icon={Check}>
                    GHS {plan.branchAddOn}/branch/mo Add-On
                  </Feature>
                  <Feature icon={MessageSquare}>{BONUS_SMS} Bonus SMS</Feature>
                  <Feature icon={Building}>
                    {opportunityOf(plan)} {opportunityLabel}
                  </Feature>
                  {commonFeatures.map((feature) => (
                    <Feature key={feature.name} icon={Check}>
                      {feature.name}
                    </Feature>
                  ))}
                </ul>

                <div className="mt-6 flex gap-3">
                  {subscription ? (
                    <Button
                      className={cn(
                        "flex-1",
                        !current &&
                          "bg-brand-gradient text-brand-foreground hover:opacity-90",
                      )}
                      variant={current ? "outline" : "default"}
                      onClick={() => begin(plan, "upgrade")}
                      disabled={isLoading || current}
                    >
                      {current ? "Current plan" : `Switch to ${plan.name}`}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => begin(plan, "trial")}
                        disabled={isLoading}
                        title="Trials are quarterly"
                      >
                        Start Trial
                      </Button>
                      <Button
                        className="flex-1 bg-brand-gradient text-brand-foreground hover:opacity-90"
                        onClick={() => begin(plan, "subscribe")}
                        disabled={isLoading}
                      >
                        Subscribe
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison toggle */}
        <div className="container mt-12 text-center">
          <Button
            variant="outline"
            onClick={() => setShowComparison((v) => !v)}
          >
            {showComparison ? "Hide comparison" : "Compare plans"}
          </Button>
        </div>

        {showComparison && (
          <div className="container mt-8">
            <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="p-3 font-semibold">Feature</th>
                    {plans.map((plan) => (
                      <th
                        key={plan.name}
                        className="p-3 text-center font-semibold"
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="[&>tr]:border-t [&>tr]:border-border/60">
                  {PLAN_INTERVALS.map((opt) => (
                    <ComparisonRow
                      key={opt.value}
                      label={`${opt.label} (GHS)`}
                      plans={plans}
                      render={(p) => ghs(p.prices[opt.value]).slice(4)}
                    />
                  ))}
                  <ComparisonRow
                    label="Default Users"
                    plans={plans}
                    render={(p) => p.defaultUsers}
                  />
                  <ComparisonRow
                    label="Add-On (GHS/user/mo)"
                    plans={plans}
                    render={(p) => p.addOnFee}
                  />
                  <ComparisonRow
                    label={opportunityLabel}
                    plans={plans}
                    render={opportunityOf}
                  />
                  <ComparisonRow
                    label="Bonus SMS"
                    plans={plans}
                    render={() => BONUS_SMS}
                  />
                  {commonFeatures.map((feature) => (
                    <tr key={feature.name}>
                      <td className="p-3">{feature.name}</td>
                      {plans.map((plan) => (
                        <td key={plan.name} className="p-3 text-center">
                          <Check className="mx-auto h-4 w-4 text-brand" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {!embedded && <LandingFooter />}

      {/* Confirmation dialog */}
      <Dialog
        open={Boolean(pending)}
        onOpenChange={(open) => !open && !isLoading && setPending(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pendingTitle}</DialogTitle>
            <DialogDescription>
              Please confirm the plan details below.
            </DialogDescription>
          </DialogHeader>
          {pending && (
            <div className="space-y-3 text-sm">
              <p>
                <strong>Plan:</strong> {pending.plan.name} ({activeTab})
              </p>
              <p>
                <strong>Billing:</strong> {intervalOf(pendingInterval).label}
                {pending.mode === "trial" && " (trials are quarterly)"}
              </p>
              <p>
                <strong>Cost:</strong>{" "}
                {ghs(pending.plan.prices[pendingInterval])} per{" "}
                {intervalOf(pendingInterval).short}, VAT excluded
              </p>
              {pending.mode === "trial" ? (
                <p className="text-muted-foreground">
                  You&apos;ll add a card on Paystack to start the trial. Your
                  subscription shows when the trial ends.
                </p>
              ) : pending.mode === "upgrade" ? (
                <p className="text-muted-foreground">
                  Your plan changes from{" "}
                  {titleCase(subscription?.plan) || "your current plan"} to{" "}
                  {pending.plan.name}. If a payment is needed you&apos;ll be
                  taken to Paystack.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  You&apos;ll be taken to Paystack to complete the payment.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPending(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-brand-gradient text-brand-foreground hover:opacity-90"
              onClick={confirm}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// The company's current plan: status, dates, auto-renewal and saved card.
function CurrentSubscription({ subscription, loading, onChanged, onRefresh }) {
  const [busy, setBusy] = useState("");
  const [confirmOff, setConfirmOff] = useState(false);

  const status = subscription.status;
  const renewing = status === "ACTIVE" || status === "ATTENTION";
  const canResume = status === "NOT_RENEW";
  const trialEnds =
    subscription.is_trial && fmtDate(subscription.trial_ends_at);
  const nextPayment = fmtDate(subscription.next_payment_date);

  const toggleRenew = async (on) => {
    setBusy(on ? "on" : "off");
    try {
      const updated = await setAutoRenew(subscription.id, on);
      toast.success(
        on ? "Auto-renewal is back on." : "Auto-renewal is turned off.",
      );
      setConfirmOff(false);
      if (updated && typeof updated === "object" && updated.id) {
        onChanged(updated);
      } else {
        onRefresh();
      }
    } catch (err) {
      toast.error(
        subscriptionErrorMessage(err, "Couldn't update auto-renewal."),
      );
      console.error("Auto-renew error:", err);
    } finally {
      setBusy("");
    }
  };

  const updateCard = async () => {
    setBusy("card");
    try {
      const link = await requestCardUpdate(subscription.id);
      if (link) {
        toast.success("Your card update link is ready.", {
          duration: 15000,
          action: {
            label: "Open",
            onClick: () => window.open(link, "_blank", "noopener"),
          },
        });
      } else {
        await requestCardUpdate(subscription.id, { email: true });
        toast.success("We've emailed you a link to update your card.");
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

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Your subscription
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl font-bold">
            {titleCase(subscription.plan) || "Plan"}
          </h2>
          {status && (
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                status === "ACTIVE"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : status === "ATTENTION"
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {SUBSCRIPTION_STATUS_LABELS[status] || status}
            </span>
          )}
          {subscription.is_trial && (
            <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
              Trial
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {trialEnds
            ? `Trial ends ${trialEnds}.`
            : nextPayment
              ? canResume
                ? `Active until ${nextPayment}; it won't renew.`
                : `Next payment ${nextPayment}.`
              : ""}
          {status === "ATTENTION" &&
            " The last payment didn't go through — update your card."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading || Boolean(busy)}
          aria-label="Refresh subscription"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={updateCard}
          disabled={Boolean(busy)}
        >
          {busy === "card" ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="mr-1.5 h-4 w-4" />
          )}
          Update card
        </Button>
        {renewing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmOff(true)}
            disabled={Boolean(busy)}
          >
            Turn off auto-renewal
          </Button>
        )}
        {canResume && (
          <Button
            size="sm"
            className="bg-brand-gradient text-brand-foreground hover:opacity-90"
            onClick={() => toggleRenew(true)}
            disabled={Boolean(busy)}
          >
            {busy === "on" && (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            Turn on auto-renewal
          </Button>
        )}
      </div>

      <Dialog
        open={confirmOff}
        onOpenChange={(open) => !busy && setConfirmOff(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Turn off auto-renewal?</DialogTitle>
            <DialogDescription>
              Your plan won&apos;t renew
              {nextPayment ? ` on ${nextPayment}` : ""}. You can turn
              auto-renewal back on at any time before then.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOff(false)}
              disabled={Boolean(busy)}
            >
              Keep it on
            </Button>
            <Button
              variant="destructive"
              onClick={() => toggleRenew(false)}
              disabled={Boolean(busy)}
            >
              {busy === "off" && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              Turn off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Feature({ icon: Icon, children }) {
  return (
    <li className="flex items-start gap-2 text-muted-foreground">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
      <span>{children}</span>
    </li>
  );
}

function ComparisonRow({ label, plans, render }) {
  return (
    <tr>
      <td className="p-3 font-medium">{label}</td>
      {plans.map((plan) => (
        <td key={plan.name} className="p-3 text-center">
          {render(plan)}
        </td>
      ))}
    </tr>
  );
}
