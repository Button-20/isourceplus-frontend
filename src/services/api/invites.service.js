// Business invitations: the events an organisation has been invited to.
//
//   GET companies/business-invites/?biz_type=<rfx|tender>   — supplier companies
//   GET transporters/business-invites/                      — transporters (waybills)
//
// The response shape is unseen, so rows are normalised defensively: either the
// event itself (ref_num, title, …) or an invite wrapping it under `rfx` /
// `tender` / `waybill` / `event`.
import http from "@/services/lib/http";

export { isMissingRoute } from "@/services/api/offers.service";

export const INVITE_TYPES = {
  rfx: {
    label: "RFx",
    plural: "RFx invitations",
    detailUrl: (ref) => `/dashboard/rfxs/${ref}`,
  },
  tender: {
    label: "Tender",
    plural: "tender invitations",
    detailUrl: (ref) => `/dashboard/tenders/${ref}`,
  },
  waybill: {
    label: "Waybill",
    plural: "waybill invitations",
    detailUrl: (ref) => `/dashboard/waybills/${ref}`,
  },
};

const toItems = (data) =>
  Array.isArray(data) ? data : data?.results || data?.data || [];

// Flatten an invite row into the event fields the table needs.
export const normalizeInvite = (row, bizType) => {
  const event =
    (row &&
      typeof row === "object" &&
      (row[bizType] || row.event || row.rfx || row.tender || row.waybill)) ||
    row ||
    {};
  const src = typeof event === "object" ? event : {};
  return {
    key: row?.id ?? src.id ?? src.ref_num,
    ref: src.ref_num ?? row?.ref_num ?? "",
    title: src.title ?? row?.title ?? "Untitled",
    company:
      src.issuing_company_info ??
      src.issuing_company_name ??
      row?.issuing_company_info ??
      row?.issuing_company_name ??
      "—",
    status: row?.status ?? src.status ?? "",
    deadline:
      src.submission_datetime ??
      src.delivery_deadline ??
      row?.submission_datetime ??
      null,
    received: row?.created_at ?? src.created_at ?? null,
  };
};

// `orgKind` is the user's org: "company" or "transporter".
// → { items, count, next, previous, emptyMessage }
export async function listBusinessInvites(
  orgKind,
  bizType,
  { page = 1 } = {},
) {
  const pageParam = page > 1 ? { page } : {};
  const { data } =
    orgKind === "transporter"
      ? await http.get("transporters/business-invites/", { params: pageParam })
      : await http.get("companies/business-invites/", {
          params: { biz_type: bizType, ...pageParam },
        });
  const items = toItems(data).map((r) => normalizeInvite(r, bizType));
  const emptyMessage =
    !items.length && data && typeof data === "object" && !Array.isArray(data)
      ? data.detail || data.message || ""
      : "";
  return {
    items,
    count: data?.count ?? items.length,
    next: data?.next ?? null,
    previous: data?.previous ?? null,
    emptyMessage,
  };
}
