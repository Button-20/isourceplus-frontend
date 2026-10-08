// Escrow + delivery/payment domain service (Isourceplus Purchase Order API).
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

// Payment channels for a manual (non-escrow) payment.
export const MANUAL_PAYMENT_METHODS = ["MoMo", "Bank", "Cash"];

// POST purchase-orders/<ref_num>/cancel-escrow/ { reason } — step 3c: the
// buyer cancels the escrow before dispatch / before the 48h auto-release.
export async function cancelPurchaseOrderEscrow(refNum, reason) {
  const { data } = await http.post(`purchase-orders/${refNum}/cancel-escrow/`, {
    reason,
  });
  return data?.data ?? data;
}

// POST purchase-orders/<ref_num>/escrow-pay/ (no body) — step 9: confirm the
// inspected goods; with a funded escrow, release follows the inspection
// outcome. Side effects: GRN → CONFIRMED, payment → PAID, PO → COMPLETED.
export async function payPurchaseOrderFromEscrow(refNum) {
  const { data } = await http.post(`purchase-orders/${refNum}/escrow-pay/`);
  return data?.data ?? data;
}

// POST purchase-orders/<ref_num>/manual-pay/ { payment_method, payment_ref } —
// step 10: no escrow, record a manual payment. Side effects as escrow-pay.
export async function payPurchaseOrderManually(
  refNum,
  { payment_method, payment_ref },
) {
  const { data } = await http.post(`purchase-orders/${refNum}/manual-pay/`, {
    payment_method,
    payment_ref,
  });
  return data?.data ?? data;
}

// First useful message from an escrow / payment error response.
export function escrowErrorMessage(err, fallback) {
  const body = err?.response?.data;
  if (body && typeof body === "object") {
    const first = (v) => (Array.isArray(v) ? v[0] : v);
    const fieldErr = body.errors && Object.values(body.errors)[0];
    return (
      first(body.message) ||
      first(body.detail) ||
      first(body.reason) ||
      first(body.payment_method) ||
      first(body.payment_ref) ||
      first(fieldErr) ||
      fallback
    );
  }
  return fallback;
}

// POST purchase-orders/<ref_num>/confirm/receipt/goods-or-service/
// { receiver_name, vehicle_number, gps_address } — the buyer confirms the
// goods arrived. A GRN is auto-created in DRAFT for inspection (lines seeded
// from the GDN / waybill); payment → RECEIVED, PO stays IN_PROGRESS.
export async function confirmGoodsReceipt(
  refNum,
  { receiver_name, vehicle_number, gps_address },
) {
  const { data } = await http.post(
    `purchase-orders/${refNum}/confirm/receipt/goods-or-service/`,
    { receiver_name, vehicle_number, gps_address },
  );
  return data?.data ?? data;
}
