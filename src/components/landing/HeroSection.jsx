import { Link } from "react-router-dom";
import { ArrowRight, PlayCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductMockup from "@/components/landing/ProductMockup";
import { ENV } from "@/services/lib/env";

// Pre-launch: the primary CTA leads to the waitlist, not signup.
const CTA_TO = ENV.PRELAUNCH ? "/waitlist" : "/signup";
const CTA_LABEL = ENV.PRELAUNCH ? "Join the waitlist" : "Get Started";

const stats = [
  { value: "10,000+", label: "Buyers & suppliers" },
  { value: "500+", label: "Registered companies" },
  { value: "Global", label: "Cross-border sourcing" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-grid-faint">
      {/* soft brand glows */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-brand-2/20 blur-3xl" />

      <div className="container relative grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-medium text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-gradient" />
            Connect. Source. Pay.
          </span>

          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            We connect you.{" "}
            <span className="text-brand-gradient">You source and pay.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Seamless source-to-pay transactions — buyers, suppliers and cargo
            transporters, all on one secure platform.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="bg-brand-gradient text-brand-foreground shadow-lg shadow-brand/25 hover:opacity-90"
            >
              <Link to={CTA_TO}>
                {CTA_LABEL} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#how-it-works">
                <PlayCircle className="mr-2 h-4 w-4" /> Take a quick tour
              </a>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {[
              "TIN-verified companies",
              "GRA E-VAT integrated",
              "Secured transactions",
            ].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-brand" /> {item}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            By using iSourcePlus you agree to our{" "}
            <Link
              to="/terms#use-of-the-platform"
              className="font-medium text-brand hover:underline"
            >
              Acceptable Use Policy
            </Link>
            .
          </p>
        </div>

        <div className="relative">
          <ProductMockup />
        </div>
      </div>

      {/* stats strip */}
      <div className="border-t border-border/60 bg-background/60">
        <div className="container grid grid-cols-1 gap-6 py-8 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="text-center sm:text-left">
              <div className="font-display text-3xl font-bold">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
