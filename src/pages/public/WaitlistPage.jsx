import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import Logo from "@/components/common/Logo";
import {
  IllustrationGrowth,
  IllustrationLogistics,
  IllustrationNetwork,
  IllustrationPlatform,
  IllustrationSignup,
} from "@/components/waitlist/Illustrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { joinWaitlist } from "@/services/api/waitlist.service";

// Pre-launch waitlist landing page, built from the "Strategic Plan to Build
// Subscription Base" brief (Sept 2026 red corrections applied).
//
// Layout follows the Payllion about-page reference: sticky nav with a pill CTA,
// a centred hero over a faint pattern with a product-mockup illustration,
// full-width flat brand bands, alternating illustration + copy sections with
// underline-accented headings, an endorsement strip, and a centred "join the
// waitlist with early access" form. Kept on the dark base per the house rule.

// Campaign dates from the brief. Ghana runs on UTC. Signups close 9 Oct; the
// platform launches 12 Oct.
export const PROMO_ENDS_AT = new Date("2026-10-31T23:59:59Z");
export const PROMO_ENDS_LABEL = "31st October, 2026";
export const LAUNCH_DATE_LABEL = "1st November, 2026";

const GHANA_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Volta",
  "Upper East",
  "Savannah",
  "Bono",
  "Upper West",
  "Western North",
  "Western",
  "Eastern",
  "Northern",
  "Central",
  "Ahafo",
  "Oti",
  "North East",
  "Bono East",
];

const CATEGORIES = [
  { value: "supplier", label: "Supplier" },
  { value: "buyer", label: "Buyer" },
  { value: "cargo_transporter", label: "Cargo Transporter" },
];

const BENEFITS = [
  "Buyers connect to multiple suppliers and receive quotations at the click of a button.",
  "Suppliers connect to a pool of buyers to engage for market opportunities.",
  "Cargo transporters receive orders from buyers and suppliers to move goods, aided by Google Maps.",
  "All documents are automated, stored and easily traced: Quotation, Payment, Waybill, Goods Received Note.",
  "Issue E-VAT or Non-E-VAT invoices, with no hassle.",
  "Payment system integrated (MoMo and Card).",
];

const ENDORSEMENTS = ["GUTA", "GRA", "GIPS", "DPA"];

const EMPTY = {
  first_name: "",
  last_name: "",
  email: "",
  whatsapp: "",
  contact_2: "",
  company_institution: "",
  company_email: "",
  region: "",
  category: "",
};

const FORM_ID = "waitlist-form";

// CTAs are plain anchor links to the form section: the app-wide SmoothScroll
// (Lenis) intercepts same-page anchors and glides to them, honouring the
// section's scroll-margin so it clears the sticky nav.
const FORM_HREF = `#${FORM_ID}`;

// Live countdown to a target date, ticking once a second.
function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  return {
    ended: diff === 0,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

const pad = (n) => String(n).padStart(2, "0");

function CountdownTile({ value, label }) {
  return (
    <div className="flex min-w-[4.75rem] flex-col items-center rounded-2xl border border-border bg-card px-3 py-3 sm:min-w-[5.75rem] sm:px-4">
      <span className="font-display text-3xl font-bold tabular-nums text-brand sm:text-4xl">
        {pad(value)}
      </span>
      <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

// Payllion-style heading with a short brand underline accent.
function SectionHeading({ eyebrow, title, center = false, light = false }) {
  return (
    <div className={cn(center && "text-center")}>
      {eyebrow && (
        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-[0.25em]",
            light ? "text-white/80" : "text-brand",
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">
        {title}
      </h2>
      <span
        className={cn(
          "mt-4 block h-1 w-14 rounded-full",
          light ? "bg-white/80" : "bg-brand",
          center && "mx-auto",
        )}
      />
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

export default function WaitlistPage() {
  const cd = useCountdown(PROMO_ENDS_AT);
  const navigate = useNavigate();
  const [values, setValues] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const onInput = (name) => (e) =>
    setValues((v) => ({ ...v, [name]: e.target.value }));
  const onSelect = (name) => (value) => {
    // Radix can emit "" while options reconcile; never let it clobber a choice.
    if (!value) return;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.region) return toast.error("Please select your region.");
    if (!values.category)
      return toast.error(
        "Please tell us whether you are a supplier, buyer or cargo transporter.",
      );

    setSubmitting(true);
    try {
      await joinWaitlist({
        ...values,
        company_institution: values.company_institution.trim(),
      });
      // Confirm, then send them to the homepage (the toast persists across
      // navigation via sonner).
      toast.success("You're on the waitlist! We'll be in touch before launch.");
      navigate("/");
    } catch (err) {
      const data = err.response?.data;
      toast.error(
        data?.email?.[0] ||
          data?.detail ||
          (typeof data === "string" ? data : null) ||
          "Couldn't join the waitlist. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Sticky nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <nav className="container flex h-20 items-center justify-between">
          <Logo onDark to={null} imgClassName="h-16" />
          <Button asChild className="bg-brand-gradient text-white hover:opacity-90">
            <a href={FORM_HREF}>Join the waitlist</a>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="bg-grid-faint">
        <div className="container pb-8 pt-14 sm:pt-20">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-brand-2">
            Hurry! Hurry!! Hurry!!!
          </p>
          <h1 className="mx-auto mt-4 max-w-4xl text-center font-display text-4xl font-bold leading-tight sm:text-6xl">
            Be part of the Waitlist and enjoy{" "}
            <span className="text-brand">1 month free</span> Early Bird
            subscription after launch
          </h1>
          <p className="mt-5 text-center font-display text-lg italic text-muted-foreground sm:text-xl">
            &ldquo;Connect. Source. Pay.&rdquo;
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-muted-foreground sm:text-lg">
            iSourceplus is a Source-to-Pay platform designed with suppliers,
            buyers and cargo transporters to drive efficiency, improve revenue
            and reduce cost.
          </p>
          <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.25em] text-brand">
            Powering the 24-hr economy with iSourceplus
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {cd.ended ? (
              <p className="rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold">
                The waitlist promo has ended
              </p>
            ) : (
              <>
                <CountdownTile value={cd.days} label="Days" />
                <CountdownTile value={cd.hours} label="Hours" />
                <CountdownTile value={cd.minutes} label="Minutes" />
                <CountdownTile value={cd.seconds} label="Seconds" />
              </>
            )}
          </div>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Promo ends{" "}
            <strong className="text-foreground">{PROMO_ENDS_LABEL}</strong>
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="bg-brand-gradient px-7 text-white hover:opacity-90"
            >
              <a href={FORM_HREF}>
                Reserve my spot <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button type="button" size="lg" variant="outline" asChild>
              <a href="#benefits">See the benefits</a>
            </Button>
          </div>

          {/* Product mockup */}
          <IllustrationPlatform className="mx-auto mt-12 w-full max-w-4xl" />
        </div>
      </section>

      {/* Brand band CTA */}
      <section className="bg-brand-gradient text-white">
        <div className="container flex flex-col items-center gap-6 py-14 text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Ready to source, connect and get paid smarter?
          </h2>
          <p className="max-w-xl text-white/85">
            Save the launch date:{" "}
            <strong className="text-white">{LAUNCH_DATE_LABEL}</strong>. Join
            the waitlist before {PROMO_ENDS_LABEL} and your first month is on
            us.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white px-8 text-brand hover:bg-white/90"
          >
            <a href={FORM_HREF}>Join the waitlist</a>
          </Button>
        </div>
      </section>

      {/* About */}
      <section className="container grid items-center gap-10 py-20 lg:grid-cols-2 lg:gap-16">
        <IllustrationNetwork className="mx-auto w-full max-w-lg" />
        <div>
          <SectionHeading eyebrow="About" title="About iSourceplus" />
          <p className="mt-6 text-muted-foreground sm:text-lg">
            Buying and selling across many suppliers, many buyers and many
            routes means quotations, invoices and waybills scattered
            everywhere. iSourceplus brings the whole Source-to-Pay journey
            into one secure platform, so buyers, suppliers and cargo
            transporters connect, transact and get paid without the paper
            chase.
          </p>
          <p className="mt-4 font-semibold">
            Join the most comprehensive suppliers&apos; and buyers&apos;
            network.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="scroll-mt-24 border-y border-border bg-card/40">
        <div className="container grid items-center gap-10 py-20 lg:grid-cols-2 lg:gap-16">
          <div className="lg:order-2">
            <IllustrationLogistics className="mx-auto w-full max-w-lg" />
          </div>
          <div className="lg:order-1">
            <SectionHeading eyebrow="Benefits" title="Why join the waitlist" />
            <ul className="mt-6 space-y-4">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                  <span className="text-muted-foreground sm:text-base">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="container grid items-center gap-10 py-20 lg:grid-cols-2 lg:gap-16">
        <IllustrationGrowth className="mx-auto w-full max-w-lg" />
        <div>
          <SectionHeading eyebrow="Vision" title="Powering the 24-hr economy" />
          <p className="mt-6 text-muted-foreground sm:text-lg">
            We are on a mission to help Ghanaian businesses source brighter and
            pay smarter: giving buyers, suppliers and transporters the tools to
            trade around the clock, grow their revenue and cut their costs.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Promo ends
              </p>
              <p className="mt-1 font-display text-lg font-bold">
                {PROMO_ENDS_LABEL}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Launch date
              </p>
              <p className="mt-1 font-display text-lg font-bold text-brand">
                {LAUNCH_DATE_LABEL}
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">NB:</span> Your free
            subscription takes effect immediately after the official launch.
          </p>
        </div>
      </section>

      {/* Endorsement strip */}
      <section className="bg-brand-gradient text-white">
        <div className="container flex flex-col items-center gap-5 py-10 sm:flex-row sm:justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/85">
            Endorsed by
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {ENDORSEMENTS.map((e) => (
              <span
                key={e}
                className="rounded-full bg-white/15 px-5 py-2 font-display text-base font-bold tracking-wide"
              >
                {e}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist form */}
      <section id={FORM_ID} className="container scroll-mt-24 py-20">
        <SectionHeading
          center
          eyebrow="Early access"
          title="Join the waitlist with early access"
        />
        <p className="mx-auto mt-5 max-w-2xl text-center text-muted-foreground sm:text-lg">
          Hundreds of businesses are getting ready for launch. Reserve your
          spot now and we will contact you as soon as we go live on{" "}
          {LAUNCH_DATE_LABEL}.
        </p>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,560px)] lg:gap-16">
          <IllustrationSignup className="mx-auto w-full max-w-md lg:order-1" />

          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 lg:order-2">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h3 className="font-display text-xl font-bold">
                    Reserve your spot
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Takes less than a minute.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="First name" required>
                    <Input
                      required
                      value={values.first_name}
                      onChange={onInput("first_name")}
                      autoComplete="given-name"
                    />
                  </Field>
                  <Field label="Last name" required>
                    <Input
                      required
                      value={values.last_name}
                      onChange={onInput("last_name")}
                      autoComplete="family-name"
                    />
                  </Field>
                  <Field label="Email" required>
                    <Input
                      type="email"
                      required
                      value={values.email}
                      onChange={onInput("email")}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </Field>
                  <Field label="Contact (WhatsApp)" required>
                    <Input
                      type="tel"
                      required
                      value={values.whatsapp}
                      onChange={onInput("whatsapp")}
                      placeholder="+233 …"
                      autoComplete="tel"
                    />
                  </Field>
                  <Field label="Contact 2">
                    <Input
                      type="tel"
                      value={values.contact_2}
                      onChange={onInput("contact_2")}
                      placeholder="+233 …"
                    />
                  </Field>
                  <Field label="Company / Institution">
                    <Input
                      value={values.company_institution}
                      onChange={onInput("company_institution")}
                      placeholder="Your company or institution"
                      autoComplete="organization"
                    />
                  </Field>
                  <Field label="Company email">
                    <Input
                      type="email"
                      value={values.company_email}
                      onChange={onInput("company_email")}
                      placeholder="name@company.com"
                    />
                  </Field>
                  <Field label="Region" required>
                    <Select
                      value={values.region || undefined}
                      onValueChange={onSelect("region")}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Select your region" />
                      </SelectTrigger>
                      <SelectContent>
                        {GHANA_REGIONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Category" required>
                    <Select
                      value={values.category || undefined}
                      onValueChange={onSelect("category")}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="I am a…" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="w-full bg-brand-gradient text-white hover:opacity-90"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Joining…
                    </>
                  ) : (
                    "Join the waitlist"
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Promo ends {PROMO_ENDS_LABEL}. Free subscription starts at
                  launch on {LAUNCH_DATE_LABEL}.
                </p>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container flex flex-col items-center gap-3 py-8 text-center sm:flex-row sm:justify-between">
          <Logo onDark to={null} imgClassName="h-16" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} iSourceplus · Connect. Source. Pay.
          </p>
        </div>
      </footer>
    </main>
  );
}
