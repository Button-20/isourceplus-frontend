import { Navigate, useLocation } from "react-router-dom";

// Old per-filter URLs (/dashboard/rfxs/issued, …/published, …/expired,
// /dashboard/business-offers/rfx, …) now live as tabs on one page. Redirect to
// `${to}?<param>=<filter>`, keeping other query params (?new=1, ?event=…).
// `extra` sets further params (e.g. { type: "proforma" } for /invoices).
export default function FilterRedirect({
  to,
  filter,
  param = "filter",
  extra = {},
}) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  if (filter) params.set(param, filter);
  Object.entries(extra).forEach(([k, v]) => params.set(k, v));
  return <Navigate to={`${to}?${params.toString()}`} replace />;
}
