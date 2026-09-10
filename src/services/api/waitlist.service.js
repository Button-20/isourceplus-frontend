// Waitlist domain service (pre-launch subscriber campaign).
//
// POSTs a signup captured by the waitlist landing page. The endpoint is assumed
// to be `waitlist/` under the API base — confirm it against the backend. The
// payload mirrors the strategic-plan form (Sept 2026 red corrections: the
// "Do you have a company? Y/N" question was replaced by a single free-text
// Company/Institution field):
//   first_name, last_name, email, whatsapp, contact_2, company_institution,
//   company_email, region, category ("supplier" | "buyer" | "cargo_transporter").
import http from "@/services/lib/http";

export async function joinWaitlist(payload) {
  const { data } = await http.post("waitlist/", payload);
  return data;
}
