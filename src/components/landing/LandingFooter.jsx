import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FaLinkedin, FaXTwitter, FaFacebook } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import Logo from "@/components/common/Logo";

export function CtaBanner() {
  return (
    <section className="py-16">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient px-8 py-14 text-center text-brand-foreground">
          <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <h2 className="relative font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to streamline your sourcing?
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/90">
            Join buyers and suppliers already trading smarter on iSource+.
          </p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="bg-white text-brand hover:bg-white/90"
            >
              <Link to="/signup">
                Create free account <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Security", href: "#security" },
    { label: "Pricing", href: "#pricing" },
  ],
  Company: [
    { label: "About", to: "/about" },
    { label: "Marketplace", to: "/marketplace" },
    { label: "Store", to: "/store" },
  ],
  Account: [
    { label: "Sign in", to: "/login" },
    { label: "Get started", to: "/signup" },
  ],
};

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-neutral-950 text-neutral-300">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo onDark imgClassName="h-8" />
            <p className="mt-4 max-w-sm text-sm text-neutral-400">
              The most comprehensive suppliers&apos; and buyers&apos; network —
              connecting businesses across Ghana and beyond.
            </p>
            <div className="mt-5 flex gap-3">
              {[FaLinkedin, FaXTwitter, FaFacebook].map((Icon, i) => (
                <span
                  key={i}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-neutral-300 transition-colors hover:bg-brand-gradient hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="font-display text-sm font-semibold text-white">
                {group}
              </h4>
              <ul className="mt-4 space-y-2 text-sm">
                {links.map((l) => (
                  <li key={l.label}>
                    {l.to ? (
                      <Link
                        to={l.to}
                        className="text-neutral-400 transition-colors hover:text-white"
                      >
                        {l.label}
                      </Link>
                    ) : (
                      <a
                        href={l.href}
                        className="text-neutral-400 transition-colors hover:text-white"
                      >
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-neutral-500 sm:flex-row">
          <span>© {new Date().getFullYear()} iSource+. All rights reserved.</span>
          <span>Accra, Ghana</span>
        </div>
      </div>
    </footer>
  );
}
