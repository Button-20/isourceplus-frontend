// Goods delivery notes (GDN): the supplier's dispatch record for an
// outsourced delivery (SwaggerHub "gdns", 2026-10-27).
//
//   GET goods-delivery-notes/gdns/?company_type=buyer|supplier
//       [&status=IN_TRANSIT|DELIVERED|CANCELLED]   the company's GDNs
//
// company_type picks the side: buyer → GDNs addressed to the caller as
// buyer; supplier (or missing) → the ones it dispatched. An unknown status
// just yields an empty page.
//
// GDN fields: gdn_number, status, date_dispatched, expected_delivery_date,
// delivery_address, supplier_warehouse_location, transporter_name,
// driver_phone, vehicle_number, total_packages, weight, special_instructions,
// dispatched_by_name, waybill { … }, purchase_order, payment_order,
// lines[] { id, item_description, quantity_dispatched, unit, batch_no,
// expiry_date, unit_price }.
import http from "@/services/lib/http";
import { rejectEnvelope } from "@/services/api/grn.service";

export const GDN_STATUSES = ["IN_TRANSIT", "DELIVERED", "CANCELLED"];

const toItems = (data) =>
  Array.isArray(data) ? data : data?.results || data?.data || [];

// → { items, count, next, previous }
export async function listGdns({ companyType, status, page = 1 } = {}) {
  const { data } = await http.get("goods-delivery-notes/gdns/", {
    params: {
      company_type: companyType,
      ...(status ? { status } : {}),
      ...(page > 1 ? { page } : {}),
    },
  });
  rejectEnvelope(data, "Couldn't load goods delivery notes.");
  return {
    items: toItems(data),
    count: data?.count ?? toItems(data).length,
    next: data?.next ?? null,
    previous: data?.previous ?? null,
  };
}
