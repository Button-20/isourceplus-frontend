import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft, ReceiptText, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCurrencyChoices,
  getDeliveryChoices,
  getExtraValueChoices,
  getPriorityChoices,
  getVatTypeChoices,
} from "@/services/api/choices.service";
import { normalizeChoices } from "@/utils/choices";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

// Fallbacks used when the backend choices endpoints are unreachable. These
// match the values the backend spec confirms.
const CURRENCY_FALLBACK = [{ value: "GHS", label: "GHS (Ghana Cedi)" }];
const VAT_TYPE_FALLBACK = [
  { value: "exclusive", label: "VAT exclusive" },
  { value: "inclusive", label: "VAT inclusive" },
];
// Fallback only — the live list comes from GET delivery-choices/.
const DELIVERY_FALLBACK = [{ value: "self", label: "Self delivery" }];
// Fallback only — the live list comes from GET priority-choices/.
const PRIORITY_FALLBACK = [
  { value: "urgent", label: "Urgent" },
  { value: "non urgent", label: "Non-Urgent" },
];
// Radix Select cannot represent "" as an item value, so the optional
// extra_value Select uses this sentinel for "no extra value".
const NONE = "__none__";

const emptyItem = (item = {}) => ({
  name: item.name || "N/A",
  description: item.description || "N/A",
  unit_of_measure: item.unit_of_measure || "",
  quantity: item.quantity || 0,
  unit_price: "0.00",
  special_handles: Array.isArray(item.special_handles)
    ? item.special_handles
    : [],
  // Company-only item fields (ignored / never sent for transporters).
  is_tax_exempt: false,
  discount: "",
  extra_value: "",
  extra_value_TnCs: "",
  attachment: null,
});

// Flatten a payload object into multipart FormData using the backend bracket
// notation (items[0][name], items[0][special_handles][1][handling_description]).
function appendToFormData(form, value, key) {
  if (value === undefined || value === null) return;
  if (value instanceof File) {
    form.append(key, value);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => appendToFormData(form, v, `${key}[${i}]`));
  } else if (typeof value === "object") {
    Object.entries(value).forEach(([k, v]) =>
      appendToFormData(form, v, key ? `${key}[${k}]` : k),
    );
  } else {
    form.append(key, String(value));
  }
}

/**
 * Shared branded form for creating a proforma invoice as an offer in response
 * to an RFx, tender, or waybill event. `mode` selects the `mn` query param and
 * the role permitted to submit; `hasItems` toggles the auto-generated item rows.
 *
 * Field gating (final backend spec):
 *  - Common: name, title, description, notes, priority, currency,
 *    start_datetime, submission_datetime, items[].{name, description,
 *    unit_of_measure, quantity, unit_price, special_handles}.
 *  - Company-only: spend_category, do_delivery, vat_type, items[].{attachment,
 *    is_tax_exempt, discount, extra_value, extra_value_TnCs}.
 *  - Transporter-only: vehicle_number, driver_name, driver_phone, eta.
 */
export default function ProformaOfferForm({
  mode,
  allowedRole,
  heading,
  hasItems = false,
  defaultDescription = "",
  backTo = "/dashboard/proforma-invoices",
}) {
  const { authAxios, jobTitle } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // Transporter (waybill) offers are submitted by logistics managers. The
  // backend spec marks spend_category / do_delivery / vat_type and the
  // company-only item fields as "N/A for transporters": they are hidden and
  // omitted from the payload, and the transporter block is shown instead.
  const isTransporter =
    mode === "waybill" || allowedRole === "logistics manager";
  const [formValues, setFormValues] = useState({
    name: "",
    title: "New proforma invoice",
    description: defaultDescription,
    notes: "",
    spend_category: "",
    priority: "urgent",
    currency: "GHS",
    do_delivery: "self",
    vat_type: "exclusive",
    // Transporter-only
    vehicle_number: "",
    driver_name: "",
    driver_phone: "",
    eta: "",
    items: [],
  });
  const [currencyChoices, setCurrencyChoices] = useState(CURRENCY_FALLBACK);
  const [priorityChoices, setPriorityChoices] = useState(PRIORITY_FALLBACK);
  const [deliveryChoices, setDeliveryChoices] = useState(DELIVERY_FALLBACK);
  const [vatTypeChoices, setVatTypeChoices] = useState(VAT_TYPE_FALLBACK);
  // null = endpoint failed/empty -> fall back to a free-text input.
  const [extraValueChoices, setExtraValueChoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Backend-owned enums; each falls back to the hardcoded list on failure.
  useEffect(() => {
    let cancelled = false;
    getCurrencyChoices()
      .then((d) => {
        const list = normalizeChoices(d);
        if (cancelled || list.length === 0) return;
        setCurrencyChoices(list);
        setFormValues((prev) =>
          list.some((c) => c.value === prev.currency)
            ? prev
            : { ...prev, currency: list[0].value },
        );
      })
      .catch((error) => console.error("Fetch currency choices error:", error));
    getPriorityChoices()
      .then((d) => {
        const list = normalizeChoices(d);
        if (cancelled || list.length === 0) return;
        setPriorityChoices(list);
        setFormValues((prev) =>
          list.some((c) => c.value === prev.priority)
            ? prev
            : { ...prev, priority: list[0].value },
        );
      })
      .catch((error) => console.error("Fetch priority choices error:", error));
    if (!isTransporter) {
      getDeliveryChoices()
        .then((d) => {
          const list = normalizeChoices(d);
          if (cancelled || list.length === 0) return;
          setDeliveryChoices(list);
          setFormValues((prev) =>
            list.some((c) => c.value === prev.do_delivery)
              ? prev
              : { ...prev, do_delivery: list[0].value },
          );
        })
        .catch((error) =>
          console.error("Fetch delivery choices error:", error),
        );
      getVatTypeChoices()
        .then((d) => {
          const list = normalizeChoices(d);
          if (cancelled || list.length === 0) return;
          setVatTypeChoices(list);
          setFormValues((prev) =>
            list.some((c) => c.value === prev.vat_type)
              ? prev
              : { ...prev, vat_type: list[0].value },
          );
        })
        .catch((error) =>
          console.error("Fetch VAT type choices error:", error),
        );
      getExtraValueChoices()
        .then((d) => {
          if (cancelled) return;
          const list = normalizeChoices(d);
          setExtraValueChoices(list.length > 0 ? list : null);
        })
        .catch((error) => {
          console.error("Fetch extra value choices error:", error);
          if (!cancelled) setExtraValueChoices(null);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [isTransporter]);

  useEffect(() => {
    const fetchAutoPopulationData = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const eventRefNum = params.get("event_ref_num");
        const response = await authAxios.get(
          `proforma-invoices/create-offer/?event_ref_num=${eventRefNum}&mn=${mode}`,
        );
        const { spend_category, items } = response.data.auto_population_data;
        setFormValues((prev) => ({
          ...prev,
          spend_category: spend_category || "",
          items: hasItems && Array.isArray(items) ? items.map(emptyItem) : [],
        }));
      } catch (error) {
        toast.error("Failed to load auto-population data.");
        console.error("Fetch auto-population error:", error);
      } finally {
        setLoading(false);
      }
    };
    if (jobTitle === allowedRole) {
      fetchAutoPopulationData();
    } else {
      setLoading(false);
    }
  }, [authAxios, location, jobTitle, mode, hasItems, allowedRole]);

  const setField = (key, value) =>
    setFormValues((prev) => ({ ...prev, [key]: value }));

  const setItem = (index, patch) =>
    setFormValues((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], ...patch };
      return { ...prev, items };
    });

  // Build the role-specific payload. Company-only and transporter-only fields
  // are omitted entirely (not sent as empty) for the other role.
  const buildPayload = () => {
    const now = new Date().toISOString();
    const payload = {
      name: formValues.name,
      title: formValues.title,
      description: formValues.description,
      notes: formValues.notes,
      priority: formValues.priority,
      currency: formValues.currency,
      start_datetime: now,
      submission_datetime: now,
      items: formValues.items.map((item) => {
        const base = {
          name: item.name,
          description: item.description,
          unit_of_measure: item.unit_of_measure,
          quantity: item.quantity,
          unit_price: item.unit_price,
          special_handles: item.special_handles.map((h) => ({
            handling_description: h.handling_description,
          })),
        };
        if (isTransporter) return base;
        const companyItem = {
          ...base,
          is_tax_exempt: Boolean(item.is_tax_exempt),
        };
        if (item.discount !== "") companyItem.discount = item.discount;
        if (item.extra_value) companyItem.extra_value = item.extra_value;
        if (item.extra_value_TnCs)
          companyItem.extra_value_TnCs = item.extra_value_TnCs;
        if (item.attachment instanceof File)
          companyItem.attachment = item.attachment;
        return companyItem;
      }),
    };
    if (isTransporter) {
      payload.vehicle_number = formValues.vehicle_number;
      payload.driver_name = formValues.driver_name;
      payload.driver_phone = formValues.driver_phone;
      if (formValues.eta) payload.eta = formValues.eta; // "YYYY-MM-DD"
    } else {
      payload.spend_category = formValues.spend_category;
      payload.do_delivery = formValues.do_delivery;
      payload.vat_type = formValues.vat_type;
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const params = new URLSearchParams(location.search);
      const eventRefNum = params.get("event_ref_num");
      const payload = buildPayload();
      // Attachments are company-only; when one is chosen the request must be
      // multipart with bracket keys, otherwise keep the JSON POST.
      const hasFile =
        !isTransporter &&
        payload.items.some((item) => item.attachment instanceof File);
      let body = payload;
      if (hasFile) {
        body = new FormData();
        appendToFormData(body, payload, "");
      }
      const response = await authAxios.post(
        `proforma-invoices/create-offer/?event_ref_num=${eventRefNum}&mn=${mode}`,
        body,
      );
      // A 2xx is success regardless of the envelope. The backend has returned
      // either a flat `{ url }` or, more recently,
      // `{ detail, message, event_data: { url, ref_num? }, waybill_data? }`
      // (transporter offers auto-create a waybill). Pull the new invoice's
      // ref from whichever is present and never fail a created offer on
      // envelope shape alone.
      const data = response.data ?? {};
      const eventData =
        data.event_data && typeof data.event_data === "object"
          ? data.event_data
          : {};
      const url = String(eventData.url ?? data.url ?? "");
      const refNum =
        eventData.ref_num ??
        data.ref_num ??
        url.match(/proforma-invoices\/([^/?#]+)/)?.[1] ??
        "";
      toast.success(
        data.message
          ? `Proforma invoice created. ${data.message}`
          : "Proforma invoice created successfully!",
      );
      navigate(refNum ? `/dashboard/proforma-invoices/${refNum}` : backTo);
    } catch (error) {
      const data = error.response?.data;
      toast.error(
        data?.message ||
          data?.detail ||
          data?.non_field_errors?.[0] ||
          "Failed to create proforma invoice.",
      );
      console.error("Create proforma invoice error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (jobTitle !== allowedRole) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center font-montserrat">
        <div className="rounded-2xl border border-border/70 bg-card p-8">
          <p className="font-display text-lg font-semibold">Access denied</p>
          <p className="mt-2 text-sm text-muted-foreground">
            You do not have permission to create this offer.
          </p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => navigate(backTo)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 font-montserrat">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <ReceiptText className="h-6 w-6" />
            </span>
            <h1 className="font-display text-2xl font-bold">{heading}</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(backTo)}
            className="border-white/40 bg-white/10 text-brand-foreground hover:bg-white/20"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-border/70 bg-card p-6"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Name</label>
            <Input
              required
              placeholder="Offer name"
              value={formValues.name}
              onChange={(e) => setField("name", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Title</label>
            <Input
              value={formValues.title}
              onChange={(e) => setField("title", e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <Textarea
            rows={3}
            value={formValues.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>
            Notes{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Textarea
            rows={3}
            placeholder="Any additional notes for this offer"
            value={formValues.notes}
            onChange={(e) => setField("notes", e.target.value)}
          />
        </div>
        {!isTransporter && (
          <div>
            <label className={labelClass}>
              Spend category
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                <Sparkles className="h-3 w-3" /> Auto-populated
              </span>
            </label>
            <Input
              value={formValues.spend_category}
              readOnly
              className="bg-muted/40"
            />
          </div>
        )}
        <div>
          <label className={labelClass}>Priority</label>
          <Select
            value={formValues.priority}
            onValueChange={(v) => setField("priority", v)}
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
        <div className={`grid gap-5 ${isTransporter ? "" : "sm:grid-cols-3"}`}>
          <div>
            <label className={labelClass}>Currency</label>
            <Select
              value={formValues.currency}
              onValueChange={(v) => setField("currency", v)}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencyChoices.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!isTransporter && (
            <>
              <div>
                <label className={labelClass}>Delivery</label>
                <Select
                  value={formValues.do_delivery}
                  onValueChange={(v) => setField("do_delivery", v)}
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
                <label className={labelClass}>VAT type</label>
                <Select
                  value={formValues.vat_type}
                  onValueChange={(v) => setField("vat_type", v)}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vatTypeChoices.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        {isTransporter && (
          <div>
            <h2 className="mb-3 font-display text-base font-semibold">
              Transport details
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Vehicle number</label>
                <Input
                  required
                  placeholder="e.g. GT-VF-3357"
                  value={formValues.vehicle_number}
                  onChange={(e) => setField("vehicle_number", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Driver name</label>
                <Input
                  required
                  placeholder="Driver full name"
                  value={formValues.driver_name}
                  onChange={(e) => setField("driver_name", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Driver phone</label>
                <Input
                  required
                  type="tel"
                  placeholder="e.g. 0241234567"
                  value={formValues.driver_phone}
                  onChange={(e) => setField("driver_phone", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>
                  ETA{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <Input
                  type="date"
                  value={formValues.eta}
                  onChange={(e) => setField("eta", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {hasItems && (
          <div>
            <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
              Items
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                <Sparkles className="h-3 w-3" /> Auto-generated
              </span>
            </h2>
            {formValues.items.length > 0 ? (
              <div className="space-y-4">
                {formValues.items.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-border/70 p-4 text-sm"
                  >
                    <p>
                      <span className="font-medium text-muted-foreground">
                        Name:
                      </span>{" "}
                      {item.name}
                    </p>
                    <p>
                      <span className="font-medium text-muted-foreground">
                        Description:
                      </span>{" "}
                      {item.description}
                    </p>
                    <p>
                      <span className="font-medium text-muted-foreground">
                        Quantity:
                      </span>{" "}
                      {item.quantity} {item.unit_of_measure}
                    </p>
                    <p>
                      <span className="font-medium text-muted-foreground">
                        Special handling:
                      </span>{" "}
                      {item.special_handles.length > 0
                        ? item.special_handles
                            .map((h) => h.handling_description)
                            .join(", ")
                        : "None"}
                    </p>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelClass}>Unit price</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) =>
                            setItem(index, { unit_price: e.target.value })
                          }
                        />
                      </div>
                      {!isTransporter && (
                        <>
                          <div>
                            <label className={labelClass}>
                              Discount{" "}
                              <span className="font-normal text-muted-foreground">
                                (optional)
                              </span>
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={item.discount}
                              onChange={(e) =>
                                setItem(index, { discount: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <label className={labelClass}>
                              Extra value{" "}
                              <span className="font-normal text-muted-foreground">
                                (optional)
                              </span>
                            </label>
                            {extraValueChoices === null ? (
                              <Input
                                placeholder="e.g. extended warranty"
                                maxLength={255}
                                value={item.extra_value}
                                onChange={(e) =>
                                  setItem(index, {
                                    extra_value: e.target.value,
                                  })
                                }
                              />
                            ) : (
                              <Select
                                value={item.extra_value || NONE}
                                onValueChange={(v) =>
                                  setItem(index, {
                                    extra_value: v === NONE ? "" : v,
                                  })
                                }
                              >
                                <SelectTrigger className="h-10 w-full">
                                  <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={NONE}>None</SelectItem>
                                  {extraValueChoices.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                      {o.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <div>
                            <label className={labelClass}>
                              Extra value terms{" "}
                              <span className="font-normal text-muted-foreground">
                                (optional)
                              </span>
                            </label>
                            <Input
                              placeholder="Terms and conditions for the extra value"
                              maxLength={500}
                              value={item.extra_value_TnCs}
                              onChange={(e) =>
                                setItem(index, {
                                  extra_value_TnCs: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className={labelClass}>
                              Attachment{" "}
                              <span className="font-normal text-muted-foreground">
                                (optional)
                              </span>
                            </label>
                            <Input
                              type="file"
                              onChange={(e) =>
                                setItem(index, {
                                  attachment: e.target.files?.[0] ?? null,
                                })
                              }
                            />
                          </div>
                          <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-foreground">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-border accent-brand"
                              checked={item.is_tax_exempt}
                              onChange={(e) =>
                                setItem(index, {
                                  is_tax_exempt: e.target.checked,
                                })
                              }
                            />
                            Tax exempt
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No items available.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-border pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(backTo)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-brand-gradient text-brand-foreground hover:opacity-90"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save proforma invoice
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
