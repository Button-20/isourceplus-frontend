import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import OrgSearchField from "@/components/reviews/OrgSearchField";
import { addClient, clientErrorMessage } from "@/services/api/clients.service";

// Pick an organisation (reviews org search) and add it as a client of the
// user's company / transporter — `orgKind` picks the endpoint.
export default function AddClientModal({
  open,
  onOpenChange,
  orgKind,
  noun = "client", // "client" (supplier side) | "supplier" (buyer side)
  onAdded,
}) {
  const [org, setOrg] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setOrg(null);
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    if (!org) return toast.error("Select an organization");
    setSaving(true);
    try {
      const res = await addClient(orgKind, org.name);
      toast.success(res?.message || `${org.name} added as a ${noun}`);
      onAdded?.(org, res);
      onOpenChange(false);
    } catch (err) {
      toast.error(clientErrorMessage(err, `Couldn't add ${noun}.`));
      console.error("Add client error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="font-montserrat sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a {noun}</DialogTitle>
          <DialogDescription>
            {noun === "supplier"
              ? "Search for the company or transporter you buy from."
              : "Search for the company or transporter you do business with."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Organization
            </label>
            <OrgSearchField value={org} onChange={setOrg} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !org}
              className="bg-brand-gradient text-brand-foreground hover:opacity-90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding…
                </>
              ) : (
                <>
                  <UserPlus className="mr-1.5 h-4 w-4" /> Add {noun}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
