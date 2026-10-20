import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LifeBuoy, Loader2, Paperclip, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  MAX_ATTACHMENT_BYTES,
  SELECTABLE_PRIORITIES,
  TICKET_PRIORITY,
  createTicket,
  helpdeskErrorMessage,
} from "@/services/api/helpdesk.service";

const labelClass = "mb-1 block text-sm font-medium text-foreground";
const MAX_TITLE = 200;

// File a support ticket: title, description, priority and an optional
// attachment. `onCreated(ticket)` receives the new ticket.
export default function NewTicketModal({ open, onOpenChange, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("3");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDescription("");
    setPriority("3");
    setFile(null);
  }, [open]);

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_ATTACHMENT_BYTES) {
      toast.error("Attachments must be 5 MB or smaller.");
      e.target.value = "";
      return;
    }
    setFile(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Give your ticket a title.");
    if (!description.trim())
      return toast.error("Describe the problem so we can help.");
    setSaving(true);
    try {
      const ticket = await createTicket({
        title: title.trim(),
        description: description.trim(),
        priority: Number(priority),
        attachment: file,
      });
      toast.success(
        ticket?.id
          ? `Ticket #${ticket.id} filed. We'll get back to you.`
          : "Ticket filed. We'll get back to you.",
      );
      onCreated?.(ticket);
      onOpenChange(false);
    } catch (err) {
      toast.error(helpdeskErrorMessage(err, "Couldn't file the ticket."));
      console.error("Create ticket error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto font-montserrat sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-brand" /> New support ticket
          </DialogTitle>
          <DialogDescription>
            Tell us what&apos;s wrong. Replies go to your company email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="ticket-title" className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <span className="text-xs text-muted-foreground">
                {title.length}/{MAX_TITLE}
              </span>
            </div>
            <Input
              id="ticket-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={MAX_TITLE}
              placeholder="e.g. Can't send a purchase order"
              required
            />
          </div>

          <div>
            <label htmlFor="ticket-description" className={labelClass}>
              Description <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="ticket-description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What were you doing, what did you expect, and what happened instead? Include any reference numbers."
              required
            />
          </div>

          <div>
            <label className={labelClass}>Priority</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SELECTABLE_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {TICKET_PRIORITY[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <span className={labelClass}>
              Attachment{" "}
              <span className="font-normal text-muted-foreground">
                (optional, up to 5 MB)
              </span>
            </span>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={pickFile}
            />
            {file ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{file.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  aria-label="Remove attachment"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <Paperclip className="mr-1.5 h-4 w-4" /> Attach a file
              </Button>
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
              disabled={saving || !title.trim() || !description.trim()}
              className="bg-brand-gradient text-brand-foreground hover:opacity-90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Filing…
                </>
              ) : (
                "File ticket"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
