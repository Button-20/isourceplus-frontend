import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FaLinkedin, FaXTwitter, FaFacebook } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import Logo from "@/components/common/Logo";
import SectionLink from "@/components/landing/SectionLink";
import { ENV } from "@/services/lib/env";

export function CtaBanner({
  title = "Ready to streamline your sourcing?",
  subtitle = "Join buyers and suppliers already trading smarter on iSourcePlus.",
  secondary,
}) {
  return (
    <section className="py-16">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient px-8 py-14 text-center text-brand-foreground">
          <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <h2 className="relative font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/90">
            {subtitle}
          </p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="bg-white text-brand hover:bg-white/90"
            >
              <Link to={ENV.PRELAUNCH ? "/waitlist" : "/signup"}>
                {ENV.PRELAUNCH ? "Join the waitlist" : "Create free account"}{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {secondary ? (
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link to={secondary.to}>{secondary.label}</Link>
              </Button>
            ) : (
              !ENV.PRELAUNCH && (
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link to="/login">Sign in</Link>
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// Pre-launch, the only reachable destinations are the landing page (its own
// anchor links) and the waitlist — the other pages redirect home, so drop them.
const PRODUCT_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
  { label: "Pricing", href: "#pricing" },
];
// Use cases, FAQ and the legal pages are public in both modes.
const RESOURCE_LINKS = [
  { label: "Industry use cases", to: "/use-cases" },
  { label: "FAQ", to: "/faq" },
];
const LEGAL_LINKS = [
  { label: "Terms of Use", to: "/terms" },
  { label: "Acceptable Use", to: "/terms#use-of-the-platform" },
  { label: "Disclaimer", to: "/terms#disclaimers-and-liability" },
  { label: "Escrow terms", to: "/terms#transactions-invoicing-and-escrow" },
  { label: "Privacy Policy", to: "/privacy" },
];
const footerLinks = ENV.PRELAUNCH
  ? {
      Product: PRODUCT_LINKS,
      Resources: [
        ...RESOURCE_LINKS,
        { label: "Join the waitlist", to: "/waitlist" },
      ],
      Legal: LEGAL_LINKS,
    }
  : {
      Product: PRODUCT_LINKS,
      Resources: [
        ...RESOURCE_LINKS,
        { label: "About", to: "/about" },
        { label: "Marketplace", to: "/marketplace" },
        { label: "Store", to: "/store" },
      ],
      Legal: LEGAL_LINKS,
      Account: [
        { label: "Sign in", to: "/login" },
        { label: "Get started", to: "/signup" },
      ],
    };

export default function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background text-muted-foreground">
      <div className="container py-14">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Logo imgClassName="h-12" />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              The most comprehensive suppliers&apos; and buyers&apos; network —
              connecting businesses across Ghana and beyond.
            </p>
            <div className="mt-5 flex gap-3">
              {[FaLinkedin, FaXTwitter, FaFacebook].map((Icon, i) => (
                <span
                  key={i}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-brand-gradient hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="font-display text-sm font-semibold text-foreground">
                {group}
              </h4>
              <ul className="mt-4 space-y-2 text-sm">
                {links.map((l) => (
                  <li key={l.label}>
                    {l.to ? (
                      <Link
                        to={l.to}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    ) : (
                      <SectionLink
                        hash={l.href}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </SectionLink>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>
            © {new Date().getFullYear()} iSourcePlus. All rights reserved.
          </span>
          <span>Accra, Ghana</span>
        </div>
      </div>
    </footer>
  );
}
