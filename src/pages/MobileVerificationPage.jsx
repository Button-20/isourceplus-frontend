// pages/MobileVerificationPage.jsx — branded OTP / phone-verification step.
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Smartphone, ShieldCheck } from "lucide-react";

import { useAuth } from "@/services/context/app.context";
import Logo from "@/components/common/Logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CODE_LENGTH = 6;

const MobileVerificationPage = () => {
  const { authAxios } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(60);
  const phoneNumber = searchParams.get("phone");
  // Where to go after a successful verification. Defaults to the profile step;
  // the profile form passes the next onboarding step here so the user continues
  // forward instead of looping back. Guarded to internal paths only.
  const redirectParam = searchParams.get("redirect");
  const redirectTo =
    redirectParam && /^\/(?!\/)/.test(redirectParam)
      ? redirectParam
      : "/onboarding/user";

  // Countdown that re-enables the "resend" action.
  const startCountdown = () => {
    setResendDisabled(true);
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return timer;
  };

  useEffect(() => {
    const timer = startCountdown();
    return () => clearInterval(timer);
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length < CODE_LENGTH) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    try {
      await authAxios.post("mobile-verification/", {
        phone: phoneNumber,
        code,
      });
      toast.success("Phone number verified successfully!");
      navigate(redirectTo);
    } catch (error) {
      toast.error(error.response?.data?.error || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendDisabled(true);
    try {
      await authAxios.get(
        `send-verification-code/?phone=${encodeURIComponent(phoneNumber)}`,
      );
      toast.success("Verification code resent!");
      startCountdown();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend code");
      setResendDisabled(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 font-montserrat">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8 sm:py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Logo imgClassName="h-8" />
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </div>

        {/* Centered card */}
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand/10 blur-2xl" />

              <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-brand-foreground">
                <Smartphone className="h-7 w-7" />
              </div>

              <h1 className="text-center font-display text-xl font-bold sm:text-2xl">
                Verify your phone number
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-center text-sm text-muted-foreground">
                Enter the 6-digit code we sent to{" "}
                <span className="font-medium text-foreground">
                  {phoneNumber || "your phone"}
                </span>
                .
              </p>

              <form onSubmit={handleVerify} className="mt-6 space-y-4">
                <label htmlFor="code" className="sr-only">
                  Verification code
                </label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) =>
                    setCode(
                      e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH),
                    )
                  }
                  placeholder="••••••"
                  className="h-14 text-center text-2xl font-semibold tracking-[0.5em]"
                />

                <Button
                  type="submit"
                  disabled={loading || code.length < CODE_LENGTH}
                  className="w-full bg-brand-gradient text-brand-foreground hover:opacity-90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…
                    </>
                  ) : (
                    "Verify phone number"
                  )}
                </Button>
              </form>

              <div className="mt-5 text-center text-sm">
                {resendDisabled ? (
                  <span className="text-muted-foreground">
                    Didn&apos;t get it? Resend in{" "}
                    <span className="font-medium text-foreground">
                      {countdown}s
                    </span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="font-medium text-brand hover:underline"
                  >
                    Resend verification code
                  </button>
                )}
              </div>

              <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                Your number is kept private and secure.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileVerificationPage;
