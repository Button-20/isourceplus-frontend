import { Link } from "react-router-dom";
import {
  FileText,
  Gavel,
  ShoppingCart,
  Truck,
  ReceiptText,
  MessageSquare,
  Inbox,
  FileSpreadsheet,
  Wallet,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ENV } from "@/services/lib/env";

const CTA_TO = ENV.PRELAUNCH ? "/waitlist" : "/signup";

// Reviewed feature copy — split by audience (buyers vs suppliers / cargo
// transporters), matching the "Feature" section of the reviewed brief.
const BUYER_FEATURES = [
  {
    icon: FileText,
    title: "RFx Management",
    description:
      "Track your Request for Quotations (RFQs), Request for Proposals (RFPs) and Request for Information (RFIs), engage the market and compare supplier responses.",
  },
  {
    icon: Gavel,
    title: "Tender Management",
    description:
      "Publish tenders to the market and review supplier submissions.",
  },
  {
    icon: ShoppingCart,
    title: "Purchase Orders",
    description:
      "Generate your purchase order directly from the supplier’s quotation and avoid human errors.",
  },
  {
    icon: Truck,
    title: "Waybill",
    description: "Generate your waybill and invite cargo transporters to bid.",
  },
  {
    icon: ReceiptText,
    title: "Payment Receipts",
    description: "All your payment receipts in one place.",
  },
  {
    icon: MessageSquare,
    title: "SMS",
    description:
      "Communication to and from your customers and business partners made easy.",
  },
];

const SUPPLIER_FEATURES = [
  {
    icon: Inbox,
    title: "Business Invitations",
    description:
      "Receive and manage all your business invitations from the marketplace in one place.",
  },
  {
    icon: ReceiptText,
    title: "Proforma Invoices",
    description:
      "Generate and serve your quotations on your customers based on the RFx.",
  },
  {
    icon: FileSpreadsheet,
    title: "Sales Invoice",
    description:
      "Generate your invoices based on the purchase order received from customers to avoid human errors.",
  },
  {
    icon: Wallet,
    title: "Payment Orders",
    description:
      "Your sales invoice enables you to generate and serve your payment order on your customers.",
  },
  {
    icon: Truck,
    title: "Waybill",
    description:
      "Generate and manage your waybills and invite cargo transporters to bid.",
  },
  {
    icon: MessageSquare,
    title: "SMS",
    description:
      "Communication to and from your customers and business partners made easy.",
  },
];

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="group rounded-2xl border border-border/70 bg-card p-6 transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/10">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand-gradient group-hover:text-brand-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FeatureGroup({ eyebrow, features }) {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
          {eyebrow}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 py-20 lg:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand">
            Features
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Business at a click!
          </h2>
          <p className="mt-4 text-muted-foreground">
            Everywhere you go, engage the markets 24 hours a day — the tools
            buyers, suppliers and cargo transporters need, in one platform.
          </p>
        </div>

        <div className="mt-14 space-y-14">
          <FeatureGroup eyebrow="For Buyers" features={BUYER_FEATURES} />
          <FeatureGroup
            eyebrow="For Suppliers & Cargo Transporters"
            features={SUPPLIER_FEATURES}
          />
        </div>

        <div className="mt-12 text-center">
          <Button
            asChild
            size="lg"
            className="bg-brand-gradient text-brand-foreground hover:opacity-90"
          >
            <Link to={CTA_TO}>
              Sign up now <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
