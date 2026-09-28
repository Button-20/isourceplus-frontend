import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ENV } from "@/services/lib/env";

const CTA_TO = ENV.PRELAUNCH ? "/waitlist" : "/signup";

// Reviewed "Just six simple transactional steps" flows, one per audience.
// `image` is a slot for the role marketing image (added once the assets land).
const ROLES = [
  {
    key: "buyers",
    label: "Buyers",
    image: "/image-1790564192757.webp",
    steps: [
      "Register",
      "Issue an RFx & engage the supplier market",
      "Analyze proforma and issue a purchase order",
      "Receive a sales invoice",
      "Receive Goods Received Note and make payments",
      "Receive payment receipt",
    ],
  },
  {
    key: "suppliers",
    label: "Suppliers",
    image: "/image-1790564184330.webp",
    steps: [
      "Register",
      "Receive and respond competitively to RFx",
      "Receive purchase order and issue sales invoice",
      "Supply goods with a waybill",
      "Issue Goods Delivery Note and serve payment order",
      "Issue payment receipt",
    ],
  },
  {
    key: "transporters",
    label: "Cargo Transporters",
    image: "/image-1790564198373.webp",
    steps: [
      "Register",
      "Receive and respond competitively to waybill offers",
      "Receive purchase order and issue sales invoice",
      "Use Google Maps to transport cargo with a waybill",
      "Issue Goods Delivery Note and serve payment order",
      "Issue payment receipt",
    ],
  },
];

const ESCROW_POINTS = [
  "Buyer lodges money into our escrow accounts per commercial terms",
  "Supplier delivers according to order",
  "Money is released within 48 hours when the buyer accepts the Goods Received Note",
  "Any mismatch between the Purchase Order and Goods Delivery Note — raise a dispute",
  "Any quantity shortage, excess or defect — the corresponding value is released",
  "Buyer raises a dispute when delays are triggered by the supplier",
];

export default function HowItWorksSection() {
  const [active, setActive] = useState(ROLES[0].key);
  const role = ROLES.find((r) => r.key === active) ?? ROLES[0];

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-muted/40 py-20 lg:py-28"
    >
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand">
            How it works
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Just six simple transactional steps
          </h2>
          <p className="mt-4 text-muted-foreground">
            Very simple and user-friendly — no hassle. Pick your role and see
            the flow end to end.
          </p>
        </div>

        {/* Role tabs */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setActive(r.key)}
              aria-pressed={active === r.key}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                active === r.key
                  ? "bg-brand-gradient text-brand-foreground shadow-md shadow-brand/20"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Active role: banner image + six steps */}
        <div className="mt-10 space-y-8">
          {role.image && (
            <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border/70 shadow-sm">
              <img
                src={role.image}
                alt={`${role.label} on iSourcePlus`}
                className="w-full"
                loading="lazy"
              />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {role.steps.map((step, i) => (
              <div
                key={step}
                className="relative rounded-2xl border border-border/70 bg-card p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient font-display text-base font-bold text-brand-foreground">
                  {i + 1}
                </div>
                <p className="mt-4 text-sm font-medium">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Escrow */}
        <div className="mt-16 overflow-hidden rounded-3xl border border-border/70 bg-card">
          <div className="grid gap-0 lg:grid-cols-5">
            <div className="bg-brand-gradient p-8 text-brand-foreground lg:col-span-2">
              <ShieldCheck className="h-10 w-10" />
              <h3 className="mt-4 font-display text-2xl font-bold">
                Mindful of payment trust issues?
              </h3>
              <p className="mt-2 text-white/90">
                We’ve got you covered with Escrow Account Management — funds are
                held securely and released only when the deal is honoured.
              </p>
              <Button
                asChild
                className="mt-6 bg-white text-brand hover:bg-white/90"
              >
                <Link to={CTA_TO}>
                  Sign up now <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-4 text-xs text-white/75">
                Escrow terms &amp; conditions apply.
              </p>
            </div>
            <div className="p-8 lg:col-span-3">
              <ul className="space-y-4">
                {ESCROW_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
