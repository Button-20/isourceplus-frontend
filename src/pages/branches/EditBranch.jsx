import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Building, MapPin, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

const REGIONS = [{ value: "region", label: "Test Region" }];
const DISTRICTS = [{ value: "district", label: "Test District" }];
const CITIES = [{ value: "city", label: "Test City" }];
const TOWNS = [{ value: "town", label: "Test Town" }];

const EditBranch = () => {
  const { authAxios } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
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
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const set = (patch) => setFormData((v) => ({ ...v, ...patch }));
  const setLoc = (patch) =>
    setFormData((v) => ({ ...v, location: { ...v.location, ...patch } }));

  useEffect(() => {
    const fetchBranchData = async () => {
      setLoading(true);
      try {
        const response = await authAxios.get(`branches/${id}/`);
        setFormData(response.data);
      } catch (err) {
        toast.error(err.response?.data?.detail || "Failed to load branch data");
        navigate(`/dashboard/branches/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchBranchData();
  }, [id, authAxios, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Branch name is required");
      return;
    }
    const { region, district, city, town } = formData.location;
    if (!region || !district || !city || !town) {
      toast.error("Region, district, city and town are required");
      return;
    }
    setSubmitting(true);
    try {
      await authAxios.patch(`branches/${id}/`, formData);
      toast.success("Branch updated successfully!");
      navigate(`/dashboard/branches/${id}`);
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          err.response?.data?.location?.non_field_errors?.[0] ||
          "Error updating branch",
      );
      console.error("Error updating branch:", err);
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
              <Building className="h-6 w-6" />
            </span>
            <h1 className="font-display text-2xl font-bold">Edit branch</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/branches/${id}`)}
            className="border-white/40 bg-white/10 text-brand-foreground hover:bg-white/20"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-border/70 bg-card p-6"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Building className="h-4 w-4" /> Branch information
          </div>
          <div>
            <label className={labelClass}>Branch name</label>
            <Input
              value={formData.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Accra Central Branch"
              maxLength={128}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Primary contact</label>
              <Input
                value={formData.office_line}
                onChange={(e) => set({ office_line: e.target.value })}
                maxLength={15}
              />
            </div>
            <div>
              <label className={labelClass}>Secondary contact</label>
              <Input
                value={formData.office_line_2}
                onChange={(e) => set({ office_line_2: e.target.value })}
                maxLength={15}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Email address</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => set({ email: e.target.value })}
              maxLength={128}
            />
          </div>
        </div>

        <div className="space-y-4 border-t border-border pt-6">
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
                  value={formData.location[f.key]}
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
                value={formData.location.popular_area_name}
                onChange={(e) => setLoc({ popular_area_name: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Digital address (GPS)</label>
              <Input
                value={formData.location.gps}
                onChange={(e) => setLoc({ gps: e.target.value })}
                maxLength={10}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Street address</label>
            <Input
              value={formData.location.street_address}
              onChange={(e) => setLoc({ street_address: e.target.value })}
              maxLength={128}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(`/dashboard/branches/${id}`)}
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Update branch
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditBranch;
