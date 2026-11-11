// The backend's social-login callback (exchange-token/callback/) sends the
// browser here with a one-time ?code=, traded for the session via
// account_auth/social/exchange/. A 2FA account continues on the sign-in page's
// code step.
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/services/context/app.context";
import { twoFactorErrorMessage } from "@/services/api/two-factor.service";

export function SocialCallbackPage() {
  const { completeSocialLogin } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState("");
  // The code is single-use; StrictMode would run the effect twice in dev.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const providerError =
      params.get("error") === "access_denied"
        ? "You cancelled the sign-in."
        : params.get("error_description") || params.get("error");
    const code = params.get("code");
    if (providerError || !code) {
      setError(
        providerError ||
          "The sign-in link is missing its code. Please try signing in again.",
      );
      return;
    }

    completeSocialLogin(code, navigate)
      .then((res) => {
        if (res?.twoFactorRequired)
          navigate("/login", {
            replace: true,
            state: { twoFactor: { pendingToken: res.pendingToken } },
          });
      })
      .catch((err) => {
        console.error("Social sign-in error:", err);
        setError(
          twoFactorErrorMessage(
            err,
            "We couldn't sign you in. The link may have expired — please try again.",
            "Social sign-in isn't available on the server yet.",
          ),
        );
      });
  }, [completeSocialLogin, navigate, params]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-montserrat">
      <div className="w-full max-w-sm rounded-2xl border border-border/70 bg-card p-6 text-center">
        {error ? (
          <>
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <h1 className="mt-3 font-display text-lg font-semibold">
              Sign-in failed
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button
              asChild
              className="mt-5 bg-brand-gradient text-brand-foreground hover:opacity-90"
            >
              <Link to="/login" replace>
                Back to sign in
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand" />
            <h1 className="mt-3 font-display text-lg font-semibold">
              Signing you in…
            </h1>
          </>
        )}
      </div>
    </div>
  );
}
