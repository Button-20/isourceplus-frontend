import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Banknote, Landmark, Loader2, Smartphone, Wallet } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MANUAL_PAYMENT_METHODS,
  escrowErrorMessage,
  payPurchaseOrderManually,
} from "@/services/api/escrow.service";

const METHOD_META = {
  MoMo: { icon: Smartphone, hint: "e.g. MTN ref 1234567890" },
  Bank: { icon: Landmark, hint: "e.g. GCB/TXN/2026/10/0001234" },
  Cash: { icon: Banknote, hint: "e.g. receipt number RCPT-0042" },
};

// Record a manual payment for a purchase order without escrow (MoMo, bank or
// cash, plus its reference). `onPaid(result)` runs on success.
export default function ManualPayModal({ open, onOpenChange, refNum, onPaid }) {
  const [method, setMethod] = useState("MoMo");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMethod("MoMo");
    setReference("");
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    const ref = reference.trim();
    if (!ref) return toast.error("Please enter the payment reference.");
    setSaving(true);
    try {
      const result = await payPurchaseOrderManually(refNum, {
        payment_method: method,
        payment_ref: ref,
      });
      toast.success(result?.message || "Payment recorded.");
      onPaid?.(result);
      onOpenChange(false);
    } catch (err) {
      toast.error(escrowErrorMessage(err, "Couldn't record the payment."));
      console.error("Manual pay error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="font-montserrat sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-brand" /> Record payment
          </DialogTitle>
          <DialogDescription>
            Confirm the goods received note and record how you paid the
            supplier. This completes the purchase order.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <span className="mb-1 block text-sm font-medium text-foreground">
              Payment method
            </span>
            <div className="grid grid-cols-3 gap-2">
              {MANUAL_PAYMENT_METHODS.map((m) => {
                const Icon = METHOD_META[m]?.icon ?? Wallet;
                const active = method === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-sm font-medium transition-colors",
                      active
                        ? "border-brand bg-brand/10 text-foreground"
                        : "border-border/70 text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", active && "text-brand")} />
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="manual_payment_ref"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Payment reference
            </label>
            <Input
              id="manual_payment_ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={METHOD_META[method]?.hint}
              maxLength={128}
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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !reference.trim()}
              className="bg-brand-gradient text-brand-foreground hover:opacity-90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Recording…
                </>
              ) : (
                <>
                  <Wallet className="mr-1.5 h-4 w-4" /> Record payment
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
