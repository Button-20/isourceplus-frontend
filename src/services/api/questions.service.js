// Q&A forum domain service (iSourcePlus Q&A API, OpenAPI 1.0.0).
//
// Submit and list questions against a parent resource for seven entity types.
// Paths are relative to the shared http client's base (/api/v1/), matching the
// spec's server URL https://app.isourceplus.net/api/v1.
//
//   Submit: POST <prefix>/<ref_num>/submit-<slug>-question/     { question }
//   List:   GET  <prefix>/<ref_num>/submitted-<slug>-questions/ -> Question[]
//
// The path segment is the parent resource's `ref_num` (its human reference,
// e.g. the value in the detail-page route), NOT the UUID. Auth is the app's
// usual bearer/cookie session, added by the http client.
import http from "@/services/lib/http";

// Per-entity path pieces. `prefix` is the collection path, `slug` the singular
// used in the action segment; both label and slug are keyed by a stable UI key.
export const QUESTION_ENTITIES = {
  tender: { label: "tender", prefix: "tenders", slug: "tender" },
  rfx: { label: "RFx", prefix: "rfxs", slug: "rfx" },
  waybill: { label: "waybill", prefix: "waybills", slug: "waybill" },
  "proforma-invoice": {
    label: "proforma invoice",
    prefix: "proforma-invoices",
    slug: "proforma-invoice",
  },
  "purchase-order": {
    label: "purchase order",
    prefix: "purchase-orders",
    slug: "purchase-order",
  },
  "sales-invoice": {
    label: "sales invoice",
    prefix: "sales-invoices",
    slug: "sales-invoice",
  },
  "payment-order": {
    label: "payment order",
    prefix: "payment-orders",
    slug: "payment-order",
  },
};

const resolve = (entity) => {
  const cfg = QUESTION_ENTITIES[entity];
  if (!cfg) throw new Error(`Unknown question entity: ${entity}`);
  return cfg;
};

// POST <prefix>/<ref_num>/submit-<slug>-question/ — submit a question against a
// resource. Returns the created Question { url, id, question, answers, … }.
export async function submitQuestion(entity, refNum, question) {
  const { prefix, slug } = resolve(entity);
  const { data } = await http.post(
    `${prefix}/${refNum}/submit-${slug}-question/`,
    { question },
  );
  return data;
}

// List questions for a resource. The API returns 404 (not an error) when none
// have been asked yet, so treat that as an empty list — every other failure
// propagates to the caller.
export async function getQuestions(entity, refNum) {
  const { prefix, slug } = resolve(entity);
  try {
    const { data } = await http.get(
      `${prefix}/${refNum}/submitted-${slug}-questions/`,
    );
    return Array.isArray(data) ? data : (data?.results ?? []);
  } catch (err) {
    if (err.response?.status === 404) return [];
    throw err;
  }
}

// ---- Answers --------------------------------------------------------------
// Answers hang off a question by its UUID, under event-questions/<id>/.

// POST event-questions/<question_id>/submit-question-answer/  { answer }
// Returns the created Answer { url, id, question, answer, created_at, updated_at }.
export async function submitAnswer(questionId, answer) {
  const { data } = await http.post(
    `event-questions/${questionId}/submit-question-answer/`,
    { answer },
  );
  return data;
}

// GET event-questions/<question_id>/submitted-question-answers/ -> Answer[]
// 404 (no answers yet) is treated as an empty list, not an error.
export async function getAnswers(questionId) {
  try {
    const { data } = await http.get(
      `event-questions/${questionId}/submitted-question-answers/`,
    );
    return Array.isArray(data) ? data : (data?.results ?? []);
  } catch (err) {
    if (err.response?.status === 404) return [];
    throw err;
  }
}
