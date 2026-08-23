import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
  FileText,
  Gavel,
  ReceiptText,
  ShoppingCart,
  Truck,
  Wallet,
  ArrowRight,
  Plus,
  Building2,
  BadgeCheck,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "@/services/context/app.context";
import { getResourceCount } from "@/services/api/dashboard.service";
import BuyerOverview from "@/components/dashboard/BuyerOverview";
import SupplierOverview from "@/components/dashboard/SupplierOverview";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Resource catalog — endpoint (DRF list), destination route, and icon.
const RESOURCES = {
  rfx: { label: "RFx", endpoint: "rfxs/", href: "/dashboard/rfxs", icon: FileText },
  tenders: { label: "Tenders", endpoint: "tenders/", href: "/dashboard/tenders", icon: Gavel },
  proforma: {
    label: "Proforma Invoices",
    endpoint: "proforma-invoices/",
    href: "/dashboard/proforma-invoices",
    icon: ReceiptText,
  },
  purchaseOrders: {
    label: "Purchase Orders",
    endpoint: "purchase-orders/",
    href: "/dashboard/purchase-orders",
    icon: ShoppingCart,
  },
  salesInvoices: {
    label: "Sales Invoices",
    endpoint: "sales-invoices/",
    href: "/dashboard/sales-invoices",
    icon: Wallet,
  },
  waybills: { label: "Waybills", endpoint: "waybills/", href: "/dashboard/waybills", icon: Truck },
  paymentOrders: {
    label: "Payment Orders",
    endpoint: "payment-orders/",
    href: "/dashboard/payment-orders/issued",
    icon: Wallet,
  },
};

// Which stats + quick actions each role sees.
const ROLE_CONFIG = {
  "lead buyer": {
    stats: ["rfx", "tenders", "proforma", "purchaseOrders"],
    actions: [
      { label: "Create RFx", href: "/dashboard/rfxs/new", icon: FileText },
      { label: "Create Tender", href: "/dashboard/tenders/new", icon: Gavel },
      { label: "View Purchase Orders", href: "/dashboard/purchase-orders/issued", icon: ShoppingCart },
      { label: "Issued Waybills", href: "/dashboard/waybills/issued", icon: Truck },
    ],
  },
  "sales manager": {
    stats: ["proforma", "salesInvoices", "purchaseOrders", "paymentOrders"],
    actions: [
      { label: "Create Sales Invoice", href: "/dashboard/sales-invoices/create-sales-invoice", icon: Wallet },
      { label: "Proforma Invoices", href: "/dashboard/proforma-invoices", icon: ReceiptText },
      { label: "Purchase Orders", href: "/dashboard/purchase-orders", icon: ShoppingCart },
      { label: "Payment Orders", href: "/dashboard/payment-orders/issued", icon: Wallet },
    ],
  },
  "logistics manager": {
    stats: ["waybills", "proforma", "purchaseOrders", "paymentOrders"],
    actions: [
      { label: "All Waybills", href: "/dashboard/waybills", icon: Truck },
      { label: "Sales Invoices", href: "/dashboard/sales-invoices", icon: Wallet },
      { label: "Purchase Orders", href: "/dashboard/purchase-orders", icon: ShoppingCart },
      { label: "Payment Orders", href: "/dashboard/payment-orders/issued", icon: Wallet },
    ],
  },
};

const DEFAULT_CONFIG = {
  stats: ["rfx", "tenders", "proforma", "purchaseOrders"],
  actions: [
    { label: "View RFx", href: "/dashboard/rfxs", icon: FileText },
    { label: "View Tenders", href: "/dashboard/tenders", icon: Gavel },
    { label: "Proforma Invoices", href: "/dashboard/proforma-invoices", icon: ReceiptText },
    { label: "Purchase Orders", href: "/dashboard/purchase-orders", icon: ShoppingCart },
  ],
};

function StatCard({ resource, count, loading }) {
  const Icon = resource.icon;
  return (
    <Card className="transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{resource.label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-14" />
          ) : (
            <p className="mt-1 font-display text-3xl font-bold">
              {count ?? "—"}
            </p>
          )}
          <Button
            variant="link"
            asChild
            className="mt-1 h-auto p-0 text-xs text-brand"
          >
            <Link to={resource.href}>
              View all <ArrowRight className="ml-0.5 h-3 w-3" />
            </Link>
          </Button>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashBoardHome() {
  const { user, token, jobTitle, companyId, transporterId, viewMode } =
    useAuth();
  const location = useLocation();
  const [counts, setCounts] = useState({});
  const [loadingCounts, setLoadingCounts] = useState(true);

  const config = ROLE_CONFIG[jobTitle] || DEFAULT_CONFIG;
  const statKeys = config.stats;

  // The overview follows the global Buyer/Supplier toggle (see ViewModeToggle).
  const overviewVariant = viewMode;

  useEffect(() => {
    // The buyer and supplier overviews fetch their own data; only the generic
    // resource-count grid needs the counts fetched here.
    if (overviewVariant !== "generic") {
      setLoadingCounts(false);
      return;
    }
    let cancelled = false;
    setLoadingCounts(true);
    const keys = config.stats;
    Promise.allSettled(
      keys.map((k) => getResourceCount(RESOURCES[k].endpoint)),
    ).then((results) => {
      if (cancelled) return;
      const next = {};
      keys.forEach((k, i) => {
        next[k] = results[i].status === "fulfilled" ? results[i].value : null;
      });
      setCounts(next);
      setLoadingCounts(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobTitle]);

  if (!user && !token) {
    return <Navigate state={{ from: location }} to="/login" replace />;
  }

  const roleLabel = jobTitle
    ? jobTitle.replace(/\b\w/g, (c) => c.toUpperCase())
    : "Member";
  const hasOrg = Boolean(companyId || transporterId);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Greeting */}
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/80">{roleLabel} dashboard</p>
            <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
              Welcome back{user ? `, ${user}` : ""}
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/85">
              Here&apos;s an overview of your procurement activity. Jump back
              into a workflow or start something new.
            </p>
          </div>
          <Button
            asChild
            className="bg-white text-brand hover:bg-white/90"
          >
            <Link to={config.actions[0].href}>
              <Plus className="mr-1.5 h-4 w-4" />
              {config.actions[0].label}
            </Link>
          </Button>
        </div>
      </div>

      {/* Onboarding nudge */}
      {!hasOrg && (
        <Card className="border-amber-300/60 bg-amber-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
            <p className="flex-1 text-sm text-amber-800">
              Finish setting up your organization to unlock the full workspace.
            </p>
            <Button size="sm" variant="outline" asChild>
              <Link to="/dashboard/companies">Set up</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats — buyers and suppliers get their dedicated dashboard overviews;
          other roles get the generic resource-count grid. */}
      {overviewVariant === "supplier" ? (
        <SupplierOverview />
      ) : overviewVariant === "buyer" ? (
        <BuyerOverview />
      ) : (
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold">Overview</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statKeys.map((key) => (
              <StatCard
                key={key}
                resource={RESOURCES[key]}
                count={counts[key]}
                loading={loadingCounts}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">Quick actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {config.actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4",
                  "transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5",
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand-gradient group-hover:text-brand-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Account summary */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-brand" /> Organization
            </CardTitle>
            <CardDescription>Your account setup at a glance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium">{roleLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Organization</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-medium",
                  hasOrg ? "text-emerald-600" : "text-amber-600",
                )}
              >
                {hasOrg ? (
                  <>
                    <BadgeCheck className="h-4 w-4" /> Active
                  </>
                ) : (
                  "Incomplete"
                )}
              </span>
            </div>
            <Button variant="outline" size="sm" asChild className="mt-2">
              <Link to="/dashboard/companies">Manage organization</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Need a hand?</CardTitle>
            <CardDescription>
              Explore the marketplace or review your subscription.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/marketplace">Browse marketplace</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/pricing">View plans</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
