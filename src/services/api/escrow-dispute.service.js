// Escrow disputes (SwaggerHub "escrow_dispute", 2026-10-27).
//
//   POST escrow-disputes/   { escrow, reason, amount_in_dispute? }
//        → 201 ok(dispute, "Dispute raised.") · 400/403 { message, errors? }
//        Freezes the escrow: escrow_status → DISPUTED.
//   GET  escrow-disputes/raised-disputes/?status=…   disputes the caller's
//        company raised (status required; a missing/invalid one answers the
//        ok(message, code=400) envelope, possibly with HTTP 200)
//
// Server rules: the caller's company must be a party to the escrow (buyer,
// supplier or transporter); the reason must suit the caller's side and the
// escrow's state; 0 ≤ amount_in_dispute ≤ escrow.amount_on_hold; the escrow
// must be SECURED or DISPUTED with funds on hold.
import http from "@/services/lib/http";
import { rejectEnvelope } from "@/services/api/grn.service";

// Grouped by the side that usually raises them — the server has the final
// say on which reasons each party may use.
export const DISPUTE_REASONS = {
  buyer: [
    { value: "SHORTAGE", label: "Shortage" },
    { value: "DAMAGE", label: "Damage" },
    { value: "WRONG_ITEM", label: "Wrong item" },
    { value: "LATE_DELIVERY", label: "Late delivery" },
  ],
  supplier: [
    { value: "UNJUSTIFIED_REFUSAL", label: "Unjustified refusal" },
    { value: "BUYER_STALLING", label: "Buyer stalling" },
    { value: "FALSE_DAMAGE_CLAIM", label: "False damage claim" },
    {
      value: "PARTIAL_ACCEPTANCE_REFUSED",
      label: "Partial acceptance refused",
    },
  ],
};

export const DISPUTE_STATUSES = [
  { value: "OPEN", label: "Open" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "RESOLVED_BUYER", label: "Resolved — buyer" },
  { value: "RESOLVED_SUPPLIER", label: "Resolved — supplier" },
  { value: "RESOLVED_TRANSPORTER", label: "Resolved — transporter" },
  { value: "SPLIT", label: "Split" },
];

export const RESOLUTION_LABELS = {
  FULL_REFUND: "Full refund",
  PARTIAL_RELEASE_80_20: "Partial release (80/20)",
  FULL_RELEASE: "Full release",
};

const ALL_REASONS = [...DISPUTE_REASONS.buyer, ...DISPUTE_REASONS.supplier];
export const reasonLabel = (value) =>
  ALL_REASONS.find((r) => r.value === value)?.label || value || "—";
export const disputeStatusLabel = (value) =>
  DISPUTE_STATUSES.find((s) => s.value === value)?.label || value || "—";

// Escrows that can take a dispute.
export const canDisputeEscrow = (escrow) =>
  Boolean(escrow) &&
  ["SECURED", "DISPUTED"].includes(escrow.escrow_status) &&
  Number(escrow.amount_on_hold) > 0;

// → the created dispute.
export async function raiseEscrowDispute({ escrow, reason, amount }) {
  const body = { escrow, reason };
  if (amount !== "" && amount != null) body.amount_in_dispute = String(amount);
  const { data } = await http.post("escrow-disputes/", body);
  rejectEnvelope(data, "Couldn't raise the dispute.");
  return data?.data ?? data;
}

// → { items, count, next, previous }
export async function listRaisedDisputes({ status, page = 1 }) {
  const { data } = await http.get("escrow-disputes/raised-disputes/", {
    params: { status, ...(page > 1 ? { page } : {}) },
  });
  rejectEnvelope(data, "Couldn't load your disputes.");
  const rows = Array.isArray(data) ? data : data?.results || [];
  return {
    items: rows,
    count: data?.count ?? rows.length,
    next: data?.next ?? null,
    previous: data?.previous ?? null,
  };
}

export function disputeErrorMessage(err, fallback) {
  if (err?.envelope) return err.message || fallback;
  const body = err?.response?.data;
  if (body && typeof body === "object") {
    const first = (v) => (Array.isArray(v) ? v[0] : v);
    const fieldErr =
      body.errors && typeof body.errors === "object"
        ? first(Object.values(body.errors)[0])
        : null;
    return (
      first(body.message) ||
      first(body.detail) ||
      fieldErr ||
      first(body.amount_in_dispute) ||
      first(body.reason) ||
      fallback
    );
  }
  return fallback;
}
