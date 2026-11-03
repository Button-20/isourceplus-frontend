import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Gavel, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DISPUTE_REASONS,
  disputeErrorMessage,
  raiseEscrowDispute,
} from "@/services/api/escrow-dispute.service";

const money = (value, currency = "GHS") => {
  const n = Number(value);
  return Number.isNaN(n)
    ? String(value ?? "—")
    : `${currency} ${n.toLocaleString("en-GH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
};

// A party to the escrow (buyer, or the supplier) disputes it: a reason and,
// optionally, the amount in dispute (up to what's on hold). Raising one
// freezes the escrow (DISPUTED). `onRaised(dispute)` gets the new dispute.
export default function RaiseDisputeModal({
  open,
  onOpenChange,
  escrow,
  party = "buyer",
  onRaised,
}) {
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setAmount("");
    }
  }, [open]);

  const reasons = DISPUTE_REASONS[party] || DISPUTE_REASONS.buyer;
  const onHold = Number(escrow?.amount_on_hold) || 0;
  const currency = escrow?.currency || "GHS";
  const amountNum = Number(amount);
  const amountError =
    amount === ""
      ? ""
      : Number.isNaN(amountNum) || amountNum < 0
        ? "Enter an amount of zero or more."
        : amountNum > onHold
          ? `It can't be more than the ${money(onHold, currency)} on hold.`
          : !/^\d+(\.\d{1,2})?$/.test(amount.trim())
            ? "Use at most two decimal places."
            : "";

  const submit = async (e) => {
    e.preventDefault();
    if (!reason) return toast.error("Choose a reason for the dispute.");
    if (amountError) return toast.error(amountError);
    setSaving(true);
    try {
      const dispute = await raiseEscrowDispute({
        escrow: escrow?.escrow_id ?? escrow?.id,
        reason,
        amount: amount.trim(),
      });
      toast.success(
        dispute?.dispute_id
          ? `Dispute ${dispute.dispute_id} raised. The escrow is frozen while it's reviewed.`
          : "Dispute raised. The escrow is frozen while it's reviewed.",
      );
      onRaised?.(dispute);
      onOpenChange(false);
    } catch (err) {
      toast.error(disputeErrorMessage(err, "Couldn't raise the dispute."));
      console.error("Raise dispute error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="font-montserrat sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-amber-500" /> Raise a dispute
          </DialogTitle>
          <DialogDescription>
            The escrow is frozen while the dispute is reviewed — no funds are
            released until it&apos;s resolved. {money(onHold, currency)} is
            currently on hold.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Reason
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a reason" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label
              htmlFor="dispute_amount"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Amount in dispute{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <Input
              id="dispute_amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Up to ${onHold.toFixed(2)}`}
              aria-invalid={Boolean(amountError)}
            />
            {amountError ? (
              <p className="mt-1 text-xs text-destructive">{amountError}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Leave empty if you&apos;re not disputing a specific amount.
              </p>
            )}
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
              disabled={saving || !reason || Boolean(amountError)}
              className="bg-brand-gradient text-brand-foreground hover:opacity-90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Raising…
                </>
              ) : (
                "Raise dispute"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
