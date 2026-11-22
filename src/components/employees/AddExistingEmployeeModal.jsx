import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
import { apiErrorMessage } from "@/services/lib/api-error";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

/** Add an already-registered user to the company by email only. */
export default function AddExistingEmployeeModal({ open, onOpenChange, onAdded }) {
  const { authAxios } = useAuth();
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);

  const close = (o) => {
    onOpenChange(o);
    if (!o) setEmail("");
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Email is required");
    setAdding(true);
    try {
      const res = await authAxios.post("/add-employee/", { email: email.trim() });
      toast.success(res.data?.message || "Existing user added!");
      onAdded?.();
      close(false);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to add existing user"));
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="font-montserrat sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add existing employee</DialogTitle>
          <DialogDescription>
            Add a user who already has an iSourcePlus account to your team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className={labelClass}>Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="team.member@company.com"
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
                "Add"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
