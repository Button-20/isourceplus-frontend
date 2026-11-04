// Proforma invoice actions.
//
//   Approve: PATCH proforma-invoices/<ref_num>/  { is_approved: true }
//
// The backend has no dedicated approve route (proforma-invoices/<ref>/approve/
// is a 404); the detail route accepts PATCH, so approval sets the record's
// own `is_approved` flag — the same field the create forms send.
import http from "@/services/lib/http";
import { apiErrorMessage } from "@/services/lib/api-error";

export async function approveProformaInvoice(refNum) {
  const { data } = await http.patch(
    `proforma-invoices/${encodeURIComponent(refNum)}/`,
    { is_approved: true },
  );
  return data?.data ?? data;
}

export function proformaErrorMessage(err, fallback) {
  return apiErrorMessage(err, fallback);
}
