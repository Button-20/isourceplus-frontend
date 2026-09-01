import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { AlertCircle, Loader2, Check } from "lucide-react";
import { storage } from "@/services/lib/storage";

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
        const subscriptionData = storage.getJSON("subscriptionData", {});
        const { plan_code, start_date, authorization_url, plan_name, plan_type } = subscriptionData;

        if (!plan_code || !authorization_url) {
          throw new Error("Missing subscription data (plan_code or authorization_url).");
        }

        // Verify transaction
        console.log("Sending verification request with params:", {
          reference,
          plan_code,
          start_date,
          authorization_url,
        });

        const verifyResponse = await authAxios.get("/subscriptions/transaction/verify/", {
          params: {
            reference,
            plan_code,
            start_date,
            authorization_url,
          },
        });

        console.log("Transaction verification response:", verifyResponse.data);

        // Check if verification was successful
        // if (
        //   verifyResponse.status !== 200 ||
        //   !verifyResponse.data.status ||
        //   verifyResponse.data.data?.status !== "success"
        // ) {
        //   console.error("Transaction verification failed:", verifyResponse.data);
        //   throw new Error(
        //     verifyResponse.data.detail && verifyResponse.data.status !== true
        //       ? verifyResponse.data.detail
        //       : "Transaction verification failed."
        //   );
        // }

        // Create subscription
        console.log("Creating subscription with reference:", reference);
        const createResponse = await authAxios.post("/subscriptions/create/", null, {
          params: { reference },
        });

        console.log("Subscription creation response:", createResponse.data);

        if (createResponse.data.status === "success") {
          toast.success("Subscription created successfully!", {
            description: `You are now subscribed to the ${plan_name} (${plan_type}) plan.`,
          });
          // Clear stored data
          storage.remove("subscriptionData");
          setTimeout(() => navigate("/dashboard"), 2000); // Delay redirect for toast visibility
        } else {
          console.error("Subscription creation failed:", createResponse.data);
          throw new Error(createResponse.data.detail || "Failed to create subscription.");
        }
      } catch (error) {
        console.error("Subscription processing error:", error);
        console.error("Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        setError(error.message || "An error occurred during subscription processing.");
        toast.error(error.response.data.data.message || error.message || "Failed to process subscription.", {
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