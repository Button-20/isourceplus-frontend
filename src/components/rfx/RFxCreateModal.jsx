import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Check,
  Pencil,
  Paperclip,
} from "lucide-react";

import { useAuth } from "@/services/context/app.context";
import { getRfxTypeChoices } from "@/services/api/rfx.service";
import {
  getDeliveryChoices,
  getMethodChoices,
  getPriorityChoices,
  getProcedureChoices,
  getProcurementTypeChoices,
  getSpendCategoryChoices,
  getUnitOfMeasureChoices,
} from "@/services/api/choices.service";
import { getRegionChoices } from "@/services/api/waitlist.service";
import { getDistrictChoices } from "@/services/api/transporters.service";
import { normalizeChoices } from "@/utils/choices";
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

// Fallback only — the live list comes from GET spend-category-choices/.
const SPEND_CATEGORIES = [
  { value: "construction", label: "Construction" },
  { value: "technology", label: "Technology" },
  { value: "logistics", label: "Logistics" },
  { value: "professional_services", label: "Professional Services" },
];
// Fallback only — the live list comes from GET rfx/type-choices/.
const TYPES = [
  { value: "information", label: "Information" },
  { value: "quotation", label: "Quotation" },
  { value: "proposal", label: "Proposal" },
];
// Fallback only — the live list comes from GET method-choices/.
const METHODS = [
  { value: "general sourcing", label: "General Sourcing" },
  { value: "client sourcing", label: "Client Sourcing" },
];
// Fallback only — the live list comes from GET procurement/type-choices/.
const PROCUREMENT_TYPES = [
  { value: "product", label: "Product" },
  { value: "project", label: "Project" },
  { value: "service", label: "Service" },
];
// Fallback only — the live list comes from GET delivery-choices/.
const DELIVERY_OPTIONS = [{ value: "self", label: "Self delivery" }];
// Fallback only — the live list comes from GET procedure-choices/.
const PROCEDURES = [
  { value: "open", label: "Open" },
  { value: "sealed", label: "Sealed" },
];
// Fallback only — the live list comes from GET priority-choices/.
const PRIORITIES = [
  { value: "non urgent", label: "Non-Urgent" },
  { value: "urgent", label: "Urgent" },
];
// Fallback only — the live list comes from GET item/unit-of-measure-choices/.
const UNITS = [
  { value: "pc", label: "Piece" },
  { value: "kg", label: "Kilogram" },
  { value: "m", label: "Meter" },
  { value: "l", label: "Liter" },
];

const STEPS = ["Details", "Reach", "Items", "Review"];
const REVIEW_STEP = STEPS.length - 1;
const labelClass = "mb-1 block text-sm font-medium text-foreground";

// Review-step helpers: show the option label (not the raw enum value) and
// readable dates.
const labelFor = (options, value) =>
  options.find((o) => o.value === value)?.label ?? (value || "—");
const fmtDateTime = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? String(v)
    : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

function ReviewSection({ title, onEdit, children }) {
  return (
    <section className="rounded-xl border border-border/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      </div>
      {children}
    </section>
  );
}

function ReviewRow({ label, children, wide = false }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium">{children}</dd>
    </div>
  );
}

// Backend expects full ISO strings; datetime-local gives "YYYY-MM-DDTHH:mm".
const toISO = (v) => (v ? new Date(v).toISOString() : "");

// Default unit for a new item: "pc" when the loaded list has it, else the
// first loaded option.
const defaultUnit = (opts) =>
  opts.some((o) => o.value === "pc") ? "pc" : (opts[0]?.value ?? "pc");

const emptyItem = (unit = "pc") => ({
  name: "",
  description: "",
  unit_of_measure: unit,
  quantity: 1,
  discount: "",
  attachment: null,
  special_handles: [],
});

const initialValues = (unit) => ({
  title: "",
  description: "",
  note: "",
  type: "quotation",
  method: "general sourcing",
  procedure: "open",
  spend_category: "construction",
  procurement_type: "product",
  priority: "non urgent",
  do_delivery: "self",
  delivery_address: "",
  delivery_deadline: "",
  start_datetime: new Date().toISOString().slice(0, 16),
  submission_datetime: new Date().toISOString().slice(0, 16),
  is_approved: true,
  region: "",
  district: "",
  items: [emptyItem(unit)],
});

export default function RFxCreateModal({ open, onOpenChange, onCreated }) {
  const { authAxios } = useAuth();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [typeChoices, setTypeChoices] = useState(TYPES);
  const [unitChoices, setUnitChoices] = useState(UNITS);
  const [spendCategoryChoices, setSpendCategoryChoices] =
    useState(SPEND_CATEGORIES);
  const [procurementTypeChoices, setProcurementTypeChoices] =
    useState(PROCUREMENT_TYPES);
  const [priorityChoices, setPriorityChoices] = useState(PRIORITIES);
  const [deliveryChoices, setDeliveryChoices] = useState(DELIVERY_OPTIONS);
  const [methodChoices, setMethodChoices] = useState(METHODS);
  const [procedureChoices, setProcedureChoices] = useState(PROCEDURES);
  const [regionChoices, setRegionChoices] = useState([]);
  const [districtChoices, setDistrictChoices] = useState([]);
  const [districtLoading, setDistrictLoading] = useState(false);

  const set = (patch) => setValues((v) => ({ ...v, ...patch }));
  const setItem = (i, patch) =>
    setValues((v) => {
      const items = [...v.items];
      items[i] = { ...items[i], ...patch };
      return { ...v, items };
    });

  // Load the backend enums (type, method, procedure, spend category,
  // procurement type, priority, delivery, unit) + regions once when the dialog
  // opens. Each falls back to its hardcoded list so the form still works if a
  // request fails.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    getMethodChoices()
      .then((data) => {
        if (cancelled) return;
        const opts = normalizeChoices(data);
        if (opts.length) {
          setMethodChoices(opts);
          setValues((v) =>
            opts.some((o) => o.value === v.method)
              ? v
              : { ...v, method: opts[0].value },
          );
        }
      })
      .catch(() => {
        if (!cancelled) setMethodChoices(METHODS);
      });

    getProcedureChoices()
      .then((data) => {
        if (cancelled) return;
        const opts = normalizeChoices(data);
        if (opts.length) {
          setProcedureChoices(opts);
          setValues((v) =>
            opts.some((o) => o.value === v.procedure)
              ? v
              : { ...v, procedure: opts[0].value },
          );
        }
      })
      .catch(() => {
        if (!cancelled) setProcedureChoices(PROCEDURES);
      });

    getDeliveryChoices()
      .then((data) => {
        if (cancelled) return;
        const opts = normalizeChoices(data);
        if (opts.length) {
          setDeliveryChoices(opts);
          setValues((v) =>
            opts.some((o) => o.value === v.do_delivery)
              ? v
              : { ...v, do_delivery: opts[0].value },
          );
        }
      })
      .catch(() => {
        if (!cancelled) setDeliveryChoices(DELIVERY_OPTIONS);
      });

    getProcurementTypeChoices()
      .then((data) => {
        if (cancelled) return;
        const opts = normalizeChoices(data);
        if (opts.length) {
          setProcurementTypeChoices(opts);
          setValues((v) =>
            opts.some((o) => o.value === v.procurement_type)
              ? v
              : { ...v, procurement_type: opts[0].value },
          );
        }
      })
      .catch(() => {
        if (!cancelled) setProcurementTypeChoices(PROCUREMENT_TYPES);
      });

    getPriorityChoices()
      .then((data) => {
        if (cancelled) return;
        const opts = normalizeChoices(data);
        if (opts.length) {
          setPriorityChoices(opts);
          setValues((v) =>
            opts.some((o) => o.value === v.priority)
              ? v
              : { ...v, priority: opts[0].value },
          );
        }
      })
      .catch(() => {
        if (!cancelled) setPriorityChoices(PRIORITIES);
      });

    getSpendCategoryChoices()
      .then((data) => {
        if (cancelled) return;
        const opts = normalizeChoices(data);
        if (opts.length) {
          setSpendCategoryChoices(opts);
          setValues((v) =>
            opts.some((o) => o.value === v.spend_category)
              ? v
              : { ...v, spend_category: opts[0].value },
          );
        }
      })
      .catch(() => {
        if (!cancelled) setSpendCategoryChoices(SPEND_CATEGORIES);
      });

    getRfxTypeChoices()
      .then((data) => {
        if (cancelled) return;
        const opts = normalizeChoices(data);
        if (opts.length) {
          setTypeChoices(opts);
          setValues((v) =>
            opts.some((o) => o.value === v.type)
              ? v
              : { ...v, type: opts[0].value },
          );
        }
      })
      .catch(() => {
        if (!cancelled) setTypeChoices(TYPES);
      });

    getUnitOfMeasureChoices()
      .then((data) => {
        if (cancelled) return;
        const opts = normalizeChoices(data);
        if (opts.length) {
          setUnitChoices(opts);
          const fallback = defaultUnit(opts);
          setValues((v) => ({
            ...v,
            items: v.items.map((it) =>
              opts.some((o) => o.value === it.unit_of_measure)
                ? it
                : { ...it, unit_of_measure: fallback },
            ),
          }));
        }
      })
      .catch(() => {
        if (!cancelled) setUnitChoices(UNITS);
      });

    getRegionChoices()
      .then((data) => {
        if (!cancelled) setRegionChoices(normalizeChoices(data));
      })
      .catch(() => {
        if (!cancelled) setRegionChoices([]);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  // Districts depend on the selected region.
  useEffect(() => {
    if (!values.region) {
      setDistrictChoices([]);
      return;
    }
    let cancelled = false;
    setDistrictLoading(true);
    getDistrictChoices(values.region)
      .then((data) => {
        if (!cancelled) setDistrictChoices(normalizeChoices(data));
      })
      .catch(() => {
        if (!cancelled) setDistrictChoices([]);
      })
      .finally(() => {
        if (!cancelled) setDistrictLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [values.region]);

  const reset = () => {
    setValues(initialValues(defaultUnit(unitChoices)));
    setStep(0);
  };

  const close = (o) => {
    onOpenChange(o);
    if (!o) reset();
  };

  const validateDetails = () => {
    {
      if (!values.title.trim()) {
        toast.error("Title is required");
        return false;
      }
      if (!values.description.trim()) {
        toast.error("Description is required");
        return false;
      }
      if (
        new Date(values.start_datetime) > new Date(values.submission_datetime)
      ) {
        toast.error("Submission date must be after the start date");
        return false;
      }
      if (
        values.delivery_deadline &&
        new Date(values.delivery_deadline) <
          new Date(values.submission_datetime)
      ) {
        toast.error("Delivery deadline must not be before the submission date");
        return false;
      }
    }
    return true;
  };

  const validateReach = () => {
    {
      const reachFields = ["region", "district"];
      if (reachFields.some((f) => values[f]) && !values.region) {
        toast.error("Region is required when providing reach details");
        return false;
      }
    }
    return true;
  };

  const validateItems = () => {
    {
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

  // The review step re-runs every earlier step's checks (stopping at the first
  // failure so only one toast shows) before the RFx is created.
  const validators = [validateDetails, validateReach, validateItems];
  const validateStep = () =>
    step === REVIEW_STEP ? validators.every((v) => v()) : validators[step]();

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
        "description",
        "note",
        "type",
        "method",
        "procedure",
        "spend_category",
        "procurement_type",
        "priority",
        "do_delivery",
        "delivery_address",
      ].forEach((k) => data.append(k, values[k]));
      ["start_datetime", "submission_datetime", "delivery_deadline"].forEach(
        (k) => {
          const iso = toISO(values[k]);
          if (iso) data.append(k, iso);
        },
      );
      data.append("is_approved", values.is_approved);

      const reachFields = ["region", "district"];
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
        if (item.discount !== "" && item.discount != null) {
          data.append(`items[${index}][discount]`, item.discount);
        }
        if (item.attachment instanceof File) {
          data.append(`items[${index}][attachment]`, item.attachment);
        }
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
              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Description <span className="text-destructive">*</span>
                </label>
                <Textarea
                  rows={3}
                  value={values.description}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="Describe what you are sourcing"
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
                    {spendCategoryChoices.map((o) => (
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
                    {typeChoices.map((o) => (
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
                    {methodChoices.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={labelClass}>Procurement type</label>
                <Select
                  value={values.procurement_type}
                  onValueChange={(v) => set({ procurement_type: v })}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {procurementTypeChoices.map((o) => (
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
                    {procedureChoices.map((o) => (
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
                    {priorityChoices.map((o) => (
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
              <div>
                <label className={labelClass}>Delivery</label>
                <Select
                  value={values.do_delivery}
                  onValueChange={(v) => set({ do_delivery: v })}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryChoices.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={labelClass}>Delivery deadline</label>
                <Input
                  type="datetime-local"
                  value={values.delivery_deadline}
                  onChange={(e) => set({ delivery_deadline: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Delivery address</label>
                <Input
                  value={values.delivery_address}
                  onChange={(e) => set({ delivery_address: e.target.value })}
                  placeholder="Where should items be delivered?"
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
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={values.is_approved}
                    onChange={(e) => set({ is_approved: e.target.checked })}
                    className="h-4 w-4 accent-[hsl(var(--brand))]"
                  />
                  Mark as approved
                </label>
                <p className="mt-1 pl-6 text-xs text-muted-foreground">
                  Only admins can approve — this may still require admin
                  confirmation.
                </p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <p className="text-sm text-muted-foreground sm:col-span-2">
                Optional — narrow who can see this RFx by location.
              </p>
              <div>
                <label className={labelClass}>Region</label>
                <Select
                  value={values.region}
                  onValueChange={(v) => set({ region: v, district: "" })}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regionChoices.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={labelClass}>District</label>
                <Select
                  value={values.district}
                  onValueChange={(v) => set({ district: v })}
                  disabled={!values.region || districtLoading}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue
                      placeholder={
                        !values.region
                          ? "Select a region first"
                          : districtLoading
                            ? "Loading districts…"
                            : "Select district"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {districtChoices.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                          {unitChoices.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className={labelClass}>Discount</label>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={item.discount}
                        onChange={(e) =>
                          setItem(i, { discount: e.target.value })
                        }
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Attachment</label>
                      <Input
                        type="file"
                        onChange={(e) =>
                          setItem(i, {
                            attachment: e.target.files?.[0] ?? null,
                          })
                        }
                      />
                      {item.attachment && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {item.attachment.name}
                        </p>
                      )}
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
                  setValues((v) => ({
                    ...v,
                    items: [...v.items, emptyItem(defaultUnit(unitChoices))],
                  }))
                }
                className="w-full gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add item
              </Button>
            </div>
          )}

          {step === REVIEW_STEP && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Check everything below before creating the RFx. Use Edit to jump
                back to a step.
              </p>

              <ReviewSection title="Details" onEdit={() => setStep(0)}>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                  <ReviewRow label="Title" wide>
                    {values.title || "—"}
                  </ReviewRow>
                  <ReviewRow label="Description" wide>
                    <span className="whitespace-pre-wrap font-normal">
                      {values.description || "—"}
                    </span>
                  </ReviewRow>
                  <ReviewRow label="Spend category">
                    {labelFor(spendCategoryChoices, values.spend_category)}
                  </ReviewRow>
                  <ReviewRow label="Type">
                    {labelFor(typeChoices, values.type)}
                  </ReviewRow>
                  <ReviewRow label="Method">
                    {labelFor(methodChoices, values.method)}
                  </ReviewRow>
                  <ReviewRow label="Procurement type">
                    {labelFor(procurementTypeChoices, values.procurement_type)}
                  </ReviewRow>
                  <ReviewRow label="Procedure">
                    {labelFor(procedureChoices, values.procedure)}
                  </ReviewRow>
                  <ReviewRow label="Priority">
                    {labelFor(priorityChoices, values.priority)}
                  </ReviewRow>
                  <ReviewRow label="Start date">
                    {fmtDateTime(values.start_datetime)}
                  </ReviewRow>
                  <ReviewRow label="Submission date">
                    {fmtDateTime(values.submission_datetime)}
                  </ReviewRow>
                  <ReviewRow label="Delivery">
                    {labelFor(deliveryChoices, values.do_delivery)}
                  </ReviewRow>
                  <ReviewRow label="Delivery deadline">
                    {fmtDateTime(values.delivery_deadline)}
                  </ReviewRow>
                  <ReviewRow label="Delivery address" wide>
                    {values.delivery_address || "—"}
                  </ReviewRow>
                  {values.note && (
                    <ReviewRow label="Note" wide>
                      <span className="whitespace-pre-wrap font-normal">
                        {values.note}
                      </span>
                    </ReviewRow>
                  )}
                  <ReviewRow label="Approval">
                    {values.is_approved ? "Marked as approved" : "Not approved"}
                  </ReviewRow>
                </dl>
              </ReviewSection>

              <ReviewSection title="Reach" onEdit={() => setStep(1)}>
                {values.region ? (
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                    <ReviewRow label="Region">
                      {labelFor(regionChoices, values.region)}
                    </ReviewRow>
                    <ReviewRow label="District">
                      {values.district
                        ? labelFor(districtChoices, values.district)
                        : "All districts"}
                    </ReviewRow>
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No reach restriction — open to the whole market.
                  </p>
                )}
              </ReviewSection>

              <ReviewSection
                title={`Items (${values.items.length})`}
                onEdit={() => setStep(2)}
              >
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/70 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-2 font-medium">#</th>
                        <th className="px-3 py-2 font-medium">Item</th>
                        <th className="px-3 py-2 text-right font-medium">Qty</th>
                        <th className="px-3 py-2 font-medium">Unit</th>
                        <th className="px-3 py-2 text-right font-medium">
                          Discount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {values.items.map((it, i) => (
                        <tr key={i} className="align-top">
                          <td className="px-3 py-2 text-muted-foreground">
                            {i + 1}
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-medium">{it.name || "—"}</p>
                            {it.description && (
                              <p className="text-xs text-muted-foreground">
                                {it.description}
                              </p>
                            )}
                            {it.special_handles?.length > 0 && (
                              <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">
                                {it.special_handles.map((h, j) => (
                                  <li key={j}>
                                    {typeof h === "string"
                                      ? h
                                      : h?.handling_description || ""}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {it.attachment && (
                              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Paperclip className="h-3 w-3" />
                                {it.attachment.name || "Attachment"}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {it.quantity}
                          </td>
                          <td className="px-3 py-2">
                            {labelFor(unitChoices, it.unit_of_measure)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {it.discount !== "" && it.discount != null
                              ? it.discount
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ReviewSection>
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
