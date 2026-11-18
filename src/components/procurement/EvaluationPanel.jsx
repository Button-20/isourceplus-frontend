// Supplier bid evaluation & ranking panel (buyer side). Fetches GET …/evaluate/
// on demand and shows ranked, compliant-first results.
import { useState } from "react";
import { Loader2, RefreshCw, Trophy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  evaluateRfx,
  evaluateTender,
} from "@/services/api/evaluation.service";
import { apiErrorMessage } from "@/services/lib/api-error";

export default function EvaluationPanel({ kind, refNum }) {
  const [rows, setRows] = useState(null); // null = not run yet
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const data =
        kind === "tender" ? await evaluateTender(refNum) : await evaluateRfx(refNum);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Couldn't evaluate responses."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-sm font-semibold">Bid evaluation</h3>
        <Button size="sm" variant="outline" onClick={run} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-4 w-4" />
          )}
          {rows ? "Refresh" : "Evaluate"}
        </Button>
      </div>

      {rows === null && !loading && (
        <p className="mt-3 text-sm text-muted-foreground">
          Run the evaluation to rank supplier responses against the published
          criteria and weights.
        </p>
      )}
      {rows !== null && rows.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          No supplier responses yet.
        </p>
      )}
      {rows !== null && rows.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-2 font-medium">Rank</th>
                <th className="px-2 py-2 font-medium">Supplier</th>
                <th className="px-2 py-2 font-medium">Compliance</th>
                <th className="px-2 py-2 text-right font-medium">Price</th>
                <th className="px-2 py-2 text-right font-medium">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-2 py-2">
                    {r.rank === 1 ? (
                      <Trophy className="h-4 w-4 text-amber-500" />
                    ) : (
                      r.rank
                    )}
                  </td>
                  <td className="px-2 py-2 font-medium">{r.supplier}</td>
                  <td className="px-2 py-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        r.compliant
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {r.compliant ? "Compliant" : "Non-compliant"}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{r.price}</td>
                  <td className="px-2 py-2 text-right font-semibold tabular-nums">
                    {r.total_score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
