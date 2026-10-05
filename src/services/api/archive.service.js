// Archiving for RFxs, tenders, proforma invoices and waybills.
//
//   GET {base}/{ref_num}/archive/   — archive one record
//   GET {base}/archive-all/         — archive ALL of the user's records of that type
//
// Verified against the backend (2026-10-05): both routes accept GET only
// (Allow: GET, HEAD, OPTIONS) and look records up by ref_num. Because a GET
// performs the action, never call these speculatively (no prefetching/probing)
// — only from an explicit, confirmed user action.
import http from "@/services/lib/http";

export const ARCHIVE_KINDS = {
  rfx: { base: "rfxs", singular: "RFx", plural: "RFxs" },
  tender: { base: "tenders", singular: "tender", plural: "tenders" },
  proforma: {
    base: "proforma-invoices",
    singular: "proforma invoice",
    plural: "proforma invoices",
  },
  waybill: { base: "waybills", singular: "waybill", plural: "waybills" },
  // purchase-orders/{ref}/archive/ and purchase-orders/archive-all/ — both
  // verified GET-only (2026-10-05).
  purchaseOrder: {
    base: "purchase-orders",
    singular: "purchase order",
    plural: "purchase orders",
  },
  // sales-invoices/{ref}/archive/ + sales-invoices/archive-all/ (verified).
  salesInvoice: {
    base: "sales-invoices",
    singular: "sales invoice",
    plural: "sales invoices",
  },
  // payment-orders/{ref}/archive/ + payment-orders/archive-all/ (verified).
  paymentOrder: {
    base: "payment-orders",
    singular: "payment order",
    plural: "payment orders",
  },
};

const messageOf = (data, fallback) =>
  (data && typeof data === "object" && (data.message || data.detail)) ||
  fallback;

export async function archiveOne(kind, refNum) {
  const { base } = ARCHIVE_KINDS[kind];
  const { data } = await http.get(
    `${base}/${encodeURIComponent(refNum)}/archive/`,
  );
  return { data, message: messageOf(data, `${refNum} archived.`) };
}

export async function archiveAll(kind) {
  const { base, plural } = ARCHIVE_KINDS[kind];
  const { data } = await http.get(`${base}/archive-all/`);
  return { data, message: messageOf(data, `All ${plural} archived.`) };
}

// Readable error for a failed archive call.
export const archiveErrorMessage = (err, fallback) =>
  messageOf(err?.response?.data, null) ||
  (err?.response?.status === 403
    ? "You don't have permission to archive this."
    : fallback);
