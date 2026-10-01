import { useEffect, useState } from "react";
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
import { getRegionChoices } from "@/services/api/waitlist.service";
import { getDistrictChoices } from "@/services/api/transporters.service";
import {
  getExtraValueChoices,
  getPriorityChoices,
  getProcedureChoices,
  getUnitOfMeasureChoices,
} from "@/services/api/choices.service";
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
  { value: "pc", label: "Piece (pc)" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "liter", label: "Liter (L)" },
];
// Sentinel for the optional extra_value Select (Radix items can't be "").
const NO_EXTRA_VALUE = "__none__";

const STEPS = ["Details", "Reach", "Items"];
const labelClass = "mb-1 block text-sm font-medium text-foreground";

// Default unit for a new item: "pc" when the loaded list has it, else the
// first loaded option.
const defaultUnit = (opts) =>
  opts.some((o) => o.value === "pc") ? "pc" : (opts[0]?.value ?? "pc");

const emptyItem = (unit = "pc") => ({
  name: "",
  description: "",
  unit_of_measure: unit,
  unit_price: "",
  quantity: 1,
  extra_value: "",
  extra_value_TnCs: "",
  attachment: null,
  special_handles: [],
});

const initialValues = (unit) => ({
  title: "",
  description: "",
  procedure: "open",
  priority: "non urgent",
  origin: "",
  destination: "",
  start_datetime: new Date().toISOString().slice(0, 16),
  submission_datetime: new Date().toISOString().slice(0, 16),
  departure_datetime: new Date().toISOString().slice(0, 16),
  expected_delivery_date: new Date().toISOString().slice(0, 10),
  delivery_deadline: new Date().toISOString().slice(0, 16),
  is_approved: true,
  region: "",
  district: "",
  items: [emptyItem(unit)],
});

// Backend expects full ISO strings for datetime fields.
const toIso = (v) => new Date(v).toISOString();

export default function WaybillCreateModal({ open, onOpenChange, onCreated }) {
  const { authAxios, companyId, transporterId, userProfileId } = useAuth();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [regionChoices, setRegionChoices] = useState([]);
  const [regionLoading, setRegionLoading] = useState(false);
  const [districtChoices, setDistrictChoices] = useState([]);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [unitChoices, setUnitChoices] = useState(UNITS);
  const [priorityChoices, setPriorityChoices] = useState(PRIORITIES);
  const [procedureChoices, setProcedureChoices] = useState(PROCEDURES);
  // Empty => extra_value renders as a free-text Input (fallback).
  const [extraValueChoices, setExtraValueChoices] = useState([]);

  const set = (patch) => setValues((v) => ({ ...v, ...patch }));
  const setItem = (i, patch) =>
    setValues((v) => {
      const items = [...v.items];
      items[i] = { ...items[i], ...patch };
      return { ...v, items };
    });

  // Backend enums: priority and units fall back to their hardcoded lists and
  // extra_value falls back to a plain text Input, so the form still works if
  // a request fails.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

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

    getExtraValueChoices()
      .then((data) => {
        if (!cancelled) setExtraValueChoices(normalizeChoices(data));
      })
      .catch(() => {
        if (!cancelled) setExtraValueChoices([]);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  // Regions come from the shared /region-choices/ endpoint.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setRegionLoading(true);
    getRegionChoices()
      .then((d) => {
        if (!cancelled) setRegionChoices(normalizeChoices(d));
      })
      .catch(() => {
        if (!cancelled) setRegionChoices([]);
      })
      .finally(() => {
        if (!cancelled) setRegionLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

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

  const validateStep = () => {
    if (step === 0) {
      if (!values.title.trim()) {
        toast.error("Title is required");
        return false;
      }
      if (!values.origin.trim()) {
        toast.error("Origin is required");
        return false;
      }
      if (!values.destination.trim()) {
        toast.error("Destination is required");
        return false;
      }
      if (!values.expected_delivery_date) {
        toast.error("Expected delivery date is required");
        return false;
      }
      if (
        new Date(values.submission_datetime) < new Date(values.start_datetime)
      ) {
        toast.error("Submission date must be after the start date");
        return false;
      }
      if (
        new Date(values.departure_datetime) < new Date(values.start_datetime)
      ) {
        toast.error("Departure date must be after the start date");
        return false;
      }
      if (
        new Date(values.delivery_deadline) < new Date(values.departure_datetime)
      ) {
        toast.error("Delivery deadline must be after the departure date");
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
        if (it.unit_price === "" || Number(it.unit_price) <= 0) {
          toast.error("Item unit price must be greater than 0");
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
      data.append("title", values.title);
      data.append("note", values.description);
      data.append("procedure", values.procedure);
      data.append("priority", values.priority);
      data.append("origin", values.origin);
      data.append("destination", values.destination);
      data.append("start_datetime", toIso(values.start_datetime));
      data.append("submission_datetime", toIso(values.submission_datetime));
      data.append("departure_datetime", toIso(values.departure_datetime));
      data.append("expected_delivery_date", values.expected_delivery_date);
      data.append("delivery_deadline", toIso(values.delivery_deadline));
      data.append("is_approved", values.is_approved);

      if (values.region) data.append("reach[region]", values.region);
      if (values.district) data.append("reach[district]", values.district);

      values.items.forEach((item, index) => {
        data.append(`items[${index}][name]`, item.name);
        if (item.description)
          data.append(`items[${index}][description]`, item.description);
        data.append(`items[${index}][unit_of_measure]`, item.unit_of_measure);
        data.append(`items[${index}][unit_price]`, item.unit_price);
        data.append(`items[${index}][quantity]`, item.quantity);
        if (item.extra_value)
          data.append(`items[${index}][extra_value]`, item.extra_value);
        if (item.extra_value_TnCs)
          data.append(
            `items[${index}][extra_value_TnCs]`,
            item.extra_value_TnCs,
          );
        if (item.attachment instanceof File)
          data.append(`items[${index}][attachment]`, item.attachment);
        item.special_handles.forEach((h, hi) => {
          data.append(
            `items[${index}][special_handles][${hi}][handling_description]`,
            h.handling_description,
          );
        });
      });

      const issuingType = companyId ? "company.Company" : "company.Transporter";
      const issuingId = companyId || transporterId;
      data.append("issuing_company_content_type", issuingType);
      data.append("issuing_company_object_id", issuingId);
      data.append("employee", userProfileId);

      await authAxios.post("waybills/", data);
      toast.success("Waybill created successfully!");
      onCreated?.();
      close(false);
    } catch (error) {
      toast.error(
        error.response?.data?.non_field_errors?.[0] ||
          error.response?.data?.title?.[0] ||
          error.response?.data?.detail ||
          "Failed to create waybill.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto font-montserrat sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create waybill</DialogTitle>
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
                  placeholder="Enter waybill title"
                  maxLength={128}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Description</label>
                <Textarea
                  rows={2}
                  value={values.description}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="Enter description"
                  maxLength={500}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Origin <span className="text-destructive">*</span>
                </label>
                <Input
                  value={values.origin}
                  onChange={(e) => set({ origin: e.target.value })}
                  placeholder="Supplier's address"
                  maxLength={255}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Destination <span className="text-destructive">*</span>
                </label>
                <Input
                  value={values.destination}
                  onChange={(e) => set({ destination: e.target.value })}
                  placeholder="Issuer's preferred address"
                  maxLength={255}
                />
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
                <label className={labelClass}>Submission due date</label>
                <Input
                  type="datetime-local"
                  value={values.submission_datetime}
                  onChange={(e) => set({ submission_datetime: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Departure date</label>
                <Input
                  type="datetime-local"
                  value={values.departure_datetime}
                  onChange={(e) => set({ departure_datetime: e.target.value })}
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
              <div>
                <label className={labelClass}>
                  Expected delivery date{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  value={values.expected_delivery_date}
                  onChange={(e) =>
                    set({ expected_delivery_date: e.target.value })
                  }
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
                Optional — define the delivery location.
              </p>
              <div>
                <label className={labelClass}>Region</label>
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
                    {regionChoices.length ? (
                      regionChoices.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {regionLoading ? "Loading…" : "No regions available"}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={labelClass}>District</label>
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
                    {districtChoices.length ? (
                      districtChoices.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {districtLoading ? "Loading…" : "No districts available"}
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
                      <label className={labelClass}>
                        Unit price <span className="text-destructive">*</span>
                      </label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) =>
                          setItem(i, { unit_price: e.target.value })
                        }
                        placeholder="0.00"
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
                      <label className={labelClass}>Attachment</label>
                      <Input
                        type="file"
                        onChange={(e) =>
                          setItem(i, {
                            attachment: e.target.files?.[0] ?? null,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Extra value</label>
                      {extraValueChoices.length ? (
                        <Select
                          value={item.extra_value || NO_EXTRA_VALUE}
                          onValueChange={(v) =>
                            setItem(i, {
                              extra_value: v === NO_EXTRA_VALUE ? "" : v,
                            })
                          }
                        >
                          <SelectTrigger className="h-10 w-full">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NO_EXTRA_VALUE}>None</SelectItem>
                            {extraValueChoices.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={item.extra_value}
                          onChange={(e) =>
                            setItem(i, { extra_value: e.target.value })
                          }
                          placeholder="e.g. extended warranty"
                          maxLength={255}
                        />
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>Extra value terms</label>
                      <Input
                        value={item.extra_value_TnCs}
                        onChange={(e) =>
                          setItem(i, { extra_value_TnCs: e.target.value })
                        }
                        placeholder="Terms and conditions for the extra value"
                        maxLength={500}
                      />
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
                          maxLength={500}
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
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add special handle
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
                "Create waybill"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
