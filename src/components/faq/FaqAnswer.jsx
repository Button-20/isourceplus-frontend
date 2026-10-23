// One FAQ answer (src/data/faq.js blocks) — used by the FAQ page and its
// chatbot. `compact` stacks lists in one column for narrow containers.
// `onNavigate` runs when an internal link is followed (e.g. close the chat).
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import FlowChain from "@/components/landing/FlowChain";
import { cn } from "@/lib/utils";

export default function FaqAnswer({ blocks, compact = false, onNavigate }) {
  return (
    <div
      className={cn(
        "text-sm leading-relaxed text-muted-foreground",
        compact ? "space-y-2" : "space-y-3",
      )}
    >
      {blocks.map((b, i) => {
        if (typeof b === "string") return <p key={i}>{b}</p>;
        if (b.list)
          return (
            <ul
              key={i}
              className={cn("grid gap-1.5", !compact && "sm:grid-cols-2")}
            >
              {b.list.map((li) => (
                <li key={li} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span className="text-foreground/90">{li}</span>
                </li>
              ))}
            </ul>
          );
        if (b.flow)
          return (
            <FlowChain
              key={i}
              steps={b.flow}
              joiner={b.joiner === "+" ? "+" : "arrow"}
              size="sm"
            />
          );
        if (b.steps)
          return (
            <ol key={i} className="grid gap-2">
              {b.steps.map((st, n) => (
                <li key={st} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-foreground">
                    {n + 1}
                  </span>
                  <span className="pt-0.5 text-foreground/90">{st}</span>
                </li>
              ))}
            </ol>
          );
        return (
          <p key={i}>
            {b.text}
            {b.text && b.link ? " " : ""}
            {b.link && (
              <Link
                to={b.link.to}
                onClick={onNavigate}
                className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
              >
                {b.link.label} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </p>
        );
      })}
    </div>
  );
}
