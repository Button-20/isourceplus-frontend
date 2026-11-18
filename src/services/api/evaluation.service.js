// Supplier bid evaluation & ranking (GET …/evaluate/ on an Rfx or Tender).
// The backend restricts this to the issuing organisation.
import http from "@/services/lib/http";

const normalize = (data) => (Array.isArray(data) ? data : data?.results || []);

export async function evaluateRfx(refNum) {
  const { data } = await http.get(`rfxs/${encodeURIComponent(refNum)}/evaluate/`);
  return normalize(data);
}

export async function evaluateTender(refNum) {
  const { data } = await http.get(
    `tenders/${encodeURIComponent(refNum)}/evaluate/`,
  );
  return normalize(data);
}
