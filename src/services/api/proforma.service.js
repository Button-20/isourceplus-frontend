// Proforma invoice actions.
//
//   Approve: PATCH proforma-invoices/<ref_num>/  { is_approved: true }
//
// The backend has no dedicated approve route (proforma-invoices/<ref>/approve/
// is a 404); the detail route accepts PATCH, so approval sets the record's
// own `is_approved` flag — the same field the create forms send.
import http from "@/services/lib/http";

export async function approveProformaInvoice(refNum) {
  const { data } = await http.patch(
    `proforma-invoices/${encodeURIComponent(refNum)}/`,
    { is_approved: true },
  );
  return data?.data ?? data;
}

export function proformaErrorMessage(err, fallback) {
  const body = err?.response?.data;
  if (body && typeof body === "object") {
    const first = (v) => (Array.isArray(v) ? v[0] : v);
    return (
      first(body.message) ||
      first(body.detail) ||
      first(body.is_approved) ||
      first(body.non_field_errors) ||
      fallback
    );
  }
  return fallback;
}
