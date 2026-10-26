// Notifications — REST (SwaggerHub "notifications" and
// "notification_settings_get_or_create", 2026-10-26). The live channel is the
// WebSocket (services/lib/notification-socket.js); these are its fallback and
// the management actions it doesn't cover.
//
//   GET notifications/all/                    unarchived, paginated
//   GET notifications/archived/               archived, paginated
//       (both answer 200 { detail: "No notification(s) …" } when empty)
//   GET notifications/<id>/                   one notification
//   GET notifications/<id>/mark-as-unread/    → { detail }
//   GET notifications/<id>/archive/           → { detail }
//   GET notifications/<id>/remove-from-archive/ → { detail }
//   GET notifications/archive-all/            → { Detail: "<N> … archived" }
//                                               or { detail: "No notifications to archive" }
//   GET notification-settings/get-or-create/  the user's settings (created
//                                             with defaults on first call)
//   PATCH notification-settings/<id>/         update them (the route allows
//                                             PATCH; not in the spec)
//
// The action routes are side-effectful GETs by design. There's no REST
// mark-as-read: the socket's `mark_read` does that (`read` is read-only —
// PATCH notifications/<id>/ ignores it, and GETting one doesn't mark it).
// Without the socket, reads are remembered for the session (rememberRead) so
// polling doesn't flip them back to unread.
//
// Not deployed yet (2026-10-26): all/, archived/, the per-notification
// actions and get-or-create/. `all` and `get-or-create` fall through to the
// detail routes and answer a bare 404 "Not found." (an unknown id). Until
// they ship the inbox reports itself unavailable. Don't fall back on the plain
// collection GET notifications/: it isn't scoped to the caller and returns
// every company's notifications.
import http from "@/services/lib/http";
import { isMissingRoute } from "@/services/api/offers.service";

const path = (id, action = "") =>
  `notifications/${encodeURIComponent(id)}/${action}`;

const detailOf = (data) =>
  (data && (data.detail || data.Detail || data.message)) || "";

// A route that isn't live yet resolves to a detail route: bare "Not found.".
const notDeployed = (err) =>
  err?.response?.status === 404 && detailOf(err.response.data) === "Not found.";

export const NOTIFICATIONS_UNAVAILABLE =
  "Notifications aren't available on the server yet.";

const unavailableError = (message) =>
  Object.assign(new Error(message), { unavailable: true });

// Notifications marked read while the socket was down (this session only).
const readLocally = new Set();
export const rememberRead = (id) => readLocally.add(String(id));
export const forgetRead = (id) => readLocally.delete(String(id));

// Socket payloads carry `type`; REST rows carry `notification_type` /
// `category`. → one shape for the UI.
export function normalizeNotification(n = {}) {
  const id = String(n.id ?? "");
  return {
    id,
    title: n.title || "",
    message: n.message || "",
    type: n.notification_type || n.type || n.category || "",
    category: n.category || "",
    docType: n.doc_type || "",
    docRef: n.doc_ref || "",
    read: Boolean(n.read) || readLocally.has(id),
    archived: Boolean(n.is_archived),
    createdAt: n.created_at || null,
  };
}

// doc_type / doc_ref → the document's dashboard page. doc_type's values
// aren't in the spec, so match it loosely, then fall back on the reference's
// prefix (RFX-2026-00032, WB-2026-00001, …).
const DOC_ROUTES = [
  [/proforma/i, /^(PI|PFI|PRF)-/i, "proforma-invoices"],
  [/purchase/i, /^PO-/i, "purchase-orders"],
  [/sales/i, /^(SI|SIN)-/i, "sales-invoices"],
  [/payment/i, /^(PMT|PAY|PYO)-/i, "payment-orders"],
  [/waybill/i, /^WB-/i, "waybills"],
  [/tender/i, /^(TND|TDR|TEN)-/i, "tenders"],
  [/rfx|rfq|rfp/i, /^RFX-/i, "rfxs"],
];

export function notificationLink({ docType, docRef } = {}) {
  if (!docRef) return null;
  const match =
    DOC_ROUTES.find(([type]) => docType && type.test(docType)) ||
    DOC_ROUTES.find(([, prefix]) => prefix.test(docRef));
  return match ? `/dashboard/${match[2]}/${encodeURIComponent(docRef)}` : null;
}

const getPage = async (endpoint, page) =>
  (await http.get(endpoint, { params: page > 1 ? { page } : undefined })).data;

// → { items, count, next, previous, emptyMessage, legacy }
async function list(endpoint, page) {
  const data = await getPage(endpoint, page);
  const rows = Array.isArray(data) ? data : data?.results;
  if (!Array.isArray(rows)) {
    return {
      items: [],
      count: 0,
      next: null,
      previous: null,
      emptyMessage: detailOf(data),
      legacy: false,
    };
  }
  return {
    items: rows.map(normalizeNotification),
    count: data?.count ?? rows.length,
    next: data?.next ?? null,
    previous: data?.previous ?? null,
    emptyMessage: "",
    legacy: false,
  };
}

// Once all/ has 404'd, stop asking for the rest of the session (the bell
// polls every minute).
let allMissing = false;

export async function listNotifications({ page = 1 } = {}) {
  if (allMissing) throw unavailableError(NOTIFICATIONS_UNAVAILABLE);
  try {
    return await list("notifications/all/", page);
  } catch (err) {
    if (!notDeployed(err)) throw err;
    allMissing = true;
    throw unavailableError(NOTIFICATIONS_UNAVAILABLE);
  }
}

export async function listArchivedNotifications({ page = 1 } = {}) {
  try {
    return await list("notifications/archived/", page);
  } catch (err) {
    if (!notDeployed(err) && !isMissingRoute(err)) throw err;
    return {
      items: [],
      count: 0,
      next: null,
      previous: null,
      emptyMessage: "",
      legacy: true,
    };
  }
}

const action = (name) => async (id) => {
  const { data } = await http.get(path(id, `${name}/`));
  return detailOf(data);
};

export const markNotificationUnread = action("mark-as-unread");
export const archiveNotification = action("archive");
export const unarchiveNotification = action("remove-from-archive");

export async function archiveAllNotifications() {
  const { data } = await http.get("notifications/archive-all/");
  return detailOf(data);
}

// Notification settings.
export const SETTINGS_UNAVAILABLE =
  "Notification settings aren't available on the server yet.";

// Until get-or-create/ ships there's no safe way to find the user's own row
// (the plain collection may not be scoped either), so report unavailable.
export async function getNotificationSettings() {
  try {
    const { data } = await http.get("notification-settings/get-or-create/");
    return data;
  } catch (err) {
    if (!notDeployed(err)) throw err;
    throw unavailableError(SETTINGS_UNAVAILABLE);
  }
}

export async function updateNotificationSettings(id, fields) {
  const { data } = await http.patch(
    `notification-settings/${encodeURIComponent(id)}/`,
    fields,
  );
  return data;
}

export function notificationErrorMessage(err, fallback) {
  if (err?.unavailable) return err.message;
  if (isMissingRoute(err)) return "This isn't available on the server yet.";
  const body = err?.response?.data;
  if (body && typeof body === "object") {
    const first = (v) => (Array.isArray(v) ? v[0] : v);
    return (
      first(body.detail) ||
      first(body.Detail) ||
      first(body.message) ||
      first(body.enabled_categories) ||
      first(body.quiet_hours_enabled) ||
      fallback
    );
  }
  return fallback;
}
