import { useAuth } from "@/contexts/app.context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import axios from "axios";
import { getCookie } from "@/utility/getCookie";

export function ResetPasswordConfirmPage() {
  const { BASE_URL } = useAuth();
  const { uid, token } = useParams();
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [displayPassword, setDisplayPassword] = useState(false);
  const navigate = useNavigate();

  // Verify we have the required params when component mounts
  useEffect(() => {
    if (!uid || !token) {
      toast.error("Invalid password reset link");
      navigate("/forgot-password");
    }
  }, [uid, token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (newPassword1 !== newPassword2) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      // Get CSRF token from cookies
      let csrfToken = getCookie("csrftoken");

      const response = await axios.post(
        `${BASE_URL}account_auth/password/reset/confirm/`,
        {
          uid,
          token,
          new_password1: newPassword1,
          new_password2: newPassword2,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(csrfToken && { "X-CSRFToken": csrfToken }),
          },
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        setSuccess(true);
        toast.success("Password has been reset successfully");
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.new_password1?.[0] ||
        error.response?.data?.new_password2?.[0] ||
        error.response?.data?.token?.[0] ||
        error.response?.data?.uid?.[0] ||
        error.response?.data?.detail ||
        "Failed to reset password. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setDisplayPassword(!displayPassword);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Password Reset Successful</h1>
            <p className="text-gray-600">
              Your password has been updated successfully. You'll be redirected to
              the login page shortly.
            </p>
          </div>
          <Button
            onClick={() => navigate("/login")}
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Set New Password</h1>
          <p className="text-gray-600">
            Please enter your new password twice so we can verify you typed it in
            correctly.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="relative">
            <Input
              required
              type={displayPassword ? "text" : "password"}
              name="new_password1"
              value={newPassword1}
              onChange={(e) => setNewPassword1(e.target.value)}
              placeholder="New password"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-3 text-gray-500"
            >
              {displayPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          
          <div className="relative">
            <Input
              required
              type={displayPassword ? "text" : "password"}
              name="new_password2"
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-3 text-gray-500"
            >
              {displayPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          <Button
            disabled={loading}
            type="submit"
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      </div>
    </div>
  );
}