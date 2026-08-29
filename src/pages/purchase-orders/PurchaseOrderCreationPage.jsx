import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft, AlertCircle, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

const PurchaseOrderCreationPage = () => {
  const { authAxios, BASE_URL } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    spend_category: "",
    quantity: "",
    total_cost: "",
    items: [],
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { redirectUrl } = location.state || {};

  useEffect(() => {
    const fetchAutoPopulationData = async () => {
      if (
        !redirectUrl ||
        !redirectUrl.startsWith("/api/v1/purchase-orders/create-business-award/")
      ) {
        setError("Invalid document creation URL.");
        setLoading(false);
        return;
      }
      try {
        const cleanUrl = redirectUrl.replace(/^\/api\/v1/, "");
        const response = await authAxios.get(cleanUrl);
        setFormData((prev) => ({
          ...prev,
          spend_category: response.data.auto_population_data?.spend_category || "",
          items: response.data.auto_population_data?.items || [],
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
    if (formData.quantity <= 0) {
      toast.error("Quantity must be a positive integer.");
      return;
    }
    if (formData.total_cost <= 0) {
      toast.error("Total cost must be a positive number.");
      return;
    }
    setSubmitting(true);
    try {
      const cleanUrl = redirectUrl.replace(/^\/api\/v1/, "");
      await authAxios.post(cleanUrl, {
        spend_category: formData.spend_category,
        quantity: parseInt(formData.quantity, 10),
        total_cost: parseFloat(formData.total_cost),
      });
      toast.success("Purchase order created successfully!");
      navigate("/dashboard/proforma-invoices");
    } catch (err) {
      toast.error(
        err.response?.data?.detail || "Failed to create purchase order.",
      );
      console.error("Create purchase order error:", err);
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
          <label className={labelClass}>Total quantity</label>
          <Input
            type="number"
            min={1}
            value={formData.quantity}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, quantity: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <label className={labelClass}>Total cost</label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={formData.total_cost}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, total_cost: e.target.value }))
            }
            required
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
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="px-4 py-2.5 font-medium">Description</th>
                    <th className="px-4 py-2.5 font-medium">Qty</th>
                    <th className="px-4 py-2.5 font-medium">Unit</th>
                    <th className="px-4 py-2.5 font-medium">Unit price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2.5 font-medium">{item.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {item.description || "N/A"}
                      </td>
                      <td className="px-4 py-2.5">{item.quantity}</td>
                      <td className="px-4 py-2.5">{item.unit_of_measure}</td>
                      <td className="px-4 py-2.5">{item.unit_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No items available.</p>
          )}
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
