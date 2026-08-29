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

const labelClass = "mb-1 block text-sm font-medium text-foreground";

/**
 * Shared branded form for creating a proforma invoice as an offer in response
 * to an RFx, tender, or waybill event. `mode` selects the `mn` query param and
 * the role permitted to submit; `hasItems` toggles the auto-generated item rows.
 */
export default function ProformaOfferForm({
  mode,
  allowedRole,
  heading,
  hasItems = false,
  defaultDescription = "",
  backTo = "/dashboard/proforma-invoices",
}) {
  const { authAxios, jobTitle, BASE_URL } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    title: "New proforma invoice",
    description: defaultDescription,
    spend_category: "",
    priority: "urgent",
    items: [],
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
          items:
            hasItems && Array.isArray(items)
              ? items.map((item) => ({
                  name: item.name || "N/A",
                  description: item.description || "N/A",
                  unit_of_measure: item.unit_of_measure || "",
                  quantity: item.quantity || 0,
                  unit_price: "0.00",
                  special_handles: Array.isArray(item.special_handles)
                    ? item.special_handles
                    : [],
                }))
              : [],
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const params = new URLSearchParams(location.search);
      const eventRefNum = params.get("event_ref_num");
      const response = await authAxios.post(
        `proforma-invoices/create-offer/?event_ref_num=${eventRefNum}&mn=${mode}`,
        {
          ...formValues,
          start_datetime: new Date().toISOString(),
          submission_datetime: new Date().toISOString(),
        },
      );
      const { url } = response.data;
      if (!url || !url.startsWith(`${BASE_URL}proforma-invoices/`)) {
        throw new Error("Invalid response URL received.");
      }
      const refNum = url.split("/").filter(Boolean).pop();
      toast.success("Proforma invoice created successfully!");
      navigate(`/dashboard/proforma-invoices/${refNum}`);
    } catch (error) {
      toast.error("Failed to create proforma invoice.");
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
        <div>
          <label className={labelClass}>Title</label>
          <Input
            value={formValues.title}
            onChange={(e) =>
              setFormValues((prev) => ({ ...prev, title: e.target.value }))
            }
          />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <Textarea
            rows={3}
            value={formValues.description}
            onChange={(e) =>
              setFormValues((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
          />
        </div>
        <div>
          <label className={labelClass}>
            Spend category
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
              <Sparkles className="h-3 w-3" /> Auto-populated
            </span>
          </label>
          <Input value={formValues.spend_category} readOnly className="bg-muted/40" />
        </div>
        <div>
          <label className={labelClass}>Priority</label>
          <Select
            value={formValues.priority}
            onValueChange={(v) =>
              setFormValues((prev) => ({ ...prev, priority: v }))
            }
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="non urgent">Non Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
                    <div className="mt-3">
                      <label className={labelClass}>Unit price</label>
                      <Input
                        value={item.unit_price}
                        onChange={(e) =>
                          setFormValues((prev) => {
                            const items = [...prev.items];
                            items[index] = {
                              ...items[index],
                              unit_price: e.target.value,
                            };
                            return { ...prev, items };
                          })
                        }
                      />
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
