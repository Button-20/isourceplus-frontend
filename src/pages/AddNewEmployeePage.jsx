import React, { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  ArrowRightToLine,
  UserPlus,
  Mail,
  Key,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { useAuth } from "@/contexts/app.context";
import { getCookie } from "@/utility/getCookie";

export default function AddNewEmployeePage() {
  const {
    authAxios,
    user,
    token,
    jobTitle,
    loading,
    setLoading,
    profileLoading,
    setProfileLoading,
  } = useAuth();

  const location = useLocation();

  // console.log("jobTitle", jobTitle);

  // ── Form state & loading
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // ── Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1) Basic validation
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!password) {
      toast.error("Password is required");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setProfileLoading(true);
    try {
      const csrfToken = getCookie("csrftoken");

      const response = await authAxios.post(
        "/add-employee/",
        {
          email: email.trim(),
          password,
          confirm_password: confirm,
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-CSRFToken": csrfToken,
          },
        }
      );
      toast.success(response.data.message || "✅ New employee created!");

      setEmail("");
      setPassword("");
      setConfirm("");
    } catch (err) {
      const data = err.response?.data || {};
      const message =
        data.detail ||
        data.email?.[0] ||
        data.password?.[0] ||
        data.confirm_password?.[0] ||
        "Failed to create employee";
      toast.error(message);
      console.log(err);
    } finally {
      setProfileLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-10 w-10 text-white mb-4" />
          <span className="text-white font-medium">
            Loading your dashboard...
          </span>
        </div>
      </div>
    );
  }

  if (!user || !token || jobTitle !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-gray-100 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-100 rounded-full opacity-20"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-blue-100 rounded-full opacity-20"></div>

        <div className="relative z-10">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-black mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-1" /> Back to Dashboard
          </button>

          <div className="flex items-center mb-6">
            <div className="p-3 bg-indigo-100 rounded-lg mr-4">
              <UserPlus className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-medium text-gray-800">
                Create New Employee
              </h2>
              <p className="text-sm text-gray-500">
                Add team members to your organization
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1">
              <div className="flex items-center">
                <Mail className="w-4 h-4 text-gray-500 mr-2" />
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Work Email
                </label>
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="employee@company.com"
                className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all duration-200 shadow-sm"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center">
                <Key className="w-4 h-4 text-gray-500 mr-2" />
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Minimum 8 characters"
                className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all duration-200 shadow-sm"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <div className="flex items-center">
                <Lock className="w-4 h-4 text-gray-500 mr-2" />
                <label
                  htmlFor="confirm"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
              </div>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Re-enter your password"
                className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all duration-200 shadow-sm"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={profileLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {profileLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Employee
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
            <Link
              to="/dashboard/employee/existing/"
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              <ArrowRightToLine className="w-4 h-4 mr-1" />
              Add existing employee
            </Link>

            <div className="flex items-center text-xs text-gray-500">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Admin privileges required
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
