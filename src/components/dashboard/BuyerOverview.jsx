import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Gavel,
  ReceiptText,
  Users,
  ShoppingCart,
  Wallet,
  ArrowRight,
  ArrowLeftRight,
} from "lucide-react";

import {
  getActiveRfxs,
  getActiveTenders,
  getReceivedOffers,
  getTotalSuppliers,
  getPurchaseOrderValue,
  getTotalPaymentOrders,
  getPayments,
  getPoToOffersPercentages,
  getPoToPaymentPercentages,
  getEventsFrequency,
} from "@/services/api/buyerDashboard.service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import EventsCard from "@/components/dashboard/EventsCard";

const num = (obj, key) => Number(obj?.[key] ?? 0) || 0;
const sumValues = (obj) =>
  obj && typeof obj === "object"
    ? Object.values(obj).reduce((a, v) => a + (Number(v) || 0), 0)
    : 0;
const formatMoney = (n) =>
  new Intl.NumberFormat("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);

/* -------------------------------- cards -------------------------------- */

function StatCard({ icon: Icon, label, value, sub, prefix, loading, href }) {
  return (
    <Card className="transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5">
      <CardContent className="flex items-start justify-between p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-20" />
          ) : (
            <p className="mt-1 font-display text-3xl font-bold">
              {prefix ?? ""}
              {value}
            </p>
          )}
          {sub && !loading && (
            <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
          )}
          {href && (
            <Button
              variant="link"
              asChild
              className="mt-1 h-auto p-0 text-xs text-brand"
            >
              <Link to={href}>
                View all <ArrowRight className="ml-0.5 h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function ComparisonCard({ title, data, parts, comparedKey, loading }) {
  const compared = num(data, comparedKey);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>Inflow / outflow comparison.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </>
        ) : (
          <>
            {parts.map((p, i) => {
              const val = num(data, p.key);
              return (
                <div key={p.key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{p.label}</span>
                    <span className="font-medium">{val.toFixed(1)}%</span>
                  </div>
                  <Progress
                    value={Math.max(0, Math.min(100, val))}
                    className={cn(i === 1 && "[&>div]:bg-brand-2")}
                  />
                </div>
              );
            })}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <ArrowLeftRight className="h-3.5 w-3.5 text-brand" /> Net inflow /
                outflow
              </span>
              <span className="font-semibold">{compared.toFixed(1)}%</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function BuyerOverview() {
  const [state, setState] = useState({ loading: true, data: {} });

  useEffect(() => {
    let cancelled = false;
    const calls = {
      activeRfxs: getActiveRfxs,
      activeTenders: getActiveTenders,
      receivedOffers: getReceivedOffers,
      totalSuppliers: getTotalSuppliers,
      purchaseOrderValue: getPurchaseOrderValue,
      totalPaymentOrders: getTotalPaymentOrders,
      payments: getPayments,
      poToOffers: getPoToOffersPercentages,
      poToPayment: getPoToPaymentPercentages,
      events: getEventsFrequency,
    };
    const keys = Object.keys(calls);
    Promise.allSettled(keys.map((k) => calls[k]())).then((results) => {
      if (cancelled) return;
      const data = {};
      keys.forEach((k, i) => {
        data[k] = results[i].status === "fulfilled" ? results[i].value : null;
      });
      setState({ loading: false, data });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { loading, data } = state;
  const rfx = data.activeRfxs || {};
  const tenders = data.activeTenders || {};

  const stats = [
    {
      icon: FileText,
      label: "Active RFx",
      value: sumValues(rfx),
      sub: `RFQ ${rfx.rfq ?? 0} · RFP ${rfx.rfp ?? 0} · RFI ${rfx.rfi ?? 0}`,
      href: "/dashboard/rfxs",
    },
    {
      icon: Gavel,
      label: "Active Tenders",
      value: sumValues(tenders),
      sub: `ICT ${tenders.tender_ict ?? 0} · NCT ${tenders.tender_nct ?? 0}`,
      href: "/dashboard/tenders",
    },
    {
      icon: ReceiptText,
      label: "Received Offers",
      value: num(data.receivedOffers, "total_offers_received"),
      href: "/dashboard/business-offers",
    },
    {
      icon: Users,
      label: "Registered Suppliers",
      value: num(data.totalSuppliers, "customer_base_supplier"),
    },
    {
      icon: ShoppingCart,
      label: "Purchase Order Value",
      prefix: "GHC ",
      value: formatMoney(data.purchaseOrderValue?.total_purchase_order_value),
      href: "/dashboard/purchase-orders",
    },
    {
      icon: Wallet,
      label: "Payment Orders",
      value: num(data.totalPaymentOrders, "total_payment_orders_received"),
      href: "/dashboard/payment-orders",
    },
    {
      icon: Wallet,
      label: "Payments",
      value: num(data.payments, "received_payment_orders"),
      sub: `${num(data.payments, "payments_made")} paid`,
      href: "/dashboard/payment-orders",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <StatCard key={s.label} loading={loading} {...s} />
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ComparisonCard
          title="Purchase Orders vs Offers Received"
          data={data.poToOffers}
          parts={[
            {
              key: "purchase_orders_raised_percentage",
              label: "Purchase orders raised",
            },
            {
              key: "proformas_submitted_percentage",
              label: "Proformas submitted",
            },
          ]}
          comparedKey="compared_inflow_outflow_percentage"
          loading={loading}
        />
        <ComparisonCard
          title="Purchase Orders vs Payment Orders"
          data={data.poToPayment}
          parts={[
            {
              key: "purchase_orders_raised_percentage",
              label: "Purchase orders raised",
            },
            {
              key: "payment_orders_submitted_percentage",
              label: "Payment orders submitted",
            },
          ]}
          comparedKey="compared_inflow_outflow_percentage"
          loading={loading}
        />
      </div>

      <EventsCard
        data={data.events}
        loading={loading}
        description="Your recent buyer events."
      />
    </div>
  );
}
