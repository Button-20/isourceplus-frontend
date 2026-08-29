import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, ArrowLeft, UserPlus, Users, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/app.context";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

export default function AddExistingEmployeePage() {
  const { authAxios, user, token, jobTitle, profileLoading, loading, setLoading } =
    useAuth();
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Email is required");
    setLoading(true);
    try {
      await authAxios.post("/add-employee/", { email: email.trim() });
      toast.success("Existing user added as employee!");
      setEmail("");
    } catch (err) {
      const data = err.response?.data || {};
      toast.error(
        data.error || data.detail || data.email?.[0] || "Failed to add existing user",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!user || !token || jobTitle !== "logistics manager") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <Users className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold">
                Add existing employee
              </h1>
              <p className="mt-1 text-sm text-white/85">
                Invite a current iSource+ user to your team.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="border-white/40 bg-white/10 text-brand-foreground hover:bg-white/20"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-border/70 bg-card p-6"
      >
        <div>
          <label className={labelClass}>Employee email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="team.member@company.com"
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">
            User must already have an account in the system.
          </p>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-gradient text-brand-foreground hover:opacity-90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding…
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" /> Add to team
            </>
          )}
        </Button>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Link
            to="/dashboard/employee/new"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
          >
            <ArrowRight className="h-4 w-4" /> Create new employee instead
          </Link>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3" /> Admin access required
          </span>
        </div>
      </form>
    </div>
  );
}
