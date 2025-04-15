import { useAuth } from "@/contexts/app.context";
import { Navigate, Outlet, useLocation } from "react-router-dom";


export function ProtectedOnBoardingRoute() {
    const {user,token} = useAuth();

     

    if (!user || !token) {
        return <Navigate to="/login" replace />;
    }


    return <Outlet />
}


export const ProtectedAuthRoute = () => {
    const location = useLocation()
    const {user,token} = useAuth();

   
    if (user && token) {
        return <Navigate to="/onboarding" state={{ from: location }} replace />;
    }

    return <Outlet />;
}