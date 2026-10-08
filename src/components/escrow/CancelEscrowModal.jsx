import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, XCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  cancelPurchaseOrderEscrow,
  escrowErrorMessage,
} from "@/services/api/escrow.service";

// Buyer cancels a purchase order's escrow (before dispatch / auto-release),
// giving a reason. `onCancelled(escrow)` receives the updated escrow.
export default function CancelEscrowModal({
  open,
  onOpenChange,
  refNum,
  onCancelled,
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    const text = reason.trim();
    if (!text) return toast.error("Please give a reason for cancelling.");
    setSaving(true);
    try {
      const escrow = await cancelPurchaseOrderEscrow(refNum, text);
      toast.success("Escrow cancelled.");
      onCancelled?.(escrow);
      onOpenChange(false);
    } catch (err) {
      toast.error(escrowErrorMessage(err, "Couldn't cancel the escrow."));
      console.error("Cancel escrow error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="font-montserrat sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" /> Cancel escrow
          </DialogTitle>
          <DialogDescription>
            Cancelling stops this escrow before the goods are dispatched or the
            funds are auto-released. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label
              htmlFor="cancel_reason"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Reason
            </label>
            <Textarea
              id="cancel_reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Supplier can no longer meet the delivery date"
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Keep escrow
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={saving || !reason.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelling…
                </>
              ) : (
                "Cancel escrow"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
