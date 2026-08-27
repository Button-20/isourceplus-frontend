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

// GET the industry choices for a given category. Suppliers pick an industry
// (which then maps to `field`); buyers don't use this.
export async function getIndustryChoices(category) {
  const { data } = await http.get("industry-choices/", {
    params: { category },
  });
  return data;
}
