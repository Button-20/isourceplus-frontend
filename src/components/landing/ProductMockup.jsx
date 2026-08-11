import { FileText, Gavel, Wallet, TrendingUp } from "lucide-react";

// Pure code/SVG abstract product-UI mockup — no photos, self-contained.
export default function ProductMockup() {
  const bars = [42, 68, 55, 80, 62, 90];

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="absolute inset-0 -rotate-3 rounded-3xl bg-brand-gradient opacity-10" />
      <div className="relative rounded-3xl border border-border/70 bg-card p-5 shadow-2xl shadow-brand/10">
        {/* window chrome */}
        <div className="mb-4 flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="ml-3 text-xs text-muted-foreground">
            iSource+ · Procurement dashboard
          </span>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: FileText, label: "Open RFx", value: "12" },
            { icon: Gavel, label: "Tenders", value: "5" },
            { icon: Wallet, label: "Payments", value: "GHC 48k" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-border/60 p-3">
              <k.icon className="h-4 w-4 text-brand" />
              <div className="mt-2 font-display text-lg font-bold leading-none">
                {k.value}
              </div>
              <div className="text-[11px] text-muted-foreground">{k.label}</div>
            </div>
          ))}
        </div>

        {/* chart card */}
        <div className="mt-3 rounded-xl border border-border/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">Spend this quarter</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" /> +18%
            </span>
          </div>
          <div className="flex h-24 items-end gap-2">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-brand-gradient"
                style={{ height: `${h}%`, opacity: 0.55 + i * 0.07 }}
              />
            ))}
          </div>
        </div>

        {/* list rows */}
        <div className="mt-3 space-y-2">
          {["Proforma invoice #PI-2043", "Purchase order #PO-1188"].map((r) => (
            <div
              key={r}
              className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
            >
              <span className="text-xs">{r}</span>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand">
                Approved
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* floating badge */}
      <div className="absolute -bottom-4 -right-4 hidden rounded-2xl border border-border/70 bg-card p-3 shadow-xl sm:block">
        <div className="text-[11px] text-muted-foreground">Suppliers matched</div>
        <div className="font-display text-xl font-bold text-brand-gradient">
          128
        </div>
      </div>
    </div>
  );
}
