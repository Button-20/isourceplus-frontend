// Product feedback (SwaggerHub "feedback_api", 2026-11-04): the user rates a
// feature and says what would make it better.
//
//   GET    feedback-feature-choices/   [{ value, label }]
//   POST   feedbacks/                  { feature, rating?, recommendation }
//   GET    feedbacks/mine/             the user's own feedback (array)
//   PATCH  feedbacks/{id}/             edit one
//   DELETE feedbacks/{id}/             → 204
//
// rating is 1–5 or null. Not deployed yet (2026-11-04): every route answers an
// HTML 404.
import http from "@/services/lib/http";

// The spec's FeedbackFeatureEnum, used until the choices endpoint answers.
export const FEEDBACK_FEATURES = [
  { value: "request_for_quote", label: "Request for Quote" },
  { value: "request_for_information", label: "Request for Information" },
  { value: "request_for_proposal", label: "Request for Proposal" },
  { value: "tender", label: "Tender" },
  { value: "purchase_order", label: "Purchase Order" },
  { value: "waybill", label: "Waybill" },
  { value: "sales_invoice", label: "Sales invoice" },
  { value: "registration", label: "Registration" },
  { value: "payment_order", label: "Payment Order" },
  { value: "goods_received_note", label: "Goods Received Note" },
  { value: "goods_delivery_note", label: "Goods Delivery Note" },
  { value: "escrow_account", label: "Escrow Account" },
];

export const FEEDBACK_UNAVAILABLE =
  "Feedback isn't available on the server yet.";

// A route that isn't live answers the server's HTML 404 page.
const notDeployed = (err) =>
  err?.response?.status === 404 && typeof err.response.data === "string";

export async function listFeedbackFeatures() {
  try {
    const { data } = await http.get("feedback-feature-choices/");
    const rows = (Array.isArray(data) ? data : data?.results || []).filter(
      (c) => c?.value,
    );
    return rows.length ? rows : FEEDBACK_FEATURES;
  } catch {
    return FEEDBACK_FEATURES;
  }
}

export const featureLabel = (value, features = FEEDBACK_FEATURES) =>
  features.find((f) => f.value === value)?.label || value || "—";

const body = ({ feature, rating, recommendation }) => ({
  feature,
  rating: rating || null,
  recommendation: recommendation.trim(),
});

export async function listMyFeedback() {
  const { data } = await http.get("feedbacks/mine/");
  return Array.isArray(data) ? data : data?.results || [];
}

export async function submitFeedback(fields) {
  const { data } = await http.post("feedbacks/", body(fields));
  return data;
}

export async function updateFeedback(id, fields) {
  const { data } = await http.patch(`feedbacks/${id}/`, body(fields));
  return data;
}

export async function deleteFeedback(id) {
  await http.delete(`feedbacks/${id}/`);
}

export function feedbackErrorMessage(err, fallback) {
  if (notDeployed(err)) return FEEDBACK_UNAVAILABLE;
  const d = err?.response?.data;
  if (d && typeof d === "object") {
    const first = (v) => (Array.isArray(v) ? v[0] : v);
    return (
      first(d.detail) ||
      first(d.message) ||
      first(d.recommendation) ||
      first(d.feature) ||
      first(d.rating) ||
      fallback
    );
  }
  return fallback;
}
