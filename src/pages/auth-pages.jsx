import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Mail } from "lucide-react";
import { FaFacebook, FaLinkedin } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/common/Logo";
import AuthBrandPanel from "@/components/auth/AuthBrandPanel";
import { useAuth } from "@/services/context/app.context";

function SocialButtons({ onGoogle }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Button variant="outline" type="button">
        <FaLinkedin className="text-[#0077B5]" />
        <span className="ml-1.5 hidden sm:inline">LinkedIn</span>
      </Button>
      <Button variant="outline" type="button" onClick={onGoogle}>
        <Mail className="h-4 w-4" />
        <span className="ml-1.5 hidden sm:inline">Google</span>
      </Button>
      <Button variant="outline" type="button">
        <FaFacebook className="text-[#1877F2]" />
        <span className="ml-1.5 hidden sm:inline">Facebook</span>
      </Button>
    </div>
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
  const { login, loading, error, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    await login(email, password, navigate);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandPanel
        title="Welcome back to iSource+"
        subtitle="Sign in to manage your quotes, tenders, orders, and payments — all in one secure workspace."
      />

      <div className="flex flex-col p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Logo imgClassName="h-8" />
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Connect - Source - Pay
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            New here?
            <Button variant="ghost" size="sm" onClick={() => navigate("/signup")}>
              Sign up <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
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
          <SocialButtons onGoogle={googleLogin} />
        </div>
      </div>
    </div>
  );
}

export function SignUpPage() {
  const { signup, loading, error, googleLogin } = useAuth();
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
        title="Start sourcing with iSource+"
        subtitle="Create your account to connect with verified buyers and suppliers and run your procurement end to end."
      />

      <div className="flex flex-col p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Logo imgClassName="h-8" />
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Connect - Source - Pay
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            Have an account?
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Sign in <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8">
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
          <SocialButtons onGoogle={googleLogin} />

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
