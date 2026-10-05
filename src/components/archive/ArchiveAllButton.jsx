import { useState } from "react";
import { Archive, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  archiveAll,
  archiveErrorMessage,
} from "@/services/api/archive.service";

const CONFIRM_WORD = "ARCHIVE";

// "Archive all" for a list page header. GET {base}/archive-all/ archives every
// record of that type for the user, so it requires typing ARCHIVE to confirm.
// `tone="onBrand"` styles the trigger for the blue page headers.
export default function ArchiveAllButton({
  kind,
  count,
  onArchived,
  tone = "default",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const { plural } = ARCHIVE_KINDS[kind];
  const armed = typed.trim().toUpperCase() === CONFIRM_WORD;

  const close = (o) => {
    if (busy) return;
    setOpen(o);
    if (!o) setTyped("");
  };

  const confirm = async () => {
    if (!armed) return;
    setBusy(true);
    try {
      const result = await archiveAll(kind);
      toast.success(result.message);
      setOpen(false);
      setTyped("");
      onArchived?.(result);
    } catch (err) {
      toast.error(archiveErrorMessage(err, `Failed to archive ${plural}.`));
      console.error("Archive all error:", err);
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
        className={
          tone === "onBrand"
            ? "border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            : undefined
        }
      >
        <Archive className="mr-1.5 h-4 w-4" /> Archive all
      </Button>

      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-amber-500" /> Archive all{" "}
              {plural}
            </DialogTitle>
            <DialogDescription>
              This archives{" "}
              <span className="font-medium text-foreground">
                every one of your {plural}
                {typeof count === "number" ? ` (${count} listed)` : ""}
              </span>{" "}
              at once, not just the ones on this page. They will be moved out of
              your active {plural}.
            </DialogDescription>
          </DialogHeader>

          <div>
            <label
              htmlFor={`archive-all-${kind}`}
              className="mb-1 block text-sm font-medium"
            >
              Type{" "}
              <span className="font-mono font-semibold">{CONFIRM_WORD}</span> to
              confirm
            </label>
            <Input
              id={`archive-all-${kind}`}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={CONFIRM_WORD}
              autoComplete="off"
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === "Enter" && armed) confirm();
              }}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => close(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              onClick={confirm}
              disabled={!armed || busy}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Archiving…
                </>
              ) : (
                <>
                  <Archive className="mr-1.5 h-4 w-4" /> Archive all {plural}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
