// "Feedback": rate a feature and suggest improvements (POST feedbacks/), and
// manage what you've sent (feedbacks/mine/ — edit or delete).
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Inbox,
  Loader2,
  MessageSquareHeart,
  Pencil,
  RefreshCw,
  Send,
  Star,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  FEEDBACK_FEATURES,
  deleteFeedback,
  featureLabel,
  feedbackErrorMessage,
  listFeedbackFeatures,
  listMyFeedback,
  submitFeedback,
  updateFeedback,
} from "@/services/api/feedback.service";

const EMPTY = { feature: "", rating: 0, recommendation: "" };

function StarRating({ value, onChange, size = "h-6 w-6", readOnly = false }) {
  return (
    <div
      className="flex items-center gap-1"
      role={readOnly ? "img" : "radiogroup"}
      aria-label={`${value || 0} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) =>
        readOnly ? (
          <Star
            key={n}
            className={cn(
              size,
              n <= value
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/40",
            )}
          />
        ) : (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => onChange(value === n ? 0 : n)}
            className="rounded p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star
              className={cn(
                size,
                "transition-colors",
                n <= value
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/40 hover:text-amber-400",
              )}
            />
          </button>
        ),
      )}
    </div>
  );
}

export default function FeedbackPage() {
  const [features, setFeatures] = useState(FEEDBACK_FEATURES);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await listMyFeedback());
    } catch (err) {
      setRows([]);
      setError(feedbackErrorMessage(err, "Couldn't load your feedback."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    listFeedbackFeatures().then(setFeatures);
  }, [load]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.feature) return toast.error("Choose the feature it's about.");
    if (!form.recommendation.trim())
      return toast.error("Tell us what would make it better.");
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateFeedback(editingId, form);
        setRows((prev) =>
          prev.map((r) => (r.id === editingId ? { ...r, ...updated } : r)),
        );
        toast.success("Feedback updated.");
      } else {
        const created = await submitFeedback(form);
        if (created?.id) setRows((prev) => [created, ...prev]);
        else load();
        toast.success("Thanks — your feedback was sent.");
      }
      reset();
    } catch (err) {
      toast.error(feedbackErrorMessage(err, "Couldn't send your feedback."));
    } finally {
      setSaving(false);
    }
  };

  const edit = (row) => {
    setEditingId(row.id);
    setForm({
      feature: row.feature || "",
      rating: Number(row.rating) || 0,
      recommendation: row.recommendation || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteFeedback(toDelete.id);
      setRows((prev) => prev.filter((r) => r.id !== toDelete.id));
      if (editingId === toDelete.id) reset();
      toast.success("Feedback deleted.");
      setToDelete(null);
    } catch (err) {
      toast.error(feedbackErrorMessage(err, "Couldn't delete it."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full space-y-6 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
          <MessageSquareHeart className="h-3.5 w-3.5" /> Feedback
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
          Help us improve iSourcePlus
        </h1>
        <p className="mt-2 max-w-lg text-sm text-white/85">
          Rate a feature and tell us what would make it work better for you.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <form
          onSubmit={submit}
          className="space-y-5 rounded-2xl border border-border/70 bg-card p-6 lg:col-span-2"
        >
          <h2 className="font-display text-base font-semibold">
            {editingId ? "Edit your feedback" : "Send feedback"}
          </h2>
          <div>
            <label className="mb-1 block text-sm font-medium">Feature</label>
            <Select
              value={form.feature || undefined}
              onValueChange={(v) => set("feature", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a feature" />
              </SelectTrigger>
              <SelectContent>
                {features.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Rating{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <StarRating
              value={form.rating}
              onChange={(v) => set("rating", v)}
            />
          </div>
          <div>
            <label
              htmlFor="feedback_recommendation"
              className="mb-1 block text-sm font-medium"
            >
              What would make it better?
            </label>
            <Textarea
              id="feedback_recommendation"
              rows={5}
              value={form.recommendation}
              onChange={(e) => set("recommendation", e.target.value)}
              placeholder="What worked, what didn't, and what you'd change."
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={saving}
              className="bg-brand-gradient text-brand-foreground hover:opacity-90"
            >
              {saving ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-4 w-4" />
              )}
              {editingId ? "Save changes" : "Send feedback"}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                onClick={reset}
                disabled={saving}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>

        {/* Your feedback */}
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card lg:col-span-3">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <h2 className="font-display text-base font-semibold">
              Your feedback
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={load}
              disabled={loading}
              aria-label="Refresh"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-brand" /> Loading…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">
                {error}
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
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/60" />
              <p className="mt-3 font-medium">No feedback yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                What you send shows up here, and you can edit or delete it.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className={cn(
                    "flex gap-3 px-6 py-4",
                    editingId === r.id && "bg-brand/[0.04]",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {featureLabel(r.feature, features)}
                      </span>
                      {Number(r.rating) > 0 && (
                        <StarRating
                          value={Number(r.rating)}
                          size="h-3.5 w-3.5"
                          readOnly
                        />
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                      {r.recommendation}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-start gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => edit(r)}
                      aria-label="Edit"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setToDelete(r)}
                      aria-label="Delete"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Dialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && !deleting && setToDelete(null)}
      >
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this feedback?</DialogTitle>
            <DialogDescription>
              Your feedback on {featureLabel(toDelete?.feature, features)} will
              be removed. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setToDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
