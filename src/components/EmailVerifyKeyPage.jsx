// pages/EmailVerifyKeyPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/app.context";
import { getCookie } from "@/utility/getCookie";

const EmailVerifyKeyPage = () => {
  const { authAxios, BASE_URL } = useAuth();
  const { key } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const csrfToken = getCookie("csrftoken");
    console.log("csrftoken", csrfToken);

    const verifyEmail = async () => {
      try {
        await authAxios.post(
          `${BASE_URL}account_auth/registration/verify-email/`,
          { key },
          {
            headers: {
              "Content-Type": "multipart/form-data",
              "X-CSRFToken": csrfToken,
            },
          }
        );
        toast.success("Email successfully verified!");
        navigate("/onboarding/user");
      } catch (err) {
        toast.error(err.response?.data?.detail || "Verification failed");
        setLoading(false);
      }
    };
    verifyEmail();
  }, [authAxios, key, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-sm w-full max-w-md text-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-black mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>

        {loading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="animate-spin h-6 w-6 mb-4" />
            <p className="text-gray-700">Verifying your email…</p>
          </div>
        ) : (
          <p className="text-red-600">
            There was a problem verifying your email.
          </p>
        )}
      </div>
    </div>
  );
};

export default EmailVerifyKeyPage;
