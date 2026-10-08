import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  escrowErrorMessage,
  payPurchaseOrderFromEscrow,
} from "@/services/api/escrow.service";

// Confirm the inspected goods and pay the supplier from escrow (no input —
// release follows the inspection outcome). `onPaid(result)` runs on success.
export default function EscrowPayModal({ open, onOpenChange, refNum, onPaid }) {
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    setSaving(true);
    try {
      const result = await payPurchaseOrderFromEscrow(refNum);
      toast.success(result?.message || "Payment released from escrow.");
      onPaid?.(result);
      onOpenChange(false);
    } catch (err) {
      toast.error(escrowErrorMessage(err, "Couldn't release the payment."));
      console.error("Escrow pay error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="font-montserrat sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand" /> Pay from escrow
          </DialogTitle>
          <DialogDescription>
            Confirm the goods received note and release payment from escrow. The
            amount released follows your inspection — disputed quantities stay
            held. This completes the purchase order.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Not yet
          </Button>
          <Button
            onClick={confirm}
            disabled={saving}
            className="bg-brand-gradient text-brand-foreground hover:opacity-90"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Releasing…
              </>
            ) : (
              <>
                <ShieldCheck className="mr-1.5 h-4 w-4" /> Confirm & pay
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
