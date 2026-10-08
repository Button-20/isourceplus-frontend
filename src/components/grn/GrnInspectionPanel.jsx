import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ClipboardCheck, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { prettify } from "@/utils/choices";
import {
  GRN_CONDITIONS,
  isMissingRoute,
  updateGrnInspection,
} from "@/services/api/grn.service";

const num = (v) => (v == null || v === "" ? "" : String(Number(v)));

const toDraft = (lines) =>
  (Array.isArray(lines) ? lines : []).map((l) => ({
    id: l.id,
    item_description: l.item_description || "Item",
    unit: l.unit || "",
    quantity_ordered: l.quantity_ordered,
    quantity_received: num(l.quantity_received),
    quantity_short: num(l.quantity_short),
    quantity_damaged: num(l.quantity_damaged),
    condition: l.condition || "",
    remarks: l.remarks || "",
  }));

// Goods received note with per-line inspection: received / short / damaged
// quantities, condition and remarks. `editable` lets the buyer save the
// inspection (PATCH good-received-notes/{id}/update/); `onSaved(grn)` gets
// the updated GRN.
export default function GrnInspectionPanel({ grn, editable = false, onSaved }) {
  const [lines, setLines] = useState(() => toDraft(grn?.lines));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLines(toDraft(grn?.lines));
  }, [grn]);

  if (!grn) return null;

  const setField = (i, key, value) =>
    setLines((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)),
    );

  const save = async () => {
    const bad = lines.find((l) =>
      ["quantity_received", "quantity_short", "quantity_damaged"].some(
        (k) => l[k] !== "" && (Number.isNaN(Number(l[k])) || Number(l[k]) < 0),
      ),
    );
    if (bad)
      return toast.error(
        `Quantities for "${bad.item_description}" must be zero or more.`,
      );
    setSaving(true);
    try {
      const updated = await updateGrnInspection(grn.id, lines);
      toast.success("Inspection saved.");
      onSaved?.(updated && typeof updated === "object" ? updated : null);
    } catch (err) {
      const body = err.response?.data;
      toast.error(
        isMissingRoute(err)
          ? "GRN inspection isn't available on the server yet."
          : (body && typeof body === "object"
              ? body.message || body.detail
              : null) || "Couldn't save the inspection.",
      );
      console.error("GRN inspection error:", err);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "h-9 w-20 text-right tabular-nums";

  return (
    <div className="rounded-2xl border border-border/70 bg-card">
      <div className="flex flex-col gap-3 border-b border-border/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold">
              Goods received note
            </h2>
            <p className="text-xs text-muted-foreground">
              {grn.grn_number || `GRN #${grn.id}`}
              {grn.receiver_name ? ` · Received by ${grn.receiver_name}` : ""}
              {grn.vehicle_number ? ` · Vehicle ${grn.vehicle_number}` : ""}
            </p>
          </div>
        </div>
        {grn.status && (
          <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-500/15 dark:text-slate-300">
            {prettify(String(grn.status).toLowerCase())}
          </span>
        )}
      </div>

      {lines.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-muted-foreground">
          This note has no line items yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-3 py-3 text-right font-medium">Ordered</th>
                <th className="px-3 py-3 text-right font-medium">Received</th>
                <th className="px-3 py-3 text-right font-medium">Short</th>
                <th className="px-3 py-3 text-right font-medium">Damaged</th>
                <th className="px-3 py-3 font-medium">Condition</th>
                <th className="px-4 py-3 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {lines.map((l, i) => (
                <tr key={l.id ?? i} className="align-middle">
                  <td className="px-4 py-3">
                    <p className="font-medium">{l.item_description}</p>
                    {l.unit && (
                      <p className="text-xs text-muted-foreground">{l.unit}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                    {num(l.quantity_ordered) || "—"}
                  </td>
                  {[
                    "quantity_received",
                    "quantity_short",
                    "quantity_damaged",
                  ].map((k) => (
                    <td key={k} className="px-3 py-3 text-right">
                      {editable ? (
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          inputMode="decimal"
                          value={l[k]}
                          onChange={(e) => setField(i, k, e.target.value)}
                          className={cn(inputClass, "ml-auto")}
                          aria-label={`${prettify(k)} for ${l.item_description}`}
                        />
                      ) : (
                        <span className="tabular-nums">{l[k] || "—"}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-3">
                    {editable ? (
                      <Select
                        value={l.condition || undefined}
                        onValueChange={(v) => setField(i, "condition", v)}
                      >
                        <SelectTrigger className="h-9 w-32">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRN_CONDITIONS.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      prettify(String(l.condition || "—").toLowerCase())
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editable ? (
                      <Input
                        value={l.remarks}
                        onChange={(e) => setField(i, "remarks", e.target.value)}
                        maxLength={255}
                        placeholder="Optional"
                        className="h-9 min-w-40"
                        aria-label={`Remarks for ${l.item_description}`}
                      />
                    ) : (
                      l.remarks || "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editable && lines.length > 0 && (
        <div className="flex justify-end border-t border-border/60 px-6 py-4">
          <Button
            onClick={save}
            disabled={saving}
            className="bg-brand-gradient text-brand-foreground hover:opacity-90"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-4 w-4" /> Save inspection
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
