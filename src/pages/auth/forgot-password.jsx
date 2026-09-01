import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/common/Logo";
import { passwordResetRequest } from "@/services/api/auth.service";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const sendResetLink = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      await passwordResetRequest(email);
      setSuccess(true);
      toast.success("Password reset link sent to your email");
    } catch (error) {
      toast.error(
        error.response?.data?.email?.[0] ||
          error.response?.data?.detail ||
          "Failed to send reset link. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendResetLink();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4 font-montserrat">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo imgClassName="h-8" />
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand/10 blur-2xl" />

          {success ? (
            <div className="relative text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-brand-foreground">
                <MailCheck className="h-7 w-7" />
              </div>
              <h1 className="font-display text-xl font-bold sm:text-2xl">
                Check your email
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                We&apos;ve sent a password reset link to{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Follow the instructions in the email to reset your password.
              </p>
              <div className="mt-6 space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={sendResetLink}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resending…
                    </>
                  ) : (
                    "Resend link"
                  )}
                </Button>
                <Button
                  className="w-full bg-brand-gradient text-brand-foreground hover:opacity-90"
                  onClick={() => navigate("/login")}
                >
                  Return to login
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-brand-foreground">
                <Mail className="h-7 w-7" />
              </div>
              <h1 className="text-center font-display text-xl font-bold sm:text-2xl">
                Forgot password
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-center text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a link to reset your
                password.
              </p>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
                  className="w-full bg-brand-gradient text-brand-foreground hover:opacity-90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
