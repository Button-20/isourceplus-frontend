import { useEffect, useMemo, useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import EmailRecipientsField from "@/components/sms/EmailRecipientsField";
import { cn } from "@/lib/utils";
import { useAuth } from "@/services/context/app.context";
import { getCompany } from "@/services/api/companies.service";
import { getTransporter } from "@/services/api/transporters.service";
import { sendEmailInvitation } from "@/services/api/sms.service";
import {
  emailInvitationMessage,
  parseEmailRecipients,
  SIGNUP_FOOTER,
  withSignupFooter,
} from "@/utils/sms";
import { apiErrorMessage } from "@/services/lib/api-error";

// "Email invitation": invite customers, suppliers and transporters to sign up,
// on behalf of the user's organisation, to typed email addresses. Users pick
// the platform's default message or write a custom one (the sign-up line is
// appended to custom messages). `onSent()` runs after a successful send.
export default function EmailInviteDialog({ open, onOpenChange, onSent }) {
  const { companyId, transporterId } = useAuth();
  const [orgName, setOrgName] = useState("");
  const [mode, setMode] = useState("default"); // "default" | "custom"
  const [recipientsRaw, setRecipientsRaw] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);

  // The invitation names the sender's organisation ("XYZ Limited invites…").
  useEffect(() => {
    if (!open) return undefined;
    setRecipientsRaw("");
    setCustomMessage("");
    setMode("default");
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

  const defaultMessage = emailInvitationMessage(orgName);
  const recipients = useMemo(
    () => parseEmailRecipients(recipientsRaw),
    [recipientsRaw],
  );
  const fullMessage =
    mode === "default" ? defaultMessage : withSignupFooter(customMessage);

  const send = async () => {
    if (!recipients.length)
      return toast.error("Add at least one valid recipient email.");
    if (mode === "custom" && !customMessage.trim())
      return toast.error("Write a message first.");
    setSending(true);
    try {
      await sendEmailInvitation({ message: fullMessage, recipients });
      toast.success(
        `Invitation sent to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}.`,
      );
      onSent?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        apiErrorMessage(err, "Couldn't send the email invitation. Please try again."),
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
            <Mail className="h-5 w-5 text-brand" /> Email invitation
          </DialogTitle>
          <DialogDescription>
            Invite your customers, suppliers and transporters to sign up on
            iSourcePlus by email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Recipients */}
          <EmailRecipientsField
            id="email-invite-recipients"
            value={recipientsRaw}
            onChange={setRecipientsRaw}
          />

          {/* Default / custom message toggle */}
          <div className="grid grid-cols-2 gap-1 rounded-full bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setMode("default")}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "default"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Default message
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "custom"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Custom message
            </button>
          </div>

          {mode === "default" ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium">Message</span>
                <span className="text-xs text-muted-foreground">
                  {fullMessage.length} chars
                </span>
              </div>
              <p className="whitespace-pre-line rounded-xl border border-border/70 bg-muted/30 p-4 text-sm leading-relaxed">
                {fullMessage}
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="email-invite-message"
                  className="text-sm font-medium"
                >
                  Message
                </label>
                <span className="text-xs text-muted-foreground">
                  {fullMessage.length} chars
                </span>
              </div>
              <Textarea
                id="email-invite-message"
                rows={5}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Write your invitation…"
              />
              <p className="mt-2 rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  Added to every message:
                </span>{" "}
                {SIGNUP_FOOTER}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="items-center gap-3 sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {recipients.length} recipient{recipients.length === 1 ? "" : "s"}
          </p>
          <Button
            onClick={send}
            disabled={
              sending ||
              !recipients.length ||
              (mode === "custom" && !customMessage.trim())
            }
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
