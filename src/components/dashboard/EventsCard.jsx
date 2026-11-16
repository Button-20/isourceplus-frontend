import { Activity } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// monitor-events-frequency returns
//   [{ category_name, event_list: [{ event_type, frequency }] }, ...]
// Flatten that into a flat [{ label, value }] series for the bar list.
export function toSeries(data) {
  if (!Array.isArray(data)) return [];
  const series = [];
  data.forEach((category) => {
    if (!category || typeof category !== "object") return;
    const catLabel = category.category_name ?? category.sub_category ?? "";
    const events = Array.isArray(category.event_list)
      ? category.event_list
      : Array.isArray(category.events)
        ? category.events
        : [];
    events.forEach((ev) => {
      const type = ev?.event_type ?? ev?.event ?? ev?.name ?? "";
      const value =
        Number(ev?.frequency ?? ev?.freq ?? ev?.count ?? ev?.total ?? 0) || 0;
      const label =
        [type, catLabel].filter(Boolean).join(" · ") ||
        `Event ${series.length + 1}`;
      series.push({ label, value });
    });
  });
  return series;
}

export default function EventsCard({ data, loading, description }) {
  const series = toSeries(data);
  const max = Math.max(1, ...series.map((s) => s.value));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-brand" /> Activity frequency
        </CardTitle>
        <CardDescription>{description ?? "Your recent activity."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </>
        ) : series.length ? (
          series.slice(0, 8).map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="w-44 shrink-0 truncate text-sm text-muted-foreground">
                {s.label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand-gradient"
                  style={{ width: `${(s.value / max) * 100}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-sm font-medium">
                {s.value}
              </span>
            </div>
          ))
        ) : (
          <p className="py-2 text-sm text-muted-foreground">
            No recent events yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
