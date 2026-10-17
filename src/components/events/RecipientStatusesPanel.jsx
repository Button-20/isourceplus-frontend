import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { prettify } from "@/utils/choices";
import { getRecipientStatuses } from "@/services/api/recipients.service";

const fmt = (v) => {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : null;
};

function Stamp({ value, icon: Icon, done, pending }) {
  const when = fmt(value);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-sm",
        when ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          when ? "text-emerald-600 dark:text-emerald-400" : "",
        )}
      />
      {when ? (
        <span title={when}>
          {done} · {when}
        </span>
      ) : (
        pending
      )}
    </span>
  );
}

// Who was invited to an RFx / tender / waybill and whether each has viewed
// and responded (GET <resource>/<ref>/recipients-statuses/). Owner-only.
export default function RecipientStatusesPanel({ resource, refNum }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await getRecipientStatuses(resource, refNum));
    } catch (err) {
      const body = err.response?.data;
      setRows([]);
      setError(
        (body && typeof body === "object"
          ? body.detail || body.message
          : null) || "Couldn't load recipient statuses.",
      );
    } finally {
      setLoading(false);
    }
  }, [resource, refNum]);

  useEffect(() => {
    load();
  }, [load]);

  const viewed = rows.filter((r) => r.viewedAt).length;
  const responded = rows.filter((r) => r.respondedAt).length;

  return (
    <div className="rounded-2xl border border-border/70 bg-card">
      <div className="flex flex-col gap-3 border-b border-border/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold">Recipients</h2>
            <p className="text-xs text-muted-foreground">
              {loading
                ? "Loading…"
                : `${rows.length} invited · ${viewed} viewed · ${responded} responded`}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw
            className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading recipients…
        </div>
      ) : error ? (
        <p className="px-6 py-10 text-center text-sm text-muted-foreground">
          {error}
        </p>
      ) : rows.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-muted-foreground">
          No recipients yet.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {rows.map((r) => (
            <li
              key={r.key}
              className="flex flex-col gap-2 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{r.name}</p>
                {r.type && (
                  <p className="text-xs text-muted-foreground">
                    {prettify(r.type)}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                <Stamp
                  value={r.viewedAt}
                  icon={Eye}
                  done="Viewed"
                  pending="Not viewed"
                />
                <Stamp
                  value={r.respondedAt}
                  icon={r.respondedAt ? CheckCircle2 : Clock}
                  done="Responded"
                  pending="No response"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
