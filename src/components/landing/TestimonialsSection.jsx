import { ShieldCheck } from "lucide-react";

// Genuine credibility, not fabricated customer quotes. iSourceplus is pre-launch
// (no live customers to quote yet), so this section shows the real institutional
// endorsements from the company's strategic plan instead of invented reviews.
// Acronyms only — the source lists these without full names, so don't guess at
// expansions. When real testimonials exist, swap this block for a quote grid.
const ENDORSERS = ["GUTA", "GRA", "GIPS", "DPA"];

export default function TestimonialsSection() {
  return (
    <section id="reviews" className="scroll-mt-20 bg-muted/40 py-20 lg:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand">
            Trusted &amp; endorsed
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Backed by Ghana&apos;s leading institutions
          </h2>
          <p className="mt-4 text-muted-foreground">
            iSourceplus is endorsed by the bodies that shape trade, tax and
            data protection in Ghana.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ENDORSERS.map((e) => (
            <div
              key={e}
              className="flex flex-col items-center rounded-2xl border border-border/70 bg-card p-6 text-center"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <span className="mt-4 font-display text-xl font-bold tracking-wide">
                {e}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
