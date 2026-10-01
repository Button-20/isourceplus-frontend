// RFx domain service. Endpoints under /api/v1/ (base URL + CSRF/cookies are
// handled by the shared http client).
import http from "@/services/lib/http";

// GET the RFx `type` choices (quotation / information / proposal, …). The
// backend owns this list, so the create form reads it instead of hardcoding.
// Endpoint per backend note: base_url/rfx/type-choices/
export async function getRfxTypeChoices() {
  const { data } = await http.get("rfx/type-choices/");
  return data;
}
