// Event lists (RFx / tender / waybill) behind one page per kind with filter
// tabs — see pages/event-lists/EventManagementPage.jsx.
//
//   all       GET {x}/                              everything visible to you
//   draft     {x}/ (rfx, tender) or waybills/issued/, filtered client-side to
//             payload status "draft" — there is no draft endpoint and the
//             backend ignores ?status= (verified 2026-10-05)
//   published GET {x}/approved/active-published/    approved and live
//   expired   GET {x}/expired/non-active/           submission due date reached
//
// "Draft" replaces the old "Issued" tab (same records): rfxs/issued/ and
// tenders/issued/ are NOT list routes — the detail route answers them
// ("No Rfx matches the given query."). waybills/issued/ is a real list.
// Published/expired are collection-level, GET-only, and answer 200
// { detail: "Nothing here yet. …" } when empty; only the tenders routes exist
// so far (rfxs/waybills → Django HTML 404, detected by isMissingRoute).
import http from "@/services/lib/http";
import { isMissingRoute } from "@/services/api/offers.service";

export { isMissingRoute };

// path: suffix after "{x}/"; status: keep only rows whose payload status
// matches (client-side). `draftPath` lets a kind source drafts elsewhere.
const FILTERS = {
  all: { path: "" },
  draft: { path: "", status: "draft" },
  published: { path: "approved/active-published/" },
  expired: { path: "expired/non-active/" },
};

export const FILTER_LABELS = {
  all: "All",
  draft: "Draft",
  published: "Published",
  expired: "Expired",
};

// Client-side filtering has to see every page, not just the first.
const MAX_PAGES = 10;

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
    offersUrl: (ref) => `/dashboard/business-offers/rfx?event=${ref}`,
    viewRoles: ["lead buyer", "sales manager"],
    // Buyers manage their own RFxs; suppliers (supplier view) just browse all.
    filtersFor: ({ isOwner, isSupplierView }) =>
      isOwner && !isSupplierView
        ? ["all", "draft", "published", "expired"]
        : ["all"],
  },
  tender: {
    base: "tenders",
    singular: "tender",
    plural: "tenders",
    route: "/dashboard/tenders",
    detailUrl: (ref) => `/dashboard/tenders/${ref}`,
    offersUrl: (ref) => `/dashboard/business-offers/tenders?event=${ref}`,
    viewRoles: ["lead buyer", "sales manager"],
    filtersFor: ({ isOwner, isSupplierView }) =>
      isOwner && !isSupplierView
        ? ["all", "draft", "published", "expired"]
        : ["all"],
  },
  waybill: {
    base: "waybills",
    singular: "waybill",
    plural: "waybills",
    route: "/dashboard/waybills",
    detailUrl: (ref) => `/dashboard/waybills/${ref}`,
    offersUrl: (ref) => `/dashboard/business-offers/waybills?event=${ref}`,
    viewRoles: null, // everyone who can reach the page
    // Owners' drafts come from their issued list (waybills/issued/ is real).
    draftPath: "issued/",
    // Sales managers create waybills too, so manage in supplier view as well.
    ownerSide: "any",
    // Waybill owners (buyers / suppliers) only ever saw their own waybills;
    // transporters see all waybills they can bid on.
    filtersFor: ({ isOwner }) =>
      isOwner ? ["draft", "published", "expired"] : ["all"],
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
    // Buyers' drafts come from their issued POs (purchase-orders/issued/ is a
    // real list). purchase-orders/ is everything visible (for a supplier: the
    // POs awarded to them). No published/expired routes exist for POs.
    draftPath: "issued/",
    filtersFor: ({ isOwner, isSupplierView }) =>
      isOwner && !isSupplierView ? ["all", "draft"] : ["all"],
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
    draftPath: "issued/", // proforma-invoices/issued/ — issuer-only list
    filtersFor: ({ isOwner }) => (isOwner ? ["all", "draft"] : ["all"]),
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
    draftPath: "issued/", // sales-invoices/issued/ — issuer-only list
    filtersFor: ({ isOwner }) => (isOwner ? ["all", "draft"] : ["all"]),
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
    viewRoles: null, // buyers see the payment orders served on them (All)
    draftPath: "issued/", // payment-orders/issued/ — issuer-only list
    filtersFor: ({ isOwner }) => (isOwner ? ["all", "draft"] : ["all"]),
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
  const k = EVENT_KINDS[kind];
  const f = FILTERS[filter];
  const suffix = filter === "draft" && k.draftPath ? k.draftPath : f.path;
  const path = `${k.base}/${suffix}`;

  // Status-filtered tab: walk the underlying list's pages, keep matches.
  if (f.status) {
    const all = [];
    let p = 1;
    let next = true;
    while (next && p <= MAX_PAGES) {
      const { data, items } = await getPage(path, p);
      all.push(...items);
      next = Boolean(data?.next);
      p += 1;
    }
    const items = all.filter(
      (r) =>
        String(r?.status ?? "")
          .trim()
          .toLowerCase() === f.status,
    );
    return { ...emptyResult(), items, count: items.length };
  }

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
