import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Wallet, Sparkles, Save } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

const CreateSalesInvoicePage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventRefNum = searchParams.get("event_ref_num");
  const mn = searchParams.get("mn");
  const [formData, setFormData] = useState({ title: "", spend_category: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
        setFormData((prev) => ({
          ...prev,
          spend_category:
            response.data.auto_population_data.spend_category || "",
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
    data.append("title", formData.title);
    data.append("spend_category", formData.spend_category);

    try {
      const response = await authAxios.post(
        `/sales-invoices/create-sales-invoice/?event_ref_num=${eventRefNum}&mn=${mn}`,
        data,
      );
      const refNum = response.data.url.split("/").slice(-2)[0];
      toast.success("Sales invoice created successfully!");
      navigate(`/dashboard/sales-invoices/${refNum}`);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          error.response?.data?.title?.[0] ||
          error.response?.data?.spend_category?.[0] ||
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
