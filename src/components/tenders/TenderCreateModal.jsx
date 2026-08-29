import { useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Check,
  Paperclip,
} from "lucide-react";

import { useAuth } from "@/services/context/app.context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SPEND_CATEGORIES = [
  { value: "communications", label: "Communications" },
  { value: "IT", label: "IT" },
  { value: "Construction", label: "Construction" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Other", label: "Other" },
];
const TYPES = [
  { value: "nct", label: "NCT" },
  { value: "other", label: "Other" },
];
const PROCEDURES = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];
const METHODS = [
  { value: "general sourcing", label: "General Sourcing" },
  { value: "other", label: "Other" },
];
const PRIORITIES = [
  { value: "non urgent", label: "Non Urgent" },
  { value: "urgent", label: "Urgent" },
];
const UNITS = [
  { value: "pc", label: "Piece (pc)" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
  { value: "t", label: "Ton (t)" },
  { value: "lb", label: "Pound (lb)" },
  { value: "L", label: "Liter (L)" },
  { value: "mL", label: "Milliliter (mL)" },
  { value: "m³", label: "Cubic meter (m³)" },
  { value: "gal", label: "Gallon (gal)" },
];

const STEPS = ["Details", "Reach", "Items", "Attachments"];
const labelClass = "mb-1 block text-sm font-medium text-foreground";

const emptyItem = () => ({
  name: "",
  description: "",
  unit_of_measure: "pc",
  quantity: 1,
  special_handling: [],
});

const initialValues = () => ({
  title: "",
  note: "",
  spend_category: "communications",
  type: "nct",
  procedure: "open",
  method: "general sourcing",
  priority: "non urgent",
  start_datetime: new Date().toISOString().slice(0, 16),
  submission_datetime: new Date().toISOString().slice(0, 16),
  delivery_datetime: new Date().toISOString().slice(0, 16),
  is_approved: true,
  region: "",
  district: "",
  city: "",
  town: "",
  items: [emptyItem()],
  attachments: [],
});

export default function TenderCreateModal({ open, onOpenChange, onCreated }) {
  const { authAxios } = useAuth();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);

  const set = (patch) => setValues((v) => ({ ...v, ...patch }));
  const setItem = (i, patch) =>
    setValues((v) => {
      const items = [...v.items];
      items[i] = { ...items[i], ...patch };
      return { ...v, items };
    });

  const reset = () => {
    setValues(initialValues());
    setStep(0);
  };

  const close = (o) => {
    onOpenChange(o);
    if (!o) reset();
  };

  const validateStep = () => {
    if (step === 0) {
      if (!values.title.trim()) {
        toast.error("Title is required");
        return false;
      }
      const start = new Date(values.start_datetime);
      const submission = new Date(values.submission_datetime);
      const delivery = new Date(values.delivery_datetime);
      if (submission < start) {
        toast.error("Submission date must be after the start date");
        return false;
      }
      if (delivery < submission) {
        toast.error("Delivery date must be after the submission date");
        return false;
      }
    }
    if (step === 1) {
      const reachFields = ["region", "district", "city", "town"];
      for (const f of reachFields) {
        if (!values[f].trim()) {
          toast.error(`${f.charAt(0).toUpperCase() + f.slice(1)} is required`);
          return false;
        }
      }
    }
    if (step === 2) {
      if (!values.items.length) {
        toast.error("Add at least one item");
        return false;
      }
      for (const it of values.items) {
        if (!it.name.trim()) {
          toast.error("Each item needs a name");
          return false;
        }
        if (!it.quantity || Number(it.quantity) <= 0) {
          toast.error("Item quantity must be greater than 0");
          return false;
        }
      }
    }
    if (step === 3) {
      for (const a of values.attachments) {
        if (a.name && !a.file) {
          toast.error("Each named attachment needs a file");
          return false;
        }
        if (a.file && !a.name.trim()) {
          toast.error("Each attachment file needs a name");
          return false;
        }
      }
    }
    return true;
  };

  const next = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const data = new FormData();
      [
        "title",
        "spend_category",
        "type",
        "procedure",
        "method",
        "priority",
        "note",
        "start_datetime",
        "submission_datetime",
        "delivery_datetime",
      ].forEach((k) => data.append(k, values[k]));
      data.append("is_approved", values.is_approved);

      data.append("reach[region]", values.region);
      data.append("reach[district]", values.district);
      data.append("reach[city]", values.city);
      data.append("reach[town]", values.town);

      values.items.forEach((item, index) => {
        data.append(`items[${index}][name]`, item.name);
        if (item.description)
          data.append(`items[${index}][description]`, item.description);
        data.append(`items[${index}][quantity]`, item.quantity);
        data.append(`items[${index}][unit_of_measure]`, item.unit_of_measure);
        item.special_handling.forEach((h, hi) => {
          data.append(
            `items[${index}][special_handling][${hi}][handling_description]`,
            h.handling_description,
          );
        });
      });

      values.attachments.forEach((a, index) => {
        if (a.name && a.file) {
          data.append(`attachments[${index}][name]`, a.name);
          data.append(`attachments[${index}][orientation]`, "document");
          data.append(`attachments[${index}][file]`, a.file);
        }
      });

      const response = await authAxios.post("/tenders/", data);
      toast.success("Tender created successfully!");
      onCreated?.(response.data);
      close(false);
    } catch (error) {
      toast.error(
        error.response?.data?.non_field_errors?.[0] ||
          error.response?.data?.title?.[0] ||
          error.response?.data?.detail ||
          "Failed to create tender.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto font-montserrat sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create tender</DialogTitle>
          <DialogDescription>
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  i === step
                    ? "bg-brand-gradient text-brand-foreground"
                    : i < step
                      ? "bg-brand text-brand-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:inline",
                  i === step ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s}
              </span>
              {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
            </div>
          ))}
        </div>

        {/* Step body */}
        <div className="space-y-4 py-2">
          {step === 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Title <span className="text-destructive">*</span>
                </label>
                <Input
                  value={values.title}
                  onChange={(e) => set({ title: e.target.value })}
                  placeholder="Enter tender title"
                  maxLength={128}
                />
              </div>
              <div>
                <label className={labelClass}>Supplier market</label>
                <Select
                  value={values.spend_category}
                  onValueChange={(v) => set({ spend_category: v })}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPEND_CATEGORIES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={labelClass}>Type</label>
                <Select
                  value={values.type}
                  onValueChange={(v) => set({ type: v })}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={labelClass}>Procedure</label>
                <Select
                  value={values.procedure}
                  onValueChange={(v) => set({ procedure: v })}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROCEDURES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={labelClass}>Method</label>
                <Select
                  value={values.method}
                  onValueChange={(v) => set({ method: v })}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={labelClass}>Priority</label>
                <Select
                  value={values.priority}
                  onValueChange={(v) => set({ priority: v })}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={labelClass}>Start date</label>
                <Input
                  type="datetime-local"
                  value={values.start_datetime}
                  onChange={(e) => set({ start_datetime: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Submission due date</label>
                <Input
                  type="datetime-local"
                  value={values.submission_datetime}
                  onChange={(e) => set({ submission_datetime: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Delivery date</label>
                <Input
                  type="datetime-local"
                  value={values.delivery_datetime}
                  onChange={(e) => set({ delivery_datetime: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Note</label>
                <Textarea
                  rows={2}
                  value={values.note}
                  onChange={(e) => set({ note: e.target.value })}
                  placeholder="Any additional notes"
                  maxLength={500}
                />
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={values.is_approved}
                  onChange={(e) => set({ is_approved: e.target.checked })}
                  className="h-4 w-4 accent-[hsl(var(--brand))]"
                />
                Mark as approved
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <p className="text-sm text-muted-foreground sm:col-span-2">
                Define the location this tender reaches.
              </p>
              {["region", "district", "city", "town"].map((f) => (
                <div key={f}>
                  <label className={cn(labelClass, "capitalize")}>
                    {f} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={values[f]}
                    onChange={(e) => set({ [f]: e.target.value })}
                    placeholder={`Enter ${f}`}
                    maxLength={100}
                  />
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {values.items.map((item, i) => (
                <div key={i} className="rounded-xl border border-border/70 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">Item {i + 1}</span>
                    {values.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setValues((v) => ({
                            ...v,
                            items: v.items.filter((_, idx) => idx !== i),
                          }))
                        }
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>
                        Name <span className="text-destructive">*</span>
                      </label>
                      <Input
                        value={item.name}
                        onChange={(e) => setItem(i, { name: e.target.value })}
                        maxLength={255}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Description</label>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          setItem(i, { description: e.target.value })
                        }
                        maxLength={500}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Quantity</label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          setItem(i, { quantity: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Unit</label>
                      <Select
                        value={item.unit_of_measure}
                        onValueChange={(v) => setItem(i, { unit_of_measure: v })}
                      >
                        <SelectTrigger className="h-10 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNITS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Special handling */}
                  <div className="mt-3 space-y-2">
                    {item.special_handling.map((h, hi) => (
                      <div key={hi} className="flex items-center gap-2">
                        <Input
                          value={h.handling_description}
                          onChange={(e) =>
                            setItem(i, {
                              special_handling: item.special_handling.map(
                                (x, idx) =>
                                  idx === hi
                                    ? { handling_description: e.target.value }
                                    : x,
                              ),
                            })
                          }
                          placeholder="Special handling instruction"
                          maxLength={500}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setItem(i, {
                              special_handling: item.special_handling.filter(
                                (_, idx) => idx !== hi,
                              ),
                            })
                          }
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Remove handling"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setItem(i, {
                          special_handling: [
                            ...item.special_handling,
                            { handling_description: "" },
                          ],
                        })
                      }
                      className="h-auto p-0 text-xs text-brand"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add special handling
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setValues((v) => ({ ...v, items: [...v.items, emptyItem()] }))
                }
                className="w-full gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add item
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Optional — attach supporting documents (keep files under 1MB).
              </p>
              {values.attachments.map((a, i) => (
                <div key={i} className="rounded-xl border border-border/70 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      Attachment {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setValues((v) => ({
                          ...v,
                          attachments: v.attachments.filter(
                            (_, idx) => idx !== i,
                          ),
                        }))
                      }
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove attachment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Name</label>
                      <Input
                        value={a.name}
                        onChange={(e) =>
                          setValues((v) => {
                            const attachments = [...v.attachments];
                            attachments[i] = {
                              ...attachments[i],
                              name: e.target.value,
                            };
                            return { ...v, attachments };
                          })
                        }
                        placeholder="Attachment name"
                        maxLength={255}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>File</label>
                      <Input
                        type="file"
                        onChange={(e) =>
                          setValues((v) => {
                            const attachments = [...v.attachments];
                            attachments[i] = {
                              ...attachments[i],
                              file: e.target.files?.[0] || null,
                            };
                            return { ...v, attachments };
                          })
                        }
                      />
                      {a.file && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {a.file.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setValues((v) => ({
                    ...v,
                    attachments: [...v.attachments, { name: "", file: null }],
                  }))
                }
                className="w-full gap-1.5"
              >
                <Paperclip className="h-4 w-4" /> Add attachment
              </Button>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button
            variant="ghost"
            onClick={step === 0 ? () => close(false) : back}
            disabled={loading}
          >
            {step === 0 ? (
              "Cancel"
            ) : (
              <>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </>
            )}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              onClick={next}
              className="gap-1 bg-brand-gradient text-brand-foreground hover:opacity-90"
            >
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={submit}
              disabled={loading}
              className="bg-brand-gradient text-brand-foreground hover:opacity-90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…
                </>
              ) : (
                "Create tender"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
