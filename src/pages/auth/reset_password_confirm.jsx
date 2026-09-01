import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, KeyRound, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/common/Logo";
import { passwordResetConfirm } from "@/services/api/auth.service";

export function ResetPasswordConfirmPage() {
  const { uid, token } = useParams();
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!uid || !token) {
      toast.error("Invalid password reset link");
      navigate("/forgot-password");
    }
  }, [uid, token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword1 !== newPassword2) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await passwordResetConfirm({
        new_password1: newPassword1,
        new_password2: newPassword2,
        uid,
        token,
      });
      setSuccess(true);
      toast.success("Password has been reset successfully");
      setTimeout(() => navigate("/login"), 2500);
    } catch (error) {
      toast.error(
        error.response?.data?.new_password1?.[0] ||
          error.response?.data?.new_password2?.[0] ||
          error.response?.data?.token?.[0] ||
          error.response?.data?.uid?.[0] ||
          error.response?.data?.detail ||
          "Failed to reset password. The link may have expired.",
      );
    } finally {
      setLoading(false);
    }
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
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="font-display text-xl font-bold sm:text-2xl">
                Password reset
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Your password has been updated. Redirecting you to sign in…
              </p>
              <Button
                className="mt-6 w-full bg-brand-gradient text-brand-foreground hover:opacity-90"
                onClick={() => navigate("/login")}
              >
                Go to login
              </Button>
            </div>
          ) : (
            <div className="relative">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-brand-foreground">
                <KeyRound className="h-7 w-7" />
              </div>
              <h1 className="text-center font-display text-xl font-bold sm:text-2xl">
                Set a new password
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-center text-sm text-muted-foreground">
                Enter your new password twice to confirm it.
              </p>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div className="relative">
                  <Input
                    required
                    type={showPassword ? "text" : "password"}
                    name="new_password1"
                    value={newPassword1}
                    onChange={(e) => setNewPassword1(e.target.value)}
                    placeholder="New password"
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
                  required
                  type={showPassword ? "text" : "password"}
                  name="new_password2"
                  value={newPassword2}
                  onChange={(e) => setNewPassword2(e.target.value)}
                  placeholder="Confirm new password"
                />
                <Button
                  disabled={loading}
                  type="submit"
                  className="w-full bg-brand-gradient text-brand-foreground hover:opacity-90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting…
                    </>
                  ) : (
                    "Reset password"
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
