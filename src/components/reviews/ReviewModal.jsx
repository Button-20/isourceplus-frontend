import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, Building2, Truck, Check } from "lucide-react";

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
import StarRating from "@/components/reviews/StarRating";
import {
  createReview,
  updateReview,
  searchOrganizationsToReview,
} from "@/services/api/reviews.service";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

// Pull a consistent { id, name, contentType } out of a search result whose
// exact shape isn't guaranteed by the API.
function normalizeOrg(item) {
  if (!item || typeof item !== "object") return null;
  const id = item.id ?? item.object_id ?? item.uuid ?? "";
  const name = item.name ?? item.company_name ?? item.title ?? "Unnamed";
  const contentType =
    item.content_type ?? item.provided_content_type ?? item.type ?? "";
  return { id: String(id), name, contentType: String(contentType) };
}

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
        const list = Array.isArray(data) ? data : data?.results || [];
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
                <div className="flex items-center justify-between rounded-lg border border-brand/40 bg-brand/5 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {selectedOrg.contentType === "transporter" ? (
                      <Truck className="h-4 w-4 text-brand" />
                    ) : (
                      <Building2 className="h-4 w-4 text-brand" />
                    )}
                    {selectedOrg.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedOrg(null)}
                    className="text-xs font-medium text-brand hover:underline"
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
                      placeholder="Search organizations…"
                      className="pl-9"
                    />
                  </div>
                  {(searching || results.length > 0) && (
                    <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-border/70">
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
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
                          >
                            {org.contentType === "transporter" ? (
                              <Truck className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="flex-1 truncate">{org.name}</span>
                            <span className="text-xs capitalize text-muted-foreground">
                              {org.contentType}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {!searching && query.trim() && results.length === 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      No organizations found.
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
