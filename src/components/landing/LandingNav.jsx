import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/common/Logo";
import ThemeToggle from "@/components/common/ThemeToggle";
import { ENV } from "@/services/lib/env";
import SectionLink from "@/components/landing/SectionLink";

// Before launch there's no login, so the CTAs point at the waitlist instead of
// signup and "Sign in" is hidden.
const CTA_TO = ENV.PRELAUNCH ? "/waitlist" : "/signup";
const CTA_LABEL = ENV.PRELAUNCH ? "Join the waitlist" : "Get Started";

// `href` = landing-page section (works from any page via SectionLink);
// `to` = its own route.
const links = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
  { label: "Use cases", to: "/use-cases" },
  { label: "Pricing", href: "#pricing" },
  { label: "Reviews", href: "#reviews" },
  { label: "FAQ", to: "/faq" },
];

function NavItem({ item, className, onClick }) {
  return item.to ? (
    <Link to={item.to} className={className} onClick={onClick}>
      {item.label}
    </Link>
  ) : (
    <SectionLink hash={item.href} className={className} onClick={onClick}>
      {item.label}
    </SectionLink>
  );
}

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-lg">
      <nav className="container flex h-16 items-center justify-between">
        {/* Theme-aware lockup — colored on light, light on dark. */}
        <Logo imgClassName="h-10" />

        <div className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <NavItem
              key={l.label}
              item={l}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            />
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {!ENV.PRELAUNCH && (
            <Button variant="ghost" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          )}
          <Button
            asChild
            className="bg-brand-gradient text-brand-foreground shadow-lg shadow-brand/25 hover:opacity-90"
          >
            <Link to={CTA_TO}>{CTA_LABEL}</Link>
          </Button>
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-md lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-border/60 bg-background lg:hidden">
          <div className="container flex flex-col gap-1 py-4">
            {links.map((l) => (
              <NavItem
                key={l.label}
                item={l}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              />
            ))}
            <div className="mt-3 flex flex-col gap-2">
              {!ENV.PRELAUNCH && (
                <Button variant="outline" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
              )}
              <Button
                asChild
                className="bg-brand-gradient text-brand-foreground"
              >
                <Link to={CTA_TO}>{CTA_LABEL}</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
