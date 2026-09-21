import { useCallback, useEffect, useState } from "react";
import { CornerDownRight, Loader2, MessageSquare, Reply, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  getQuestions,
  QUESTION_ENTITIES,
  submitAnswer,
  submitQuestion,
} from "@/services/api/questions.service";

// Reusable Q&A forum for an entity detail page (iSourcePlus Q&A API). Drop in
// with the entity slug and the parent resource's UUID:
//   <QuestionsForum entity="rfx" refNum={rfx?.ref_num} />
// Handles listing (404 = "no questions yet"), submitting, and rendering each
// question with its answers. Renders nothing until a ref_num is available.

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
  const [answers, setAnswers] = useState(
    Array.isArray(q.answers) ? q.answers : [],
  );
  const [replying, setReplying] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const sendAnswer = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      const created = await submitAnswer(q.id, text);
      setAnswers((prev) => [
        ...prev,
        created || { answer: text, created_at: new Date().toISOString() },
      ]);
      setDraft("");
      setReplying(false);
      toast.success("Answer submitted.");
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          err.response?.data?.answer?.[0] ||
          "Couldn't submit the answer. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

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

      {q.id &&
        (replying ? (
          <form onSubmit={sendAnswer} className="mt-3 space-y-2">
            <Textarea
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write an answer…"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setReplying(false)}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={sending || !draft.trim()}
                className="bg-brand-gradient text-white hover:opacity-90"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  "Submit answer"
                )}
              </Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setReplying(true)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
          >
            <Reply className="h-3.5 w-3.5" /> Answer
          </button>
        ))}
    </li>
  );
}

export default function QuestionsForum({ entity, refNum, className }) {
  const label = QUESTION_ENTITIES[entity]?.label ?? "item";
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!refNum) return;
    setLoading(true);
    try {
      setQuestions(await getQuestions(entity, refNum));
    } catch {
      toast.error("Couldn't load questions.");
    } finally {
      setLoading(false);
    }
  }, [entity, refNum]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return toast.error("Type a question first.");
    setSubmitting(true);
    try {
      const created = await submitQuestion(entity, refNum, text);
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
  if (!refNum) return null;

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
