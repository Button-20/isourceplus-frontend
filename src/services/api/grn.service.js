// Goods received notes (GRN): the buyer's record of what arrived for a
// purchase order, inspected line by line before payment (SwaggerHub "grns",
// 2026-10-27).
//
//   GET goods-received-notes/grns/?company_type=buyer|supplier
//       [&status=DRAFT|INSPECTED|CONFIRMED]   the company's GRNs (paginated)
//   PUT goods-received-notes/{id}/            inspection — { lines: [{ id,
//       quantity_received, quantity_short, quantity_damaged, condition,
//       remarks }] }; only the lines sent change, status → INSPECTED.
//       → ok(grn, "GRN Inspected.") or ok(message, code=400, errors=[…]),
//       possibly with HTTP 200
//
// GRN fields (from the API's OPTIONS metadata): grn_number, status,
// purchase_order, escrow, receiver_name, vehicle_number, gps_address,
// confirmed_at, lines[] { id, item_description, unit, quantity_ordered,
// quantity_received, quantity_short, quantity_damaged, unit_price,
// condition (GOOD | DAMAGED | SHORT), remarks, accepted_quantity,
// accepted_value, disputed_value }.
//
// Line rules (server-checked): quantities ≥ 0, damaged ≤ received,
// received + short ≤ ordered.
import http from "@/services/lib/http";
import { isMissingRoute } from "@/services/api/offers.service";

export { isMissingRoute };

export const GRN_CONDITIONS = [
  { value: "GOOD", label: "Good" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "SHORT", label: "Short" },
];

const toItems = (data) =>
  Array.isArray(data) ? data : data?.results || data?.data || [];

const MAX_PAGES = 5;

export const GRN_STATUSES = ["DRAFT", "INSPECTED", "CONFIRMED"];

// The backend's ok(message, code=400) envelope can arrive with HTTP 200;
// surface it as an error like a real 4xx.
export function rejectEnvelope(data, fallback) {
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    (data.success === false || Number(data.code) >= 400)
  ) {
    const errors = Array.isArray(data.errors) ? data.errors : [];
    throw Object.assign(new Error(data.message || errors[0] || fallback), {
      envelope: data,
    });
  }
  return data;
}

// → { items, count, next, previous }
export async function listGrns({ companyType, status, page = 1 } = {}) {
  const { data } = await http.get("goods-received-notes/grns/", {
    params: {
      company_type: companyType,
      ...(status ? { status } : {}),
      ...(page > 1 ? { page } : {}),
    },
  });
  rejectEnvelope(data, "Couldn't load goods received notes.");
  return {
    items: toItems(data),
    count: data?.count ?? toItems(data).length,
    next: data?.next ?? null,
    previous: data?.previous ?? null,
  };
}

// `purchase_order` may be an id, a hyperlink or a nested object.
const linksTo = (grn, po) => {
  const ref = grn?.purchase_order;
  if (ref == null || !po) return false;
  if (typeof ref === "object")
    return (
      (ref.id != null && String(ref.id) === String(po.id)) ||
      (ref.ref_num && ref.ref_num === po.ref_num)
    );
  const s = String(ref);
  return (
    (po.id != null && (s === String(po.id) || s.endsWith(`/${po.id}/`))) ||
    (po.ref_num && (s === po.ref_num || s.endsWith(`/${po.ref_num}/`)))
  );
};

// The GRN for a purchase order: embedded on the PO when the backend includes
// it, otherwise found in the company's GRNs (`companyType` — the buyer's by
// default). Resolves null when none exists.
export async function findGrnForPurchaseOrder(po, companyType = "buyer") {
  const embedded =
    po?.grn || po?.goods_received_note || po?.goods_received_notes?.[0];
  if (embedded && typeof embedded === "object") return embedded;

  let page = 1;
  let next = true;
  while (next && page <= MAX_PAGES) {
    const res = await listGrns({ companyType, page });
    const match = res.items.find((g) => linksTo(g, po));
    if (match) return match;
    next = Boolean(res.next);
    page += 1;
  }
  return null;
}

// Inspection: send each line's received / short / damaged quantities,
// condition and remarks (all as strings). The line keys are the model's own
// (`condition`, `remarks` — confirmed 2026-10-08), not `quantity_condition` /
// `quantity_remarks`.
export async function updateGrnInspection(grnId, lines) {
  const { data } = await http.put(`goods-received-notes/${grnId}/`, {
    lines: lines.map((l) => ({
      id: l.id,
      quantity_received: String(l.quantity_received ?? ""),
      quantity_short: String(l.quantity_short ?? ""),
      quantity_damaged: String(l.quantity_damaged ?? ""),
      condition: String(l.condition ?? ""),
      remarks: String(l.remarks ?? ""),
    })),
  });
  rejectEnvelope(data, "Couldn't save the inspection.");
  return data?.data ?? data;
}

// First useful message from a GRN / GDN error (thrown envelope or 4xx).
export function grnErrorMessage(err, fallback) {
  if (err?.envelope) return err.message || fallback;
  if (isMissingRoute(err)) return "This isn't available on the server yet.";
  const body = err?.response?.data;
  if (body && typeof body === "object") {
    const first = (v) => (Array.isArray(v) ? v[0] : v);
    return (
      first(body.message) ||
      first(body.detail) ||
      first(body.errors) ||
      fallback
    );
  }
  return fallback;
}
