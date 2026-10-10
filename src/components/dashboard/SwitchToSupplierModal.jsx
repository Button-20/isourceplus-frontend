import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Store } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { normalizeChoices } from "@/utils/choices";
import { useAuth } from "@/services/context/app.context";
import {
  getCompany,
  getIndustryChoices,
  getSubCategoryChoices,
  supplierSwitch,
  supplierSwitchErrorMessage,
} from "@/services/api/companies.service";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

// Switching back to supplier requires a supplier sub-category: POST
// companies/supplier-switch/?switch_permission=cancel { sub_category }.
// Sub-categories depend on a supplier industry
// (supplier/sub-category-choices/?type=supplier&industry=…), so the industry
// is picked first — prefilled from the company when it's a supplier industry.
// Only `sub_category` is sent. `onSwitched()` runs on success.
export default function SwitchToSupplierModal({
  open,
  onOpenChange,
  onSwitched,
}) {
  const { companyId } = useAuth();
  const [industries, setIndustries] = useState([]);
  const [industry, setIndustry] = useState("");
  const [subCategories, setSubCategories] = useState([]);
  const [subCategory, setSubCategory] = useState("");
  const [loadingIndustries, setLoadingIndustries] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [saving, setSaving] = useState(false);

  // Supplier industries + the company's current industry / sub-category.
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoadingIndustries(true);
    setIndustry("");
    setSubCategory("");
    Promise.all([
      getIndustryChoices("supplier").then(normalizeChoices),
      companyId ? getCompany(companyId).catch(() => null) : null,
    ])
      .then(([choices, data]) => {
        if (cancelled) return;
        setIndustries(choices);
        const company =
          data?.data && !Array.isArray(data.data) ? data.data : data;
        if (
          company?.industry &&
          choices.some((c) => c.value === company.industry)
        )
          setIndustry(company.industry);
        if (company?.sub_category) setSubCategory(company.sub_category);
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load supplier industries.");
      })
      .finally(() => {
        if (!cancelled) setLoadingIndustries(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, companyId]);

  // Sub-categories for the chosen industry.
  useEffect(() => {
    if (!open || !industry) {
      setSubCategories([]);
      return undefined;
    }
    let cancelled = false;
    setLoadingSubs(true);
    getSubCategoryChoices("supplier", industry)
      .then((data) => {
        if (!cancelled) setSubCategories(normalizeChoices(data));
      })
      .catch(() => {
        if (!cancelled) {
          setSubCategories([]);
          toast.error("Couldn't load sub-categories for that industry.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSubs(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, industry]);

  // A remembered sub-category only counts if the chosen industry offers it.
  const validSub = subCategories.some((c) => c.value === subCategory)
    ? subCategory
    : "";

  const submit = async (e) => {
    e.preventDefault();
    if (!validSub) return toast.error("Please select a sub-category.");
    setSaving(true);
    try {
      const res = await supplierSwitch("cancel", { sub_category: validSub });
      toast.success(res?.message || "Switched back to supplier.");
      onSwitched?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        supplierSwitchErrorMessage(err, "Couldn't switch back to supplier."),
      );
      console.error("Supplier switch error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="font-montserrat sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Switch to supplier</DialogTitle>
          <DialogDescription>
            Choose what your company supplies to go back to selling on
            iSourcePlus. You can switch to buyer again at any time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={labelClass}>Supplier industry</label>
            <Select
              value={industry || undefined}
              onValueChange={(v) => {
                setIndustry(v);
                setSubCategory("");
              }}
              disabled={loadingIndustries || saving}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingIndustries
                      ? "Loading industries…"
                      : "Select industry"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {industries.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className={labelClass}>
              Sub-category <span className="text-destructive">*</span>
            </label>
            <Select
              value={validSub || undefined}
              onValueChange={setSubCategory}
              disabled={!industry || loadingSubs || saving}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !industry
                      ? "Select an industry first"
                      : loadingSubs
                        ? "Loading sub-categories…"
                        : "Select sub-category"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {subCategories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !validSub}
              className="bg-brand-gradient text-brand-foreground hover:opacity-90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Switching…
                </>
              ) : (
                <>
                  <Store className="mr-1.5 h-4 w-4" /> Switch to supplier
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
