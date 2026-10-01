import { useEffect, useState } from "react";
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
import { getRegionChoices } from "@/services/api/waitlist.service";
import { getDistrictChoices } from "@/services/api/transporters.service";
import {
  getMethodChoices,
  getPriorityChoices,
  getProcedureChoices,
  getProcurementTypeChoices,
  getSpendCategoryChoices,
  getTenderTypeChoices,
  getUnitOfMeasureChoices,
} from "@/services/api/choices.service";
import { normalizeChoices } from "@/utils/choices";

// Fallback only — the live list comes from GET spend-category-choices/.
const SPEND_CATEGORIES = [
  { value: "construction", label: "Construction" },
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "professional_services", label: "Professional Services" },
];
// Fallback only — the live list comes from GET tender/type-choices/.
const TYPES = [
  { value: "nct", label: "National competitive tendering" },
  { value: "ict", label: "International competitive tendering" },
];
// Fallback only — the live list comes from GET procedure-choices/.
const PROCEDURES = [
  { value: "open", label: "Open" },
  { value: "sealed", label: "Sealed" },
];
// Fallback only — the live list comes from GET method-choices/.
const METHODS = [
  { value: "general sourcing", label: "General Sourcing" },
  { value: "client sourcing", label: "Client Sourcing" },
];
// Fallback only — the live list comes from GET priority-choices/.
const PRIORITIES = [
  { value: "non urgent", label: "Non-Urgent" },
  { value: "urgent", label: "Urgent" },
];
// Fallback only — the live list comes from GET procurement/type-choices/.
const PROCUREMENT_TYPES = [
  { value: "product", label: "Product" },
  { value: "project", label: "Project" },
  { value: "service", label: "Service" },
];
// Fallback only — the live list comes from GET item/unit-of-measure-choices/.
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
  special_handling: [],
});

const initialValues = (unit) => ({
  title: "",
  description: "",
  note: "",
  spend_category: "construction",
  type: "nct",
  procedure: "open",
  method: "general sourcing",
  priority: "non urgent",
  procurement_type: "product",
  start_datetime: new Date().toISOString().slice(0, 16),
  submission_datetime: new Date().toISOString().slice(0, 16),
  delivery_deadline: new Date().toISOString().slice(0, 16),
  is_approved: true,
  region: "",
  district: "",
  items: [emptyItem(unit)],
  attachments: [],
});

// Backend expects full ISO strings; datetime-local inputs give "YYYY-MM-DDTHH:mm".
const toIso = (v) => new Date(v).toISOString();
const isValidDate = (v) => v && !Number.isNaN(new Date(v).getTime());

export default function TenderCreateModal({ open, onOpenChange, onCreated }) {
  const { authAxios } = useAuth();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [regionChoices, setRegionChoices] = useState([]);
  const [regionLoading, setRegionLoading] = useState(false);
  const [districtChoices, setDistrictChoices] = useState([]);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [unitChoices, setUnitChoices] = useState(UNITS);
  const [spendCategoryChoices, setSpendCategoryChoices] =
    useState(SPEND_CATEGORIES);
  const [procurementTypeChoices, setProcurementTypeChoices] =
    useState(PROCUREMENT_TYPES);
  const [priorityChoices, setPriorityChoices] = useState(PRIORITIES);
  const [typeChoices, setTypeChoices] = useState(TYPES);
  const [methodChoices, setMethodChoices] = useState(METHODS);
  const [procedureChoices, setProcedureChoices] = useState(PROCEDURES);

  // Backend enums (type, method, procedure, spend category, procurement type,
  // priority, unit) load when the dialog opens; each falls back to its
  // hardcoded list so the form still works if a request fails.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    getTenderTypeChoices()
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
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Regions come from the shared /region-choices/ endpoint (backend slugs).
  useEffect(() => {
    if (!open || regionChoices.length) return;
    let cancelled = false;
    setRegionLoading(true);
    getRegionChoices()
      .then((d) => {
        if (!cancelled) setRegionChoices(normalizeChoices(d));
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load regions.");
      })
      .finally(() => {
        if (!cancelled) setRegionLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, regionChoices.length]);

  // Districts depend on the selected region (/district-choices/?region=…).
  useEffect(() => {
    if (!values.region) {
      setDistrictChoices([]);
      return;
    }
    let cancelled = false;
    setDistrictLoading(true);
    getDistrictChoices(values.region)
      .then((d) => {
        if (!cancelled) setDistrictChoices(normalizeChoices(d));
      })
      .catch(() => {
        if (!cancelled) {
          setDistrictChoices([]);
          toast.error("Couldn't load districts.");
        }
      })
      .finally(() => {
        if (!cancelled) setDistrictLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [values.region]);

  const set = (patch) => setValues((v) => ({ ...v, ...patch }));
  const setItem = (i, patch) =>
    setValues((v) => {
      const items = [...v.items];
      items[i] = { ...items[i], ...patch };
      return { ...v, items };
    });

  const reset = () => {
    setValues(initialValues(defaultUnit(unitChoices)));
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
      if (!values.description.trim()) {
        toast.error("Description is required");
        return false;
      }
      if (
        !isValidDate(values.start_datetime) ||
        !isValidDate(values.submission_datetime) ||
        !isValidDate(values.delivery_deadline)
      ) {
        toast.error("Start, submission and delivery dates are required");
        return false;
      }
      const start = new Date(values.start_datetime);
      const submission = new Date(values.submission_datetime);
      const delivery = new Date(values.delivery_deadline);
      if (submission < start) {
        toast.error("Submission date must be after the start date");
        return false;
      }
      if (delivery < submission) {
        toast.error("Delivery deadline must not be before the submission date");
        return false;
      }
    }
    if (step === 1) {
      if (!values.region) {
        toast.error("Region is required");
        return false;
      }
      if (!values.district) {
        toast.error("District is required");
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
        "description",
        "spend_category",
        "type",
        "procedure",
        "method",
        "priority",
        "procurement_type",
        "note",
      ].forEach((k) => data.append(k, values[k]));
      data.append("start_datetime", toIso(values.start_datetime));
      data.append("submission_datetime", toIso(values.submission_datetime));
      data.append("delivery_deadline", toIso(values.delivery_deadline));
      data.append("is_approved", values.is_approved);

      if (values.region) data.append("reach[region]", values.region);
      if (values.district) data.append("reach[district]", values.district);

      values.items.forEach((item, index) => {
        data.append(`items[${index}][name]`, item.name);
        if (item.description)
          data.append(`items[${index}][description]`, item.description);
        data.append(`items[${index}][quantity]`, item.quantity);
        data.append(`items[${index}][unit_of_measure]`, item.unit_of_measure);
        if (item.discount !== "" && item.discount != null)
          data.append(`items[${index}][discount]`, item.discount);
        if (item.attachment instanceof File)
          data.append(`items[${index}][attachment]`, item.attachment);
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
              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Description <span className="text-destructive">*</span>
                </label>
                <Textarea
                  rows={3}
                  value={values.description}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="Describe what this tender is for"
                  maxLength={2000}
                />
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
                <label className={labelClass}>Supplier market</label>
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
                <label className={labelClass}>Submission due date</label>
                <Input
                  type="datetime-local"
                  value={values.submission_datetime}
                  onChange={(e) => set({ submission_datetime: e.target.value })}
                />
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
                <label className={labelClass}>Note</label>
                <Textarea
                  rows={2}
                  value={values.note}
                  onChange={(e) => set({ note: e.target.value })}
                  placeholder="Any additional notes"
                  maxLength={500}
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
                Define the location this tender reaches.
              </p>
              <div>
                <label className={labelClass}>
                  Region <span className="text-destructive">*</span>
                </label>
                <Select
                  value={values.region || undefined}
                  onValueChange={(v) => set({ region: v, district: "" })}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue
                      placeholder={
                        regionLoading ? "Loading regions…" : "Select a region"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {regionLoading ? (
                      <div className="flex items-center justify-center py-2 text-sm">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Loading…
                      </div>
                    ) : regionChoices.length ? (
                      regionChoices.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="py-2 text-center text-sm text-muted-foreground">
                        No regions available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={labelClass}>
                  District <span className="text-destructive">*</span>
                </label>
                <Select
                  value={values.district || undefined}
                  onValueChange={(v) => set({ district: v })}
                  disabled={!values.region}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue
                      placeholder={
                        !values.region
                          ? "Select a region first"
                          : districtLoading
                            ? "Loading districts…"
                            : "Select a district"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {districtLoading && !districtChoices.length ? (
                      <div className="flex items-center justify-center py-2 text-sm">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Loading…
                      </div>
                    ) : districtChoices.length ? (
                      districtChoices.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="py-2 text-center text-sm text-muted-foreground">
                        No districts available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
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
                            attachment: e.target.files?.[0] || null,
                          })
                        }
                      />
                      {item.attachment && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.attachment.name}
                        </p>
                      )}
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
