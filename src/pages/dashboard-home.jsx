import { useAuth } from "@/contexts/app.context";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router";

export function DashBoardHome({}) {
  const {
    user,
    token,
    loading,
    jobTitle,
    setJobTitle,
  } = useAuth();

  const location = useLocation();

  if (!user && !token) {
    return <Navigate state={{ from: location }} to="/login" replace />;
  }



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/25">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  return (
    <div>
      <h1>Hello {user}</h1>
    </div>
  );
}
