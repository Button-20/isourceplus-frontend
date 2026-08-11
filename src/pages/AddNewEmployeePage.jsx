import React, { useState, useEffect } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
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
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/contexts/app.context";
import { getCookie } from "@/utility/getCookie";

// No changes to validation function
const validateStoredData = (data, expectedKeys) => {
  if (!data || typeof data !== "object") return false;
  return expectedKeys.every((key) => Object.prototype.hasOwnProperty.call(data, key));
};

// No changes to component declaration
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

  const navigate = useNavigate()

  const location = useLocation();

  // Modified: Added showPassword and showConfirm states for toggle functionality
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // No changes to localStorage loading
  useEffect(() => {
    try {
      const storedValues = localStorage.getItem("addEmployeeFormValues");
      if (storedValues) {
        const parsedValues = JSON.parse(storedValues);
        const expectedKeys = ["email", "password", "confirm"];
        if (validateStoredData(parsedValues, expectedKeys)) {
          setEmail(parsedValues.email);
          setPassword(parsedValues.password);
          setConfirm(parsedValues.confirm);
          toast.info("Form data restored from previous session.");
        } else {
          console.warn("Invalid stored values in localStorage, skipping load.");
        }
      }
    } catch (err) {
      console.error("Failed to load form data from localStorage:", err);
      toast.error("Unable to restore form data. Local storage may be disabled.");
    }
  }, []);

  // No changes to handleEmailChange
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    try {
      localStorage.setItem(
        "addEmployeeFormValues",
        JSON.stringify({ email: value, password, confirm })
      );
    } catch (err) {
      console.error("Failed to save email to localStorage:", err);
      toast.error("Unable to save form data. Local storage may be disabled.");
    }
  };

  // No changes to handlePasswordChange
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    try {
      localStorage.setItem(
        "addEmployeeFormValues",
        JSON.stringify({ email, password: value, confirm })
      );
    } catch (err) {
      console.error("Failed to save password to localStorage:", err);
      toast.error("Unable to save form data. Local storage may be disabled.");
    }
  };

  // No changes to handleConfirmChange
  const handleConfirmChange = (e) => {
    const value = e.target.value;
    setConfirm(value);
    try {
      localStorage.setItem(
        "addEmployeeFormValues",
        JSON.stringify({ email, password, confirm: value })
      );
    } catch (err) {
      console.error("Failed to save confirm password to localStorage:", err);
      toast.error("Unable to save form data. Local storage may be disabled.");
    }
  };

  // Added: Toggle functions for password and confirm password visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmVisibility = () => {
    setShowConfirm((prev) => !prev);
  };

  // No changes to handleReset
  const handleReset = () => {
    setEmail("");
    setPassword("");
    setConfirm("");
    try {
      localStorage.removeItem("addEmployeeFormValues");
      toast.success("Form reset successfully.");
    } catch (err) {
      console.error("Failed to clear localStorage:", err);
      toast.error("Unable to reset form. Local storage may be disabled.");
    }
  };

  // No changes to handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();

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
      navigate('/company/employees')

      try {
        localStorage.removeItem("addEmployeeFormValues");
      } catch (err) {
        console.error("Failed to clear localStorage:", err);
        toast.error("Unable to clear form data. Local storage may be disabled.");
      }

      setEmail("");
      setPassword("");
      setConfirm("");
    } catch (err) {
      const data = err.response?.data || {};
      const message =
        data.detail ||
        data.error ||
        data.email?.[0] ||
        "Failed to create employee";
      toast.error(message);
      console.log(err);
    } finally {
      setProfileLoading(false);
    }
  };

  // No changes to commented-out loading state
  // if (profileLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 to-gray-800">
  //       <div className="flex flex-col items-center">
  //         <Loader2 className="animate-spin h-10 w-10 text-white mb-4" />
  //         <span className="text-white font-medium">
  //           Loading your dashboard...
  //         </span>
  //       </div>
  //     </div>
  //   );
  // }

  // No changes to access control
  const allowedTitles = ["logistics manager", "lead buyer", "sales manager"];

  if (!user || !token || !allowedTitles.includes(jobTitle)) {
    return <Navigate to="/login" replace />;
  }

  // Modified: Updated JSX to include show/hide password toggle with eye icons
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-gray-100 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gray-100 rounded-full opacity-20"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-blue-100 rounded-full opacity-20"></div>

        <div className="relative z-10">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-black mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-1" /> Back to Dashboard
          </button>

          <div className="flex items-center mb-6">
            <div className="p-3 bg-gray-100 rounded-lg mr-4">
              <UserPlus className="w-6 h-6 text-gray-600" />
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
            {/* Email - No changes */}
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
                onChange={handleEmailChange}
                required
                placeholder="employee@company.com"
                className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-gray-200 focus:border-gray-600 transition-all duration-200 shadow-xs"
              />
            </div>

            {/* Password - Modified: Added show/hide toggle with eye icon */}
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
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  placeholder="Minimum 8 characters"
                  className="w-full border border-gray-200 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-gray-200 focus:border-gray-500 transition-all duration-200 shadow-xs"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password - Modified: Added show/hide toggle with eye icon */}
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
              <div className="relative">
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={handleConfirmChange}
                  required
                  placeholder="Re-enter your password"
                  className="w-full border border-gray-200 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-gray-200 focus:border-gray-500 transition-all duration-200 shadow-xs"
                />
                <button
                  type="button"
                  onClick={toggleConfirmVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirm ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* No changes to button section */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleReset}
                disabled={profileLoading}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={profileLoading}
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:opacity-90 transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
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
            </div>
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