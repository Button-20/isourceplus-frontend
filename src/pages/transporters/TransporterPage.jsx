// pages/TransporterPage.jsx — branded transporter registration screen.
import TransporterForm from "@/components/TransporterForm";
import { Truck } from "lucide-react";

export default function TransporterPage() {
  return (
    <div className="mx-auto max-w-4xl font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <span className="relative inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
          <Truck className="h-3.5 w-3.5" /> Transporter registration
        </span>
        <h1 className="relative mt-4 font-display text-2xl font-bold sm:text-3xl">
          Register your transport service
        </h1>
        <p className="relative mt-2 max-w-2xl text-sm text-white/85">
          Set up your transporter profile to offer logistics and delivery across
          the iSource+ supply chain.
        </p>
      </div>

      {/* Form card */}
      <div className="mt-6 rounded-2xl border border-border/70 bg-card p-6 sm:p-8">
        <TransporterForm />
      </div>
    </div>
  );
}
