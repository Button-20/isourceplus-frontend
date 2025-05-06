import { useAuth } from "@/contexts/app.context";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export function ProtectedOnBoardingRoute() {
  const { user, token } = useAuth();
  const location = useLocation();

  if (!user || !token) {
    // redirect to login, but remember where we wanted to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export const ProtectedAuthRoute = () => {
  const location = useLocation();
  const { user, token } = useAuth();

  // 1️⃣ If we're on the signup page, always let it render
  if (location.pathname === "/signup") {
    return <Outlet />;
  }

  // 2️⃣ If already logged in, redirect back or to dashboard
  if (user && token) {
    const from = location.state?.from?.pathname || "/dashboard";

    return <Navigate to={from} replace />;
  }

  // 3️⃣ Otherwise (not logged-in, not /signup), show login/forgot/etc.
  return <Outlet />;
};
