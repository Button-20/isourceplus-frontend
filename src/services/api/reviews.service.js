// Reviews domain service. Endpoints under /api/v1/ (base URL resolved by the
// shared http client, which also attaches CSRF + cookies).

import http from "@/services/lib/http";

// GET reviews authored by the current organization.
export async function getOrganizationReviews() {
  const { data } = await http.get("reviews/");
  return data;
}

// GET every review across the platform.
export async function getAllReviews() {
  const { data } = await http.get("reviews/all-reviews/");
  return data;
}

// GET organizations matching a name, to choose one to review.
export async function searchOrganizationsToReview(query) {
  const { data } = await http.get("reviews/search-organisation-to-review/", {
    params: query ? { search: query } : undefined,
  });
  return data;
}

// POST a new review for an organization.
//   rating: int 1-5 (required)
//   comment: string (optional)
//   provided_content_type: "company" | "transporter" (required)
//   provided_object_id: uuid string (required)
export async function createReview({
  rating,
  comment,
  provided_content_type,
  provided_object_id,
}) {
  const { data } = await http.post("reviews/", {
    rating,
    comment,
    provided_content_type,
    provided_object_id,
  });
  return data;
}

// PATCH an existing review (rating and/or comment).
export async function updateReview(id, { rating, comment }) {
  const { data } = await http.patch(`reviews/${id}/`, { rating, comment });
  return data;
}

// DELETE a review.
export async function deleteReview(id) {
  const { data } = await http.delete(`reviews/${id}/`);
  return data;
}
