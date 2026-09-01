// Transporters domain service.
// Endpoints under /api/v1/ (base URL resolved by the shared http client).
//
// NOTE: per the provided API spec the DETAIL endpoint is SINGULAR
// (`transporter/{uuid}/`) while list/create are PLURAL (`transporters/`).
// Kept exactly as specified — if a detail lookup 404s, that singular path is
// the first thing to verify against the backend.

import http from "@/services/lib/http";

// GET all transporters. DRF list response: { count, next, previous, results }.
export async function listTransporters() {
  const { data } = await http.get("transporters/");
  return data;
}

// GET a single transporter by its UUID (singular path, per spec).
export async function getTransporter(uuid) {
  const { data } = await http.get(`transporter/${uuid}/`);
  return data;
}

// POST create a transporter. Accepts a plain object or FormData.
export async function createTransporter(payload) {
  const { data } = await http.post("transporters/", payload);
  return data;
}

// PATCH update a transporter (used to attach logo / vehicle images after
// create). Uses the plural collection path, matching the create endpoint.
export async function updateTransporter(uuid, payload) {
  const { data } = await http.patch(`transporters/${uuid}/`, payload);
  return data;
}

// GET the type choices for a transporter.
export async function getTransporterTypeChoices() {
  const { data } = await http.get("transporter-type-choices/");
  return data;
}

// GET the transport mode choices for a transporter.
export async function getTransportModeChoices() {
  const { data } = await http.get("transport-mode-choices/");
  return data;
}

// GET the transport means choices for a transporter.
export async function getTransportMeansChoices() {
  const { data } = await http.get("transport-means-choices/");
  return data;
}
