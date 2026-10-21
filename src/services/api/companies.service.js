// Companies domain service.
// Endpoints under /api/v1/companies/ (base URL resolved by the shared http
// client + proxy). Thin async wrappers that return the response body.

import http from "@/services/lib/http";

// GET all companies. DRF list response: { count, next, previous, results }.
export async function listCompanies() {
  const { data } = await http.get("companies/");
  return data;
}

// GET a single company by its UUID.
export async function getCompany(uuid) {
  const { data } = await http.get(`companies/${uuid}/`);
  return data;
}

// POST create a company. Accepts a FormData (multipart — logo / images) or a
// plain object; the shared http client sets the Content-Type + CSRF header.
export async function createCompany(payload) {
  const { data } = await http.post("companies/", payload);
  return data;
}

// GET the category choices for a company type ("buyer" | "supplier"). Buyers and
// suppliers have different categories, so a type is always required.
export async function getCategoryChoices(type) {
  const { data } = await http.get("category-choices/", { params: { type } });
  return data;
}

// GET the industry choices for a company type ("buyer" | "supplier").
// Industry is required for BOTH types; the backend keys the list by `?type=`.
export async function getIndustryChoices(type) {
  const { data } = await http.get("industry-choices/", { params: { type } });
  return data;
}

// GET company-type-choices/ — the `type` enum (buyer / supplier …).
export async function getCompanyTypeChoices() {
  const { data } = await http.get("company-type-choices/");
  return data;
}

// GET supplier/type-choices/ — `supplier_type` enum (suppliers only).
export async function getSupplierTypeChoices() {
  const { data } = await http.get("supplier/type-choices/");
  return data;
}

// GET supplier/sub-category-choices/?type=<type>&industry=<industry> —
// `sub_category` enum (suppliers only; depends on the chosen industry).
export async function getSubCategoryChoices(type, industry) {
  const { data } = await http.get("supplier/sub-category-choices/", {
    params: { type, industry },
  });
  return data;
}

// POST companies/supplier-switch/?switch_permission=accept — switch a
// switch-enabled company (type_switch=true) to the other side:
//   to buyer:    { industry }                (buyer industry enum)
//   to supplier: { industry, sub_category }  (supplier enums, both required)
// `switch_permission` is accept (perform the switch) or cancel (ABORT it —
// nothing changes). It is NOT the direction: both directions send accept.
// (Sending cancel for "back to supplier" was a bug, found by the backend
// developer 2026-10-21; the backend also answered aborts with 200.)
export async function supplierSwitch(body) {
  const { data } = await http.post("companies/supplier-switch/", body, {
    params: { switch_permission: "accept" },
  });
  return data;
}

export function supplierSwitchErrorMessage(err, fallback) {
  const body = err?.response?.data;
  if (body && typeof body === "object") {
    const first = (v) => (Array.isArray(v) ? v[0] : v);
    return (
      first(body.detail) ||
      first(body.message) ||
      first(body.industry) ||
      first(body.sub_category) ||
      first(body.switch_permission) ||
      first(body.error) ||
      fallback
    );
  }
  return fallback;
}
