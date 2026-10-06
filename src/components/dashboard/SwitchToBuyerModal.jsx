import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShoppingCart } from "lucide-react";

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
import { storage } from "@/services/lib/storage";
import {
  getIndustryChoices,
  supplierSwitch,
  supplierSwitchErrorMessage,
} from "@/services/api/companies.service";

const LAST_INDUSTRY_KEY = "buyer_switch_industry";

// A supplier company switching to the buyer side picks the industry it buys
// in (buyer industry enum), then POST companies/supplier-switch/
// ?switch_permission=accept { industry }. `onSwitched()` runs on success.
export default function SwitchToBuyerModal({ open, onOpenChange, onSwitched }) {
  const [industries, setIndustries] = useState([]);
  const [loadingChoices, setLoadingChoices] = useState(false);
  const [industry, setIndustry] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setIndustry(storage.get(LAST_INDUSTRY_KEY) || "");
    setLoadingChoices(true);
    getIndustryChoices("buyer")
      .then((data) => {
        if (!cancelled) setIndustries(normalizeChoices(data));
      })
      .catch(() => {
        if (!cancelled) {
          setIndustries([]);
          toast.error("Couldn't load buyer industries.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingChoices(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Drop a remembered industry that's no longer offered.
  const validIndustry = industries.some((c) => c.value === industry)
    ? industry
    : "";

  const submit = async (e) => {
    e.preventDefault();
    if (!validIndustry) return toast.error("Please select an industry.");
    setSaving(true);
    try {
      const res = await supplierSwitch("accept", validIndustry);
      storage.set(LAST_INDUSTRY_KEY, validIndustry);
      toast.success(res?.message || "Switched to buyer.");
      onSwitched?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(supplierSwitchErrorMessage(err, "Couldn't switch to buyer."));
      console.error("Supplier switch error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="font-montserrat sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Switch to buyer</DialogTitle>
          <DialogDescription>
            Choose the industry your company buys in to start sourcing as a
            buyer. You can switch back to supplier at any time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Buyer industry
            </label>
            <Select
              value={validIndustry}
              onValueChange={setIndustry}
              disabled={loadingChoices || saving}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingChoices ? "Loading industries…" : "Select industry"
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
              disabled={saving || !validIndustry}
              className="bg-brand-gradient text-brand-foreground hover:opacity-90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Switching…
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-1.5 h-4 w-4" /> Switch to buyer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
