// "Chat issuer": start (or reopen) a conversation with the organisation that
// issued a document. Hidden when the viewer is the issuer themselves (you can't
// chat with your own organisation).
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/services/context/app.context";
import {
  chatErrorMessage,
  openConversation,
} from "@/services/api/chat.service";

export default function ChatIssuerButton({
  issuerRef,
  documentType,
  documentId,
  subject,
  className,
}) {
  const navigate = useNavigate();
  const { companyId, transporterId } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!issuerRef?.id) return null;
  const myId = String(companyId || transporterId || "");
  if (myId && String(issuerRef.id) === myId) return null;

  const start = async () => {
    setBusy(true);
    try {
      const conversation = await openConversation({
        counterpartType: issuerRef.type || "company",
        counterpartId: issuerRef.id,
        documentType,
        documentId,
        subject,
      });
      navigate(`/dashboard/messages/${conversation.id}`);
    } catch (err) {
      toast.error(chatErrorMessage(err, "Couldn't start the chat."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={start}
      disabled={busy}
      className={className}
    >
      {busy ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <MessageSquare className="mr-1.5 h-4 w-4" />
      )}
      Chat issuer
    </Button>
  );
}
