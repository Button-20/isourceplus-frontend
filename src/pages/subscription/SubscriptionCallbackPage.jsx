import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, Loader2, Check } from "lucide-react";

import {
  clearCheckout,
  completeSubscription,
  loadCheckout,
  subscriptionErrorMessage,
} from "@/services/api/subscriptions.service";

// Paystack returns here (?reference=…) after the payment the pricing page
// started with subscriptions/tranx/init/. Completing it creates the
// subscription (POST subscriptions/subscribe/).
export function SubscriptionCallbackPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // React StrictMode runs effects twice in dev; subscribe/ must run once.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const complete = async () => {
      try {
        const checkout = loadCheckout();
        const reference =
          searchParams.get("reference") ||
          searchParams.get("trxref") ||
          checkout.reference;
        if (!reference) {
          throw new Error("No payment reference was returned.");
        }
        if (!checkout.plan_code || !checkout.authorization_url) {
          throw new Error(
            "We couldn't find the plan you were paying for. Please start again from the pricing page.",
          );
        }

        await completeSubscription({
          authorizationUrl: checkout.authorization_url,
          planCode: checkout.plan_code,
          reference,
        });

        clearCheckout();
        const plan = checkout.plan_name
          ? `${checkout.plan_name.charAt(0)}${checkout.plan_name.slice(1).toLowerCase()}`
          : "";
        toast.success(
          checkout.is_trial ? "Your trial has started!" : "You're subscribed!",
          plan
            ? {
                description: `You're on the ${plan}${checkout.plan_type ? ` (${checkout.plan_type})` : ""} plan.`,
              }
            : undefined,
        );
        setTimeout(() => navigate("/dashboard/subscriptions"), 2000);
      } catch (err) {
        console.error("Subscription processing error:", err);
        const message = subscriptionErrorMessage(
          err,
          "We couldn't complete your subscription.",
        );
        setError(message);
        toast.error(message, { icon: <AlertCircle className="w-5 h-5" /> });
      } finally {
        setIsLoading(false);
      }
    };

    complete();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-xl p-6 shadow-lg border border-border max-w-md w-full text-center">
        {isLoading ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold">Processing your subscription…</h2>
            <p className="text-muted-foreground">
              Please wait while we confirm your payment.
            </p>
          </>
        ) : error ? (
          <>
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Subscription error</h2>
            <p className="text-muted-foreground">{error}</p>
            <button
              className="mt-4 px-4 py-2 bg-brand-gradient text-white rounded-md hover:opacity-90"
              onClick={() => navigate("/dashboard/subscriptions")}
            >
              Back to plans
            </button>
          </>
        ) : (
          <>
            <Check className="w-8 h-8 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Subscription successful</h2>
            <p className="text-muted-foreground">
              Taking you to your subscription…
            </p>
          </>
        )}
      </div>
    </div>
  );
}
