// Waybill delivery actions (SwaggerHub specs, 2026-10-15).
//
//   POST waybills/<ref>/get-directions/  multipart { origin, destination }
//        → { success, message, data: { waybill_number, eta_iso,
//              route: { success, data: { distance (m), duration (s),
//                start, end: { coordinates: [lat, lng], name, resolved_from },
//                profile, provider } } } }
//        origin / destination: a place name, GhanaPost GPS ("GA-123-4567") or
//        "lat,lng". origin defaults to the waybill's last GPS ping and
//        destination to waybill.destination.
//   POST waybills/<ref>/arrived/  multipart { location }
//        → { success, message, data: { waybill, notification } }
//
// Lists (in-house / out-sourced / transporter-accessed) live in
// event-lists.service as the Waybills page's tabs.
import http from "@/services/lib/http";

const form = (fields) => {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => {
    if (v != null && String(v).trim() !== "") fd.append(k, String(v).trim());
  });
  return fd;
};

// → { waybillNumber, etaIso, distanceM, durationS, start, end, profile,
//     provider, message }
export async function getWaybillDirections(refNum, { origin, destination }) {
  const { data } = await http.post(
    `waybills/${encodeURIComponent(refNum)}/get-directions/`,
    form({ origin, destination }),
  );
  const body = data?.data ?? data;
  const route = body?.route?.data ?? body?.route ?? {};
  return {
    waybillNumber: body?.waybill_number ?? refNum,
    etaIso: body?.eta_iso ?? null,
    distanceM: Number(route.distance) || 0,
    durationS: Number(route.duration) || 0,
    start: route.start ?? null,
    end: route.end ?? null,
    profile: route.profile ?? "",
    provider: route.provider ?? "",
    message: data?.message ?? "",
  };
}

// Publish a draft. There's no publish route (waybills/<ref>/publish/ is a
// 404); the detail route accepts PATCH, so this sets status = "published".
// The caller checks the returned status — if the backend treats status as
// read-only it comes back unchanged.
export async function publishWaybill(refNum) {
  const { data } = await http.patch(`waybills/${encodeURIComponent(refNum)}/`, {
    status: "published",
  });
  return data?.data ?? data;
}

// → { waybill, message }
export async function markWaybillArrived(refNum, location) {
  const { data } = await http.post(
    `waybills/${encodeURIComponent(refNum)}/arrived/`,
    form({ location }),
  );
  return {
    waybill: data?.data?.waybill ?? null,
    message: data?.message ?? "",
  };
}

export function waybillErrorMessage(err, fallback) {
  const body = err?.response?.data;
  if (body && typeof body === "object") {
    const first = (v) => (Array.isArray(v) ? v[0] : v);
    const fieldErr = body.errors && Object.values(body.errors)[0];
    return (
      first(body.message) ||
      first(body.detail) ||
      first(body.origin) ||
      first(body.destination) ||
      first(body.location) ||
      first(fieldErr) ||
      fallback
    );
  }
  return fallback;
}
