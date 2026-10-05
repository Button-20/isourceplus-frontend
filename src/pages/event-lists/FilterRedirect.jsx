import { Navigate, useLocation } from "react-router-dom";

// Old per-filter URLs (/dashboard/rfxs/issued, …/published, …/expired,
// /dashboard/business-offers/rfx, …) now live as tabs on one page. Redirect to
// `${to}?<param>=<filter>`, keeping other query params (?new=1, ?event=…).
export default function FilterRedirect({ to, filter, param = "filter" }) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  params.set(param, filter);
  return <Navigate to={`${to}?${params.toString()}`} replace />;
}
