// Dashboard domain service. Best-effort resource counts for the overview cards.
// DRF list endpoints return `{ count, results }`; we fall back gracefully so a
// missing/misshaped endpoint never breaks the dashboard.

import http from "@/services/lib/http";

export async function getResourceCount(resource) {
  const { data } = await http.get(resource);
  if (typeof data?.count === "number") return data.count;
  if (Array.isArray(data?.results)) return data.results.length;
  if (Array.isArray(data)) return data.length;
  return 0;
}
