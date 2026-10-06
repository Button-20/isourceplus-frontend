import Logo from "@/components/common/Logo";
import { FileText, ShieldCheck, Wallet } from "lucide-react";

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

// Logo at the top of the white form column on login and signup.
export function AuthBrandHeader() {
  return (
    // Wider than the max-w-sm form on purpose: justify-center lets the logo
    // spill evenly past both edges, capped to the viewport on phones.
    <div className="mb-10 flex justify-center">
      <Logo
        className="shrink-0"
        imgClassName="h-auto w-[min(32rem,calc(100vw-3rem))]"
      />
    </div>
  );
}

// Branded left column shared by the login and signup screens: one centred
// column (shared left edge) — tagline on top, welcome + selling points in the
// middle, trust line at the foot.
export default function AuthBrandPanel({ title, subtitle }) {
  return (
    <div className="relative hidden overflow-hidden bg-[#1e3171] p-10 text-white lg:flex xl:p-14">
      <div className="mx-auto flex w-full max-w-xl flex-col">
        {/* The logo sits in the white form column (AuthBrandHeader). */}
        <p className="font-display text-2xl text-center font-semibold leading-snug text-white/90">
          Ghana&apos;s No.1 Biggest &amp; Most Reliable Sourcing Platform.
        </p>

        <div className="flex flex-1 flex-col justify-center py-10">
          <h2 className="font-display text-4xl font-bold leading-tight">
            {title}
          </h2>
          <p className="mt-4 max-w-md text-white/85">{subtitle}</p>

          <ul className="mt-8 divide-y divide-white/15 rounded-2xl bg-white/10">
            {points.map((p) => (
              <li key={p.title} className="flex items-start gap-4 px-5 py-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <p.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-display text-lg font-semibold">
                    {p.title}
                  </span>
                  <span className="block text-sm text-white/80">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="border-t border-white/20 pt-6 text-sm text-white/70">
          Trusted by buyers and suppliers across Ghana and beyond.
        </p>
      </div>
    </div>
  );
}
