import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Star,
  Plus,
  Pencil,
  Trash2,
  Building2,
  Truck,
  MessageSquare,
} from "lucide-react";
import {
  format,
  formatDistanceToNow,
} from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import StarRating from "@/components/reviews/StarRating";
import ReviewModal from "@/components/reviews/ReviewModal";
import {
  getOrganizationReviews,
  getAllReviews,
  deleteReview,
} from "@/services/api/reviews.service";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

function ReviewCard({ review, onEdit, onDelete }) {
  const created = review.created_at ? new Date(review.created_at) : null;
  const orgName =
    review.provided_organisation_name ||
    review.organisation_name ||
    review.reviewed_organisation ||
    review.provided_object_name ||
    "Organization";
  const contentType =
    review.provided_content_type || review.content_type || "company";
  const author =
    review.reviewer_name ||
    review.author_name ||
    review.created_by ||
    review.organisation_name;

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            {contentType === "transporter" ? (
              <Truck className="h-5 w-5" />
            ) : (
              <Building2 className="h-5 w-5" />
            )}
          </span>
          <div>
            <p className="font-display font-semibold">{orgName}</p>
            <div className="mt-1 flex items-center gap-2">
              <StarRating value={review.rating} size={15} />
              <span className="text-xs text-muted-foreground">
                {review.rating}/5
              </span>
            </div>
          </div>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1.5">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(review)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
              </Button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(review)}
                className="text-muted-foreground transition-colors hover:text-destructive"
                aria-label="Delete review"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
      {review.comment && (
        <p className="mt-3 text-sm text-foreground">{review.comment}</p>
      )}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        {author && <span>By {author}</span>}
        {author && created && <span>·</span>}
        {created && (
          <span title={format(created, "dd MMM yyyy, HH:mm")}>
            {formatDistanceToNow(created, { addSuffix: true })}
          </span>
        )}
      </div>
    </div>
  );
}

function ReviewList({ loading, reviews, emptyText, onEdit, onDelete }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-brand" /> Loading reviews…
      </div>
    );
  }
  if (!reviews.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 py-14 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
          <MessageSquare className="h-6 w-6 text-brand" />
        </div>
        <p className="font-medium">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {reviews.map((r) => (
        <ReviewCard key={r.id} review={r} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

const ReviewsPage = () => {
  const [mineLoading, setMineLoading] = useState(true);
  const [allLoading, setAllLoading] = useState(true);
  const [mine, setMine] = useState([]);
  const [all, setAll] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMine = useCallback(async () => {
    setMineLoading(true);
    try {
      setMine(asList(await getOrganizationReviews()));
    } catch {
      setMine([]);
      toast.error("Failed to load your reviews.");
    } finally {
      setMineLoading(false);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setAllLoading(true);
    try {
      setAll(asList(await getAllReviews()));
    } catch {
      setAll([]);
      toast.error("Failed to load reviews.");
    } finally {
      setAllLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMine();
    fetchAll();
  }, [fetchMine, fetchAll]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (review) => {
    setEditing(review);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteReview(toDelete.id);
      toast.success("Review deleted");
      setToDelete(null);
      fetchMine();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete review.");
    } finally {
      setDeleting(false);
    }
  };

  const refresh = () => {
    fetchMine();
    fetchAll();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <Star className="h-3.5 w-3.5" /> Reviews
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
              Reviews
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/85">
              Rate the organizations you&apos;ve worked with and see feedback
              across the marketplace.
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="bg-white text-brand hover:bg-white/90"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Write a review
          </Button>
        </div>
      </div>

      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">Your reviews</TabsTrigger>
          <TabsTrigger value="all">All reviews</TabsTrigger>
        </TabsList>
        <TabsContent value="mine" className="mt-6">
          <ReviewList
            loading={mineLoading}
            reviews={mine}
            emptyText="You haven't written any reviews yet."
            onEdit={openEdit}
            onDelete={setToDelete}
          />
        </TabsContent>
        <TabsContent value="all" className="mt-6">
          <ReviewList
            loading={allLoading}
            reviews={all}
            emptyText="No reviews yet."
          />
        </TabsContent>
      </Tabs>

      <ReviewModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        review={editing}
        onSaved={refresh}
      />

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setToDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewsPage;
