// Document lists (RFx, tender, waybill, PO, proforma, sales invoice, payment
// order) behind one page per kind with filter tabs — see
// pages/event-lists/EventManagementPage.jsx.
//
//   draft     GET {x}/drafts/                       your drafts (POs: below)
//   published GET {x}/approved/active-published/    approved and live
//   expired   GET {x}/expired/non-active/           submission due date reached
//
// All three exist for every kind (verified 2026-10-08). There is no "All" tab:
// owners get Draft · Published · Expired, everyone else Published · Expired.
// Some kinds add their own tabs (SwaggerHub specs, 2026-10-15 / 2026-10-26):
//
//   accepted / rejected   GET proforma-invoices/accepted/ | rejected/
//
//   By status — {x}/multi-status/?status=… for what the company issued,
//   {x}/received/?status=… for what was sent to it (status is required):
//     purchase orders  issued:   DRAFT · ESCROW_FUNDED · IN_PROGRESS ·
//                                COMPLETED · CANCELLED
//                      received: PUBLISHED · ESCROW_FUNDED · IN_PROGRESS ·
//                                COMPLETED · CANCELLED
//     sales invoices   issued:   DISPATCHED · RECEIVED · PAID · CANCELLED
//                      received: PUBLISHED · DISPATCHED · RECEIVED · PAID ·
//                                CANCELLED
//     payment orders   issued:   DISPATCHED · RECEIVED · GRN_CONFIRMED ·
//                                PAID · CANCELLED
//                      received: PUBLISHED · DISPATCHED · RECEIVED ·
//                                GRN_CONFIRMED · PAID · CANCELLED
//   (Issued drafts stay on drafts/ except POs; issued Published stays on
//   approved/active-published/.)
//
//   in-house / out-sourced (waybill owners, ?source= on the page)
//                         GET waybills/in-house/ | out-sourced/
//                             ?status=draft | published | expired
//   assigned / in transit / delivered / cancelled (transporters)
//                         GET waybills/out-sourced/transporter-accessed/
//                             ?tracking_status=ASSIGNED | IN_TRANSIT | …
//
// A kind's `filterOverrides(ctx)` replaces a shared filter's path/params;
// ctx = { isOwner, isSupplierView, isTransporter, ...listContext }.
// Lists are collection-level, GET-only, and may answer a JSON 404 or
// 200 { detail: "Nothing here yet. …" } when empty.
import http from "@/services/lib/http";
import { isMissingRoute } from "@/services/api/offers.service";

export { isMissingRoute };

// path: suffix after "{x}/"; params: extra query params.
const FILTERS = {
  draft: { path: "drafts/" },
  published: { path: "approved/active-published/" },
  accepted: { path: "accepted/" },
  rejected: { path: "rejected/" },
  received: { path: "received/" },
  expired: { path: "expired/non-active/" },
};

export const FILTER_LABELS = {
  draft: "Draft",
  published: "Published",
  dispatched: "Dispatched",
  accepted: "Accepted",
  rejected: "Rejected",
  received: "Received",
  assigned: "Assigned",
  in_transit: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
  escrow_funded: "Escrow funded",
  in_progress: "In progress",
  completed: "Completed",
  grn_confirmed: "GRN confirmed",
  paid: "Paid",
  expired: "Expired",
};

// One tab per status from {x}/multi-status/ (issued) or {x}/received/.
const byStatus = (path, tabs) =>
  Object.fromEntries(
    tabs.map((t) => [t, { path, params: { status: t.toUpperCase() } }]),
  );

// Purchase orders by status (GET purchase-orders/multi-status/?status=DRAFT |
// ESCROW_FUNDED | IN_PROGRESS | COMPLETED | CANCELLED). Draft comes from here
// too (not drafts/); Published keeps approved/active-published/. The spec
// doesn't name the query param; `status` matches its "Invalid status value".
const PO_LIFECYCLE_TABS = [
  "escrow_funded",
  "in_progress",
  "completed",
  "cancelled",
];
const PO_LIFECYCLE = byStatus("multi-status/", ["draft", ...PO_LIFECYCLE_TABS]);
// Received POs (suppliers and transporters), Published included.
const PO_RECEIVED_TABS = ["published", ...PO_LIFECYCLE_TABS];
const PO_RECEIVED = byStatus("received/", PO_RECEIVED_TABS);

// Sales invoices / payment orders after publishing.
const INVOICE_STATUS_TABS = ["dispatched", "received", "paid", "cancelled"];
const PAYMENT_STATUS_TABS = [
  "dispatched",
  "received",
  "grn_confirmed",
  "paid",
  "cancelled",
];

// Transporters' outsourced waybills, one tracking status per tab.
const TRACKING_TABS = ["assigned", "in_transit", "delivered", "cancelled"];
const transporterWaybills = (tab) => ({
  path: "out-sourced/transporter-accessed/",
  params: { tracking_status: tab.toUpperCase() },
});

// Drafts belong to whoever manages the document; others only see live ones.
const tabsFor = (canManage) =>
  canManage ? ["draft", "published", "expired"] : ["published", "expired"];

const OWNER_ROLES = {
  rfx: ["lead buyer"],
  tender: ["lead buyer"],
  waybill: ["lead buyer", "sales manager"],
  purchaseOrder: ["lead buyer"],
  // Proformas / sales invoices are issued by the selling side.
  proforma: ["sales manager", "logistics manager"],
  salesInvoice: ["sales manager", "logistics manager"],
  paymentOrder: ["sales manager", "logistics manager"],
};

export const EVENT_KINDS = {
  rfx: {
    base: "rfxs",
    singular: "RFx",
    plural: "RFxs",
    route: "/dashboard/rfxs",
    detailUrl: (ref) => `/dashboard/rfxs/${ref}`,
    // Received offers live on the Business Offers page, with this RFx picked.
    offersUrl: (ref) =>
      `/dashboard/business-offers?type=rfx&event=${encodeURIComponent(ref)}`,
    viewRoles: ["lead buyer", "sales manager"],
    // Buyers manage their own RFxs; suppliers (supplier view) only browse.
    filtersFor: ({ isOwner, isSupplierView }) =>
      tabsFor(isOwner && !isSupplierView),
  },
  tender: {
    base: "tenders",
    singular: "tender",
    plural: "tenders",
    route: "/dashboard/tenders",
    detailUrl: (ref) => `/dashboard/tenders/${ref}`,
    offersUrl: (ref) =>
      `/dashboard/business-offers?type=tender&event=${encodeURIComponent(ref)}`,
    viewRoles: ["lead buyer", "sales manager"],
    filtersFor: ({ isOwner, isSupplierView }) =>
      tabsFor(isOwner && !isSupplierView),
  },
  waybill: {
    base: "waybills",
    singular: "waybill",
    plural: "waybills",
    route: "/dashboard/waybills",
    detailUrl: (ref) => `/dashboard/waybills/${ref}`,
    offersUrl: (ref) =>
      `/dashboard/business-offers?type=waybill&event=${encodeURIComponent(ref)}`,
    viewRoles: null, // everyone who can reach the page
    // Sales managers create waybills too, so manage in supplier view as well.
    ownerSide: "any",
    // Transporters also follow the waybills they carry, by tracking status.
    filtersFor: ({ isOwner, isTransporter }) =>
      isTransporter && !isOwner
        ? ["published", ...TRACKING_TABS]
        : tabsFor(isOwner),
    // Owners see in-house or out-sourced waybills (?source=) by status.
    filterOverrides: ({ isOwner, isTransporter, source }) => {
      if (isOwner && source)
        return Object.fromEntries(
          ["draft", "published", "expired"].map((f) => [
            f,
            { path: `${source}/`, params: { status: f } },
          ]),
        );
      if (isTransporter && !isOwner)
        return Object.fromEntries(
          TRACKING_TABS.map((t) => [t, transporterWaybills(t)]),
        );
      return {};
    },
  },
  purchaseOrder: {
    base: "purchase-orders",
    singular: "purchase order",
    plural: "purchase orders",
    route: "/dashboard/purchase-orders",
    detailUrl: (ref) => `/dashboard/purchase-orders/${ref}`,
    offersUrl: null, // no received-offers view for POs
    canDelete: false, // POs come from awarded offers; no delete
    viewRoles: null,
    // No Expired tab (product decision, 2026-10-08); after Published, the
    // life-cycle tabs follow the order through escrow, delivery and payment.
    // Buyers see the POs they issued; suppliers and transporters the ones
    // sent to them (received/?status=…).
    filtersFor: ({ isOwner, isSupplierView }) =>
      isOwner && !isSupplierView
        ? ["draft", "published", ...PO_LIFECYCLE_TABS]
        : PO_RECEIVED_TABS,
    filterOverrides: ({ isOwner, isSupplierView }) =>
      isOwner && !isSupplierView ? PO_LIFECYCLE : PO_RECEIVED,
  },
  proforma: {
    base: "proforma-invoices",
    singular: "proforma invoice",
    plural: "proforma invoices",
    route: "/dashboard/proforma-invoices",
    // Issued (Draft tab) proformas open the issuer's detail page for the
    // logistics manager (the only role that page serves); otherwise the
    // shared detail page.
    detailUrl: (ref, ctx = {}) =>
      ctx.filter === "draft" && ctx.jobTitle === "logistics manager"
        ? `/dashboard/proforma-invoices/issued/${ref}`
        : `/dashboard/proforma-invoices/${ref}`,
    offersUrl: null,
    ownerSide: "any", // sellers own these, so manage in supplier view too
    viewRoles: null,
    // Accepted / rejected by the buyer — seen from both sides.
    filtersFor: ({ isOwner }) =>
      isOwner
        ? ["draft", "published", "accepted", "rejected", "expired"]
        : ["published", "accepted", "rejected", "expired"],
  },
  salesInvoice: {
    base: "sales-invoices",
    singular: "sales invoice",
    plural: "sales invoices",
    route: "/dashboard/sales-invoices",
    detailUrl: (ref) => `/dashboard/sales-invoices/${ref}`,
    offersUrl: null,
    canDelete: false, // the old list pages had no delete
    ownerSide: "any",
    viewRoles: null,
    // Issuers follow their invoices from draft to paid; buyers the ones
    // they've received, by status.
    filtersFor: ({ isOwner }) =>
      isOwner
        ? ["draft", "published", ...INVOICE_STATUS_TABS, "expired"]
        : ["published", ...INVOICE_STATUS_TABS],
    filterOverrides: ({ isOwner }) =>
      isOwner
        ? byStatus("multi-status/", INVOICE_STATUS_TABS)
        : byStatus("received/", ["published", ...INVOICE_STATUS_TABS]),
  },
  paymentOrder: {
    base: "payment-orders",
    singular: "payment order",
    plural: "payment orders",
    route: "/dashboard/payment-orders",
    detailUrl: (ref) => `/dashboard/payment-orders/${ref}`,
    offersUrl: null,
    canDelete: false, // the old list page had no delete
    ownerSide: "any", // issued by sellers (sales / logistics managers)
    viewRoles: null,
    // Issuers and the buyers they're served on both follow them by status:
    // published → dispatched → received → GRN confirmed → paid.
    filtersFor: ({ isOwner }) =>
      isOwner
        ? ["draft", "published", ...PAYMENT_STATUS_TABS, "expired"]
        : ["published", ...PAYMENT_STATUS_TABS],
    filterOverrides: ({ isOwner }) =>
      isOwner
        ? byStatus("multi-status/", PAYMENT_STATUS_TABS)
        : byStatus("received/", ["published", ...PAYMENT_STATUS_TABS]),
  },
};

// Kinds a buyer issues. A supplier company that has switched to buyer
// (viewMode "buyer") creates and manages these too, whatever the member's
// job title — sales managers aren't in OWNER_ROLES for RFxs, tenders or POs.
const BUYER_KINDS = ["rfx", "tender", "waybill", "purchaseOrder"];

export const isBuyerView = (jobTitle, viewMode) =>
  jobTitle === "lead buyer" ||
  (viewMode === "buyer" && jobTitle !== "logistics manager");

export const isEventOwner = (kind, jobTitle, viewMode) =>
  OWNER_ROLES[kind].includes(jobTitle) ||
  (BUYER_KINDS.includes(kind) && isBuyerView(jobTitle, viewMode));

const toItems = (data) =>
  Array.isArray(data) ? data : data?.results || data?.data || [];

const emptyResult = (emptyMessage = "") => ({
  items: [],
  count: 0,
  next: null,
  previous: null,
  emptyMessage,
});

// GET one page; a JSON 404 (not the HTML "no route" page) means "nothing".
async function getPage(path, page, params = {}) {
  try {
    const query = { ...params, ...(page > 1 ? { page } : {}) };
    const { data } = await http.get(path, {
      params: Object.keys(query).length ? query : undefined,
    });
    return { data, items: toItems(data) };
  } catch (err) {
    if (err?.response?.status === 404 && !isMissingRoute(err)) {
      return { data: null, items: [] };
    }
    throw err;
  }
}

const detailOf = (data) =>
  data && typeof data === "object" && !Array.isArray(data)
    ? data.detail || data.message || ""
    : "";

// → { items, count, next, previous, emptyMessage }
// `ctx` ({ isOwner, isTransporter, …listContext }) picks filterOverrides.
export async function fetchEventList(kind, filter, { page = 1, ...ctx } = {}) {
  const k = EVENT_KINDS[kind];
  const f = k.filterOverrides?.(ctx)?.[filter] ?? FILTERS[filter];
  const path = `${k.base}/${f.path}`;
  const { data, items } = await getPage(path, page, f.params);
  if (!data) return emptyResult();
  return {
    items,
    count: data?.count ?? items.length,
    next: data?.next ?? null,
    previous: data?.previous ?? null,
    emptyMessage: items.length ? "" : detailOf(data),
  };
}

// Approve a draft. No kind has an approve route ({x}/<ref>/approve/ is a
// 404); the detail route accepts PATCH, so this sets the record's own
// `is_approved` flag — the one the create forms send — which moves it from
// drafts/ to approved/active-published/.
export async function approveEvent(kind, ref) {
  const { data } = await http.patch(
    `${EVENT_KINDS[kind].base}/${encodeURIComponent(ref)}/`,
    { is_approved: true },
  );
  return data?.data ?? data;
}

export const deleteEvent = (kind, ref) =>
  http.delete(`${EVENT_KINDS[kind].base}/${encodeURIComponent(ref)}/`);
