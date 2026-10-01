import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Wallet, Sparkles, Save } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

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
import { getCurrencyChoices } from "@/services/api/choices.service";
import { normalizeChoices } from "@/utils/choices";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

// Used when currency-choices/ cannot be reached.
const FALLBACK_CURRENCIES = [
  { value: "GHS", label: "GHS" },
  { value: "NGN", label: "NGN" },
];

// Item keys the backend accepts on items[N][...]. `attachment` is handled
// separately (only sent when a File is present) and `special_handles` is a
// nested list.
const ITEM_SCALAR_KEYS = [
  "name",
  "description",
  "unit_of_measure",
  "quantity",
  "unit_price",
  "extra_value",
  "extra_value_TnCs",
];

// Shape an auto-populated source item into the spec's item fields, carrying
// through every key the source provides.
const normalizeItem = (item) => ({
  name: item?.name ?? "",
  description: item?.description ?? "",
  unit_of_measure: item?.unit_of_measure ?? "",
  quantity: item?.quantity ?? "",
  unit_price: item?.unit_price ?? "",
  extra_value: item?.extra_value ?? "",
  extra_value_TnCs: item?.extra_value_TnCs ?? "",
  // Auto-population returns a URL/string for existing attachments; only a
  // File can be re-uploaded, so anything else is dropped from the payload.
  attachment: item?.attachment instanceof File ? item.attachment : null,
  special_handles: Array.isArray(item?.special_handles)
    ? item.special_handles.map((h) => ({
        handling_description:
          typeof h === "string" ? h : (h?.handling_description ?? ""),
      }))
    : [],
});

const CreateSalesInvoicePage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventRefNum = searchParams.get("event_ref_num");
  const mn = searchParams.get("mn");
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    spend_category: "",
    currency: "GHS",
    note: "",
    items: [],
  });
  const [currencyOptions, setCurrencyOptions] = useState(FALLBACK_CURRENCIES);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Currency enum (GHS, NGN, …) from the backend; fall back to the known set.
  useEffect(() => {
    let cancelled = false;
    getCurrencyChoices()
      .then((data) => {
        const options = normalizeChoices(data);
        if (!cancelled && options.length > 0) setCurrencyOptions(options);
      })
      .catch((error) => {
        console.error("Fetch currency choices error:", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (jobTitle !== "sales manager" && jobTitle !== "logistics manager") {
      toast.error("You cannot create sales invoices.");
      navigate("/dashboard/purchase-orders");
      return;
    }
    const fetchAutoPopulationData = async () => {
      try {
        const response = await authAxios.get(
          `/sales-invoices/create-sales-invoice/?event_ref_num=${eventRefNum}&mn=${mn}`,
        );
        const auto = response.data.auto_population_data || {};
        setFormData((prev) => ({
          ...prev,
          spend_category: auto.spend_category || "",
          currency: auto.currency || prev.currency,
          items: Array.isArray(auto.items) ? auto.items.map(normalizeItem) : [],
        }));
      } catch (error) {
        toast.error("Failed to load auto-population data.");
        console.error("Fetch auto-population error:", error);
      } finally {
        setLoading(false);
      }
    };
    if (eventRefNum && mn === "purchaseorder") {
      fetchAutoPopulationData();
    } else {
      setLoading(false);
    }
  }, [authAxios, eventRefNum, mn, jobTitle, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("title", formData.title);
    data.append("spend_category", formData.spend_category);
    data.append("currency", formData.currency);
    data.append("note", formData.note);
    formData.items.forEach((item, i) => {
      ITEM_SCALAR_KEYS.forEach((key) => {
        const value = item[key];
        if (value !== undefined && value !== null && value !== "") {
          data.append(`items[${i}][${key}]`, value);
        }
      });
      if (item.attachment instanceof File) {
        data.append(`items[${i}][attachment]`, item.attachment);
      }
      item.special_handles.forEach((h, j) => {
        data.append(
          `items[${i}][special_handles][${j}][handling_description]`,
          h.handling_description,
        );
      });
    });

    try {
      const response = await authAxios.post(
        `/sales-invoices/create-sales-invoice/?event_ref_num=${eventRefNum}&mn=${mn}`,
        data,
      );
      // A 2xx is success regardless of the envelope: the backend returns either
      // a flat { url } or { detail, message, event_data: { url, ref_num? } }.
      const body = response.data ?? {};
      const eventData =
        body.event_data && typeof body.event_data === "object"
          ? body.event_data
          : {};
      const url = String(eventData.url ?? body.url ?? "");
      const refNum =
        eventData.ref_num ??
        body.ref_num ??
        url.match(/sales-invoices[/]([^/?#]+)/)?.[1] ??
        "";
      toast.success(
        body.message
          ? `Sales invoice created. ${body.message}`
          : "Sales invoice created successfully!",
      );
      navigate(refNum ? `/dashboard/sales-invoices/${refNum}` : "/dashboard/sales-invoices");
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          error.response?.data?.name?.[0] ||
          error.response?.data?.title?.[0] ||
          error.response?.data?.spend_category?.[0] ||
          error.response?.data?.currency?.[0] ||
          error.response?.data?.note?.[0] ||
          "Failed to create sales invoice.",
      );
      console.error("Create error:", error);
    } finally {
      setSubmitting(false);
    }
  };

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
              <Wallet className="h-6 w-6" />
            </span>
            <h1 className="font-display text-2xl font-bold">
              Create sales invoice
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/purchase-orders")}
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
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className={labelClass}>Title</label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
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
          <div>
            <label className={labelClass}>Currency</label>
            <Select
              value={formData.currency}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, currency: v }))
              }
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Note</label>
          <Textarea
            value={formData.note}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, note: e.target.value }))
            }
            rows={3}
          />
        </div>

        <div>
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
            Items
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
              <Sparkles className="h-3 w-3" /> Auto-populated
            </span>
          </h2>
          {formData.items.length > 0 ? (
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border/70 p-4 text-sm"
                >
                  <p>
                    <span className="font-medium text-muted-foreground">
                      Name:
                    </span>{" "}
                    {item.name || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium text-muted-foreground">
                      Description:
                    </span>{" "}
                    {item.description || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium text-muted-foreground">
                      Quantity:
                    </span>{" "}
                    {item.quantity} {item.unit_of_measure}
                  </p>
                  <p>
                    <span className="font-medium text-muted-foreground">
                      Unit price:
                    </span>{" "}
                    {item.unit_price !== "" ? item.unit_price : "N/A"}
                  </p>
                  {item.extra_value !== "" && (
                    <p>
                      <span className="font-medium text-muted-foreground">
                        Extra value:
                      </span>{" "}
                      {item.extra_value}
                      {item.extra_value_TnCs !== "" && (
                        <span className="text-muted-foreground">
                          {" "}
                          ({item.extra_value_TnCs})
                        </span>
                      )}
                    </p>
                  )}
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
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No items available.</p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/dashboard/purchase-orders")}
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Create sales invoice
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateSalesInvoicePage;
