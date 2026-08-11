import { KeyRound, BadgeCheck, Lock, Scale } from "lucide-react";

// Copy from src/assets/assets.js (security[]).
const items = [
  {
    icon: KeyRound,
    title: "Two-Factor Authentication",
    content:
      "Secure administrator accounts with dual identity verification.",
  },
  {
    icon: BadgeCheck,
    title: "Document Verification",
    content:
      "Ensures trust by verifying buyer and supplier documents like the Ghana Card during onboarding.",
  },
  {
    icon: Lock,
    title: "End-to-End Encryption",
    content:
      "Protects all communications and transactions from interception by encrypting data.",
  },
  {
    icon: Scale,
    title: "Regulatory Compliance",
    content:
      "Adheres to data protection and privacy regulations to safeguard sensitive information.",
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
            Built to protect every transaction
          </h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Trust is the foundation of trade. iSource+ safeguards your business
            with verified identities, encrypted data, and compliant processes at
            every step.
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
              <h3 className="mt-4 font-display text-base font-semibold">
                {it.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{it.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
