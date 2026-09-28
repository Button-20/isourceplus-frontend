import { Link } from "react-router-dom";
import { BadgeCheck, FileCheck, FileText, ShieldCheck } from "lucide-react";

// Reviewed security & compliance copy. `links` render as a small footnote row;
// entries with a `to` are real navigation links.
const items = [
  {
    icon: BadgeCheck,
    title: "TIN-verified companies",
    content:
      "Provides the 1st layer of due diligence for your transactions. Further diligence is required by you.",
    links: [
      { label: "Terms of Use", to: "/terms" },
      { label: "Disclaimer Policy", to: "/terms" },
    ],
  },
  {
    icon: FileCheck,
    title: "GRA E-VAT integrated",
    content:
      "Want to issue a VAT invoice? No worries — just issue it while we file on your behalf. It’s simple!",
  },
  {
    icon: FileText,
    title: "NON-VAT invoicing",
    content:
      "Not VAT-compliant? No worries — you have the option to issue a NON-VAT invoice. It’s simple!",
  },
  {
    icon: ShieldCheck,
    title: "100% data-protection compliant",
    content:
      "Secured, auditable and highly retentive transactional data you can trust.",
    links: [{ label: "Privacy Policy", to: "/privacy" }],
  },
];

export default function SecuritySection() {
  return (
    <section id="security" className="scroll-mt-20 py-20 lg:py-28">
      <div className="container grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wider text-brand">
            Security & compliance
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Trust and compliance, built into every transaction
          </h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            From TIN-verified companies and GRA e-VAT filing to fully protected
            transactional data — iSourcePlus keeps your business compliant and
            your deals trustworthy at every step.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((it) => (
            <div
              key={it.title}
              className="rounded-2xl border border-border/70 bg-card p-6"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <it.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 flex items-center gap-1.5 font-display text-base font-semibold">
                {it.title}
                <BadgeCheck className="h-4 w-4 text-brand" />
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{it.content}</p>
              {it.links && (
                <p className="mt-3 flex flex-wrap items-center gap-x-1.5 text-xs font-medium">
                  {it.links.map((lnk, i) => (
                    <span key={lnk.label} className="inline-flex items-center gap-1.5">
                      {i > 0 && <span className="text-muted-foreground/50">·</span>}
                      <Link to={lnk.to} className="text-brand hover:underline">
                        {lnk.label}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
