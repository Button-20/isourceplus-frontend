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
