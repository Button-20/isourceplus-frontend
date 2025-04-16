import { useAuth } from "@/contexts/app.context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { getCookie } from "@/utility/getCookie";
import axios from "axios";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get CSRF token from cookies
      let csrfToken = getCookie("csrftoken");

      const response = await axios.post(
        "http://127.0.0.1:8000/api/v1/account_auth/password/reset/",
        {
          email: email.trim(),
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
        toast.success("Password reset link sent to your email");
      }
    } catch (error) {
      console.error("Error sending password reset link:", error);
      const errorMessage =
        error.response?.data?.email?.[0] ||
        error.response?.data?.detail ||
        "Failed to send reset link. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendLink = async () => {
    setLoading(true);
    setError(null);

    try {
      let csrfToken = getCookie("csrftoken");
      const response = await axios.post(
        "http://127.0.0.1:8000/api/v1/account_auth/registration/resend-email/",
        {
          email: email.trim(),
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
        toast.success("Password reset link sent to your email");
      }
    } catch (error) {
      console.error("Error resending password reset link:", error);
      const errorMessage =
        error.response?.data?.email?.[0] ||
        error.response?.data?.detail ||
        "Failed to resend reset link. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Check your email</h1>
            <p className="text-gray-600">
              We've sent a password reset link to {email}. Please check your
              inbox and follow the instructions.
            </p>
          </div>
          <Button
            onClick={() => navigate("/login")}
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            Return to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Forgot password</h1>
          <p className="text-gray-600">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            required
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
          <Button
            disabled={loading}
            type="submit"
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
        {/* resend link */}
        <p className="text-sm text-gray-500 text-center">
          Didn't receive the email?{" "}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="text-black hover:underline"
          >
            Resend link
          </button>
        </p>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <div className="text-center text-sm">
          <Link to="/login" className="font-medium text-black hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
