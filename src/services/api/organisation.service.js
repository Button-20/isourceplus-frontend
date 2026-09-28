// Organisation verification domain service (iSourcePlus Verify Organisation API,
// OpenAPI 1.0.0). Verifies an organisation by its Tax Identification Number.
//
//   POST verify-organisation/  { tin }
//     200 -> { status: true,  message, data: { tin, organisationName } }
//     400 -> { status: false, message, errors }   (axios rejects; body on err.response.data)
//
// Paths are relative to the shared http client's base (/api/v1/); it attaches
// CSRF + cookies + bearer.
import http from "@/services/lib/http";

// POST verify-organisation/ — look up and verify an organisation by TIN.
// Resolves the success envelope; a 400 (invalid/missing TIN) rejects, and the
// caller reads `err.response.data.message` / `.errors`.
export async function verifyOrganisation(tin) {
  const { data } = await http.post("verify-organisation/", {
    tin: String(tin ?? "").trim(),
  });
  return data; // { status, message, data: { tin, organisationName } }
}
