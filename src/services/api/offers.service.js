// Business offers (buyer side): the offers — proforma invoices — that suppliers
// and transporters submitted against the buyer's own RFxs, tenders and waybills.
//
//   GET rfxs/{ref}/received-offers/
//   GET tenders/{ref}/received-offers/
//   GET waybills/{ref}/received-offers/
//
// `{ref}` is the event's ref_num, matching every other event endpoint
// (rfxs/{ref}/, tenders/{ref}/ …). All three are live (verified 2026-10-08);
// a missing route is still detected (isMissingRoute) and explained.
//
// The events to pick from are the buyer's own — drafts, published and expired
// ({x}/drafts/, {x}/approved/active-published/, {x}/expired/non-active/),
// merged. ({x}/issued/ is not a list: the detail route answers it.)
import http from "@/services/lib/http";

export const OFFER_KINDS = {
  rfx: {
    key: "rfx",
    label: "RFx",
    singular: "an RFx",
    plural: "RFxs",
    title: "RFx offers",
    blurb:
      "Proforma invoices suppliers have submitted against your RFQs, RFPs and RFIs.",
    base: "rfxs",
    offersPath: (ref) => `rfxs/${encodeURIComponent(ref)}/received-offers/`,
    eventUrl: (ref) => `/dashboard/rfxs/${ref}`,
    createUrl: "/dashboard/rfxs/issued?new=1",
  },
  tender: {
    key: "tender",
    label: "Tender",
    singular: "a tender",
    plural: "tenders",
    title: "Tender offers",
    blurb: "Bids suppliers have submitted against the tenders you published.",
    base: "tenders",
    offersPath: (ref) => `tenders/${encodeURIComponent(ref)}/received-offers/`,
    eventUrl: (ref) => `/dashboard/tenders/${ref}`,
    createUrl: "/dashboard/tenders?new=1",
  },
  waybill: {
    key: "waybill",
    label: "Waybill",
    singular: "a waybill",
    plural: "waybills",
    title: "Waybill offers",
    blurb:
      "Delivery offers cargo transporters have submitted against your waybills.",
    base: "waybills",
    offersPath: (ref) => `waybills/${encodeURIComponent(ref)}/received-offers/`,
    eventUrl: (ref) => `/dashboard/waybills/${ref}`,
    createUrl: "/dashboard/waybills/issued",
  },
};

// Lists come back as an array, a DRF page ({ results, next }) or wrapped
// ({ data } / { offers }).
const toList = (data) =>
  Array.isArray(data)
    ? data
    : data?.results ||
      data?.data ||
      data?.offers ||
      data?.received_offers ||
      [];

// A 404 whose body is Django's HTML page means the route itself doesn't exist
// yet (as opposed to a JSON 404 for an unknown event).
export const isMissingRoute = (err) =>
  err?.response?.status === 404 &&
  typeof err.response.data === "string" &&
  /<html/i.test(err.response.data);

// A JSON 404 (not the HTML "no route" page) means an empty list.
const isEmptyListNotFound = (err) =>
  err?.response?.status === 404 && !isMissingRoute(err);

const EVENT_LISTS = [
  "drafts/",
  "approved/active-published/",
  "expired/non-active/",
];

async function getList(path) {
  try {
    const { data } = await http.get(path);
    return toList(data);
  } catch (err) {
    if (isEmptyListNotFound(err)) return [];
    throw err;
  }
}

// The buyer's own events of one kind — drafts, published and expired merged
// (first page of each), newest first. `next` stays null: no paging across
// the merged lists.
export async function getIssuedEvents(kind) {
  const { base } = OFFER_KINDS[kind];
  const lists = await Promise.all(
    EVENT_LISTS.map((suffix) => getList(`${base}/${suffix}`)),
  );
  const seen = new Set();
  const items = lists.flat().filter((e) => {
    const key = e?.ref_num ?? e?.id;
    if (key == null || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  items.sort(
    (a, b) =>
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime(),
  );
  return { items, next: null };
}

export async function getReceivedOffers(kind, ref) {
  const { data } = await http.get(OFFER_KINDS[kind].offersPath(ref));
  return toList(data);
}
