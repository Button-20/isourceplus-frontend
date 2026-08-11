import { FileText, Gavel, ShoppingBag, Wallet, ShieldCheck } from "lucide-react";

// Copy is the real product copy from src/assets/assets.js (features[]).
const features = [
  {
    icon: FileText,
    title: "Request Quotes from Suppliers",
    description:
      "Easily create and send requests to suppliers, compare their offers, and choose the best deal for your needs.",
  },
  {
    icon: Gavel,
    title: "Post Bids for Projects",
    description:
      "Post project requirements to receive competitive offers from suppliers, ensuring the best value for your work.",
  },
  {
    icon: ShoppingBag,
    title: "Browse Supplier Products",
    description:
      "Suppliers can showcase their product catalogs for buyers to explore and find the best goods and services.",
  },
  {
    icon: Wallet,
    title: "Manage Transactions Easily",
    description:
      "Track and handle all your requests, orders, invoices, payments, and receipts in one simple system.",
  },
  {
    icon: ShieldCheck,
    title: "Enhanced Security and Privacy",
    description:
      "Your data and transactions are protected with top-level security and encryption to keep everything safe.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 py-20 lg:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand">
            Everything you need
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            One platform for the entire procurement lifecycle
          </h2>
          <p className="mt-4 text-muted-foreground">
            From the first quote to final payment, iSource+ keeps buyers and
            suppliers moving in the same, secure workflow.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border/70 bg-card p-6 transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/10"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand-gradient group-hover:text-brand-foreground">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
