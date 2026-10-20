// Helpdesk — submitter API (SwaggerHub "helpdesk", 2026-10-20).
//
//   GET  my-tickets/?page=&page_size=   tickets filed under the user's
//                                       company email (paginated)
//   POST my-tickets/                    file a ticket: JSON
//                                       { title, description, priority? } or
//                                       multipart with an `attachment`
//   GET  my-tickets/<id>/               one ticket (404 if not the user's)
//
// Submitters can't edit or delete. status / queue / due_date / resolution
// are server-controlled. Priority 1 (Critical) is clamped to 2 server-side.
import http from "@/services/lib/http";

// tone → DetailShell StatusBadge: warn = awaiting support, open = resolved.
export const TICKET_STATUS = {
  1: { label: "Open", tone: "warn" },
  2: { label: "Reopened", tone: "warn" },
  3: { label: "Resolved", tone: "open" },
  4: { label: "Closed", tone: "closed" },
  5: { label: "Duplicate", tone: "closed" },
};

export const TICKET_PRIORITY = {
  1: "Critical",
  2: "High",
  3: "Normal",
  4: "Low",
  5: "Very low",
};

// Priorities a submitter can pick (Critical would be clamped to High).
export const SELECTABLE_PRIORITIES = [2, 3, 4, 5];

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

// → { items, count, next, previous }
export async function listMyTickets({ page = 1, pageSize } = {}) {
  const { data } = await http.get("my-tickets/", {
    params: {
      ...(page > 1 ? { page } : {}),
      ...(pageSize ? { page_size: pageSize } : {}),
    },
  });
  const items = Array.isArray(data) ? data : data?.results || [];
  return {
    items,
    count: data?.count ?? items.length,
    next: data?.next ?? null,
    previous: data?.previous ?? null,
  };
}

export async function getMyTicket(id) {
  const { data } = await http.get(`my-tickets/${encodeURIComponent(id)}/`);
  return data;
}

// JSON without a file; multipart when an attachment is included.
export async function createTicket({
  title,
  description,
  priority,
  attachment,
}) {
  const fields = { title, description, ...(priority ? { priority } : {}) };
  if (!attachment) {
    const { data } = await http.post("my-tickets/", fields);
    return data;
  }
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, String(v)));
  fd.append("attachment", attachment);
  const { data } = await http.post("my-tickets/", fd);
  return data;
}

export function helpdeskErrorMessage(err, fallback) {
  const body = err?.response?.data;
  if (body && typeof body === "object") {
    const first = (v) => (Array.isArray(v) ? v[0] : v);
    return (
      first(body.detail) ||
      first(body.message) ||
      first(body.title) ||
      first(body.description) ||
      first(body.priority) ||
      first(body.attachment) ||
      fallback
    );
  }
  return fallback;
}
