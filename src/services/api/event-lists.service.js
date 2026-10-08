// Document lists (RFx, tender, waybill, PO, proforma, sales invoice, payment
// order) behind one page per kind with filter tabs — see
// pages/event-lists/EventManagementPage.jsx.
//
//   draft     GET {x}/drafts/                       your drafts
//   published GET {x}/approved/active-published/    approved and live
//   expired   GET {x}/expired/non-active/           submission due date reached
//
// All three exist for every kind (verified 2026-10-08). There is no "All" tab:
// owners get Draft · Published · Expired, everyone else Published · Expired.
// Lists are collection-level, GET-only, and may answer a JSON 404 or
// 200 { detail: "Nothing here yet. …" } when empty.
import http from "@/services/lib/http";
import { isMissingRoute } from "@/services/api/offers.service";

export { isMissingRoute };

// path: suffix after "{x}/".
const FILTERS = {
  draft: { path: "drafts/" },
  published: { path: "approved/active-published/" },
  expired: { path: "expired/non-active/" },
};

export const FILTER_LABELS = {
  draft: "Draft",
  published: "Published",
  expired: "Expired",
};

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
    filtersFor: ({ isOwner }) => tabsFor(isOwner),
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
    // No Expired tab for purchase orders (product decision, 2026-10-08).
    filtersFor: ({ isOwner, isSupplierView }) =>
      tabsFor(isOwner && !isSupplierView).filter((f) => f !== "expired"),
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
    filtersFor: ({ isOwner }) => tabsFor(isOwner),
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
    filtersFor: ({ isOwner }) => tabsFor(isOwner),
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
    filtersFor: ({ isOwner }) => tabsFor(isOwner),
  },
};

export const isEventOwner = (kind, jobTitle) =>
  OWNER_ROLES[kind].includes(jobTitle);

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
async function getPage(path, page) {
  try {
    const { data } = await http.get(path, {
      params: page > 1 ? { page } : undefined,
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
export async function fetchEventList(kind, filter, { page = 1 } = {}) {
  const path = `${EVENT_KINDS[kind].base}/${FILTERS[filter].path}`;
  const { data, items } = await getPage(path, page);
  if (!data) return emptyResult();
  return {
    items,
    count: data?.count ?? items.length,
    next: data?.next ?? null,
    previous: data?.previous ?? null,
    emptyMessage: items.length ? "" : detailOf(data),
  };
}

export const deleteEvent = (kind, ref) =>
  http.delete(`${EVENT_KINDS[kind].base}/${encodeURIComponent(ref)}/`);
