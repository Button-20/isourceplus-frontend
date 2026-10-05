// Industry use cases — public marketing page (/use-cases).
// Copy: src/data/use-cases.js ("Website friendly Use Cases.docx").
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleHelp,
  Fingerprint,
  Layers,
  Sparkles,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import LandingFooter, { CtaBanner } from "@/components/landing/LandingFooter";
import FlowChain from "@/components/landing/FlowChain";
import useHashScroll from "@/components/landing/useHashScroll";
import { Button } from "@/components/ui/button";
import { ENV } from "@/services/lib/env";
import {
  INDUSTRIES,
  LIFECYCLE,
  MANAGEMENT_QUESTIONS,
  PARTICIPANTS,
  PROCUREMENT_INTELLIGENCE,
  USE_CASES_INTRO,
  UTID_CHAIN,
} from "@/data/use-cases";

const CTA_TO = ENV.PRELAUNCH ? "/waitlist" : "/signup";
const CTA_LABEL = ENV.PRELAUNCH ? "Join the waitlist" : "Get started";

function IndustryCard({ industry }) {
  const {
    id,
    name,
    icon: Icon,
    tagline,
    manages,
    uses,
    usesLabel,
    value,
  } = industry;
  return (
    <article
      id={id}
      className="flex scroll-mt-28 flex-col rounded-2xl border border-border/70 bg-card p-6 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold leading-tight">
            {name}
          </h3>
          <p className="mt-1 text-sm font-medium text-brand">{tagline}</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{manages}</p>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-foreground/80">
        {usesLabel || "Use iSourcePlus to"}
      </p>
      <ul className="mt-2 grid gap-1.5 text-sm">
        {uses.map((u) => (
          <li key={u} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span>{u}</span>
          </li>
        ))}
      </ul>

      <p className="mt-auto pt-5">
        <span className="block rounded-xl bg-muted/60 px-4 py-3 text-sm">
          <span className="font-semibold text-foreground">Value: </span>
          <span className="text-muted-foreground">{value}</span>
        </span>
      </p>
    </article>
  );
}

export function UseCasesPage() {
  useHashScroll();

  return (
    <div className="font-montserrat">
      <LandingNav />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-brand-gradient text-brand-foreground">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="container relative py-16 sm:py-20">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <Layers className="h-3.5 w-3.5" /> {USE_CASES_INTRO.eyebrow}
            </span>
            <h1 className="mt-5 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-5xl">
              {USE_CASES_INTRO.title}
            </h1>
            <p className="mt-5 max-w-2xl text-white/90">
              {USE_CASES_INTRO.lead}
            </p>
            <p className="mt-3 max-w-2xl font-medium">{USE_CASES_INTRO.body}</p>
            <p className="mt-6 font-display text-sm font-bold tracking-[0.2em] text-white/80">
              CONNECT. SOURCE. PAY.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="bg-white text-brand hover:bg-white/90"
              >
                <Link to={CTA_TO}>
                  {CTA_LABEL} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link to="/faq">
                  <CircleHelp className="mr-2 h-4 w-4" /> Read the FAQ
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Industry jump links */}
        <nav
          aria-label="Industries"
          className="sticky top-16 z-30 border-b border-border/60 bg-background/85 backdrop-blur-lg"
        >
          <div className="container flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {INDUSTRIES.map((ind) => (
              <a
                key={ind.id}
                href={`#${ind.id}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
              >
                <ind.icon className="h-3.5 w-3.5" />
                {ind.name}
              </a>
            ))}
          </div>
        </nav>

        {/* Industries */}
        <section className="py-16 lg:py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-brand">
                Industries
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Every industry buys differently
              </h2>
              <p className="mt-4 text-muted-foreground">
                See how organisations in your sector use iSourcePlus across the
                procurement lifecycle.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {INDUSTRIES.map((ind) => (
                <IndustryCard key={ind.id} industry={ind} />
              ))}
            </div>
          </div>
        </section>

        {/* One platform */}
        <section
          id="lifecycle"
          className="scroll-mt-28 bg-muted/40 py-16 lg:py-20"
        >
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-brand">
                One platform
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                One platform. Many procurement environments.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Whatever your industry, iSourcePlus connects:
              </p>
            </div>
            <FlowChain steps={LIFECYCLE} className="mt-8 justify-center" />
            <p className="mt-10 text-center text-sm font-medium text-muted-foreground">
              Across
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {PARTICIPANTS.map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-border/70 bg-card px-3 py-1 text-sm font-medium"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* UTID */}
        <section id="utid" className="scroll-mt-28 py-16 lg:py-20">
          <div className="container">
            <div className="overflow-hidden rounded-3xl bg-brand-gradient p-8 text-brand-foreground sm:p-12">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-xl">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                    <Fingerprint className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
                    One transaction. One complete story.
                  </h2>
                  <p className="mt-3 text-white/90">
                    Every authorised transaction can be connected through a
                    Universal Transaction Identity (UTID). A single transaction
                    can link:
                  </p>
                </div>
              </div>
              <FlowChain steps={UTID_CHAIN} tone="onBrand" className="mt-8" />
              <p className="mt-8 text-white/90">
                Giving your organisation a connected view of the procurement
                journey.
              </p>
            </div>
          </div>
        </section>

        {/* Intelligence */}
        <section
          id="intelligence"
          className="scroll-mt-28 bg-muted/40 py-16 lg:py-20"
        >
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-brand">
                Intelligence
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                From procurement data to business intelligence
              </h2>
              <p className="mt-4 text-muted-foreground">
                iSourcePlus transforms transaction data into actionable
                intelligence.
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-card p-6">
                <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <BarChart3 className="h-5 w-5 text-brand" /> Procurement
                  intelligence
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {PROCUREMENT_INTELLIGENCE.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-6">
                <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <Sparkles className="h-5 w-5 text-brand" /> Management
                  intelligence
                </h3>
                <ul className="mt-4 grid gap-2 text-sm">
                  {MANAGEMENT_QUESTIONS.map((q) => (
                    <li key={q} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Closing */}
        <section className="py-16 lg:py-20">
          <div className="container max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Built for your industry. Connected across your business.
            </h2>
            <p className="mt-5 text-muted-foreground">
              Your industry may be different. Your procurement challenges may be
              different. But your need for visibility, control, traceability and
              intelligence is universal.
            </p>
            <p className="mt-6 font-display text-sm font-bold tracking-[0.2em] text-brand">
              CONNECT. SOURCE. PAY.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              The digital procurement network connecting buyers, suppliers,
              finance and procurement intelligence.
            </p>
          </div>
        </section>

        <CtaBanner
          title="Start connecting your procurement today."
          subtitle="One platform for buyers, suppliers and cargo transporters — from demand to payment."
        />
      </main>
      <LandingFooter />
    </div>
  );
}

export default UseCasesPage;
