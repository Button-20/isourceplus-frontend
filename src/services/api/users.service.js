// Users domain service. Reference example of the services/api pattern: plain
// async functions that call the shared `http` client and return response data.
// Other domains (companies, rfx, tenders, invoices, ...) follow this shape.

import http from "@/services/lib/http";

// The backend returns a paginated list; the current user is the first result.
export async function getCurrentUser() {
  const { data } = await http.get("users/");
  return data?.results?.[0] ?? null;
}

export async function getUserProfile(profileId) {
  const { data } = await http.get(`user-profiles/${profileId}/`);
  return data;
}

export async function updateUserProfile(profileId, payload) {
  const { data } = await http.patch(`user-profiles/${profileId}/`, payload);
  return data;
}
