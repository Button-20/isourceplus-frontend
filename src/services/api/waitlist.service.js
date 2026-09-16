// Waitlist domain service (iSourcePlus Waitlist API, OpenAPI 1.0.0).
// Paths are relative to the shared http client base (/api/v1/).
import http from "@/services/lib/http";

// POST /wait-lists/ — create a waitlist entry. Required payload keys (per spec):
//   first_name, last_name, email, contact_whatsapp, company_or_institution,
//   company_email, region, category ("supplier"|"buyer"|"cargo_transporter").
// contact_2 is optional. Returns the created WaitList entry.
export async function joinWaitlist(payload) {
  const { data } = await http.post("wait-lists/", payload);
  return data;
}

// GET /wait-lists/{id}/ — retrieve a single waitlist entry by its UUID.
export async function getWaitList(id) {
  const { data } = await http.get(`wait-lists/${id}/`);
  return data;
}
