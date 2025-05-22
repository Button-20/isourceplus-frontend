import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
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
  } = useAuth();

  const location = useLocation();

  console.log("jobTitle", jobTitle);

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

    setLoading(true);
    try {
      
      const csrfToken = getCookie("csrftoken");
      
      await authAxios.post("/add-employee/", {
        email: email.trim(),
        password,
        confirm_password: confirm,
      },{
        headers: {
          "Content-Type": "multipart/form-data",
          "X-CSRFToken": csrfToken,
        },
      });
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
      console.log(err)
    } finally {
      setLoading(false);
    }
  };

 if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/25">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  // 2) Now you can safely guard on auth & role
  if (!user || !token || jobTitle !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <button
          onClick={() => window.history.back()}
          className="flex items-center text-gray-600 hover:text-black mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-1" /> Back
        </button>

        <h2 className="text-2xl font-bold mb-4">Create New Employee</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="employee@example.com"
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter password"
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="Re-enter password"
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-md font-medium hover:bg-black/65 transition flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Creating…
              </>
            ) : (
              "Create Employee"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
