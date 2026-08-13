// Buyer dashboard domain service.
// Endpoints under /api/v1/buyer-dashboard/ (base URL resolved by the shared
// http client + dev proxy). Each returns the raw response body; the overview
// component extracts the values defensively since exact shapes vary.

import http from "@/services/lib/http";

const get = (path) => http.get(path).then((r) => r.data);

export const getActiveRfxs = () => get("buyer-dashboard/active-rfxs/");
export const getActiveTenders = () => get("buyer-dashboard/active-tenders/");
export const getReceivedOffers = () => get("buyer-dashboard/received-offers/");
export const getTotalSuppliers = () => get("buyer-dashboard/total-suppliers/");
export const getPurchaseOrderValue = () =>
  get("buyer-dashboard/purchase-order-value/");
export const getTotalPaymentOrders = () =>
  get("buyer-dashboard/total-payment-orders/");
export const getPoToOffersPercentages = () =>
  get("buyer-dashboard/po-or-inflow-outflow-compared-percentages/");
export const getPoToPaymentPercentages = () =>
  get("buyer-dashboard/po-pmt-inflow-outflow-compared-percentages/");
export const getEventsFrequency = () =>
  get("buyer-dashboard/monitor-events-frequency/");
