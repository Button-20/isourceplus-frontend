import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Smartphone, CreditCard, Wallet } from "lucide-react";

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
import { cn } from "@/lib/utils";
import {
  fundPurchaseOrderEscrow,
  PAYMENT_METHODS,
} from "@/services/api/escrow.service";
import { apiErrorMessage } from "@/services/lib/api-error";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

// Icon + helper text per payment channel.
const METHOD_META = {
  MoMo: { icon: Smartphone, hint: "e.g. MTN ref 1234567890" },
  Card: { icon: CreditCard, hint: "e.g. PSP-AUTH-9f2c1b8a" },
  Wallet: { icon: Wallet, hint: "Paid from your available wallet balance" },
};

// Modal to lodge funds into escrow for a purchase order. `refNum` is the PO
// reference; `onSecured(escrow)` receives the SECURED escrow on success.
// `preferredMethod` (MoMo/Card) is the PO's configured channel and becomes the
// default selection; the buyer can override it (including funding from Wallet).
export default function FundEscrowModal({
  open,
  onOpenChange,
  refNum,
  onSecured,
  preferredMethod,
}) {
  const [method, setMethod] = useState("MoMo");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMethod(PAYMENT_METHODS.includes(preferredMethod) ? preferredMethod : "MoMo");
    setReference("");
  }, [open, preferredMethod]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!method) return toast.error("Choose a payment method.");
    setSaving(true);
    try {
      const result = await fundPurchaseOrderEscrow(refNum, {
        payment_method: method,
        payment_ref: reference.trim() || undefined,
      });
      const redirectUrl = result?.redirect_url;
      if (redirectUrl) {
        // Hand the buyer to Orchard's hosted checkout. The escrow is secured
        // server-side once their callback confirms success.
        toast.success("Redirecting to complete escrow funding…");
        window.location.href = redirectUrl;
        return;
      }
      // No redirect — funded straight from the wallet (or already secured).
      toast.success(
        result?.funded_from_wallet
          ? "Escrow funded from your wallet."
          : "Escrow secured — funds lodged successfully.",
      );
      onSecured?.(result?.escrow ?? result);
      onOpenChange(false);
    } catch (err) {
      toast.error(
        apiErrorMessage(err, "Failed to fund escrow. Please try again."),
      );
    } finally {
      setSaving(false);
    }
  };

  const hint = METHOD_META[method]?.hint;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-montserrat sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand" /> Fund escrow
          </DialogTitle>
          <DialogDescription>
            {method === "Wallet"
              ? "Fund the escrow straight from your available wallet balance. Funds are held until the release conditions are met."
              : "You'll be redirected to a secure payment page to lodge funds into the escrow account. Funds are held until the release conditions are met."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment method */}
          <div>
            <span className={labelClass}>Payment method</span>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const Icon = METHOD_META[m]?.icon ?? CreditCard;
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
                    <Icon
                      className={cn("h-5 w-5", active && "text-brand")}
                    />
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment reference (not needed for wallet funding) */}
          {method !== "Wallet" && (
            <div>
              <label htmlFor="payment_ref" className={labelClass}>
                Payment reference{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Input
                id="payment_ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={hint}
                maxLength={128}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Optional. Any reference for this deposit, stored on the escrow
                ledger.
              </p>
            </div>
          )}

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
              disabled={saving}
              className="bg-brand-gradient text-brand-foreground hover:opacity-90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting…
                </>
              ) : method === "Wallet" ? (
                <>
                  <Wallet className="mr-2 h-4 w-4" /> Fund from wallet
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" /> Continue to payment
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
