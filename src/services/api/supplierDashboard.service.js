// Supplier dashboard domain service.
// Endpoints under /api/v1/supplier-dashboard/ (base URL resolved by the shared
// http client + dev proxy). Each returns the raw response body; the overview
// component extracts the values defensively since exact shapes vary.

import http from "@/services/lib/http";

const get = (path) => http.get(path).then((r) => r.data);

export const getActiveBizInvitations = () =>
  get("supplier-dashboard/active-biz-invitations/");
export const getActiveBizOffers = () =>
  get("supplier-dashboard/active-biz-offers/");
export const getActiveBizsAwarded = () =>
  get("supplier-dashboard/active-bizs-awarded/");
export const getPaymentOrdersIssuedValue = () =>
  get("supplier-dashboard/pmt-orders-issued-value/");
export const getReceivedPayments = () =>
  get("supplier-dashboard/received-pmts/");
export const getSalesInvoiceValue = () =>
  get("supplier-dashboard/sales-invoice-value/");
export const getTotalBuyers = () => get("supplier-dashboard/total-buyers/");
