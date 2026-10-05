import { useState } from "react";
import { Handshake } from "lucide-react";

// "Our Partners" (reviewed Features doc). Logos weren't supplied yet: each tile
// shows a monogram until a file is dropped at `public/partners/<id>.png`, at
// which point the logo is used automatically.
const PARTNERS = [
  { id: "gra", short: "GRA", name: "Ghana Revenue Authority" },
  {
    id: "gncci",
    short: "GNCCI",
    name: "Ghana National Chamber of Commerce and Industry",
  },
  {
    id: "appsnmobile",
    short: "AppsNmobile",
    name: "AppsNmobile — fintech partner licensed by the Bank of Ghana",
  },
  { id: "guta", short: "GUTA", name: "Ghana Union Traders Association" },
];

function PartnerLogo({ partner }) {
  const [failed, setFailed] = useState(false);
  // Hidden until it loads, so a missing logo never flashes its alt text.
  const [loaded, setLoaded] = useState(false);
  if (failed) {
    return (
      <span className="font-display text-xl font-bold tracking-wide text-brand">
        {partner.short}
      </span>
    );
  }
  return (
    <img
      src={`/partners/${partner.id}.png`}
      alt={`${partner.short} logo`}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`max-h-12 w-auto max-w-[140px] object-contain transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
    />
  );
}

export default function PartnersSection() {
  return (
    <section id="partners" className="scroll-mt-20 py-20 lg:py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand">
            <Handshake className="h-4 w-4" /> Our partners
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Working with the institutions behind Ghana&apos;s trade
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PARTNERS.map((p) => (
            <div
              key={p.id}
              className="flex flex-col items-center justify-center rounded-2xl border border-border/70 bg-card px-6 py-8 text-center"
            >
              <div className="flex h-14 items-center justify-center">
                <PartnerLogo partner={p} />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{p.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
