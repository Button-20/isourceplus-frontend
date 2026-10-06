import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import StarRating from "@/components/reviews/StarRating";
import OrgSearchField from "@/components/reviews/OrgSearchField";
import { createReview, updateReview } from "@/services/api/reviews.service";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

export default function ReviewModal({ open, onOpenChange, review, onSaved }) {
  const isEdit = Boolean(review);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  // Create-mode org picked via OrgSearchField.
  const [selectedOrg, setSelectedOrg] = useState(null);

  // Seed / reset the form whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    setRating(review?.rating || 0);
    setComment(review?.comment || "");
    setSelectedOrg(null);
  }, [open, review]);

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
              <OrgSearchField value={selectedOrg} onChange={setSelectedOrg} />
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
