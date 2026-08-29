import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  ArrowRightToLine,
  UserPlus,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/contexts/app.context";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

const validateStoredData = (data, expectedKeys) => {
  if (!data || typeof data !== "object") return false;
  return expectedKeys.every((key) =>
    Object.prototype.hasOwnProperty.call(data, key),
  );
};

export default function AddNewEmployeePage() {
  const { authAxios, user, token, jobTitle, profileLoading, setProfileLoading } =
    useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    try {
      const storedValues = localStorage.getItem("addEmployeeFormValues");
      if (storedValues) {
        const parsedValues = JSON.parse(storedValues);
        if (validateStoredData(parsedValues, ["email", "password", "confirm"])) {
          setEmail(parsedValues.email);
          setPassword(parsedValues.password);
          setConfirm(parsedValues.confirm);
          toast.info("Form data restored from previous session.");
        }
      }
    } catch (err) {
      console.error("Failed to load form data from localStorage:", err);
    }
  }, []);

  const persist = (next) => {
    try {
      localStorage.setItem("addEmployeeFormValues", JSON.stringify(next));
    } catch (err) {
      console.error("Failed to save form data to localStorage:", err);
    }
  };

  const handleReset = () => {
    setEmail("");
    setPassword("");
    setConfirm("");
    try {
      localStorage.removeItem("addEmployeeFormValues");
      toast.success("Form reset successfully.");
    } catch (err) {
      console.error("Failed to clear localStorage:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Email is required");
    if (!password) return toast.error("Password is required");
    if (password !== confirm) return toast.error("Passwords do not match");

    setProfileLoading(true);
    try {
      const response = await authAxios.post("/add-employee/", {
        email: email.trim(),
        password,
        confirm_password: confirm,
      });
      toast.success(response.data.message || "New employee created!");
      try {
        localStorage.removeItem("addEmployeeFormValues");
      } catch (err) {
        console.error("Failed to clear localStorage:", err);
      }
      setEmail("");
      setPassword("");
      setConfirm("");
      navigate("/dashboard/company/employees");
    } catch (err) {
      const data = err.response?.data || {};
      toast.error(
        data.detail || data.error || data.email?.[0] || "Failed to create employee",
      );
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const allowedTitles = ["logistics manager", "lead buyer", "sales manager"];
  if (!user || !token || !allowedTitles.includes(jobTitle)) {
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
              <UserPlus className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold">
                Create new employee
              </h1>
              <p className="mt-1 text-sm text-white/85">
                Add a team member to your organization.
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
          <label className={labelClass}>Work email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              persist({ email: e.target.value, password, confirm });
            }}
            placeholder="employee@company.com"
            required
          />
        </div>
        <div>
          <label className={labelClass}>Password</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                persist({ email, password: e.target.value, confirm });
              }}
              placeholder="Minimum 8 characters"
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
        </div>
        <div>
          <label className={labelClass}>Confirm password</label>
          <div className="relative">
            <Input
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                persist({ email, password, confirm: e.target.value });
              }}
              placeholder="Re-enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={profileLoading}
            className="flex-1"
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={profileLoading}
            className="flex-1 bg-brand-gradient text-brand-foreground hover:opacity-90"
          >
            {profileLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" /> Create employee
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Link
            to="/dashboard/employee/existing"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
          >
            <ArrowRightToLine className="h-4 w-4" /> Add existing employee
          </Link>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3" /> Admin privileges required
          </span>
        </div>
      </form>
    </div>
  );
}
