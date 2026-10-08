// Business Offers (buyer): pick one of your RFxs / tenders / waybills on the
// left, see the offers received for it on the right. One component serves all
// three kinds (see OFFER_KINDS). The selected event lives in ?event=<ref_num>
// so a specific event's offers can be linked to directly.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  ExternalLink,
  FileText,
  Gavel,
  Inbox,
  Info,
  Loader2,
  RefreshCw,
  Search,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { prettify } from "@/utils/choices";
import { formatMoney } from "@/utils/money";
import { isDraftStatus, normalizeStatus } from "@/utils/status";
import { resolveMediaUrl } from "@/services/lib/env";
import {
  OFFER_KINDS,
  getIssuedEvents,
  getReceivedOffers,
  isMissingRoute,
} from "@/services/api/offers.service";

const KIND_ICON = { rfx: FileText, tender: Gavel, waybill: Truck };

const fmtDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? String(v)
    : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

// Offers are proforma invoices, but read every field defensively — the
// endpoint's exact shape isn't documented yet.
const normalizeOffer = (o) => {
  const url = String(o?.url ?? "");
  const ref =
    o?.ref_num ??
    o?.proforma_ref_num ??
    o?.reference ??
    url.match(/proforma-invoices\/([^/?#]+)/)?.[1] ??
    "";
  return {
    key: o?.id ?? ref,
    ref,
    title: o?.title ?? o?.name ?? "Untitled offer",
    company:
      o?.issuing_company_name ??
      o?.issuing_company_info ??
      o?.company_name ??
      o?.supplier_name ??
      o?.transporter_name ??
      (typeof o?.issuing_company === "object"
        ? o.issuing_company?.name
        : null) ??
      "—",
    logo: resolveMediaUrl(o?.issuing_company_display_logo ?? o?.logo ?? ""),
    total: o?.total_cost ?? o?.total_sales_value ?? o?.amount ?? null,
    currency: o?.currency || "GHS",
    status: o?.status ?? "",
    received: o?.created_at ?? o?.submitted_at ?? o?.submission_datetime,
  };
};

const STATUS_TINT = {
  draft: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  accepted:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  awarded:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  declined: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};
const neutralTint =
  "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300";

// Shows the payload status as-is (e.g. "Draft").
function StatusPill({ status }) {
  const s = normalizeStatus(status);
  if (!s) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_TINT[s] || neutralTint,
      )}
    >
      {prettify(s)}
    </span>
  );
}

function CompanyCell({ offer }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted">
        {offer.logo && !broken ? (
          <img
            src={offer.logo}
            alt=""
            loading="lazy"
            onError={() => setBroken(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <Building2 className="h-4 w-4 text-muted-foreground" />
        )}
      </span>
      <span className="truncate font-medium">{offer.company}</span>
    </span>
  );
}

// Tab order matches the old sidebar: RFx, Waybill, Tender.
const TAB_ORDER = ["rfx", "waybill", "tender"];

// Business Offers page: one sidebar link, the three offer kinds as tabs in
// ?type=<rfx|waybill|tender> (default rfx). `key` remounts per kind.
export function BusinessOffersPage() {
  const [searchParams] = useSearchParams();
  const requested = searchParams.get("type");
  const kind = TAB_ORDER.includes(requested) ? requested : "rfx";
  return <ReceivedOffersPage key={kind} kind={kind} showTabs />;
}

export default function ReceivedOffersPage({ kind, showTabs = false }) {
  const cfg = OFFER_KINDS[kind];
  const KindIcon = KIND_ICON[kind];
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedRef = searchParams.get("event") || "";
  // Offer detail pages come back here, to this exact view (tab + event).
  const location = useLocation();
  const backState = {
    backTo: `${location.pathname}${location.search}`,
    backLabel: "Back to offers",
  };
  // Select an event while keeping other params (e.g. ?type= on the tabbed page).
  const selectEvent = useCallback(
    (ref, opts) => {
      const next = new URLSearchParams(searchParams);
      next.set("event", ref);
      setSearchParams(next, opts);
    },
    [searchParams, setSearchParams],
  );

  // Left column: the buyer's events of this kind.
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");
  const [nextPage, setNextPage] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");

  // Right column: offers for the selected event.
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState(""); // "" | "missing" | message
  const [reloadKey, setReloadKey] = useState(0);

  // Reset when switching between RFx / Tender / Waybill offers.
  useEffect(() => {
    setEvents([]);
    setPage(1);
    setFilter("");
  }, [kind]);

  useEffect(() => {
    let cancelled = false;
    setEventsLoading(true);
    setEventsError("");
    getIssuedEvents(kind, page)
      .then(({ items, next }) => {
        if (cancelled) return;
        setEvents((prev) => (page === 1 ? items : [...prev, ...items]));
        setNextPage(next);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          `Couldn't load your ${cfg.plural}.`;
        setEventsError(msg);
        if (page === 1) setEvents([]);
      })
      .finally(() => !cancelled && setEventsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [kind, page, cfg.plural]);

  // Default the selection to the first event once the list arrives.
  useEffect(() => {
    if (!selectedRef && events.length && events[0]?.ref_num) {
      selectEvent(events[0].ref_num, { replace: true });
    }
  }, [selectedRef, events, selectEvent]);

  const loadOffers = useCallback(async () => {
    if (!selectedRef) {
      setOffers([]);
      return;
    }
    setOffersLoading(true);
    setOffersError("");
    try {
      const list = await getReceivedOffers(kind, selectedRef);
      setOffers(list.map(normalizeOffer));
    } catch (err) {
      setOffers([]);
      if (isMissingRoute(err)) {
        setOffersError("missing");
      } else {
        const msg =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          "Couldn't load offers for this event.";
        setOffersError(msg);
        toast.error(msg);
      }
    } finally {
      setOffersLoading(false);
    }
  }, [kind, selectedRef]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers, reloadKey]);

  const visibleEvents = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) =>
      `${e.ref_num ?? ""} ${e.title ?? ""}`.toLowerCase().includes(q),
    );
  }, [events, filter]);

  const selected = events.find((e) => e.ref_num === selectedRef);

  return (
    <div className="w-full space-y-6 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <Inbox className="h-3.5 w-3.5" /> Business offers
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
            {cfg.title}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/85">{cfg.blurb}</p>
        </div>
      </div>

      {showTabs && (
        <div
          role="tablist"
          aria-label="Offer type"
          className="flex flex-wrap gap-2"
        >
          {TAB_ORDER.map((key) => {
            const active = key === kind;
            const TabIcon = KIND_ICON[key];
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                // Switching type starts fresh: drop the selected event.
                onClick={() => setSearchParams({ type: key })}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand text-brand-foreground shadow-sm"
                    : "border border-border/70 bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                <TabIcon className="h-4 w-4" />
                {OFFER_KINDS[key].label}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Events */}
        <aside className="rounded-2xl border border-border/70 bg-card">
          <div className="border-b border-border/60 p-4">
            <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
              <KindIcon className="h-4 w-4 text-brand" /> Your {cfg.plural}
            </h2>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter by reference or title"
                aria-label={`Filter your ${cfg.plural}`}
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div
            className="max-h-[60vh] overflow-y-auto p-2"
            data-lenis-prevent=""
          >
            {eventsLoading && events.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : eventsError && events.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                {eventsError}
              </p>
            ) : visibleEvents.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                {events.length === 0 ? (
                  <>
                    You haven&apos;t issued any {cfg.plural} yet.
                    <Link
                      to={cfg.createUrl}
                      className="mt-2 block font-medium text-brand hover:underline"
                    >
                      Create one
                    </Link>
                  </>
                ) : (
                  "No matches."
                )}
              </div>
            ) : (
              <ul className="space-y-1">
                {visibleEvents.map((e) => {
                  const active = e.ref_num === selectedRef;
                  return (
                    <li key={e.id ?? e.ref_num}>
                      <button
                        type="button"
                        onClick={() => selectEvent(e.ref_num)}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "w-full rounded-xl px-3 py-2.5 text-left transition-colors",
                          active
                            ? "bg-brand/10 ring-1 ring-brand/30"
                            : "hover:bg-muted/60",
                        )}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "text-xs font-semibold",
                              active ? "text-brand" : "text-muted-foreground",
                            )}
                          >
                            {e.ref_num}
                          </span>
                          <StatusPill status={e.status} />
                        </span>
                        <span className="mt-1 block truncate text-sm font-medium">
                          {e.title || "Untitled"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {nextPage && !filter && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                disabled={eventsLoading}
                onClick={() => setPage((p) => p + 1)}
              >
                {eventsLoading ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : null}
                Load more
              </Button>
            )}
          </div>
        </aside>

        {/* Offers */}
        <section className="min-w-0 rounded-2xl border border-border/70 bg-card">
          <div className="flex flex-col gap-3 border-b border-border/60 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Offers received
              </p>
              <h2 className="mt-1 truncate font-display text-lg font-semibold">
                {selected?.title || selectedRef || `Select ${cfg.singular}`}
              </h2>
              {selectedRef && (
                <p className="text-xs text-muted-foreground">{selectedRef}</p>
              )}
            </div>
            {selectedRef && (
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReloadKey((k) => k + 1)}
                  disabled={offersLoading}
                >
                  <RefreshCw
                    className={cn(
                      "mr-1.5 h-4 w-4",
                      offersLoading && "animate-spin",
                    )}
                  />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to={cfg.eventUrl(selectedRef)}>
                    View {cfg.singular.split(" ").pop()}{" "}
                    <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <div className="p-5">
            {!selectedRef ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Choose one of your {cfg.plural} to see the offers it received.
              </p>
            ) : offersLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading offers…
              </div>
            ) : offersError === "missing" ? (
              <div className="mx-auto flex max-w-md flex-col items-center py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Info className="h-5 w-5" />
                </span>
                <p className="mt-3 font-medium">
                  {cfg.label} offers aren&apos;t available yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This view will list offers as soon as the service is enabled.
                  Meanwhile you can review all received proforma invoices.
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link to="/dashboard/proforma-invoices">
                    All proforma invoices{" "}
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : offersError ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {offersError}
              </p>
            ) : offers.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Inbox className="h-8 w-8 text-muted-foreground/60" />
                <p className="mt-3 font-medium">No offers received yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isDraftStatus(selected?.status)
                    ? "Offers will appear here as they come in."
                    : "This event received no offers."}
                </p>
              </div>
            ) : (
              <>
                <p className="mb-3 text-sm text-muted-foreground">
                  {offers.length} offer{offers.length === 1 ? "" : "s"}
                </p>
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/70 bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-2.5 font-medium">
                          {kind === "waybill" ? "Transporter" : "Supplier"}
                        </th>
                        <th className="px-4 py-2.5 font-medium">Offer</th>
                        <th className="px-4 py-2.5 text-right font-medium">
                          Total
                        </th>
                        <th className="px-4 py-2.5 font-medium">Status</th>
                        <th className="px-4 py-2.5 font-medium">Received</th>
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {offers.map((o) => (
                        <tr key={o.key} className="align-middle">
                          <td className="max-w-[220px] px-4 py-3">
                            <CompanyCell offer={o} />
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium">{o.title}</p>
                            {o.ref && (
                              <p className="text-xs text-muted-foreground">
                                {o.ref}
                              </p>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                            {formatMoney(o.total, o.currency)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusPill status={o.status} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                            {fmtDate(o.received)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {o.ref && (
                              <Link
                                to={`/dashboard/proforma-invoices/${o.ref}`}
                                state={backState}
                                className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium text-brand hover:underline"
                              >
                                View <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
