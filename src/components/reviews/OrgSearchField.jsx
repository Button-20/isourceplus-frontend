// Organisation picker shared by the review modal and "Add client": searches
// GET reviews/search-organisation-to-review/?name= (debounced) and returns the
// chosen org via onChange(org | null). Org shape: see normalizeOrg.
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Building2,
  Loader2,
  Search,
  Star,
  Truck,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { prettify } from "@/utils/choices";
import { resolveMediaUrl } from "@/services/lib/env";
import { searchOrganizationsToReview } from "@/services/api/reviews.service";

// Normalize a search result into the shape the UI + createReview need. The
// content type ("company" | "transporter") comes from `org_type`/`content_type`
// — NOT `type`, which is the org's sub-type (buyer / supplier / organisation).
function normalizeOrg(item) {
  if (!item || typeof item !== "object") return null;
  const id = item.id ?? item.object_id ?? item.uuid ?? "";
  if (!id) return null;
  const contentType = String(
    item.org_type ?? item.content_type ?? "",
  ).toLowerCase();

  // Best-effort human location line.
  const loc = item.location;
  const locFromObj =
    loc && typeof loc === "object"
      ? [loc.region, loc.district].filter(Boolean).map(prettify).join(", ")
      : "";
  const location =
    locFromObj ||
    item.transporter_address ||
    item.company_address ||
    (item.country ? prettify(item.country) : "");

  return {
    id: String(id),
    name: item.name ?? item.company_name ?? item.title ?? "Unnamed",
    contentType, // "company" | "transporter"
    subType: item.type ? String(item.type) : "", // buyer | supplier | organisation | individual
    logo: resolveMediaUrl(item.logo) || null,
    verified: Boolean(item.is_verified),
    rating: Number(item.avg_rating) || 0,
    location,
  };
}

// Logo (or a type icon fallback) for an org. A fixed square container with
// overflow-hidden guarantees the image crops cleanly (object-cover) instead of
// stretching, whatever the source aspect ratio is.
export function OrgAvatar({ org, className }) {
  const Icon = org.contentType === "transporter" ? Truck : Building2;
  return (
    <span
      className={cn(
        "flex aspect-square h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60",
        org.logo ? "bg-muted" : "bg-brand/10",
        className,
      )}
    >
      {org.logo ? (
        <img
          src={org.logo}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <Icon className="h-4 w-4 text-brand" />
      )}
    </span>
  );
}

// "Company · Buyer" / "Transporter · Organisation"
const orgTypeLabel = (org) =>
  [org.contentType, org.subType].filter(Boolean).map(prettify).join(" · ");

export default function OrgSearchField({
  value,
  onChange,
  placeholder = "Search companies or transporters…",
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Debounced search while nothing is selected.
  useEffect(() => {
    if (value) return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const data = await searchOrganizationsToReview(q);
        // The endpoint wraps the ranked array under `data` ({ data: [...] }).
        const list = Array.isArray(data)
          ? data
          : data?.data || data?.results || [];
        // Backend already ranks by similarity; keep that order.
        if (!cancelled) setResults(list.map(normalizeOrg).filter(Boolean));
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, value]);

  const q = query.trim();

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-brand/40 bg-brand/5 px-3 py-2.5">
        <span className="flex min-w-0 items-center gap-2.5">
          <OrgAvatar org={value} />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <span className="truncate">{value.name}</span>
              {value.verified && (
                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-brand" />
              )}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {orgTypeLabel(value)}
              {value.location ? ` · ${value.location}` : ""}
            </span>
          </span>
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="shrink-0 text-xs font-medium text-brand hover:underline"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      {(searching || results.length > 0) && (
        <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-border/70">
          {searching ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          ) : (
            results.map((org) => (
              <button
                key={`${org.contentType}-${org.id}`}
                type="button"
                onClick={() => onChange(org)}
                className="flex w-full items-center gap-3 border-b border-border/50 px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-muted/50"
              >
                <OrgAvatar org={org} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="truncate">{org.name}</span>
                    {org.verified && (
                      <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-brand" />
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {orgTypeLabel(org)}
                    {org.location ? ` · ${org.location}` : ""}
                  </span>
                </span>
                {org.rating > 0 && (
                  <span className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {org.rating.toFixed(1)}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
      {!searching && q && results.length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          No organizations found for “{q}”.
        </p>
      )}
    </>
  );
}
