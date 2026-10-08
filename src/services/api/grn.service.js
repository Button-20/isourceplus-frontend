// Goods received notes (GRN): the buyer's record of what arrived for a
// purchase order, inspected line by line before payment.
//
//   GET   goods-received-notes/                 list (paginated)
//   PATCH good-received-notes/{id}/update/      inspection — line items
//
// GRN fields (from the API's OPTIONS metadata): grn_number, status,
// purchase_order, escrow, receiver_name, vehicle_number, gps_address,
// confirmed_at, lines[] { id, item_description, unit, quantity_ordered,
// quantity_received, quantity_short, quantity_damaged, unit_price,
// condition (GOOD | DAMAGED | SHORT), remarks, accepted_quantity,
// accepted_value, disputed_value }.
//
// The inspection URL is as specified ("good-", not "goods-"); it wasn't live
// yet on 2026-10-08 (HTML 404). On the generic goods-received-notes/{id}/
// route `lines` is read-only, so it can't stand in for it.
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
// it, otherwise found in the user's GRN list. Resolves null when none exists.
export async function findGrnForPurchaseOrder(po) {
  const embedded =
    po?.grn || po?.goods_received_note || po?.goods_received_notes?.[0];
  if (embedded && typeof embedded === "object") return embedded;

  let page = 1;
  let next = true;
  while (next && page <= MAX_PAGES) {
    const { data } = await http.get("goods-received-notes/", {
      params: page > 1 ? { page } : undefined,
    });
    const match = toItems(data).find((g) => linksTo(g, po));
    if (match) return match;
    next = Boolean(data?.next);
    page += 1;
  }
  return null;
}

// Inspection: send each line's received / short / damaged quantities,
// condition and remarks (all as strings). The line keys are the model's own
// (`condition`, `remarks` — confirmed 2026-10-08), not `quantity_condition` /
// `quantity_remarks`.
export async function updateGrnInspection(grnId, lines) {
  const { data } = await http.patch(`good-received-notes/${grnId}/update/`, {
    lines: lines.map((l) => ({
      id: l.id,
      quantity_received: String(l.quantity_received ?? ""),
      quantity_short: String(l.quantity_short ?? ""),
      quantity_damaged: String(l.quantity_damaged ?? ""),
      condition: String(l.condition ?? ""),
      remarks: String(l.remarks ?? ""),
    })),
  });
  return data?.data ?? data;
}
