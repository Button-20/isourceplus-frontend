import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  ReceiptText,
  Award,
  Wallet,
  HandCoins,
  FileText,
  Users,
  ArrowRight,
} from "lucide-react";

import {
  getActiveBizInvitations,
  getActiveBizOffers,
  getActiveBizsAwarded,
  getPaymentOrdersIssuedValue,
  getReceivedPayments,
  getSalesInvoiceValue,
  getTotalBuyers,
} from "@/services/api/supplierDashboard.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Pull a single numeric metric out of the various shapes these endpoints may
// return: a bare number, a `{ key: value }` object carrying one metric, or a
// breakdown object whose numeric values should be summed (e.g. counts by type).
// Keeps the dashboard resilient to exact response shapes.
function pickMetric(data) {
  if (data == null) return 0;
  if (typeof data === "number") return Number.isFinite(data) ? data : 0;
  if (typeof data === "string") return Number(data) || 0;
  if (typeof data === "object") {
    const nums = Object.values(data)
      .map((v) => (typeof v === "number" ? v : Number(v)))
      .filter((v) => Number.isFinite(v));
    if (nums.length === 1) return nums[0];
    if (nums.length > 1) return nums.reduce((a, b) => a + b, 0);
  }
  return 0;
}

const formatMoney = (n) =>
  new Intl.NumberFormat("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);

const formatCount = (n) => new Intl.NumberFormat("en-GH").format(Number(n) || 0);

// label, icon, service call, whether it's a money value, and where "View all"
// links to. Order matches how they should read on the grid.
const METRICS = [
  {
    key: "invitations",
    icon: Mail,
    label: "Active Business Invitations",
    fetch: getActiveBizInvitations,
    href: "/dashboard/rfxs",
  },
  {
    key: "offers",
    icon: ReceiptText,
    label: "Active Business Offers",
    fetch: getActiveBizOffers,
    href: "/dashboard/proforma-invoices/issued",
  },
  {
    key: "awarded",
    icon: Award,
    label: "Businesses Awarded",
    fetch: getActiveBizsAwarded,
    href: "/dashboard/purchase-orders",
  },
  {
    key: "salesInvoiceValue",
    icon: FileText,
    label: "Sales Invoices Value",
    money: true,
    fetch: getSalesInvoiceValue,
    href: "/dashboard/sales-invoices/issued",
  },
  {
    key: "pmtOrdersIssuedValue",
    icon: Wallet,
    label: "Payment Orders Issued (Value)",
    money: true,
    fetch: getPaymentOrdersIssuedValue,
    href: "/dashboard/payment-orders/issued",
  },
  {
    key: "receivedPayments",
    icon: HandCoins,
    label: "Received Payment Orders",
    fetch: getReceivedPayments,
    href: "/dashboard/payment-orders/issued",
  },
  {
    key: "totalBuyers",
    icon: Users,
    label: "Total Buyers",
    fetch: getTotalBuyers,
  },
];

function StatCard({ icon: Icon, label, value, prefix, loading, href }) {
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
          {href && !loading && (
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

export default function SupplierOverview() {
  const [state, setState] = useState({ loading: true, data: {} });

  useEffect(() => {
    let cancelled = false;
    // Fetch every card independently — one failing endpoint never blanks the
    // rest of the dashboard.
    Promise.allSettled(METRICS.map((m) => m.fetch())).then((results) => {
      if (cancelled) return;
      const data = {};
      METRICS.forEach((m, i) => {
        data[m.key] =
          results[i].status === "fulfilled" ? results[i].value : null;
      });
      setState({ loading: false, data });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { loading, data } = state;

  return (
    <div>
      <h2 className="mb-3 font-display text-lg font-semibold">Overview</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {METRICS.map((m) => {
          const metricValue = pickMetric(data[m.key]);
          return (
            <StatCard
              key={m.key}
              icon={m.icon}
              label={m.label}
              loading={loading}
              prefix={m.money ? "GHC " : undefined}
              value={
                m.money ? formatMoney(metricValue) : formatCount(metricValue)
              }
              href={m.href}
            />
          );
        })}
      </div>
    </div>
  );
}
