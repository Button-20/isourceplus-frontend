import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, ArrowLeft, UserPlus, Users, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/app.context";
import { getCookie } from "@/utility/getCookie";

export default function AddExistingEmployeePage() {
  const {
    authAxios,
    user,
    token,
    jobTitle,
    profileLoading,
    loading,
    setLoading,
  } = useAuth();

  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    setLoading(true);
    try {
      const csrfToken = getCookie("csrftoken");

      await authAxios.post(
        "/add-employee/",
        { email: email.trim() },
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-CSRFToken": csrfToken,
          },
        }
      );
      toast.success("✅ Existing user added as employee!");
      setEmail("");
    } catch (err) {
      const data = err.response?.data || {};
      const message =
        data.error ||
        data.detail ||
        data.email?.[0] ||
        "Failed to add existing user";
      toast.error(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

   if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-10 w-10 text-white mb-4" />
          <span className="text-white font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user || !token || jobTitle !== "logistics manager") {
    return <Navigate to="/login" replace />;
  }

   return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-gray-100 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-100 rounded-full opacity-20"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-gray-100 rounded-full opacity-20"></div>
        
        <div className="relative z-10">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-black mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-1" /> Back to Dashboard
          </button>

          <div className="flex items-center mb-6">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-medium text-gray-800">Add Existing Employee</h2>
              <p className="text-sm text-gray-500">Invite current users to your team</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1">
              <div className="flex items-center">
                <Mail className="w-4 h-4 text-gray-500 mr-2" />
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Employee Email
                </label>
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="team.member@company.com"
                className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 shadow-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                User must already have an account in the system
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-gray-600 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Adding Employee...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Add to Team
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
            <Link 
              to="/dashboard/employee/new/" 
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              <ArrowRight className="w-4 h-4 mr-1" />
              Create new employee instead
            </Link>
            
            <div className="flex items-center text-xs text-gray-500">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Admin access required
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
