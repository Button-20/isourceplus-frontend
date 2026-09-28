import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  Building2,
  Truck,
  Check,
  BadgeCheck,
  Star,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { prettify } from "@/utils/choices";
import StarRating from "@/components/reviews/StarRating";
import {
  createReview,
  updateReview,
  searchOrganizationsToReview,
} from "@/services/api/reviews.service";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

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
    logo: item.logo || null,
    verified: Boolean(item.is_verified),
    rating: Number(item.avg_rating) || 0,
    location,
  };
}

// Logo (or a type icon fallback) for an org. A fixed square container with
// overflow-hidden guarantees the image crops cleanly (object-cover) instead of
// stretching, whatever the source aspect ratio is.
function OrgAvatar({ org, className }) {
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

export default function ReviewModal({ open, onOpenChange, review, onSaved }) {
  const isEdit = Boolean(review);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  // Create-mode org search.
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);

  // Seed / reset the form whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    setRating(review?.rating || 0);
    setComment(review?.comment || "");
    setQuery("");
    setResults([]);
    setSelectedOrg(null);
  }, [open, review]);

  // Debounced organization search (create mode only).
  useEffect(() => {
    if (isEdit || !open) return;
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
  }, [query, isEdit, open]);

  const orgLabel = useMemo(() => {
    if (isEdit)
      return (
        review?.provided_organisation_name ||
        review?.organisation_name ||
        review?.reviewed_organisation ||
        "this organization"
      );
    return selectedOrg?.name;
  }, [isEdit, review, selectedOrg]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return toast.error("Please choose a rating");
    if (!isEdit && !selectedOrg) return toast.error("Select an organization");
    setSaving(true);
    try {
      if (isEdit) {
        await updateReview(review.id, { rating, comment });
        toast.success("Review updated");
      } else {
        await createReview({
          rating,
          comment: comment || undefined,
          provided_content_type: selectedOrg.contentType,
          provided_object_id: selectedOrg.id,
        });
        toast.success("Review submitted");
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          err.response?.data?.rating?.[0] ||
          err.response?.data?.provided_object_id?.[0] ||
          "Failed to save review.",
      );
    } finally {
      setSaving(false);
    }
  };

  const q = query.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-montserrat sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit review" : "Write a review"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update your review for ${orgLabel}.`
              : "Search for an organization and share your experience."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Org search (create only) */}
          {!isEdit && (
            <div>
              <label className={labelClass}>Organization</label>
              {selectedOrg ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-brand/40 bg-brand/5 px-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <OrgAvatar org={selectedOrg} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <span className="truncate">{selectedOrg.name}</span>
                        {selectedOrg.verified && (
                          <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-brand" />
                        )}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {orgTypeLabel(selectedOrg)}
                        {selectedOrg.location ? ` · ${selectedOrg.location}` : ""}
                      </span>
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedOrg(null)}
                    className="shrink-0 text-xs font-medium text-brand hover:underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search companies or transporters…"
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
                            onClick={() => setSelectedOrg(org)}
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
              )}
            </div>
          )}

          {/* Rating */}
          <div>
            <label className={labelClass}>Rating</label>
            <StarRating value={rating} onChange={setRating} size={26} />
          </div>

          {/* Comment */}
          <div>
            <label className={labelClass}>Comment (optional)</label>
            <Textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details of your experience"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className={cn(
                "bg-brand-gradient text-brand-foreground hover:opacity-90",
              )}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                </>
              ) : isEdit ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Save changes
                </>
              ) : (
                "Submit review"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
