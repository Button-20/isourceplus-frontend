import { useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Check,
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
  { value: "it", label: "IT" },
  { value: "logistics", label: "Logistics" },
  { value: "consulting", label: "Consulting" },
];
const TYPES = [
  { value: "information", label: "Information" },
  { value: "quotation", label: "Quotation" },
  { value: "proposal", label: "Proposal" },
];
const PROCEDURES = [
  { value: "open", label: "Open" },
  { value: "sealed", label: "Sealed" },
];
const PRIORITIES = [
  { value: "non urgent", label: "Non Urgent" },
  { value: "urgent", label: "Urgent" },
];
const UNITS = [
  { value: "pc", label: "Piece" },
  { value: "kg", label: "Kilogram" },
  { value: "m", label: "Meter" },
  { value: "l", label: "Liter" },
];

const STEPS = ["Details", "Reach", "Items"];
const labelClass = "mb-1 block text-sm font-medium text-foreground";

const emptyItem = () => ({
  name: "",
  description: "",
  unit_of_measure: "pc",
  quantity: 1,
  special_handles: [],
});

const initialValues = () => ({
  title: "",
  note: "",
  type: "information",
  procedure: "open",
  spend_category: "communications",
  priority: "non urgent",
  start_datetime: new Date().toISOString().slice(0, 16),
  submission_datetime: new Date().toISOString().slice(0, 16),
  is_approved: true,
  region: "",
  district: "",
  city: "",
  town: "",
  items: [emptyItem()],
});

export default function RFxCreateModal({ open, onOpenChange, onCreated }) {
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
      if (
        new Date(values.start_datetime) > new Date(values.submission_datetime)
      ) {
        toast.error("Submission date must be after the start date");
        return false;
      }
    }
    if (step === 1) {
      const reachFields = ["region", "district", "city", "town"];
      if (reachFields.some((f) => values[f]) && !values.region) {
        toast.error("Region is required when providing reach details");
        return false;
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
        "note",
        "type",
        "procedure",
        "spend_category",
        "priority",
        "start_datetime",
        "submission_datetime",
      ].forEach((k) => data.append(k, values[k]));
      data.append("is_approved", values.is_approved);

      const reachFields = ["region", "district", "city", "town"];
      if (reachFields.some((f) => values[f])) {
        reachFields.forEach((f) => {
          if (values[f]) data.append(`reach[${f}]`, values[f]);
        });
      }

      values.items.forEach((item, index) => {
        data.append(`items[${index}][name]`, item.name);
        data.append(`items[${index}][description]`, item.description || "");
        data.append(`items[${index}][quantity]`, item.quantity);
        data.append(`items[${index}][unit_of_measure]`, item.unit_of_measure);
        item.special_handles.forEach((h, hi) => {
          data.append(
            `items[${index}][special_handles][${hi}][handling_description]`,
            h.handling_description,
          );
        });
      });

      await authAxios.post("/rfxs/", data);
      toast.success("RFx created successfully!");
      onCreated?.();
      close(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create RFx.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto font-montserrat sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create RFx</DialogTitle>
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
                  placeholder="Enter RFx title"
                />
              </div>
              <div>
                <label className={labelClass}>Spend category</label>
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
                <label className={labelClass}>Submission date</label>
                <Input
                  type="datetime-local"
                  value={values.submission_datetime}
                  onChange={(e) => set({ submission_datetime: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Note</label>
                <Textarea
                  rows={2}
                  value={values.note}
                  onChange={(e) => set({ note: e.target.value })}
                  placeholder="Any additional notes"
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
                Optional — narrow who can see this RFx by location.
              </p>
              {["region", "district", "city", "town"].map((f) => (
                <div key={f}>
                  <label className={cn(labelClass, "capitalize")}>{f}</label>
                  <Input
                    value={values[f]}
                    onChange={(e) => set({ [f]: e.target.value })}
                    placeholder={`Enter ${f}`}
                  />
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {values.items.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border/70 p-4"
                >
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
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Description</label>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          setItem(i, { description: e.target.value })
                        }
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
                        onValueChange={(v) =>
                          setItem(i, { unit_of_measure: v })
                        }
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
                    {item.special_handles.map((h, hi) => (
                      <div key={hi} className="flex items-center gap-2">
                        <Input
                          value={h.handling_description}
                          onChange={(e) =>
                            setItem(i, {
                              special_handles: item.special_handles.map(
                                (x, idx) =>
                                  idx === hi
                                    ? { handling_description: e.target.value }
                                    : x,
                              ),
                            })
                          }
                          placeholder="Special handling instruction"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setItem(i, {
                              special_handles: item.special_handles.filter(
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
                          special_handles: [
                            ...item.special_handles,
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
                "Create RFx"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
