// Q&A forum domain service (iSourcePlus Q&A API, OpenAPI 1.0.0).
//
// Submit and list questions against a parent resource for seven entity types.
// Paths are relative to the shared http client's base (/api/v1/), matching the
// spec's server URL https://app.isourceplus.net/api/v1.
//
//   Submit: POST <entity>/submit-<slug>-question/<id>/     { question }
//   List:   GET  <entity>/submitted-<slug>-questions/<id>/ -> Question[]
//
// `id` is the parent resource's UUID (not its human reference number). Auth is
// the app's usual bearer/cookie session, added by the http client.
import http from "@/services/lib/http";

// Per-entity path segments. Keyed by a stable slug used across the UI.
export const QUESTION_ENTITIES = {
  tender: {
    label: "tender",
    submit: (id) => `tenders/submit-tender-question/${id}/`,
    list: (id) => `tenders/submitted-tender-questions/${id}/`,
  },
  rfx: {
    label: "RFx",
    submit: (id) => `rfxs/submit-rfx-question/${id}/`,
    list: (id) => `rfxs/submitted-rfx-questions/${id}/`,
  },
  waybill: {
    label: "waybill",
    submit: (id) => `waybills/submit-waybill-question/${id}/`,
    list: (id) => `waybills/submitted-waybill-questions/${id}/`,
  },
  "proforma-invoice": {
    label: "proforma invoice",
    submit: (id) => `proforma-invoices/submit-proforma-invoice-question/${id}/`,
    list: (id) => `proforma-invoices/submitted-proforma-invoice-questions/${id}/`,
  },
  "purchase-order": {
    label: "purchase order",
    submit: (id) => `purchase-orders/submit-purchase-order-question/${id}/`,
    list: (id) => `purchase-orders/submitted-purchase-order-questions/${id}/`,
  },
  "sales-invoice": {
    label: "sales invoice",
    submit: (id) => `sales-invoices/submit-sales-invoice-question/${id}/`,
    list: (id) => `sales-invoices/submitted-sales-invoice-questions/${id}/`,
  },
  "payment-order": {
    label: "payment order",
    submit: (id) => `payment-orders/submit-payment-order-question/${id}/`,
    list: (id) => `payment-orders/submitted-payment-order-questions/${id}/`,
  },
};

const resolve = (entity) => {
  const cfg = QUESTION_ENTITIES[entity];
  if (!cfg) throw new Error(`Unknown question entity: ${entity}`);
  return cfg;
};

// Submit a question against a resource. Returns the created Question
// { url, id, question, answers, created_at, updated_at }.
export async function submitQuestion(entity, id, question) {
  const { data } = await http.post(resolve(entity).submit(id), { question });
  return data;
}

// List questions for a resource. The API returns 404 (not an error) when none
// have been asked yet, so treat that as an empty list — every other failure
// propagates to the caller.
export async function getQuestions(entity, id) {
  try {
    const { data } = await http.get(resolve(entity).list(id));
    return Array.isArray(data) ? data : (data?.results ?? []);
  } catch (err) {
    if (err.response?.status === 404) return [];
    throw err;
  }
}
