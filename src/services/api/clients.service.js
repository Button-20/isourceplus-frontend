// Clients: the organisations a company or transporter does business with.
// The endpoint base follows the *logged-in user's* org kind:
//
//   POST companies/add-client/     { name }   — the user's org is a company
//   POST transporters/add-client/  { name }   — the user's org is a transporter
//   GET  companies/clients/?client_type=company|transporter
//   GET  transporters/clients/?client_type=company|transporter
//
// `name` is the client organisation's name, picked from the reviews org search
// (GET reviews/search-organisation-to-review/).
import http from "@/services/lib/http";
import { prettify } from "@/utils/choices";
import { resolveMediaUrl } from "@/services/lib/env";

const BASE = { company: "companies", transporter: "transporters" };

export const CLIENT_TYPES = {
  company: { label: "Companies", singular: "company" },
  transporter: { label: "Transporters", singular: "transporter" },
};

export async function addClient(orgKind, name) {
  const { data } = await http.post(`${BASE[orgKind]}/add-client/`, { name });
  return data;
}

// "greater_accra_region, ablekuma_central, 13 Kai Abbey Ln" → readable
// parts, minus any already shown in the location line (region / district).
function formatAddress(raw, location) {
  const shown = location.toLowerCase();
  const parts = String(raw)
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (/_/.test(p) || /^[a-z\s]+$/.test(p) ? prettify(p) : p));
  const rest = parts.filter((p) => !shown.includes(p.toLowerCase()));
  return (rest.length ? rest : parts).join(", ");
}

// One client row → card fields. Rows may be the org itself or wrap it under
// `client`; anything missing comes back empty and the card skips it.
function normalizeClient(row, index) {
  if (!row || typeof row !== "object") return null;
  const o = row.client && typeof row.client === "object" ? row.client : row;
  const name =
    o.name ??
    o.company_name ??
    o.transporter_name ??
    o.client_name ??
    row.client_name ??
    (typeof row.client === "string" ? row.client : "");
  if (!name) return null;
  const loc = o.location;
  const location =
    (loc && typeof loc === "object"
      ? [loc.district, loc.region].filter(Boolean).map(prettify).join(", ")
      : "") || (o.country ? prettify(o.country) : "");
  const text = (v) =>
    typeof v === "string" || typeof v === "number" ? String(v) : "";
  return {
    key: String(row.id ?? o.id ?? `${name}-${index}`),
    name,
    logo: resolveMediaUrl(o.logo) || null,
    verified: Boolean(o.is_verified),
    subType: o.type ? prettify(String(o.type)) : "",
    industry: o.industry ? prettify(String(o.industry)) : "",
    location,
    address: formatAddress(
      text(o.company_address) ||
        text(o.transporter_address) ||
        text(o.address) ||
        text(o.digital_address),
      location,
    ),
    email: text(o.email) || text(o.company_email),
    phone: text(o.phone_number) || text(o.phone) || text(o.contact),
    website: text(o.website),
    rating: Number(o.avg_rating) || 0,
    addedAt: row.created_at || row.date_added || row.added_on || "",
  };
}

// The user's clients of one type. A JSON 404 means "none yet".
export async function listClients(orgKind, clientType, { page = 1 } = {}) {
  try {
    const { data } = await http.get(`${BASE[orgKind]}/clients/`, {
      params: { client_type: clientType, ...(page > 1 ? { page } : {}) },
    });
    const list = Array.isArray(data)
      ? data
      : data?.results || data?.data || data?.clients || [];
    return {
      items: list.map(normalizeClient).filter(Boolean),
      count: data?.count ?? list.length,
      next: data?.next ?? null,
      previous: data?.previous ?? null,
      emptyMessage: !list.length && data?.detail ? data.detail : "",
    };
  } catch (err) {
    const res = err?.response;
    if (res?.status === 404 && typeof res.data === "object") {
      return {
        items: [],
        count: 0,
        next: null,
        previous: null,
        emptyMessage: res.data?.detail || "",
      };
    }
    throw err;
  }
}

export function clientErrorMessage(err, fallback = "Couldn't add client.") {
  const body = err?.response?.data;
  if (body && typeof body === "object") {
    const first = (v) => (Array.isArray(v) ? v[0] : v);
    return (
      first(body.detail) ||
      first(body.message) ||
      first(body.name) ||
      first(body.non_field_errors) ||
      first(body.error) ||
      fallback
    );
  }
  return fallback;
}
