import { FileText, ShieldCheck, Wallet } from "lucide-react";
import Logo from "@/components/common/Logo";

const points = [
  {
    icon: FileText,
    title: "Source smarter",
    text: "Create RFQs and tenders, then compare supplier offers side by side.",
  },
  {
    icon: ShieldCheck,
    title: "Trade securely",
    text: "Ghana Card verification and end-to-end encryption on every deal.",
  },
  {
    icon: Wallet,
    title: "Get paid faster",
    text: "Issue invoices and purchase orders, and settle payments in one place.",
  },
];

// Branded left column shared by the login and signup screens.
export default function AuthBrandPanel({ title, subtitle }) {
  return (
    <div className="relative hidden overflow-hidden bg-brand-gradient p-10 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

      <div className="relative mb-5">
        <Logo onDark imgClassName="h-8" />
        <p className="mt-3 text-sm font-medium uppercase tracking-[0.25em] text-white/80">
          Connect - Source - Pay
        </p>
      </div>

      <div className="relative">
        <h2 className="font-display text-4xl font-bold leading-tight">
          {title}
        </h2>
        <p className="mt-3 max-w-md text-white/85">{subtitle}</p>

        <div className="mt-10 space-y-6">
          {points.map((p) => (
            <div key={p.title} className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <p.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                <p className="text-sm text-white/80">{p.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="relative text-sm text-white/70">
        Trusted by buyers and suppliers across Ghana and beyond.
      </p>
    </div>
  );
}
