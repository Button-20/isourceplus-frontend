// Frequently asked questions — public page (/faq).
// Copy: src/data/faq.js ("Web-friendly FAQ_Isourceplus.docx").
import { useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock,
  Network,
  Search,
  X,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import LandingFooter, { CtaBanner } from "@/components/landing/LandingFooter";
import FlowChain from "@/components/landing/FlowChain";
import useHashScroll from "@/components/landing/useHashScroll";
import { cn } from "@/lib/utils";
import { FAQ_SECTIONS, FRAGMENTED_SOURCES, QUICK_REFERENCE } from "@/data/faq";

// Flatten an answer to plain text for search.
const answerText = (blocks) =>
  blocks
    .map((b) =>
      typeof b === "string"
        ? b
        : b.list || b.flow || b.steps
          ? (b.list || b.flow || b.steps).join(" ")
          : `${b.text || ""} ${b.link?.label || ""}`,
    )
    .join(" ");

function Answer({ blocks }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
      {blocks.map((b, i) => {
        if (typeof b === "string") return <p key={i}>{b}</p>;
        if (b.list)
          return (
            <ul key={i} className="grid gap-1.5 sm:grid-cols-2">
              {b.list.map((li) => (
                <li key={li} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span className="text-foreground/90">{li}</span>
                </li>
              ))}
            </ul>
          );
        if (b.flow)
          return (
            <FlowChain
              key={i}
              steps={b.flow}
              joiner={b.joiner === "+" ? "+" : "arrow"}
              size="sm"
            />
          );
        if (b.steps)
          return (
            <ol key={i} className="grid gap-2">
              {b.steps.map((st, n) => (
                <li key={st} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-foreground">
                    {n + 1}
                  </span>
                  <span className="pt-0.5 text-foreground/90">{st}</span>
                </li>
              ))}
            </ol>
          );
        return (
          <p key={i}>
            {b.text}
            {b.text && b.link ? " " : ""}
            {b.link && (
              <Link
                to={b.link.to}
                className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
              >
                {b.link.label} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </p>
        );
      })}
    </div>
  );
}

function FaqItem({ item, open, onToggle }) {
  const panelId = useId();
  return (
    <div className="rounded-xl border border-border/70 bg-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-medium">{item.q}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180 text-brand",
          )}
        />
      </button>
      {open && (
        <div id={panelId} className="border-t border-border/60 px-5 pb-5 pt-4">
          <Answer blocks={item.a} />
        </div>
      )}
    </div>
  );
}

const STATUS_STYLE = {
  yes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "not-yet":
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  ecosystem: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
};

export function FaqPage() {
  useHashScroll();
  const [query, setQuery] = useState("");
  // Opened question keys ("sectionId:index"); the first one starts open.
  const [openKeys, setOpenKeys] = useState(() => new Set(["about:0"]));

  const q = query.trim().toLowerCase();
  const sections = useMemo(() => {
    if (!q) return FAQ_SECTIONS;
    return FAQ_SECTIONS.map((s) => ({
      ...s,
      items: s.items.filter((it) =>
        `${it.q} ${answerText(it.a)}`.toLowerCase().includes(q),
      ),
    })).filter((s) => s.items.length);
  }, [q]);
  const matchCount = sections.reduce((n, s) => n + s.items.length, 0);

  const toggle = (key) =>
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const allKeys = FAQ_SECTIONS.flatMap((s) =>
    s.items.map((_, i) => `${s.id}:${i}`),
  );
  const allOpen = allKeys.every((k) => openKeys.has(k));

  return (
    <div className="font-montserrat">
      <LandingNav />
      <main>
        {/* Hero + search */}
        <section className="relative overflow-hidden bg-brand-gradient text-brand-foreground">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="container relative py-16 sm:py-20">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <CircleHelp className="h-3.5 w-3.5" /> Source-to-Pay (S2P)
            </span>
            <h1 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Frequently asked questions
            </h1>
            <p className="mt-4 max-w-2xl text-white/90">
              Everything you need to know about buying, supplying and
              transporting on iSourcePlus.
            </p>
            <div className="relative mt-8 max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions — e.g. UTID, invoices, payments"
                aria-label="Search frequently asked questions"
                className="h-12 w-full rounded-full border-0 bg-white pl-11 pr-11 text-sm text-foreground shadow-lg outline-none ring-2 ring-transparent placeholder:text-muted-foreground focus:ring-white/60 dark:bg-card"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Category jump links */}
        {!q && (
          <nav
            aria-label="FAQ categories"
            className="sticky top-16 z-30 border-b border-border/60 bg-background/85 backdrop-blur-lg"
          >
            <div className="container flex gap-2 overflow-x-auto py-3 scrollbar-hide">
              {FAQ_SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="shrink-0 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
                >
                  {s.title}
                </a>
              ))}
              <a
                href="#quick-reference"
                className="shrink-0 rounded-full border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs font-medium text-brand"
              >
                Quick reference
              </a>
            </div>
          </nav>
        )}

        {/* Questions */}
        <section className="py-14 lg:py-16">
          <div className="container max-w-4xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {q
                  ? `${matchCount} result${matchCount === 1 ? "" : "s"} for “${query.trim()}”`
                  : `${allKeys.length} questions in ${FAQ_SECTIONS.length} topics`}
              </p>
              {!q && (
                <button
                  type="button"
                  onClick={() =>
                    setOpenKeys(allOpen ? new Set() : new Set(allKeys))
                  }
                  className="text-sm font-medium text-brand hover:underline"
                >
                  {allOpen ? "Collapse all" : "Expand all"}
                </button>
              )}
            </div>

            {sections.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center">
                <p className="font-medium">No questions match your search.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try another word, or{" "}
                  <a
                    href="mailto:support@isourceplus.net"
                    className="font-medium text-brand hover:underline"
                  >
                    contact support
                  </a>
                  .
                </p>
              </div>
            ) : (
              <div className="space-y-12">
                {sections.map((s, si) => (
                  <section key={s.id} id={s.id} className="scroll-mt-32">
                    <h2 className="flex items-center gap-3 font-display text-xl font-semibold">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-sm font-bold text-brand">
                        {q ? si + 1 : FAQ_SECTIONS.indexOf(s) + 1}
                      </span>
                      {s.title}
                    </h2>
                    <div className="mt-5 space-y-3">
                      {s.items.map((item) => {
                        const idx = FAQ_SECTIONS.find(
                          (x) => x.id === s.id,
                        ).items.indexOf(item);
                        const key = `${s.id}:${idx}`;
                        return (
                          <FaqItem
                            key={key}
                            item={item}
                            open={Boolean(q) || openKeys.has(key)}
                            onToggle={() => toggle(key)}
                          />
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Quick reference */}
        <section
          id="quick-reference"
          className="scroll-mt-32 bg-muted/40 py-14 lg:py-16"
        >
          <div className="container max-w-4xl">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Quick reference
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              What iSourcePlus does today, and what&apos;s coming.
            </p>
            <div className="mt-6 overflow-hidden rounded-2xl border border-border/70 bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Question</th>
                    <th className="px-5 py-3 font-medium">iSourcePlus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {QUICK_REFERENCE.map((row) => (
                    <tr key={row.q}>
                      <td className="px-5 py-3 font-medium">{row.q}</td>
                      <td className="px-5 py-3">
                        {row.status === "info" ? (
                          <span className="text-muted-foreground">{row.a}</span>
                        ) : (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                              STATUS_STYLE[row.status],
                            )}
                          >
                            {row.status === "yes" && (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            {row.status === "not-yet" && (
                              <Clock className="h-3.5 w-3.5" />
                            )}
                            {row.status === "ecosystem" && (
                              <Network className="h-3.5 w-3.5" />
                            )}
                            {row.a}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* The iSourcePlus difference */}
        <section className="py-14 lg:py-16">
          <div className="container max-w-5xl">
            <div className="text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-brand">
                The iSourcePlus difference
              </span>
              <h2 className="mx-auto mt-3 max-w-2xl font-display text-2xl font-bold tracking-tight sm:text-3xl">
                From disconnected procurement data to connected procurement
                intelligence
              </h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-card p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  From
                </p>
                <p className="mt-2 font-display text-lg font-semibold">
                  Disconnected procurement data
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Traditional procurement can leave information fragmented
                  across:
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {FRAGMENTED_SOURCES.map((src) => (
                    <span
                      key={src}
                      className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {src}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-brand-gradient p-6 text-brand-foreground">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/75">
                  To
                </p>
                <p className="mt-2 font-display text-lg font-semibold">
                  Connected procurement intelligence
                </p>
                <p className="mt-2 text-sm text-white/90">
                  iSourcePlus is designed to connect the procurement journey
                  into a structured digital transaction.
                </p>
              </div>
            </div>

            <div className="mx-auto mt-14 max-w-3xl text-center">
              <h3 className="font-display text-xl font-semibold">
                Why will an organisation use iSourcePlus?
              </h3>
              <p className="mt-3 text-muted-foreground">
                Because procurement is more than buying. It is about connecting
                business needs, suppliers, contracts, inventory, deliveries,
                invoices, payments, finance and intelligence into one traceable
                process.
              </p>
              <p className="mt-6 font-display text-sm font-bold tracking-[0.2em] text-brand">
                CONNECT. SOURCE. PAY.
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Use the platform. Verify the information. Make the decision. Own
                the obligation.
              </p>
            </div>
          </div>
        </section>

        <CtaBanner
          title="Still have questions?"
          subtitle="Explore how iSourcePlus fits your industry, or get started today."
          secondary={{ label: "Industry use cases", to: "/use-cases" }}
        />
      </main>
      <LandingFooter />
    </div>
  );
}

export default FaqPage;
