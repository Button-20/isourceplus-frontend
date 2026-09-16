import { Loader2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  createTransporter as createTransporterRequest,
  getTransporterTypeChoices,
  getTransportMeansChoices,
  getTransportModeChoices,
} from "@/services/api/transporters.service";
import { useAuth } from "@/services/context/app.context";
import { storage } from "@/services/lib/storage";
import { compressImage } from "@/utils/compress-image";
import { normalizeChoices, prettify } from "@/utils/choices";

// Create-transporter form. Matches the Cargo Transporters API (OpenAPI v1):
// POST /transporters/ as multipart/form-data with required logo +
// image_front_view images, a nested `location` (bracket notation) and
// `transport_modes` / `transport_means` as repeated form keys (style=form,
// explode=true). type/modes/means come from the backend choices endpoints;
// region uses Ghana slugs; district & category are free-text pending their
// (TBD) choice endpoints.

const labelClass = "mb-1 block text-sm font-medium text-foreground";
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_BIO = 225; // Backend caps the description/bio at 225 characters.

const EMPTY_VALUES = {
  name: "",
  type: "",
  category: "",
  bio: "",
  email: "",
  office_line: "",
  office_line_2: "",
  web_address: "",
};
const EMPTY_LOCATION = {
  region: "",
  district: "",
  popular_area_name: "",
  gps: "",
  street_address: "",
};
const VALUE_KEYS = Object.keys(EMPTY_VALUES);
const LOCATION_KEYS = Object.keys(EMPTY_LOCATION);

// region is an enum server-side; slugs match the spec example ("greater_accra").
const GHANA_REGIONS = [
  { value: "greater_accra", label: "Greater Accra" },
  { value: "ashanti", label: "Ashanti" },
  { value: "volta", label: "Volta" },
  { value: "upper_east", label: "Upper East" },
  { value: "savannah", label: "Savannah" },
  { value: "bono", label: "Bono" },
  { value: "upper_west", label: "Upper West" },
  { value: "western_north", label: "Western North" },
  { value: "western", label: "Western" },
  { value: "eastern", label: "Eastern" },
  { value: "northern", label: "Northern" },
  { value: "central", label: "Central" },
  { value: "ahafo", label: "Ahafo" },
  { value: "oti", label: "Oti" },
  { value: "north_east", label: "North East" },
  { value: "bono_east", label: "Bono East" },
];

const validateStoredData = (data, expectedKeys) =>
  data &&
  typeof data === "object" &&
  expectedKeys.every((key) => Object.prototype.hasOwnProperty.call(data, key));

// Branded dashed-border upload tile with preview + remove.
function UploadTile({ label, name, required, preview, onChange, onRemove }) {
  return (
    <div>
      <label className={labelClass}>
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="flex items-center gap-3">
        <label className="relative flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-input bg-muted/30 text-center transition-colors hover:border-brand/50 hover:bg-brand/5">
          {preview ? (
            <img
              src={preview}
              alt={`${label} preview`}
              className="h-full w-full rounded-xl object-contain p-2"
            />
          ) : (
            <>
              <Upload className="mb-1 h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Click to upload
              </span>
            </>
          )}
          <input
            type="file"
            name={name}
            accept="image/png,image/jpeg"
            onChange={onChange}
            className="hidden"
          />
        </label>
        {preview && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label}`}
            className="text-muted-foreground transition-colors hover:text-destructive"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

const TransporterForm = () => {
  const { setTransporterId } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState(EMPTY_VALUES);
  const [location, setLocation] = useState(EMPTY_LOCATION);
  const [lists, setLists] = useState({
    transport_modes: [],
    transport_means: [],
  });
  const [files, setFiles] = useState({ logo: null, image_front_view: null });
  const [filePreviews, setFilePreviews] = useState({
    logo: null,
    image_front_view: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const [typeChoices, setTypeChoices] = useState([]);
  const [typeLoading, setTypeLoading] = useState(false);
  const [modeChoices, setModeChoices] = useState([]);
  const [modeLoading, setModeLoading] = useState(false);
  const [meansChoices, setMeansChoices] = useState([]);
  const [meansLoading, setMeansLoading] = useState(false);

  // Restore any in-progress draft once on mount. (File objects can't be
  // persisted, so previews are restored but the files must be re-picked.)
  useEffect(() => {
    const parsedValues = storage.getJSON("transporterFormValues");
    if (parsedValues && validateStoredData(parsedValues, VALUE_KEYS)) {
      setValues(parsedValues);
      toast.info("Form data restored from previous session.");
    }
    const parsedLocation = storage.getJSON("transporterFormLocation");
    if (parsedLocation && validateStoredData(parsedLocation, LOCATION_KEYS)) {
      setLocation(parsedLocation);
    }
    const parsedLists = storage.getJSON("transporterFormLists");
    if (
      parsedLists &&
      validateStoredData(parsedLists, ["transport_modes", "transport_means"])
    ) {
      setLists(parsedLists);
    }
  }, []);

  // type/mode/means options are fetched from the backend (they may change).
  const loadChoices = (fetcher, setChoices, setLoading, label) => {
    let cancelled = false;
    setLoading(true);
    fetcher()
      .then((data) => {
        if (!cancelled) setChoices(normalizeChoices(data));
      })
      .catch(() => {
        if (!cancelled) {
          setChoices([]);
          toast.error(`Couldn't load ${label}.`);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  };

  useEffect(
    () =>
      loadChoices(getTransporterTypeChoices, setTypeChoices, setTypeLoading, "types"),
    [],
  );
  useEffect(
    () =>
      loadChoices(getTransportModeChoices, setModeChoices, setModeLoading, "modes"),
    [],
  );
  useEffect(
    () =>
      loadChoices(
        getTransportMeansChoices,
        setMeansChoices,
        setMeansLoading,
        "means",
      ),
    [],
  );

  // Guarantee a restored type value always has a matching option before the
  // async choices resolve, so the trigger doesn't fall back to the placeholder.
  const typeOptions = useMemo(() => {
    if (values.type && !typeChoices.some((c) => c.value === values.type)) {
      return [...typeChoices, { value: values.type, label: prettify(values.type) }];
    }
    return typeChoices;
  }, [typeChoices, values.type]);

  const persist = (key, value) => storage.setJSON(key, value);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => {
      const next = { ...v, [name]: value };
      persist("transporterFormValues", next);
      return next;
    });
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setLocation((l) => {
      const next = { ...l, [name]: value };
      persist("transporterFormLocation", next);
      return next;
    });
  };

  // Radix Select can emit "" while async options reconcile — guard against it
  // clobbering a chosen value.
  const setValue = (name, value) => {
    if (!value) return;
    setValues((v) => {
      const next = { ...v, [name]: value };
      persist("transporterFormValues", next);
      return next;
    });
  };
  const setRegion = (value) => {
    if (!value) return;
    setLocation((l) => {
      const next = { ...l, region: value };
      persist("transporterFormLocation", next);
      return next;
    });
  };

  const toggleListItem = (name, value) => {
    setLists((prev) => {
      const set = new Set(prev[name]);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      const next = { ...prev, [name]: Array.from(set) };
      persist("transporterFormLists", next);
      return next;
    });
  };

  const handleFileChange = async (e) => {
    const { name, files: fileList } = e.target;
    const picked = fileList[0];
    e.target.value = ""; // let the user re-pick the same file after an error
    if (!picked) return;
    if (!["image/jpeg", "image/png"].includes(picked.type)) {
      toast.error("Only JPG and PNG formats are accepted");
      return;
    }
    // Downscale before upload so the request stays under the backend's size cap.
    const file = await compressImage(picked);
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image is too large. Please use a smaller image.");
      return;
    }
    setFiles((f) => ({ ...f, [name]: file }));
    setFilePreviews((p) => ({ ...p, [name]: URL.createObjectURL(file) }));
  };

  const removeFile = (name) => {
    setFiles((f) => ({ ...f, [name]: null }));
    setFilePreviews((p) => ({ ...p, [name]: null }));
  };

  const clearDraft = () => {
    storage.remove("transporterFormValues");
    storage.remove("transporterFormLocation");
    storage.remove("transporterFormLists");
  };

  const handleReset = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setValues(EMPTY_VALUES);
    setLocation(EMPTY_LOCATION);
    setLists({ transport_modes: [], transport_means: [] });
    setFiles({ logo: null, image_front_view: null });
    setFilePreviews({ logo: null, image_front_view: null });
    clearDraft();
    toast.success("Form reset successfully.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Required fields per the spec.
    const missingScalar = [
      ["name", "transporter name"],
      ["type", "type"],
      ["category", "category"],
      ["bio", "bio"],
      ["email", "email"],
      ["office_line", "primary phone"],
    ].find(([k]) => !String(values[k]).trim());
    if (missingScalar)
      return toast.error(`Please provide the ${missingScalar[1]}.`);

    const missingLocation = [
      ["region", "region"],
      ["district", "district"],
      ["gps", "GPS address"],
      ["street_address", "street address"],
    ].find(([k]) => !String(location[k]).trim());
    if (missingLocation)
      return toast.error(`Please provide the ${missingLocation[1]}.`);

    if (!lists.transport_modes.length)
      return toast.error("Please select at least one transport mode.");
    if (!lists.transport_means.length)
      return toast.error("Please select at least one transport means.");
    if (!files.logo) return toast.error("Please upload a logo.");
    if (!files.image_front_view)
      return toast.error("Please upload a front-view image.");

    setSubmitting(true);
    try {
      // multipart/form-data (required for the image uploads).
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (String(v).trim()) fd.append(k, v);
      });
      // Nested location via bracket notation: location[region]=…
      Object.entries(location).forEach(([k, v]) => {
        if (String(v).trim()) fd.append(`location[${k}]`, v);
      });
      // Arrays as repeated keys (style=form, explode=true).
      lists.transport_modes.forEach((v) => fd.append("transport_modes", v));
      lists.transport_means.forEach((v) => fd.append("transport_means", v));
      fd.append("logo", files.logo);
      fd.append("image_front_view", files.image_front_view);

      const created = await createTransporterRequest(fd);
      if (created?.id) {
        setTransporterId(created.id);
        storage.set("transporter_id", created.id);
      }
      clearDraft();
      toast.success("Transporter registered successfully!");
      navigate("/dashboard/transporter/edit");
    } catch (err) {
      console.error("Registration failed", err);
      const data = err.response?.data;
      toast.error(
        data?.detail ||
          data?.logo?.[0] ||
          data?.image_front_view?.[0] ||
          (typeof data === "string" ? data : null) ||
          "Registration failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderChips = (name, choices, loading) => (
    <div className="flex flex-wrap gap-2">
      {loading ? (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : choices.length ? (
        choices.map((c) => {
          const active = lists[name].includes(c.value);
          return (
            <button
              type="button"
              key={c.value}
              aria-pressed={active}
              onClick={() => toggleListItem(name, c.value)}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors",
                active
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-input text-muted-foreground hover:border-brand/40 hover:text-foreground",
              )}
            >
              {c.label}
            </button>
          );
        })
      ) : (
        <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
          <X className="mr-2 h-4 w-4" /> None available.
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic information */}
      <section className="border-b border-border pb-6">
        <h2 className="mb-4 font-display text-base font-semibold">
          Basic information
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              Transporter name <span className="text-destructive">*</span>
            </label>
            <Input name="name" value={values.name} onChange={handleChange} required />
          </div>
          <div>
            <label className={labelClass}>
              Type <span className="text-destructive">*</span>
            </label>
            <Select
              value={values.type || undefined}
              onValueChange={(v) => setValue("type", v)}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {typeLoading && !typeOptions.length ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
                  </div>
                ) : typeOptions.length ? (
                  typeOptions.map((choice) => (
                    <SelectItem key={choice.value} value={choice.value}>
                      {choice.label}
                    </SelectItem>
                  ))
                ) : (
                  <div className="py-2 text-center text-sm text-muted-foreground">
                    No types available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className={labelClass}>
              Category <span className="text-destructive">*</span>
            </label>
            <Input
              name="category"
              value={values.category}
              onChange={handleChange}
              placeholder="e.g. freight"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Transporter bio <span className="text-destructive">*</span>
              </label>
              <span
                className={cn(
                  "text-xs",
                  values.bio.length > MAX_BIO
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {values.bio.length}/{MAX_BIO}
              </span>
            </div>
            <Textarea
              name="bio"
              rows={3}
              maxLength={MAX_BIO}
              value={values.bio}
              onChange={handleChange}
              placeholder="Briefly describe your transport service"
              required
            />
          </div>
        </div>
      </section>

      {/* Contact information */}
      <section className="border-b border-border pb-6">
        <h2 className="mb-4 font-display text-base font-semibold">
          Contact information
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>
              Email <span className="text-destructive">*</span>
            </label>
            <Input
              type="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              placeholder="contact@example.com"
              required
            />
          </div>
          <div>
            <label className={labelClass}>
              Primary phone <span className="text-destructive">*</span>
            </label>
            <Input
              type="tel"
              name="office_line"
              value={values.office_line}
              onChange={handleChange}
              placeholder="+233 …"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Secondary phone</label>
            <Input
              type="tel"
              name="office_line_2"
              value={values.office_line_2}
              onChange={handleChange}
              placeholder="+233 …"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Website</label>
            <Input
              type="url"
              name="web_address"
              value={values.web_address}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="border-b border-border pb-6">
        <h2 className="mb-4 font-display text-base font-semibold">Location</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              Region <span className="text-destructive">*</span>
            </label>
            <Select
              value={location.region || undefined}
              onValueChange={setRegion}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Select a region" />
              </SelectTrigger>
              <SelectContent>
                {GHANA_REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className={labelClass}>
              District <span className="text-destructive">*</span>
            </label>
            <Input
              name="district"
              value={location.district}
              onChange={handleLocationChange}
              placeholder="e.g. Accra Metropolitan"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Popular area name</label>
            <Input
              name="popular_area_name"
              value={location.popular_area_name}
              onChange={handleLocationChange}
              placeholder="e.g. Osu"
            />
          </div>
          <div>
            <label className={labelClass}>
              GPS address <span className="text-destructive">*</span>
            </label>
            <Input
              name="gps"
              value={location.gps}
              onChange={handleLocationChange}
              placeholder="e.g. GA-123-4567"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>
              Street address <span className="text-destructive">*</span>
            </label>
            <Input
              name="street_address"
              value={location.street_address}
              onChange={handleLocationChange}
              placeholder="e.g. 12 Oxford Street"
              required
            />
          </div>
        </div>
      </section>

      {/* Transport services */}
      <section className="border-b border-border pb-6">
        <h2 className="mb-4 font-display text-base font-semibold">
          Transport services
        </h2>
        <div className="space-y-5">
          <div>
            <label className={labelClass}>
              Transport modes <span className="text-destructive">*</span>
            </label>
            {renderChips("transport_modes", modeChoices, modeLoading)}
          </div>
          <div>
            <label className={labelClass}>
              Transport means <span className="text-destructive">*</span>
            </label>
            {renderChips("transport_means", meansChoices, meansLoading)}
          </div>
        </div>
      </section>

      {/* Media uploads */}
      <section>
        <h2 className="mb-1 font-display text-base font-semibold">
          Media uploads
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          A logo and a front-view image are required (under 2MB each, JPG or PNG).
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <UploadTile
            label="Logo"
            name="logo"
            required
            preview={filePreviews.logo}
            onChange={handleFileChange}
            onRemove={() => removeFile("logo")}
          />
          <UploadTile
            label="Front-view image"
            name="image_front_view"
            required
            preview={filePreviews.image_front_view}
            onChange={handleFileChange}
            onRemove={() => removeFile("image_front_view")}
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">
        <Button
          type="button"
          variant="ghost"
          onClick={handleReset}
          disabled={submitting}
        >
          Reset form
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="bg-brand-gradient text-brand-foreground hover:opacity-90"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering…
            </>
          ) : (
            "Register transporter"
          )}
        </Button>
      </div>
    </form>
  );
};

export default TransporterForm;
