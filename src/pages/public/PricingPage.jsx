import { useEffect, useState } from "react";
import {
  Check,
  MessageSquare,
  Users,
  Building,
  Truck,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import ScrollToTop from "@/components/ScrollToTop";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import { useAuth } from "@/services/context/app.context";
import { storage } from "@/services/lib/storage";
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
} from "@/data/pricing-plans";

export function PricingPage({ embedded = false }) {
  const [activeTab, setActiveTab] = useState("buyer");
  const [showComparison, setShowComparison] = useState(false);
  const [selectedPlans, setSelectedPlans] = useState(
    buyerPlans.reduce((acc, plan) => ({ ...acc, [plan.name]: "biannually" }), {}),
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isTrial, setIsTrial] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const {
    authAxios,
    user,
    companyId,
    transporterId,
    token,
    userProfileId,
    fetchProfileInfo,
  } = useAuth();

  const plans =
    activeTab === "buyer"
      ? buyerPlans
      : activeTab === "supplier"
        ? supplierPlans
        : transporterPlans;
  const marketAccessKey =
    activeTab === "buyer" ? "suppliersMarketBase" : "buyersMarketBase";
  const marketAccessLabel =
    activeTab === "buyer" ? "Suppliers’ Market Base" : "Buyers’ Market Base";
  const opportunityLabel =
    activeTab === "buyer" ? "Competitive Offers" : "Business Opportunities";
  const registeredLabel =
    activeTab === "buyer"
      ? "Registered Buyers"
      : activeTab === "supplier"
        ? "Registered Suppliers"
        : "Registered Transporters";

  useEffect(() => {
    // Embedded in the dashboard the profile is already loaded; re-fetching here
    // toggles sidebarLoading and makes the sidebar flicker to a spinner.
    if (!embedded && user && token && userProfileId) {
      fetchProfileInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authAxios, userProfileId, user, token]);

  const selectTab = (tab, source) => {
    setActiveTab(tab);
    setSelectedPlans(
      source.reduce((acc, plan) => ({ ...acc, [plan.name]: "biannually" }), {}),
    );
  };

  const handlePlanSelection = (planName, value) => {
    setSelectedPlans((prev) => ({ ...prev, [planName]: value }));
  };

  const initiateSubscription = (plan, isTrialMode) => {
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

    setSelectedPlan(plan);
    setIsTrial(isTrialMode);
    setIsModalOpen(true);
  };

  const confirmSubscription = async () => {
    setIsLoading(true);
    try {
      const planInterval = selectedPlans[selectedPlan.name];
      const backendPlanInterval =
        planInterval === "biannually"
          ? "biannually"
          : planInterval === "annually"
            ? "annually"
            : "monthly";
      const startDate = isTrial
        ? new Date(Date.now() + 28 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        : null;

      const planName = selectedPlan.name.toUpperCase();
      const planType = activeTab;

      // CSRF is injected automatically by the shared HTTP client.
      const response = await authAxios.post(
        "subscriptions/subscribe/",
        {},
        {
          params: {
            plan_name: planName,
            plan_type: planType,
            plan_interval: backendPlanInterval,
            ...(isTrial && { is_trial: true, start_date: startDate }),
          },
        },
      );

      if (!response.data?.data?.paystack_transaction_data) {
        throw new Error(
          "Invalid response structure: paystack_transaction_data is missing",
        );
      }

      const { authorization_url, reference } =
        response.data.data.paystack_transaction_data.data;

      storage.setJSON("subscriptionData", {
        plan_code:
          response.data.data.plan_code ||
          `${activeTab.toUpperCase()}_${planName}_${backendPlanInterval.toUpperCase()}`,
        plan_name: planName,
        plan_type: planType,
        plan_interval: backendPlanInterval,
        is_trial: isTrial,
        start_date: startDate,
        reference,
        authorization_url,
      });

      window.open(authorization_url, "_blank");
      setIsModalOpen(false);
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error("User not authenticated or company details missing.", {
          icon: <AlertCircle className="w-5 h-5" />,
        });
        navigate("/login");
      } else if (error.response?.status === 402) {
        toast.error("Abandoned transaction found.", {
          icon: <AlertCircle className="w-5 h-5" />,
          action: {
            label: "Continue Transaction",
            onClick: () =>
              window.open(error.response.data.authorization_url, "_blank"),
          },
        });
      } else if (error.response?.status === 403) {
        toast.error(
          error.response?.data?.detail ||
            "You do not have permission to perform this action. Please check your account or contact support.",
          { icon: <AlertCircle className="w-5 h-5" /> },
        );
      } else {
        toast.error(
          error.response?.data?.detail ||
            error.message ||
            "Failed to initiate subscription. Please try again or contact support.",
          { icon: <AlertCircle className="w-5 h-5" /> },
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const discountLabel = (months) =>
    activeTab === "transporter"
      ? months === 6
        ? "15% off"
        : "25% off"
      : months === 6
        ? "20% off"
        : "30% off";

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
            Flexible monthly plans in Ghana Cedis for buyers, suppliers, and
            transporters. All prices exclude VAT.
          </p>

          {/* Role tabs */}
          <div className="mt-8 inline-flex flex-wrap justify-center gap-2 rounded-full border border-border/70 bg-card p-1.5">
            {planTabs.map((tab) => {
              const source =
                tab.id === "buyer"
                  ? buyerPlans
                  : tab.id === "supplier"
                    ? supplierPlans
                    : transporterPlans;
              return (
                <button
                  key={tab.id}
                  className={cn(
                    "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "bg-brand-gradient text-brand-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => selectTab(tab.id, source)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Plan cards */}
      <section className="pb-16">
        <div className="container grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "flex flex-col rounded-2xl border bg-card p-6 transition-all",
                plan.isPopular
                  ? "border-brand/50 shadow-xl shadow-brand/10 ring-1 ring-brand/30"
                  : "border-border/70 hover:border-brand/40 hover:shadow-lg",
              )}
            >
              {plan.isPopular && (
                <span className="mb-3 inline-flex w-fit rounded-full bg-brand-gradient px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-foreground">
                  Most popular
                </span>
              )}
              <h2 className="font-display text-xl font-bold">{plan.name}</h2>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold text-brand-gradient">
                  GHC {plan.monthlyRate}
                </span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">VAT excluded</p>

              {/* Duration selector */}
              <div className="mt-4 space-y-2">
                {[
                  {
                    value: "biannually",
                    months: 6,
                    label: "6-Month",
                    amount: plan.sixMonthRate,
                  },
                  {
                    value: "annually",
                    months: 12,
                    label: "12-Month",
                    amount: plan.twelveMonthRate,
                  },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-xs transition-colors",
                      selectedPlans[plan.name] === opt.value
                        ? "border-brand/50 bg-brand/5"
                        : "border-border/60",
                    )}
                  >
                    <input
                      type="radio"
                      name={`${plan.name}-duration`}
                      value={opt.value}
                      checked={selectedPlans[plan.name] === opt.value}
                      onChange={() => handlePlanSelection(plan.name, opt.value)}
                      className="accent-[hsl(var(--brand))]"
                    />
                    <span className="text-muted-foreground">
                      {opt.label}: GHC {opt.amount}{" "}
                      <span className="font-medium text-brand">
                        ({discountLabel(opt.months)})
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              <ul className="mt-5 flex-1 space-y-2 text-sm">
                <Feature icon={Check}>
                  {plan.defaultUsers} Default User
                  {plan.defaultUsers > 1 ? "s" : ""}
                </Feature>
                <Feature icon={Check}>GHC {plan.addOnFee}/user/mo Add-On</Feature>
                <Feature icon={Check}>
                  GHC {plan.branchAddOn}/branch/mo Add-On
                </Feature>
                <Feature icon={MessageSquare}>
                  {plan.transactionalSMS} Transactional SMS
                </Feature>
                <Feature icon={Building}>
                  {activeTab === "buyer"
                    ? plan.competitiveOffers
                    : plan.businessOpportunities}{" "}
                  {opportunityLabel}
                </Feature>
                <Feature icon={Users}>
                  {plan[marketAccessKey]} {marketAccessLabel}
                </Feature>
                <Feature icon={activeTab === "transporter" ? Truck : Users}>
                  {activeTab === "buyer"
                    ? plan.registeredBuyers
                    : activeTab === "supplier"
                      ? plan.registeredSuppliers
                      : plan.registeredTransporters}{" "}
                  {registeredLabel}
                </Feature>
                {commonFeatures.map((feature) => (
                  <Feature key={feature.name} icon={Check}>
                    {feature.name}
                  </Feature>
                ))}
              </ul>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => initiateSubscription(plan, true)}
                  disabled={isLoading}
                >
                  Start Trial
                </Button>
                <Button
                  className="flex-1 bg-brand-gradient text-brand-foreground hover:opacity-90"
                  onClick={() => initiateSubscription(plan, false)}
                  disabled={isLoading}
                >
                  Subscribe
                </Button>
              </div>
            </div>
          ))}
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
                      <th key={plan.name} className="p-3 text-center font-semibold">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="[&>tr]:border-t [&>tr]:border-border/60">
                  <ComparisonRow label="Monthly Rate (GHC)" plans={plans} render={(p) => p.monthlyRate} />
                  <ComparisonRow label={`6-Month (GHC)`} plans={plans} render={(p) => p.sixMonthRate} />
                  <ComparisonRow label={`12-Month (GHC)`} plans={plans} render={(p) => p.twelveMonthRate} />
                  <ComparisonRow label="Default Users" plans={plans} render={(p) => p.defaultUsers} />
                  <ComparisonRow label="Add-On (GHC/user/mo)" plans={plans} render={(p) => p.addOnFee} />
                  <ComparisonRow label={opportunityLabel} plans={plans} render={(p) => (activeTab === "buyer" ? p.competitiveOffers : p.businessOpportunities)} />
                  <ComparisonRow label={marketAccessLabel} plans={plans} render={(p) => p[marketAccessKey]} />
                  <ComparisonRow label="Transactional SMS" plans={plans} render={(p) => p.transactionalSMS} />
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
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm {isTrial ? "Trial" : "Subscription"}
            </DialogTitle>
            <DialogDescription>
              Please confirm your subscription details below.
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-3 text-sm">
              <p>
                <strong>Plan:</strong> {selectedPlan.name} ({activeTab})
              </p>
              <p>
                <strong>Duration:</strong>{" "}
                {selectedPlans[selectedPlan.name] === "biannually"
                  ? "6 Months (Biannually)"
                  : selectedPlans[selectedPlan.name] === "annually"
                    ? "12 Months (Annually)"
                    : "Monthly"}
              </p>
              <p>
                <strong>Cost:</strong> GHC{" "}
                {selectedPlans[selectedPlan.name] === "biannually"
                  ? selectedPlan.sixMonthRate
                  : selectedPlan.twelveMonthRate}
              </p>
              {isTrial && (
                <p>
                  <strong>Trial Period:</strong> 28 days (ends on{" "}
                  {new Date(
                    Date.now() + 28 * 24 * 60 * 60 * 1000,
                  ).toLocaleDateString()}
                  )
                </p>
              )}
              <p className="text-muted-foreground">
                You will be redirected to Paystack to complete the{" "}
                {isTrial ? "trial" : "subscription"}.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-brand-gradient text-brand-foreground hover:opacity-90"
              onClick={confirmSubscription}
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
