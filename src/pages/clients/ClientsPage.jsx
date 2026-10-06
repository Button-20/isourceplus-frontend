// "Clients" (Organization): the organisations you do business with, in two
// tabs kept in ?client_type=company|transporter. Companies use
// companies/clients/ + companies/add-client/, transporters the transporters/
// equivalents (see clients.service).
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Globe,
  Handshake,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Star,
  Truck,
  UserPlus,
} from "lucide-react";

import Pagination from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AddClientModal from "@/components/clients/AddClientModal";
import { useAuth } from "@/services/context/app.context";
import { CLIENT_TYPES, listClients } from "@/services/api/clients.service";

const TAB_ORDER = ["company", "transporter"];
const TAB_ICONS = { company: Building2, transporter: Truck };

const fmtDate = (v) => {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleDateString(undefined, { dateStyle: "medium" })
    : "";
};

// One client/supplier as a card: identity on top, contact details in the
// middle, industry / rating / date added at the foot. Missing fields are skipped.
function ClientCard({ client: c, TypeIcon }) {
  const website = c.website
    ? c.website.startsWith("http")
      ? c.website
      : `https://${c.website}`
    : "";
  const contacts = [
    c.email && { icon: Mail, text: c.email, href: `mailto:${c.email}` },
    c.phone && { icon: Phone, text: c.phone, href: `tel:${c.phone}` },
    website && {
      icon: Globe,
      text: c.website.replace(/^https?:\/\//, ""),
      href: website,
      external: true,
    },
    c.address && { icon: MapPin, text: c.address, wrap: true },
  ].filter(Boolean);
  const added = fmtDate(c.addedAt);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-border/70 bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60",
            c.logo ? "bg-white" : "bg-brand/10 text-brand",
          )}
        >
          {c.logo ? (
            <img
              src={c.logo}
              alt=""
              loading="lazy"
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <TypeIcon className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 font-display font-semibold">
            <span className="truncate">{c.name}</span>
            {c.verified && (
              <BadgeCheck
                className="h-4 w-4 shrink-0 text-brand"
                aria-label="Verified"
              />
            )}
          </h3>
          {c.location && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{c.location}</span>
            </p>
          )}
        </div>
        {c.subType && (
          <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
            {c.subType}
          </span>
        )}
      </div>

      {contacts.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-border/60 pt-4 text-sm">
          {contacts.map(({ icon: Icon, text, href, external, wrap }) => (
            <li
              key={text}
              className={cn(
                "flex min-w-0 gap-2 text-muted-foreground",
                wrap ? "items-start" : "items-center",
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", wrap && "mt-0.5")} />
              {href ? (
                <a
                  href={href}
                  {...(external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="truncate hover:text-brand hover:underline"
                >
                  {text}
                </a>
              ) : (
                <span className={wrap ? "line-clamp-2" : "truncate"}>
                  {text}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {(c.industry || c.rating > 0 || added) && (
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-xs text-muted-foreground">
          {c.industry && (
            <span className="rounded-full border border-border/70 px-2.5 py-0.5">
              {c.industry}
            </span>
          )}
          {c.rating > 0 && (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {c.rating.toFixed(1)}
            </span>
          )}
          {added && <span className="ml-auto">Added {added}</span>}
        </div>
      )}
    </article>
  );
}

export default function ClientsPage() {
  const { companyId, transporterId, jobTitle, viewMode } = useAuth();
  const isTransporter =
    Boolean(transporterId) ||
    String(jobTitle ?? "").toLowerCase() === "logistics manager";
  const orgKind = isTransporter ? "transporter" : "company";
  const hasOrg = Boolean(isTransporter ? transporterId : companyId);
  // Buyers call them suppliers; suppliers and transporters call them clients.
  const noun = isTransporter || viewMode === "supplier" ? "client" : "supplier";

  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("client_type");
  const clientType = TAB_ORDER.includes(requested) ? requested : TAB_ORDER[0];
  const typeCfg = CLIENT_TYPES[clientType];
  const TypeIcon = TAB_ICONS[clientType];

  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });
  const [emptyMessage, setEmptyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // null | { status, message }

  const setClientType = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set("client_type", key);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    setPage(1);
  }, [clientType]);

  const load = useCallback(async () => {
    if (!hasOrg) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await listClients(orgKind, clientType, { page });
      setRows(res.items);
      setPagination({
        count: res.count,
        next: res.next,
        previous: res.previous,
      });
      setEmptyMessage(res.emptyMessage);
    } catch (err) {
      setRows([]);
      const status = err.response?.status;
      const body = err.response?.data;
      const detail =
        body && typeof body === "object" ? body.detail || body.message : null;
      setError({
        status,
        message:
          detail ||
          (status >= 500
            ? "The service ran into a problem. Please try again shortly."
            : "Couldn't load this list."),
      });
    } finally {
      setLoading(false);
    }
  }, [hasOrg, orgKind, clientType, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="w-full space-y-6 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <Handshake className="h-3.5 w-3.5" /> My {noun}s
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
              My {noun}s
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/85">
              {noun === "supplier"
                ? "The companies and transporters your company buys from."
                : `The companies and transporters your ${isTransporter ? "transport business" : "company"} works with.`}
            </p>
          </div>
          <Button
            onClick={() => setOpen(true)}
            disabled={!hasOrg}
            className="bg-white text-brand hover:bg-white/90"
          >
            <UserPlus className="mr-1.5 h-4 w-4" /> Add {noun}
          </Button>
        </div>
      </div>

      {/* Client type tabs */}
      <div
        role="tablist"
        aria-label="Client type"
        className="flex flex-wrap gap-2"
      >
        {TAB_ORDER.map((key) => {
          const active = key === clientType;
          const Icon = TAB_ICONS[key];
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setClientType(key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand text-brand-foreground shadow-sm"
                  : "border border-border/70 bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {CLIENT_TYPES[key].label}
            </button>
          );
        })}
      </div>

      {hasOrg && !loading && !error && rows.length > 0 ? (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((c) => (
              <li key={c.key}>
                <ClientCard client={c} TypeIcon={TypeIcon} />
              </li>
            ))}
          </ul>
          {(pagination.next || pagination.previous) && (
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
              <Pagination
                count={pagination.count}
                page={page}
                setPage={setPage}
                next={pagination.next}
                previous={pagination.previous}
              />
            </div>
          )}
        </>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-brand" /> Loading{" "}
              {typeCfg.label.toLowerCase()}…
            </div>
          ) : !hasOrg ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <Handshake className="h-8 w-8 text-muted-foreground/60" />
              <p className="mt-3 font-medium">No organization yet</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Set up your organization first to add {noun}s.
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <p className="mt-3 font-medium">
                Couldn&apos;t load {typeCfg.label.toLowerCase()}
              </p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {error.message}
                {error.status ? ` (error ${error.status})` : ""}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={load}
              >
                <RefreshCw className="mr-1.5 h-4 w-4" /> Try again
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <TypeIcon className="h-5 w-5" />
              </span>
              <p className="mt-3 font-medium">
                No {typeCfg.singular} {noun}s yet
              </p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {emptyMessage ||
                  `Search for a ${typeCfg.singular} on iSourcePlus and add it as a ${noun}.`}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setOpen(true)}
              >
                <UserPlus className="mr-1.5 h-4 w-4" /> Add {noun}
              </Button>
            </div>
          ) : null}
        </div>
      )}

      <AddClientModal
        open={open}
        onOpenChange={setOpen}
        orgKind={orgKind}
        noun={noun}
        onAdded={(org) => {
          // Show the tab the new client belongs to, then refresh it.
          const type = TAB_ORDER.includes(org.contentType)
            ? org.contentType
            : clientType;
          if (type !== clientType) setClientType(type);
          else load();
        }}
      />
    </div>
  );
}
