import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthBrandPanel, { AuthBrandHeader } from "@/components/auth/AuthBrandPanel";
import {
  GoogleLogo,
  LinkedInLogo,
} from "@/components/auth/BrandIcons";
import { useAuth } from "@/services/context/app.context";

// Social sign-in (auth/{provider}/) and enterprise single sign-on
// (account_auth/sso/redirect/default/), both handed off through the backend.
function SocialButtons() {
  const { socialLogin, ssoLogin } = useAuth();
  const [busy, setBusy] = useState("");
  const go = async (provider, label) => {
    setBusy(provider);
    try {
      await (provider === "sso" ? ssoLogin() : socialLogin(provider, label));
    } finally {
      setBusy("");
    }
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          type="button"
          disabled={Boolean(busy)}
          onClick={() => go("linkedin", "LinkedIn")}
        >
          <LinkedInLogo />
          <span className="ml-1.5 hidden sm:inline">LinkedIn</span>
        </Button>
        <Button
          variant="outline"
          type="button"
          disabled={Boolean(busy)}
          onClick={() => go("google", "Google")}
        >
          <GoogleLogo />
          <span className="ml-1.5 hidden sm:inline">Google</span>
        </Button>
      </div>
      <Button
        variant="outline"
        type="button"
        className="w-full"
        disabled={Boolean(busy)}
        onClick={() => go("sso")}
      >
        <Building2 className="h-4 w-4" />
        <span className="ml-1.5">Company single sign-on (SSO)</span>
      </Button>
    </div>
  );
}

// Second step of a 2FA login: the authenticator app's code, or a backup code.
function TwoFactorStep({ pendingToken, onBack }) {
  const { completeTwoFactorLogin, loading, error } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [useBackup, setUseBackup] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await completeTwoFactorLogin(pendingToken, code, navigate);
    } catch (err) {
      // The pending token lasts 5 minutes; once it's expired the password
      // step has to be redone. Other errors show via the context's toast.
      if (err?.response?.status === 401) onBack();
    }
  };

  return (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <ShieldCheck className="h-5 w-5" />
      </span>
      <h1 className="mt-4 font-display text-2xl font-bold">
        Two-step verification
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {useBackup
          ? "Enter one of your backup codes. Each code works once."
          : "Enter the 6-digit code from your authenticator app."}
      </p>

      <form className="mt-6 space-y-4" onSubmit={submit}>
        <Input
          name="code"
          value={code}
          onChange={(e) =>
            setCode(
              useBackup ? e.target.value : e.target.value.replace(/\D/g, ""),
            )
          }
          placeholder={useBackup ? "Backup code" : "123456"}
          inputMode={useBackup ? "text" : "numeric"}
          autoComplete="one-time-code"
          maxLength={useBackup ? 16 : 6}
          autoFocus
          required
          className="text-center text-lg tracking-[0.3em]"
        />
        <Button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full bg-brand-gradient text-brand-foreground hover:opacity-90"
        >
          {loading ? "Verifying..." : "Verify and sign in"}
        </Button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-destructive">
          {typeof error === "string" ? error : "An error occurred"}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <button
          type="button"
          onClick={() => {
            setUseBackup((v) => !v);
            setCode("");
          }}
          className="text-brand hover:underline"
        >
          {useBackup ? "Use authenticator code" : "Use a backup code"}
        </button>
      </div>
    </>
  );
}

function Divider({ children }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">
          {children}
        </span>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Set when the account has 2FA on (from the password step, or handed over
  // by the SSO callback).
  const [pendingToken, setPendingToken] = useState(
    location.state?.twoFactor?.pendingToken || "",
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await login(email, password, navigate);
      if (res?.twoFactorRequired) setPendingToken(res.pendingToken);
    } catch {
      /* error surfaced via context toast + error state */
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandPanel
        title="Welcome back to iSourcePlus"
        subtitle="Sign in to manage your quotes, tenders, orders, and payments — all in one secure workspace."
      />

      <div className="flex flex-col p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            New here?
            <Button variant="ghost" size="sm" onClick={() => navigate("/signup")}>
              Sign up <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          <AuthBrandHeader />
          {pendingToken ? (
            <TwoFactorStep
              pendingToken={pendingToken}
              onBack={() => {
                setPendingToken("");
                setPassword("");
              }}
            />
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold">Sign in</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email and password to continue.
              </p>

              <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                <Input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-brand hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-gradient text-brand-foreground hover:opacity-90"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              {error && (
                <p className="mt-3 text-sm text-destructive">
                  {typeof error === "string" ? error : "An error occurred"}
                </p>
              )}

              <Divider>or continue with</Divider>
              <SocialButtons />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function SignUpPage() {
  const { signup, loading, error } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      await signup(email, password1, password2, navigate);
    } catch {
      /* error surfaced via context toast + error state */
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandPanel
        title="Start sourcing with iSourcePlus"
        subtitle="Create your account to connect with verified buyers and suppliers and run your procurement end to end."
      />

      <div className="flex flex-col p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            Have an account?
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Sign in <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8">
          <AuthBrandHeader />
          <h1 className="font-display text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email and choose a password to get started.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSignUp}>
            <Input
              type="email"
              name="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password1"
                placeholder="Create a password"
                value={password1}
                onChange={(e) => setPassword1(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <Input
              type={showPassword ? "text" : "password"}
              name="password2"
              placeholder="Confirm your password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-gradient text-brand-foreground hover:opacity-90"
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          {error && (
            <p className="mt-3 text-sm text-destructive">
              {typeof error === "string" ? error : "An error occurred"}
            </p>
          )}

          <Divider>or continue with</Divider>
          <SocialButtons />

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="text-brand hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-brand hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
