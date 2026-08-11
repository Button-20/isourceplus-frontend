import { Link } from "react-router-dom";
import { Check, ArrowRight, Users, MessageSquare } from "lucide-react";
import { buyerPlans } from "@/data/pricing-plans";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Shows the Buyer plans (the default tab on /pricing) so the numbers here
// always match the full pricing page — both read from src/data/pricing-plans.js.
export default function PricingTeaser() {
  return (
    <section id="pricing" className="scroll-mt-20 py-20 lg:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand">
            Pricing
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Plans that scale with your business
          </h2>
          <p className="mt-4 text-muted-foreground">
            Buyer plans shown below. Supplier and transporter plans, plus 6- and
            12-month discounts, are on the full pricing page. All prices exclude
            VAT.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {buyerPlans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "flex flex-col rounded-2xl border bg-card p-6",
                plan.isPopular
                  ? "border-brand/50 shadow-xl shadow-brand/10 ring-1 ring-brand/30"
                  : "border-border/70",
              )}
            >
              {plan.isPopular && (
                <span className="mb-3 inline-flex w-fit rounded-full bg-brand-gradient px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-foreground">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold">
                  GHC {plan.monthlyRate}
                </span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  {plan.defaultUsers} default user
                  {plan.defaultUsers > 1 ? "s" : ""}
                </li>
                <li className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  {plan.competitiveOffers} competitive offers
                </li>
                <li className="flex items-start gap-2">
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  {plan.transactionalSMS} transactional SMS
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  {plan.suppliersMarketBase} suppliers&apos; market base
                </li>
              </ul>
              <Button
                asChild
                variant={plan.isPopular ? "default" : "outline"}
                className={cn(
                  "mt-6",
                  plan.isPopular &&
                    "bg-brand-gradient text-brand-foreground hover:opacity-90",
                )}
              >
                <Link to="/pricing">Choose {plan.name}</Link>
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button variant="link" asChild className="text-brand">
            <Link to="/pricing">
              Compare all plans <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
