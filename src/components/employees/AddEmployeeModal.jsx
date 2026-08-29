import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

import { useAuth } from "@/services/context/app.context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

/** Create-account modal for a new employee (email + password + confirm). */
export default function AddEmployeeModal({ open, onOpenChange, onAdded }) {
  const { authAxios } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [adding, setAdding] = useState(false);

  const close = (o) => {
    onOpenChange(o);
    if (!o) {
      setForm({ email: "", password: "", confirm: "" });
      setShowPassword(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) return toast.error("Email is required");
    if (!form.password) return toast.error("Password is required");
    if (form.password !== form.confirm)
      return toast.error("Passwords do not match");
    setAdding(true);
    try {
      const res = await authAxios.post("/add-employee/", {
        email: form.email.trim(),
        password: form.password,
        confirm_password: form.confirm,
      });
      toast.success(res.data?.message || "Employee added!");
      onAdded?.();
      close(false);
    } catch (err) {
      const data = err.response?.data || {};
      toast.error(
        data.detail || data.error || data.email?.[0] || "Failed to add employee",
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="font-montserrat sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add employee</DialogTitle>
          <DialogDescription>
            Create an account for a new team member. They&apos;ll sign in with
            this email and password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className={labelClass}>Work email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="employee@company.com"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
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
            <Input
              type={showPassword ? "text" : "password"}
              value={form.confirm}
              onChange={(e) =>
                setForm((f) => ({ ...f, confirm: e.target.value }))
              }
              placeholder="Re-enter password"
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => close(false)}
              disabled={adding}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={adding}
              className="bg-brand-gradient text-brand-foreground hover:opacity-90"
            >
              {adding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding…
                </>
              ) : (
                "Add employee"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
