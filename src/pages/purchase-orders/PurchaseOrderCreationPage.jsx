import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft, AlertCircle, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getPurchaseOrderTypeChoices,
  getPaymentMethodChoices,
  getCurrencyChoices,
  getFundEscrowChoices,
} from "@/services/api/choices.service";
import { normalizeChoices } from "@/utils/choices";
import LineItemsTable from "@/components/detail/LineItemsTable";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

// Fallbacks so the form still works when a choices endpoint is unavailable.
const FALLBACK_TYPES = [{ value: "npo", label: "NPO" }];
const FALLBACK_PAYMENT_CHANNELS = [
  { value: "MoMo", label: "MoMo" },
  { value: "Bank", label: "Bank" },
];
const FALLBACK_CURRENCIES = [
  { value: "GHS", label: "GHS" },
  { value: "NGN", label: "NGN" },
];
const FALLBACK_FUND_ESCROW = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

// Spec item keys carried from auto-population through to the POST.
const ITEM_KEYS = [
  "name",
  "description",
  "unit_of_measure",
  "quantity",
  "unit_price",
  "extra_value",
  "extra_value_TnCs",
];

const hasValue = (v) => v !== undefined && v !== null && v !== "";

// Normalize special handles to [{ handling_description }] (backend may send
// objects or plain strings).
const normalizeSpecialHandles = (handles) =>
  (Array.isArray(handles) ? handles : [])
    .map((h) =>
      typeof h === "string"
        ? { handling_description: h }
        : h && typeof h === "object"
          ? {
              handling_description:
                h.handling_description ?? h.description ?? "",
            }
          : null,
    )
    .filter((h) => h && hasValue(h.handling_description));

// Only spec item keys that are present in the auto-population data are sent;
// attachment is included only when it is an actual File.
const toPayloadItem = (item) => {
  const out = {};
  ITEM_KEYS.forEach((key) => {
    if (hasValue(item?.[key])) out[key] = item[key];
  });
  const handles = normalizeSpecialHandles(item?.special_handles);
  if (handles.length) out.special_handles = handles;
  if (item?.attachment instanceof File) out.attachment = item.attachment;
  return out;
};

const itemsHaveFile = (items) =>
  items.some((item) => item?.attachment instanceof File);

// multipart keys: items[N][name], items[N][special_handles][M][handling_description], …
const buildFormData = (fields, items) => {
  const data = new FormData();
  Object.entries(fields).forEach(([k, v]) => {
    if (hasValue(v)) data.append(k, v);
  });
  items.forEach((item, i) => {
    Object.entries(item).forEach(([key, value]) => {
      if (key === "special_handles") {
        value.forEach((h, m) =>
          data.append(
            `items[${i}][special_handles][${m}][handling_description]`,
            h.handling_description,
          ),
        );
      } else {
        data.append(`items[${i}][${key}]`, value);
      }
    });
  });
  return data;
};

const PurchaseOrderCreationPage = () => {
  const { authAxios, BASE_URL } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    spend_category: "",
    preferred_payment_channel: "",
    currency: "GHS",
    fund_escrow: "no",
    items: [],
  });
  const [typeChoices, setTypeChoices] = useState(FALLBACK_TYPES);
  const [paymentChannelChoices, setPaymentChannelChoices] = useState(
    FALLBACK_PAYMENT_CHANNELS,
  );
  const [currencyChoices, setCurrencyChoices] = useState(FALLBACK_CURRENCIES);
  // Total carried over from the proforma, when the backend provides one;
  // otherwise the items table sums the rows' extended values.
  const [autoTotal, setAutoTotal] = useState(null);
  const [fundEscrowChoices, setFundEscrowChoices] =
    useState(FALLBACK_FUND_ESCROW);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { redirectUrl } = location.state || {};

  const set = (patch) => setFormData((prev) => ({ ...prev, ...patch }));

  // Load backend enums; keep the hardcoded fallbacks on failure. Defaults are
  // reconciled so each Select always holds a valid option.
  useEffect(() => {
    let cancelled = false;

    const load = (fetcher, fallback, setChoices, field) => {
      fetcher()
        .then((data) => {
          if (cancelled) return;
          const opts = normalizeChoices(data);
          const next = opts.length ? opts : fallback;
          setChoices(next);
          setFormData((prev) => {
            if (!field) return prev;
            const current = prev[field];
            if (current && next.some((o) => o.value === current)) return prev;
            // Prefer a case-insensitive match of the current default, else
            // the first option (for required enums) or empty.
            const match =
              current &&
              next.find(
                (o) => o.value.toLowerCase() === String(current).toLowerCase(),
              );
            return {
              ...prev,
              [field]: match ? match.value : (next[0]?.value ?? ""),
            };
          });
        })
        .catch(() => {
          if (!cancelled) setChoices(fallback);
        });
    };

    load(getPurchaseOrderTypeChoices, FALLBACK_TYPES, setTypeChoices, "type");
    load(
      getPaymentMethodChoices,
      FALLBACK_PAYMENT_CHANNELS,
      setPaymentChannelChoices,
      "preferred_payment_channel",
    );
    load(
      getCurrencyChoices,
      FALLBACK_CURRENCIES,
      setCurrencyChoices,
      "currency",
    );
    load(
      getFundEscrowChoices,
      FALLBACK_FUND_ESCROW,
      setFundEscrowChoices,
      "fund_escrow",
    );

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const fetchAutoPopulationData = async () => {
      if (
        !redirectUrl ||
        !redirectUrl.startsWith(
          "/api/v1/purchase-orders/create-business-award/",
        )
      ) {
        setError("Invalid document creation URL.");
        setLoading(false);
        return;
      }
      try {
        const cleanUrl = redirectUrl.replace(/^\/api\/v1/, "");
        const response = await authAxios.get(cleanUrl);
        const auto = response.data.auto_population_data || {};
        setAutoTotal(auto.total_sales_value ?? auto.total_cost ?? null);
        setFormData((prev) => ({
          ...prev,
          spend_category: auto.spend_category || "",
          items: auto.items || [],
        }));
      } catch (err) {
        const errorMessage =
          err.response?.data?.detail || "Failed to load auto-population data.";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Fetch auto-population data error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAutoPopulationData();
  }, [authAxios, redirectUrl, BASE_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!redirectUrl) {
      toast.error("Invalid document creation URL.");
      return;
    }
    if (!formData.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!formData.type) {
      toast.error("Type is required.");
      return;
    }
    setSubmitting(true);
    try {
      const cleanUrl = redirectUrl.replace(/^\/api\/v1/, "");
      const fields = {
        title: formData.title.trim(),
        type: formData.type,
        spend_category: formData.spend_category,
        preferred_payment_channel: formData.preferred_payment_channel,
        currency: formData.currency,
        fund_escrow: formData.fund_escrow,
      };
      const items = formData.items.map(toPayloadItem);
      // JSON unless an item carries a File, in which case multipart is required.
      const payload = itemsHaveFile(formData.items)
        ? buildFormData(fields, items)
        : { ...fields, items };
      await authAxios.post(cleanUrl, payload);
      toast.success("Purchase order created successfully!");
      navigate("/dashboard/proforma-invoices");
    } catch (err) {
      const data = err.response?.data;
      toast.error(
        data?.detail ||
          data?.title?.[0] ||
          data?.type?.[0] ||
          data?.preferred_payment_channel?.[0] ||
          data?.currency?.[0] ||
          data?.fund_escrow?.[0] ||
          "Failed to create purchase order.",
      );
      console.error("Create purchase order error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderSelect = (field, options, placeholder) => (
    <Select value={formData[field]} onValueChange={(v) => set({ [field]: v })}>
      <SelectTrigger className="h-10 w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center font-montserrat">
        <div className="rounded-2xl border border-border/70 bg-card p-8">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <p className="mt-4 font-display text-lg font-semibold">{error}</p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => navigate("/dashboard/proforma-invoices")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to proforma invoices
          </Button>
        </div>
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
              <Save className="h-6 w-6" />
            </span>
            <h1 className="font-display text-2xl font-bold">
              Create purchase order
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/proforma-invoices")}
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
        <div>
          <label className={labelClass}>Title</label>
          <Input
            value={formData.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="e.g. Office supplies — Q3"
            required
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Type</label>
            {renderSelect("type", typeChoices, "Select type")}
          </div>
          <div>
            <label className={labelClass}>
              Spend category
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                <Sparkles className="h-3 w-3" /> Auto-populated
              </span>
            </label>
            <Input
              value={formData.spend_category}
              readOnly
              className="bg-muted/40"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Preferred payment channel</label>
            {renderSelect(
              "preferred_payment_channel",
              paymentChannelChoices,
              "Select channel",
            )}
          </div>
          <div>
            <label className={labelClass}>Currency</label>
            {renderSelect("currency", currencyChoices, "Select currency")}
          </div>
          <div>
            <label className={labelClass}>Fund escrow</label>
            {renderSelect("fund_escrow", fundEscrowChoices, "Select")}
          </div>
        </div>

        <div>
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
            Items
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
              <Sparkles className="h-3 w-3" /> Auto-populated
            </span>
          </h2>
          <LineItemsTable
            items={formData.items}
            total={autoTotal}
            totalLabel="Total sales value"
            currency={formData.currency}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/dashboard/proforma-invoices")}
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Create purchase order
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseOrderCreationPage;
