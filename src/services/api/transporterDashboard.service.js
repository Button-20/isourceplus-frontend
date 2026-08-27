// Transporter dashboard domain service.
// Endpoints under /api/v1/transporter-dashboard/ (base URL resolved by the
// shared http client + proxy). Each returns the raw response body; the overview
// component extracts the values defensively since exact shapes vary.

import http from "@/services/lib/http";

const get = (path) => http.get(path).then((r) => r.data);

export const getActiveBizInvitations = () =>
  get("transporter-dashboard/active-biz-invitations/");
export const getActiveBizOffers = () =>
  get("transporter-dashboard/active-biz-offers/");
export const getPaymentOrdersIssuedValue = () =>
  get("transporter-dashboard/pmt-orders-issued-value/");
export const getSalesInvoiceValue = () =>
  get("transporter-dashboard/sales-invoice-value/");
export const getTotalBuyersAndSuppliers = () =>
  get("transporter-dashboard/total-buyers-and-suppliers/");
