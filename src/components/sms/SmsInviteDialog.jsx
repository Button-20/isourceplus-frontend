import { useEffect, useMemo, useState } from "react";
import { Loader2, Send, UserPlus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import RecipientsField from "@/components/sms/RecipientsField";
import { useAuth } from "@/services/context/app.context";
import { getCompany } from "@/services/api/companies.service";
import { getTransporter } from "@/services/api/transporters.service";
import { sendSms } from "@/services/api/sms.service";
import { invitationMessage, parseRecipients, segmentsFor } from "@/utils/sms";

// "SMS invitation": send the default sign-up invitation, on behalf of the
// user's organisation, to typed or uploaded numbers. `balance` (units, or
// null if unknown) guards the send; `onSent()` runs after a successful send.
export default function SmsInviteDialog({
  open,
  onOpenChange,
  balance,
  onSent,
}) {
  const { companyId, transporterId } = useAuth();
  const [orgName, setOrgName] = useState("");
  const [recipientsRaw, setRecipientsRaw] = useState("");
  const [sending, setSending] = useState(false);

  // The invitation names the sender's organisation ("XYZ Limited invites…").
  useEffect(() => {
    if (!open) return undefined;
    setRecipientsRaw("");
    let cancelled = false;
    const load = transporterId
      ? getTransporter(transporterId)
      : companyId
        ? getCompany(companyId)
        : null;
    load
      ?.then((data) => {
        const org = data?.data && !Array.isArray(data.data) ? data.data : data;
        if (!cancelled) setOrgName(String(org?.name || "").trim());
      })
      .catch(() => {
        /* falls back to "We invite you…" */
      });
    return () => {
      cancelled = true;
    };
  }, [open, companyId, transporterId]);

  const message = invitationMessage(orgName);
  const recipients = useMemo(
    () => parseRecipients(recipientsRaw),
    [recipientsRaw],
  );
  const units = recipients.length * segmentsFor(message);
  const overBalance = balance != null && units > balance;

  const send = async () => {
    if (!recipients.length)
      return toast.error("Add at least one valid recipient number.");
    if (overBalance)
      return toast.error("Not enough SMS units. Buy more units first.");
    setSending(true);
    try {
      await sendSms({ message, recipients });
      toast.success(
        `Invitation sent to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}.`,
      );
      onSent?.();
      onOpenChange(false);
    } catch (err) {
      const data = err.response?.data;
      toast.error(
        data?.detail ||
          data?.message?.[0] ||
          data?.recipients?.[0] ||
          (typeof data === "string" ? data : null) ||
          "Couldn't send the invitation. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !sending && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto font-montserrat sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-brand" /> SMS invitation
          </DialogTitle>
          <DialogDescription>
            Invite your customers, suppliers and transporters to sign up on
            iSourcePlus.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <RecipientsField
            id="invite-recipients"
            value={recipientsRaw}
            onChange={setRecipientsRaw}
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium">Message</span>
              <span className="text-xs text-muted-foreground">
                {message.length} chars · {segmentsFor(message)} segments
              </span>
            </div>
            <p className="whitespace-pre-line rounded-xl border border-border/70 bg-muted/30 p-4 text-sm leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <DialogFooter className="items-center gap-3 sm:justify-between">
          <p
            className={cn(
              "text-sm",
              overBalance ? "text-destructive" : "text-muted-foreground",
            )}
          >
            Cost:{" "}
            <span className="font-semibold text-foreground">
              {units.toLocaleString()} unit{units === 1 ? "" : "s"}
            </span>
            {overBalance && " — exceeds your balance"}
          </p>
          <Button
            onClick={send}
            disabled={sending || !recipients.length || overBalance}
            className="bg-brand-gradient text-white hover:opacity-90"
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
              </>
            ) : (
              <>
                <Send className="mr-1.5 h-4 w-4" /> Send invitation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
