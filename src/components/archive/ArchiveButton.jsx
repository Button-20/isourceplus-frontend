import { useState } from "react";
import { Archive, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ARCHIVE_KINDS,
  archiveErrorMessage,
  archiveOne,
} from "@/services/api/archive.service";

// "Archive" action for one record (RFx / tender / proforma invoice / waybill)
// with a confirmation dialog. `onArchived(result)` runs after success — pages
// use it to return to their list.
export default function ArchiveButton({
  kind,
  refNum,
  title,
  onArchived,
  disabled = false,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { singular } = ARCHIVE_KINDS[kind];

  const confirm = async () => {
    setBusy(true);
    try {
      const result = await archiveOne(kind, refNum);
      toast.success(result.message);
      setOpen(false);
      onArchived?.(result);
    } catch (err) {
      toast.error(archiveErrorMessage(err, `Failed to archive ${singular}.`));
      console.error("Archive error:", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={disabled || busy}
        className={className}
      >
        <Archive className="mr-1.5 h-4 w-4" /> Archive
      </Button>

      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Archive {singular}</DialogTitle>
            <DialogDescription>
              Archive{" "}
              <span className="font-medium text-foreground">
                {title || refNum}
              </span>
              {title && refNum ? ` (${refNum})` : ""}? It will be moved out of
              your active {ARCHIVE_KINDS[kind].plural}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              onClick={confirm}
              disabled={busy}
              className="bg-brand-gradient text-brand-foreground hover:opacity-90"
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Archiving…
                </>
              ) : (
                <>
                  <Archive className="mr-1.5 h-4 w-4" /> Archive
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
