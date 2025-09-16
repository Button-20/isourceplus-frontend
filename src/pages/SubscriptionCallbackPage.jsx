// pages/SubscriptionCallbackPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { AlertCircle, Loader2 } from "lucide-react";

// NEW ADDITION: Full component for handling Paystack callback
export function SubscriptionCallbackPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authAxios } = useAuth();

  useEffect(() => {
    const verifyAndCreateSubscription = async () => {
      try {
        const reference = searchParams.get("reference");
        if (!reference) {
          throw new Error("No transaction reference provided.");
        }

        // Retrieve stored subscription data
        const subscriptionData = JSON.parse(localStorage.getItem("subscriptionData") || "{}");
        const { plan_code, start_date, authorization_url } = subscriptionData;

        if (!plan_code || !authorization_url) {
          throw new Error("Missing subscription data.");
        }

        // Verify transaction
        const verifyResponse = await authAxios.get("/subscriptions/verify/", {
          params: {
            reference,
            plan_code,
            start_date,
            authorization_url,
          },
        });

        if (verifyResponse.data.status !== "success") {
          throw new Error("Transaction verification failed.");
        }

        // Create subscription
        const createResponse = await authAxios.post("/subscriptions/create/", null, {
          params: { reference },
        });

        if (createResponse.data.status === "success") {
          toast.success("Subscription created successfully!", {
            description: `You are now subscribed to the ${subscriptionData.plan_name} plan.`,
          });
          // Clear stored data
          localStorage.removeItem("subscriptionData");
          navigate("/dashboard");
        } else {
          throw new Error("Failed to create subscription.");
        }
      } catch (error) {
        setError(error.message || "An error occurred during subscription processing.");
        toast.error(error.message || "Failed to process subscription.", {
          icon: <AlertCircle className="w-5 h-5" />,
        });
      } finally {
        setIsLoading(false);
      }
    };

    verifyAndCreateSubscription();
  }, [authAxios, navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 max-w-md w-full text-center">
        {isLoading ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold">Processing your subscription...</h2>
            <p className="text-gray-600">Please wait while we verify your payment.</p>
          </>
        ) : error ? (
          <>
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Subscription Error</h2>
            <p className="text-gray-600">{error}</p>
            <button
              className="mt-4 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
              onClick={() => navigate("/dashboard")}
            >
              Return to Dashboard
            </button>
          </>
        ) : (
          <>
            <Check className="w-8 h-8 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Subscription Successful</h2>
            <p className="text-gray-600">You will be redirected to your dashboard shortly.</p>
          </>
        )}
      </div>
    </div>
  );
}