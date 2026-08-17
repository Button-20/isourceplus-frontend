// pages/AccountTypePage.jsx — onboarding "choose your account type" step.
//
// Serves both the onboarding flow (/onboarding/account-type, reached after the
// profile step) and the dashboard entry point (/dashboard/companies). The two
// choices — Company and Transporter — are gated by the user's job title via the
// shared rules in utils/account-type.
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Loader2,
  Building2,
  Truck,
  CheckCircle2,
  ArrowRight,
  ShieldQuestion,
} from "lucide-react";

import { useAuth } from "@/services/context/app.context";
import Logo from "@/components/common/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { canCreateCompany, canCreateTransporter } from "@/utils/account-type";

const ACCOUNT_TYPES = [
  {
    id: "company",
    title: "Company",
    icon: Building2,
    tagline: "Buy or supply goods and services",
    description:
      "Ideal for businesses managing procurement, inventory, and their supplier network.",
    features: ["Inventory management", "Supplier network", "Analytics dashboard"],
    route: "/dashboard/company",
  },
  {
    id: "transporter",
    title: "Transporter",
    icon: Truck,
    tagline: "Provide logistics and delivery",
    description:
      "Designed for logistics providers offering transportation across the supply chain.",
    features: ["Fleet management", "Route optimization", "Load matching"],
    route: "/dashboard/transporter",
  },
];

const AccountTypePage = () => {
  const {
    userProfileId,
    jobTitle: ctxJobTitle,
    companyId,
    transporterId,
    authAxios,
    logout,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Rendered both standalone in onboarding (/onboarding/account-type) and inside
  // the dashboard shell (/dashboard/companies). When embedded, drop the page
  // chrome (top bar, full-height background) so it doesn't double up on the
  // dashboard's own header and sidebar.
  const embedded = location.pathname.startsWith("/dashboard");

  const [jobTitle, setJobTitle] = useState(ctxJobTitle || null);
  const [loading, setLoading] = useState(!ctxJobTitle);
  const [selected, setSelected] = useState(null);

  // If the user already has an organization there is nothing to choose here.
  useEffect(() => {
    if (companyId || transporterId) navigate("/dashboard", { replace: true });
  }, [companyId, transporterId, navigate]);

  // Resolve the job title — it decides which account types are available.
  useEffect(() => {
    if (ctxJobTitle) {
      setJobTitle(ctxJobTitle);
      setLoading(false);
      return;
    }
    if (!userProfileId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await authAxios.get(`user-profiles/${userProfileId}/`);
        if (!cancelled) setJobTitle(data.job_title || null);
      } catch {
        if (!cancelled)
          toast.error("Couldn't load your profile. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authAxios, userProfileId, ctxJobTitle]);

  const permissions = useMemo(
    () => ({
      company: canCreateCompany(jobTitle),
      transporter: canCreateTransporter(jobTitle),
    }),
    [jobTitle],
  );

  const hasAnyOption = permissions.company || permissions.transporter;

  const handleContinue = () => {
    if (!selected || !permissions[selected]) return;
    const choice = ACCOUNT_TYPES.find((t) => t.id === selected);
    if (choice) navigate(choice.route);
  };

  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center",
          embedded ? "py-24" : "min-h-screen bg-muted/30",
        )}
      >
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-brand" />
          <p className="text-muted-foreground">Loading your account…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("font-montserrat", !embedded && "min-h-screen bg-muted/30")}>
      <div
        className={cn(
          "mx-auto max-w-5xl",
          embedded ? "w-full" : "px-4 py-8 sm:py-10",
        )}
      >
        {/* Top bar — only outside the dashboard shell, which has its own. */}
        {!embedded && (
          <div className="flex items-center justify-between">
            <Logo imgClassName="h-8" />
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              Log out
            </Button>
          </div>
        )}

        {/* Hero */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8",
            !embedded && "mt-8",
          )}
        >
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <span className="relative inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            Step 2 · Account type
          </span>
          <h1 className="relative mt-4 font-display text-2xl font-bold sm:text-3xl">
            Choose your account type
          </h1>
          <p className="relative mt-2 max-w-2xl text-sm text-white/85">
            Set up the organization that matches how you&apos;ll use iSource+.
            The options available to you are based on your role.
          </p>
        </div>

        {hasAnyOption ? (
          <>
            {/* Choice cards */}
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {ACCOUNT_TYPES.map((type) => {
                const allowed = permissions[type.id];
                const isSelected = selected === type.id;
                const Icon = type.icon;
                return (
                  <button
                    type="button"
                    key={type.id}
                    disabled={!allowed}
                    aria-pressed={isSelected}
                    onClick={() => allowed && setSelected(type.id)}
                    className={cn(
                      "group relative flex flex-col rounded-2xl border bg-card p-6 text-left transition-all",
                      allowed
                        ? "cursor-pointer hover:border-brand/40 hover:shadow-md"
                        : "cursor-not-allowed opacity-60",
                      isSelected
                        ? "border-brand ring-2 ring-brand/30"
                        : "border-border/70",
                    )}
                  >
                    {isSelected && (
                      <span className="absolute right-4 top-4 text-brand">
                        <CheckCircle2 className="h-5 w-5" />
                      </span>
                    )}
                    <span
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                        isSelected
                          ? "bg-brand-gradient text-brand-foreground"
                          : "bg-brand/10 text-brand",
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <h2 className="mt-4 font-display text-lg font-semibold">
                      {type.title}
                    </h2>
                    <p className="text-xs font-medium uppercase tracking-wide text-brand">
                      {type.tagline}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {type.description}
                    </p>
                    <ul className="mt-4 space-y-2">
                      {type.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-sm text-foreground"
                        >
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {!allowed && (
                      <p className="mt-4 text-xs text-muted-foreground">
                        Not available for your current role.
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
              >
                Skip for now
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!selected}
                className="gap-2 bg-brand-gradient text-brand-foreground hover:opacity-90"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          // Roles that can't create an organization land here.
          <div className="mt-8 rounded-2xl border border-border/70 bg-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
              <ShieldQuestion className="h-6 w-6" />
            </div>
            <h2 className="font-display text-lg font-semibold">
              You&apos;re all set
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Your role doesn&apos;t require setting up an organization. You can
              head straight to your dashboard and get started.
            </p>
            <Button
              className="mt-5 gap-2 bg-brand-gradient text-brand-foreground hover:opacity-90"
              onClick={() => navigate("/dashboard")}
            >
              Go to dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountTypePage;
