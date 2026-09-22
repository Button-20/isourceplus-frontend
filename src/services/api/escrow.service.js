// Escrow domain service (Isourceplus Purchase Order Escrow API, OpenAPI 1.0.0).
//
// Endpoint 3b of the escrow workflow — called after a PurchaseOrder is created
// with `escrow_required=true`. It confirms the buyer's deposit into the
// platform escrow account (bank / MoMo provider is mocked for now): the escrow
// moves to SECURED, two release conditions (GRN_CONFIRMATION, 48HR_AUTO_RELEASE)
// are attached, and a CREDIT row is written to the escrow ledger.
//
//   Fund: POST purchase-orders/<ref_num>/fund-escrow/  { payment_method, payment_ref? }
//         -> { success, message, data: EscrowTransaction }
//
// Paths are relative to the shared http client's base (/api/v1/); it attaches
// CSRF + cookies + bearer. Like the other PO endpoints in this app, the path
// segment is the purchase order's `ref_num` (the detail-page route param) — the
// spec resolves the PO by ref_num.
import http from "@/services/lib/http";

export const PAYMENT_METHODS = ["MoMo", "Bank", "Card"];

// POST purchase-orders/<ref_num>/fund-escrow/ — confirm the buyer's deposit and
// secure the escrow. Idempotent on an already-SECURED escrow (no duplicate
// ledger CREDIT). Returns the EscrowTransaction (unwrapped from the envelope).
export async function fundPurchaseOrderEscrow(
  refNum,
  { payment_method, payment_ref } = {},
) {
  const body = { payment_method };
  if (payment_ref) body.payment_ref = payment_ref;
  const { data } = await http.post(
    `purchase-orders/${refNum}/fund-escrow/`,
    body,
  );
  // Success envelope is { success, message, data }; return the escrow itself,
  // tolerating a bare escrow object too.
  return data?.data ?? data;
}
