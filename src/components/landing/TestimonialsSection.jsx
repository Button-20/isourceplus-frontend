import { useState } from "react";
import { Quote } from "lucide-react";

// "Trusted by Industry" (reviewed Features doc). Quotes are the customers' own
// words with light copy-edits (brand name, spelling). Photos live at
// `public/testimonials/<id>.jpg`; until a photo exists the card shows initials.
const TESTIMONIALS = [
  {
    id: "kennedy-amoh",
    name: "Kennedy Amoh",
    role: "CEO, Go-Diak Afrique Limited",
    quote:
      "Our marketing expenditure accounted for 70% of our working capital in order to connect into the marketplace, but revenue was next to nothing, which was a worry to us. iSourcePlus gave us very high visibility when we subscribed to the PLATINUM package, as we receive all the business invitations from the marketplace. This led to a significant reduction in our marketing expenditure while sales revenue grew exponentially.",
  },
  {
    id: "jonathan-dornyo",
    name: "Jonathan Dornyo",
    role: "CEO, NAT Citadel Logistics",
    quote:
      "As a company specialised in interior and exterior décor and home furnishing, sourcing large quantities of materials for multiple project sites has often been challenging, leading to delays and increased costs. Since discovering iSourcePlus, we have streamlined our sourcing process, improved cost efficiency, and maintained our project timelines and budgets. This has enhanced our operational efficiency and enabled us to deliver quality projects while keeping our clients satisfied.",
  },
  {
    id: "lawrence-havor",
    name: "Lawrence Havor",
    role: "CEO, Via Spiga Ventures",
    quote:
      "We lost many big government contracts and ended up working in the shadows of competitors while they built their project portfolios, due to late filing of VAT receipts and non-compliance, combined with the huge challenge of sourcing from multiple sources to make price and material decisions as a plumbing and construction engineering company. Using iSourcePlus brought us convenience: we became VAT compliant, work within timelines and deliver within budget. Our trust ratings have gone up in the marketplace.",
  },
  {
    id: "alhaji-seinu",
    name: "Alhaji Seinu",
    role: "CEO, Building Materials and More",
    quote:
      "Record keeping was intensively and extensively manual and resided in silos — email, Excel spreadsheets, paper receipts and more. This made it difficult for my bankers to assess my business for a loan facility to finance my Purchase Order, Goods Received Note and Sales Invoice. Because of these bottlenecks, I lost projects and clients through our inability to deliver. Since joining iSourcePlus, all our business documents — from RFQ and Purchase Order to Sales Invoice and Payment Receipts — are kept in one place and can be traced, and it is now easier to secure a loan facility on time.",
  },
];

const initials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

function Avatar({ person }) {
  const [failed, setFailed] = useState(false);
  // Hidden until it loads, so a missing photo never flashes its alt text.
  const [loaded, setLoaded] = useState(false);
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand/10 ring-2 ring-brand/15">
      {failed ? (
        <span className="font-display text-sm font-bold text-brand">
          {initials(person.name)}
        </span>
      ) : (
        <img
          src={`/testimonials/${person.id}.jpg`}
          alt={person.name}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover object-top transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </span>
  );
}

export default function TestimonialsSection() {
  return (
    <section id="reviews" className="scroll-mt-20 bg-muted/40 py-20 lg:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand">
            Trusted by industry
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            What businesses say about iSourcePlus
          </h2>
          <p className="mt-4 text-muted-foreground">
            Buyers, suppliers and transporters trading smarter on the platform.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-6 md:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.id}
              className="flex flex-col rounded-2xl border border-border/70 bg-card p-6 sm:p-8"
            >
              <Quote className="h-7 w-7 text-brand/40" aria-hidden="true" />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-border/60 pt-5">
                <Avatar person={t} />
                <span className="min-w-0">
                  <span className="block font-display font-semibold">
                    {t.name}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {t.role}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
