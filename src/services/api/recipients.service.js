// Recipient statuses for an event the user issued (SwaggerHub
// "recipient_statuses", 2026-10-17):
//
//   GET <rfxs|tenders|waybills>/<ref>/recipients-statuses/
//     → [{ company: { id, name, type }, viewed_at, responded_at }]
import http from "@/services/lib/http";

// → [{ key, name, type, viewedAt, respondedAt }]
export async function getRecipientStatuses(resource, refNum) {
  const { data } = await http.get(
    `${resource}/${encodeURIComponent(refNum)}/recipients-statuses/`,
  );
  const list = Array.isArray(data) ? data : data?.results || data?.data || [];
  return list.map((r, i) => ({
    key: r?.company?.id ?? `${r?.company?.name ?? "recipient"}-${i}`,
    name: r?.company?.name || "Unnamed company",
    type: r?.company?.type || "",
    viewedAt: r?.viewed_at || null,
    respondedAt: r?.responded_at || null,
  }));
}
