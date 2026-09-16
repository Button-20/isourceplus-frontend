import { useCallback, useEffect, useState } from "react";
import { CornerDownRight, Loader2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  getQuestions,
  QUESTION_ENTITIES,
  submitQuestion,
} from "@/services/api/questions.service";

// Reusable Q&A forum for an entity detail page (iSourcePlus Q&A API). Drop in
// with the entity slug and the parent resource's UUID:
//   <QuestionsForum entity="rfx" id={rfx?.id} />
// Handles listing (404 = "no questions yet"), submitting, and rendering each
// question with its answers. Renders nothing until an id is available.

const formatDateTime = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

function QuestionCard({ q }) {
  const answers = Array.isArray(q.answers) ? q.answers : [];
  return (
    <li className="rounded-xl border border-border bg-background/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{q.question}</p>
        {q.created_at && (
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatDateTime(q.created_at)}
          </span>
        )}
      </div>

      {answers.length > 0 ? (
        <ul className="mt-3 space-y-2 border-l-2 border-brand/30 pl-4">
          {answers.map((a, i) => (
            <li key={a.id ?? i} className="flex items-start gap-2">
              <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <div>
                <p className="text-sm text-muted-foreground">{a.answer}</p>
                {a.created_at && (
                  <span className="text-[11px] text-muted-foreground/70">
                    {formatDateTime(a.created_at)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs italic text-muted-foreground">
          Awaiting an answer.
        </p>
      )}
    </li>
  );
}

export default function QuestionsForum({ entity, id, className }) {
  const label = QUESTION_ENTITIES[entity]?.label ?? "item";
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setQuestions(await getQuestions(entity, id));
    } catch {
      toast.error("Couldn't load questions.");
    } finally {
      setLoading(false);
    }
  }, [entity, id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return toast.error("Type a question first.");
    setSubmitting(true);
    try {
      const created = await submitQuestion(entity, id, text);
      // Prepend the new question so it shows immediately (newest first).
      setQuestions((prev) => (created ? [created, ...prev] : prev));
      setDraft("");
      toast.success("Question submitted.");
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          err.response?.data?.question?.[0] ||
          "Couldn't submit your question. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Nothing to key questions to until the parent resource id is known.
  if (!id) return null;

  return (
    <section
      className={`rounded-2xl border border-border bg-card p-6 ${className || ""}`}
    >
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-brand" />
        <h2 className="font-display text-base font-semibold">
          Questions &amp; answers
        </h2>
        {!loading && questions.length > 0 && (
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            {questions.length}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <Textarea
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Ask a question about this ${label}…`}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={submitting || !draft.trim()}
            className="bg-brand-gradient text-white hover:opacity-90"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Submit question
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : questions.length ? (
          <ul className="space-y-3">
            {questions.map((q, i) => (
              <QuestionCard key={q.id ?? i} q={q} />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            No questions yet. Be the first to ask.
          </p>
        )}
      </div>
    </section>
  );
}
