// pages/EmailVerificationPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/app.context";
import { getCookie } from "@/utility/getCookie";

const EmailVerificationPage = () => {
  const { authAxios } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { BASE_URL } = useAuth();

  const csrfToken = getCookie("csrftoken");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      await authAxios.post(
        `${BASE_URL}account_auth/registration/resend-email-verification-link/`,
        { email: email.trim() },
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-CSRFToken": csrfToken,
          },
        }
      );
      toast.success("Verification link sent! Check your inbox.");
      // navigate to “check your email” screen or leave here
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to send link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-xs w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2.5 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Sending…
              </>
            ) : (
              "Send Verification Link"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
