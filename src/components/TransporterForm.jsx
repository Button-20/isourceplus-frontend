import { Loader2, Plus, Upload, X } from "lucide-react";
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
  updateTransporter as updateTransporterRequest,
} from "@/services/api/transporters.service";
import { useAuth } from "@/services/context/app.context";
import { storage } from "@/services/lib/storage";
import { compressImage } from "@/utils/compress-image";
import { normalizeChoices, prettify } from "@/utils/choices";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

const EMPTY_VALUES = {
  name: "",
  type: "",
  bio: "",
  email: "",
  transport_mode: [],
  transport_means: [],
  office_line: "",
  office_line_2: "",
  web_address: "",
};
const VALUE_KEYS = Object.keys(EMPTY_VALUES);

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
// The backend caps the whole request at ~1MB; keep the combined upload under it.
const MAX_TOTAL_UPLOAD = 900 * 1024;
const MAX_BIO = 225; // Backend caps the description/bio at 225 characters.

const validateStoredData = (data, expectedKeys) =>
  data &&
  typeof data === "object" &&
  expectedKeys.every((key) => Object.prototype.hasOwnProperty.call(data, key));

// Branded dashed-border upload tile with preview + remove.
function UploadTile({ label, name, preview, onChange, onRemove }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
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
            accept="image/*"
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
  const [lists, setLists] = useState({
    transport_mode: [],
    transport_means: [],
  });
  const [files, setFiles] = useState({ logo: null, vehicle_images: [] });
  const [filePreviews, setFilePreviews] = useState({
    logo: null,
    vehicle_images: [],
  });
  const [submitting, setSubmitting] = useState(false);

  const [typeChoices, setTypeChoices] = useState([]);
  const [typeLoading, setTypeLoading] = useState(false);
  const [modeChoices, setModeChoices] = useState([]);
  const [modeLoading, setModeLoading] = useState(false);
  const [meansChoices, setMeansChoices] = useState([]);
  const [meansLoading, setMeansLoading] = useState(false);

  // Restore any in-progress draft once on mount. (Files themselves can't be
  // persisted, so their previews are restored but the File objects reset.)
  useEffect(() => {
    const parsedValues = storage.getJSON("transporterFormValues");
    if (parsedValues && validateStoredData(parsedValues, VALUE_KEYS)) {
      setValues(parsedValues);
      toast.info("Form data restored from previous session.");
    }
    const parsedLists = storage.getJSON("transporterFormLists");
    if (
      parsedLists &&
      validateStoredData(parsedLists, ["transport_mode", "transport_means"])
    ) {
      setLists(parsedLists);
    }
    const parsedPreviews = storage.getJSON("transporterFormFilePreviews");
    if (
      parsedPreviews &&
      validateStoredData(parsedPreviews, ["logo", "vehicle_images"])
    ) {
      setFilePreviews(parsedPreviews);
      setFiles((prev) => ({
        ...prev,
        vehicle_images: parsedPreviews.vehicle_images.map(() => null),
      }));
    }
  }, []);

  // Type options are fetched from the backend because they may change over time
  useEffect(() => {
    let cancelled = false;
    setTypeLoading(true);
    getTransporterTypeChoices()
      .then((data) => {
        if (!cancelled) setTypeChoices(normalizeChoices(data));
      })
      .catch(() => {
        if (!cancelled) {
          setTypeChoices([]);
          toast.error("Couldn't load types.");
        }
      })
      .finally(() => {
        if (!cancelled) setTypeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Mode options are fetched from the backend because they may change over time
  useEffect(() => {
    let cancelled = false;
    setModeLoading(true);
    getTransportModeChoices()
      .then((data) => {
        if (!cancelled) setModeChoices(normalizeChoices(data));
      })
      .catch(() => {
        if (!cancelled) {
          setModeChoices([]);
          toast.error("Couldn't load modes.");
        }
      })
      .finally(() => {
        if (!cancelled) setModeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Means options are fetched from the backend because they may change over time
  useEffect(() => {
    let cancelled = false;
    setMeansLoading(true);
    getTransportMeansChoices()
      .then((data) => {
        if (!cancelled) setMeansChoices(normalizeChoices(data));
      })
      .catch(() => {
        if (!cancelled) {
          setMeansChoices([]);
          toast.error("Couldn't load means.");
        }
      })
      .finally(() => {
        if (!cancelled) setMeansLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Guarantee the currently-selected type always has a matching option, even
  // before the async choices resolve — otherwise a restored draft value has no
  // <SelectItem> to match and the trigger falls back to the placeholder.
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

  const handleFileChange = async (e, index = null) => {
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
    if (name === "logo") {
      setFiles((f) => ({ ...f, logo: file }));
      setFilePreviews((p) => {
        const next = { ...p, logo: URL.createObjectURL(file) };
        persist("transporterFormFilePreviews", next);
        return next;
      });
    } else if (name === "vehicle_image" && index !== null) {
      setFiles((f) => {
        const images = [...f.vehicle_images];
        images[index] = file;
        return { ...f, vehicle_images: images };
      });
      setFilePreviews((p) => {
        const previews = [...p.vehicle_images];
        previews[index] = URL.createObjectURL(file);
        const next = { ...p, vehicle_images: previews };
        persist("transporterFormFilePreviews", next);
        return next;
      });
    }
  };

  const removeFile = (name, index = null) => {
    if (name === "logo") {
      setFiles((f) => ({ ...f, logo: null }));
      setFilePreviews((p) => {
        const next = { ...p, logo: null };
        persist("transporterFormFilePreviews", next);
        return next;
      });
    } else if (name === "vehicle_image" && index !== null) {
      setFiles((f) => {
        const images = [...f.vehicle_images];
        images.splice(index, 1);
        return { ...f, vehicle_images: images };
      });
      setFilePreviews((p) => {
        const previews = [...p.vehicle_images];
        previews.splice(index, 1);
        const next = { ...p, vehicle_images: previews };
        persist("transporterFormFilePreviews", next);
        return next;
      });
    }
  };

  const addVehicleImageSlot = () => {
    setFiles((f) => ({ ...f, vehicle_images: [...f.vehicle_images, null] }));
    setFilePreviews((p) => {
      const next = { ...p, vehicle_images: [...p.vehicle_images, null] };
      persist("transporterFormFilePreviews", next);
      return next;
    });
  };

  const handleReset = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setValues(EMPTY_VALUES);
    setLists({ transport_mode: [], transport_means: [] });
    setFiles({ logo: null, vehicle_images: [] });
    setFilePreviews({ logo: null, vehicle_images: [] });
    storage.remove("transporterFormValues");
    storage.remove("transporterFormLists");
    storage.remove("transporterFormFilePreviews");
    toast.success("Form reset successfully.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lists.transport_mode.length) {
      toast.error("Please select at least one transport mode.");
      return;
    }
    if (!lists.transport_means.length) {
      toast.error("Please select at least one transport means.");
      return;
    }
    const totalUpload = [files.logo, ...files.vehicle_images].reduce(
      (sum, f) => sum + (f?.size || 0),
      0,
    );
    if (totalUpload > MAX_TOTAL_UPLOAD) {
      toast.error("Your images are too large. Please use smaller images.");
      return;
    }
    setSubmitting(true);
    try {
      // Create with a JSON body so the transport lists are sent as real arrays.
      // (Multipart form-encoding flattened them to strings, which the API
      // rejected with "Expected a list of items but got type str".)
      const payload = {
        transport_mode: lists.transport_mode,
        transport_means: lists.transport_means,
      };
      Object.entries(values).forEach(([k, v]) => {
        if (v) payload[k] = v;
      });
      const created = await createTransporterRequest(payload);
      setTransporterId(created.id);
      storage.set("transporter_id", created.id);

      // Attach the logo / vehicle images in a follow-up multipart PATCH.
      if (files.logo || files.vehicle_images.some(Boolean)) {
        const fd = new FormData();
        if (files.logo) fd.append("logo", files.logo);
        files.vehicle_images.forEach((file, index) => {
          if (file) fd.append(`vehicle_images[${index}][file]`, file);
        });
        await updateTransporterRequest(created.id, fd);
      }

      toast.success("Transporter registered successfully!");
      storage.remove("transporterFormValues");
      storage.remove("transporterFormLists");
      storage.remove("transporterFormFilePreviews");
      navigate("/dashboard/transporter/edit");
    } catch (err) {
      console.error("Registration failed", err);
      toast.error(
        err.response?.data?.vehicle_images?.[0] ||
          err.response?.data?.detail ||
          "Registration failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

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
            <Input
              name="name"
              value={values.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <Select
              value={values.type || undefined}
              onValueChange={(value) => {
                // Radix can emit an empty value while the async options
                // reconcile on load — ignore it so it never clobbers a
                // restored/selected type.
                if (!value) return;
                setValues((v) => {
                  const next = { ...v, type: value };
                  persist("transporterFormValues", next);
                  return next;
                });
              }}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {typeLoading && !typeOptions.length ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading…
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

          <div className="sm:col-span-2">
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Transporter bio
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
            <div className="flex flex-wrap gap-2">
              {modeLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading…
                </div>
              ) : modeChoices.length ? (
                modeChoices.map((mode) => {
                  const active = lists.transport_mode.includes(mode.value);
                  return (
                    <button
                      type="button"
                      key={mode.value}
                      aria-pressed={active}
                      onClick={() => toggleListItem("transport_mode", mode.value)}
                      className={cn(
                        "rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors",
                        active
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-input text-muted-foreground hover:border-brand/40 hover:text-foreground",
                      )}
                    >
                      {mode.label}
                    </button>
                  );
                })
              ) : (
                <div className="flex items-center justify-center py-2">
                  <X className="mr-2 h-4 w-4" />
                  No transport modes available.
                </div>
              )}
            </div>
          </div>
          <div>
            <label className={labelClass}>
              Transport means <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {meansLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading…
                </div>
              ) : meansChoices.length ? (
                meansChoices.map((means) => {
                  const active = lists.transport_means.includes(means.value);
                  return (
                    <button
                      type="button"
                      key={means.value}
                      aria-pressed={active}
                      onClick={() => toggleListItem("transport_means", means.value)}
                      className={cn(
                        "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                        active
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-input text-muted-foreground hover:border-brand/40 hover:text-foreground",
                      )}
                    >
                      {means.label}
                    </button>
                  );
                })
              ) : (
                <div className="flex items-center justify-center py-2">
                  <X className="mr-2 h-4 w-4" />
                  No transport means available.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Media uploads */}
      <section>
        <h2 className="mb-1 font-display text-base font-semibold">
          Media uploads
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Add a square logo (under 2MB, JPG or PNG) and as many vehicle images
          as you need to showcase your fleet.
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <UploadTile
            label="Logo"
            name="logo"
            preview={filePreviews.logo}
            onChange={(e) => handleFileChange(e)}
            onRemove={() => removeFile("logo")}
          />
          {filePreviews.vehicle_images.map((preview, index) => (
            <UploadTile
              key={index}
              label={`Vehicle image ${index + 1}`}
              name="vehicle_image"
              preview={preview}
              onChange={(e) => handleFileChange(e, index)}
              onRemove={() => removeFile("vehicle_image", index)}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addVehicleImageSlot}
          className="mt-4 gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add vehicle image
        </Button>
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
