import { useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  Building,
  MapPin,
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// API-defined choices (placeholder set matching backend fixtures).
const REGIONS = [{ value: "region", label: "Test Region" }];
const DISTRICTS = [{ value: "district", label: "Test District" }];
const CITIES = [{ value: "city", label: "Test City" }];
const TOWNS = [{ value: "town", label: "Test Town" }];

const STEPS = ["Information", "Location"];
const labelClass = "mb-1 block text-sm font-medium text-foreground";

const initialValues = () => ({
  name: "",
  office_line: "",
  office_line_2: "",
  email: "",
  location: {
    region: "",
    district: "",
    city: "",
    town: "",
    popular_area_name: "",
    gps: "",
    street_address: "",
  },
});

export default function BranchCreateModal({ open, onOpenChange, onCreated }) {
  const { authAxios } = useAuth();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);

  const set = (patch) => setValues((v) => ({ ...v, ...patch }));
  const setLoc = (patch) =>
    setValues((v) => ({ ...v, location: { ...v.location, ...patch } }));

  const reset = () => {
    setValues(initialValues());
    setStep(0);
  };

  const close = (o) => {
    onOpenChange(o);
    if (!o) reset();
  };

  const validateStep = () => {
    if (step === 0) {
      if (!values.name.trim()) {
        toast.error("Branch name is required");
        return false;
      }
    }
    if (step === 1) {
      const { region, district, city, town } = values.location;
      if (!region || !district || !city || !town) {
        toast.error("Region, district, city and town are required");
        return false;
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
      await authAxios.post("branches/", values);
      toast.success("Branch created successfully!");
      onCreated?.();
      close(false);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          error.response?.data?.location?.non_field_errors?.[0] ||
          "Failed to create branch.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto font-montserrat sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add branch</DialogTitle>
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
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Building className="h-4 w-4" /> Branch information
              </div>
              <div>
                <label className={labelClass}>
                  Branch name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={values.name}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="e.g. Accra Central Branch"
                  maxLength={128}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Primary contact</label>
                  <Input
                    value={values.office_line}
                    onChange={(e) => set({ office_line: e.target.value })}
                    placeholder="e.g. 0244123456"
                    maxLength={15}
                  />
                </div>
                <div>
                  <label className={labelClass}>Secondary contact</label>
                  <Input
                    value={values.office_line_2}
                    onChange={(e) => set({ office_line_2: e.target.value })}
                    placeholder="Optional"
                    maxLength={15}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Corporate email</label>
                <Input
                  type="email"
                  value={values.email}
                  onChange={(e) => set({ email: e.target.value })}
                  placeholder="branch@company.com"
                  maxLength={128}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <MapPin className="h-4 w-4" /> Location details
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { key: "region", label: "Region", options: REGIONS },
                  { key: "district", label: "District", options: DISTRICTS },
                  { key: "city", label: "City", options: CITIES },
                  { key: "town", label: "Town", options: TOWNS },
                ].map((f) => (
                  <div key={f.key}>
                    <label className={labelClass}>
                      {f.label} <span className="text-destructive">*</span>
                    </label>
                    <Select
                      value={values.location[f.key]}
                      onValueChange={(v) => setLoc({ [f.key]: v })}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder={`Select ${f.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {f.options.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Landmark / nearby</label>
                  <Input
                    value={values.location.popular_area_name}
                    onChange={(e) =>
                      setLoc({ popular_area_name: e.target.value })
                    }
                    placeholder="e.g. Near Ghana Commercial Bank"
                  />
                </div>
                <div>
                  <label className={labelClass}>Digital address (GPS)</label>
                  <Input
                    value={values.location.gps}
                    onChange={(e) => setLoc({ gps: e.target.value })}
                    placeholder="e.g. GA-123-4567"
                    maxLength={10}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Street address</label>
                <Input
                  value={values.location.street_address}
                  onChange={(e) => setLoc({ street_address: e.target.value })}
                  placeholder="e.g. 123 Main Street, Block A"
                  maxLength={128}
                />
              </div>
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
                "Create branch"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
