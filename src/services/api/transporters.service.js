// Transporters domain service (Cargo Transporters API, OpenAPI v1).
// Endpoints under /api/v1/ (base URL resolved by the shared http client).
// Create/update are multipart/form-data (image uploads) — pass a FormData.

import http from "@/services/lib/http";

// GET all transporters. DRF list response: { count, next, previous, results }.
export async function listTransporters() {
  const { data } = await http.get("transporters/");
  return data;
}

// GET a single transporter by its UUID (GET /transporters/{id}/).
export async function getTransporter(uuid) {
  const { data } = await http.get(`transporters/${uuid}/`);
  return data;
}

// POST /transporters/ — create a transporter. Pass a FormData (multipart).
export async function createTransporter(payload) {
  const { data } = await http.post("transporters/", payload);
  return data;
}

// PATCH /transporters/{id}/ — partial update (multipart). Pass a FormData.
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
