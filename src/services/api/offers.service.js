// Business offers (buyer side): the offers — proforma invoices — that suppliers
// and transporters submitted against the buyer's own RFxs, tenders and waybills.
//
//   GET rfxs/{ref}/received-offers/
//   GET tenders/{ref}/received-offers/
//   GET waybills/{ref}/received-offers/
//
// `{ref}` is the event's ref_num, matching every other event endpoint
// (rfxs/{ref}/, tenders/{ref}/ …). As of 2026-10-05 only the tenders route is
// live on the backend; the RFx and waybill routes 404 at the URL router — the
// page detects that (see isMissingRoute) and explains instead of erroring.
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
    issuedPath: "rfxs/issued/",
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
    issuedPath: "tenders/issued/",
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
    issuedPath: "waybills/issued/",
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

// rfxs/issued/ and tenders/issued/ answer a JSON 404 {"detail":"Not found."}
// when the buyer has issued none — an empty state, not a failure.
const isEmptyListNotFound = (err) =>
  err?.response?.status === 404 && !isMissingRoute(err);

// The buyer's own events of one kind (paginated where the backend paginates).
export async function getIssuedEvents(kind, page = 1) {
  try {
    const { data } = await http.get(OFFER_KINDS[kind].issuedPath, {
      params: page > 1 ? { page } : undefined,
    });
    return { items: toList(data), next: data?.next ?? null };
  } catch (err) {
    if (isEmptyListNotFound(err)) return { items: [], next: null };
    throw err;
  }
}

export async function getReceivedOffers(kind, ref) {
  const { data } = await http.get(OFFER_KINDS[kind].offersPath(ref));
  return toList(data);
}
