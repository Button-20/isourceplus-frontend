import { useMemo, useRef, useState } from "react";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { parseEmailRecipients } from "@/utils/sms";
import {
  EMAIL_FILE_ACCEPT,
  RecipientFileError,
  downloadEmailRecipientTemplate,
  readEmailRecipientFile,
} from "@/utils/email-recipient-file";

// Recipient email addresses: typed / pasted, or imported from a CSV / .xlsx
// file (merged into the box, then validated and de-duplicated by
// parseEmailRecipients). Controlled by the parent via `value` / `onChange`;
// the parent derives the emails with parseEmailRecipients.
export default function EmailRecipientsField({ value, onChange, rows = 3, id }) {
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [lastImport, setLastImport] = useState(null); // { name, added }
  const [dragOver, setDragOver] = useState(false);

  const recipients = useMemo(() => parseEmailRecipients(value), [value]);

  const importRecipientFile = async (file) => {
    if (!file || importing) return;
    setImporting(true);
    try {
      const { tokens, column } = await readEmailRecipientFile(file);
      const existing = new Set(
        parseEmailRecipients(value).map((e) => e.toLowerCase()),
      );
      const fromFile = parseEmailRecipients(tokens.join("\n"));
      const added = fromFile.filter((e) => !existing.has(e.toLowerCase()));
      const invalid = tokens.filter((t) => !parseEmailRecipients(t).length)
        .length;
      const duplicates = fromFile.length - added.length;

      if (!fromFile.length) {
        toast.error(`No valid email addresses found in ${file.name}.`);
        return;
      }
      if (added.length) {
        onChange([value.trim(), added.join("\n")].filter(Boolean).join("\n"));
      }
      setLastImport({ name: file.name, added: added.length });

      const skipped = [
        duplicates && `${duplicates} already listed`,
        invalid && `${invalid} invalid`,
      ].filter(Boolean);
      toast.success(
        `Imported ${added.length} email${added.length === 1 ? "" : "s"} from ${file.name}` +
          (column ? ` (column: ${column})` : "") +
          (skipped.length ? ` — skipped ${skipped.join(", ")}.` : "."),
      );
    } catch (err) {
      toast.error(
        err instanceof RecipientFileError
          ? err.message
          : "Couldn't read that file. Try a .csv or .xlsx export.",
      );
      console.error("Email import error:", err);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) importRecipientFile(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!dragOver) setDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false);
      }}
      onDrop={onDrop}
      className={cn(
        "rounded-xl transition-colors",
        dragOver &&
          "bg-brand/5 ring-2 ring-brand/40 ring-offset-4 ring-offset-card",
      )}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium">
          Recipients
        </label>
        <span className="text-xs text-muted-foreground">
          {recipients.length} valid email{recipients.length === 1 ? "" : "s"}
        </span>
      </div>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={"customer@example.com, supplier@example.com"}
      />
      <p className="mt-1.5 text-xs text-muted-foreground">
        One or many — separate with commas, spaces or new lines.
      </p>

      {/* Bulk upload from CSV / Excel */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={EMAIL_FILE_ACCEPT}
          className="hidden"
          onChange={(e) => importRecipientFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          {importing ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-1.5 h-4 w-4" />
          )}
          {importing ? "Reading file…" : "Upload CSV or Excel"}
        </Button>
        <button
          type="button"
          onClick={downloadEmailRecipientTemplate}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
        >
          <Download className="h-3.5 w-3.5" /> Download template
        </button>
        {value.trim() && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setLastImport(null);
            }}
            className="ml-auto text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        )}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        .csv or .xlsx, up to 5 MB — or drop the file here. A column headed
        “email”, “e-mail”, “address” or “contact” is used if present.
      </p>
      {lastImport && value.trim() && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          {lastImport.name} · {lastImport.added} added
        </p>
      )}
      {recipients.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {recipients.slice(0, 8).map((r) => (
            <span
              key={r}
              className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand"
            >
              {r}
            </span>
          ))}
          {recipients.length > 8 && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              +{recipients.length - 8} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
