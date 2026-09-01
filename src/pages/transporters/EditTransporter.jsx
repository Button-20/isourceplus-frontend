import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/app.context";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Upload, X, Plus, Truck, ArrowLeft, FileCheck2, Save } from "lucide-react";

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
import { cn } from "@/lib/utils";
import { normalizeChoices, prettify } from "@/utils/choices";
import {
  getTransporterTypeChoices,
  getTransportModeChoices,
  getTransportMeansChoices,
} from "@/services/api/transporters.service";

const labelClass = "mb-1 block text-sm font-medium text-foreground";
const MAX_BIO = 255;

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

export default function EditTransporter() {
  const { authAxios, transporterId, setTransporterId } = useAuth();
  const navigate = useNavigate();
  const [idLoading, setIdLoading] = useState(!transporterId);

  const [values, setValues] = useState({
    name: "",
    type: "",
    bio: "",
    email: "",
    office_line: "",
    office_line_2: "",
    web_address: "",
  });
  const [lists, setLists] = useState({
    transport_mode: [],
    transport_means: [],
  });
  const [files, setFiles] = useState({ logo: null, vehicle_images: [] });
  const [filePreviews, setFilePreviews] = useState({
    logo: null,
    vehicle_images: [],
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [typeChoices, setTypeChoices] = useState([]);
  const [modeChoices, setModeChoices] = useState([]);
  const [meansChoices, setMeansChoices] = useState([]);

  // Type/mode/means options come from the backend (same source as the create
  // form) so the saved values match an option and display correctly.
  useEffect(() => {
    let cancelled = false;
    getTransporterTypeChoices()
      .then((d) => !cancelled && setTypeChoices(normalizeChoices(d)))
      .catch(() => {});
    getTransportModeChoices()
      .then((d) => !cancelled && setModeChoices(normalizeChoices(d)))
      .catch(() => {});
    getTransportMeansChoices()
      .then((d) => !cancelled && setMeansChoices(normalizeChoices(d)))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Always include the current type as an option so a loaded value shows even
  // before the async choices resolve (or if it isn't in the returned set).
  const typeOptions = useMemo(() => {
    if (values.type && !typeChoices.some((c) => c.value === values.type)) {
      return [
        ...typeChoices,
        { value: values.type, label: prettify(values.type) },
      ];
    }
    return typeChoices;
  }, [typeChoices, values.type]);

  // Merge fetched mode/means options with any already-saved values, so a saved
  // selection still renders (and stays toggled) even if it's not in the list.
  const modeOptions = useMemo(() => {
    const merged = [...modeChoices];
    lists.transport_mode.forEach((v) => {
      if (!merged.some((c) => c.value === v))
        merged.push({ value: v, label: prettify(v) });
    });
    return merged;
  }, [modeChoices, lists.transport_mode]);

  const meansOptions = useMemo(() => {
    const merged = [...meansChoices];
    lists.transport_means.forEach((v) => {
      if (!merged.some((c) => c.value === v))
        merged.push({ value: v, label: prettify(v) });
    });
    return merged;
  }, [meansChoices, lists.transport_means]);

  // Resolve the transporter id from the current user if it isn't in context yet.
  useEffect(() => {
    if (!transporterId) {
      (async () => {
        try {
          setIdLoading(true);
          const res = await authAxios.get("users/");
          const userData = res.data.results[0];
          if (userData.company && userData.company.includes("/transporters/")) {
            const id = userData.company.split("/").slice(-2)[0];
            setTransporterId(id);
          } else {
            toast.error("No transporter associated with this user");
          }
        } catch (err) {
          toast.error("Failed to load transporter ID");
          console.error("Fetch user error:", err);
        } finally {
          setIdLoading(false);
        }
      })();
    }
  }, [authAxios, transporterId, setTransporterId]);

  // Load the transporter's current details.
  useEffect(() => {
    if (transporterId) {
      (async () => {
        try {
          const { data } = await authAxios.get(`transporters/${transporterId}/`);
          setValues({
            name: data.name || "",
            type: data.type || "",
            bio: data.bio || "",
            email: data.email || "",
            office_line: data.office_line || "",
            office_line_2: data.office_line_2 || "",
            web_address: data.web_address || "",
          });
          setLists({
            transport_mode: data.transport_mode || [],
            transport_means: data.transport_means || [],
          });
          setFilePreviews({
            logo: data.logo || null,
            vehicle_images: data.vehicle_images?.map((img) => img.file) || [],
          });
          setFiles({ logo: null, vehicle_images: [] });
        } catch {
          toast.error("Failed to load transporter data");
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [authAxios, transporterId]);

  // Revoke object URLs for any locally-previewed uploads on unmount.
  useEffect(() => {
    return () => {
      filePreviews.vehicle_images.forEach((preview) => {
        if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
      });
      if (filePreviews.logo && filePreviews.logo.startsWith("blob:")) {
        URL.revokeObjectURL(filePreviews.logo);
      }
    };
  }, [filePreviews]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const toggleListItem = (name, value) => {
    setLists((prev) => {
      const set = new Set(prev[name]);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...prev, [name]: Array.from(set) };
    });
  };

  const handleFileChange = (e, index = null) => {
    const { name, files: fileList } = e.target;
    const file = fileList[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be under 2MB");
      return;
    }
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Only JPG and PNG formats are accepted");
      return;
    }
    if (name === "logo") {
      setFiles((f) => ({ ...f, logo: file }));
      setFilePreviews((p) => ({ ...p, logo: URL.createObjectURL(file) }));
    } else if (name === "vehicle_image" && index !== null) {
      setFiles((f) => {
        const images = [...f.vehicle_images];
        images[index] = file;
        return { ...f, vehicle_images: images };
      });
      setFilePreviews((p) => {
        const previews = [...p.vehicle_images];
        previews[index] = URL.createObjectURL(file);
        return { ...p, vehicle_images: previews };
      });
    }
  };

  const addVehicleImageSlot = () => {
    setFiles((f) => ({ ...f, vehicle_images: [...f.vehicle_images, null] }));
    setFilePreviews((p) => ({
      ...p,
      vehicle_images: [...p.vehicle_images, null],
    }));
  };

  const removeFile = (name, index = null) => {
    if (name === "logo") {
      setFiles((f) => ({ ...f, logo: null }));
      setFilePreviews((p) => ({ ...p, logo: null }));
    } else if (name === "vehicle_image" && index !== null) {
      setFiles((f) => {
        const images = [...f.vehicle_images];
        images.splice(index, 1);
        return { ...f, vehicle_images: images };
      });
      setFilePreviews((p) => {
        const previews = [...p.vehicle_images];
        previews.splice(index, 1);
        return { ...p, vehicle_images: previews };
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authAxios.patch(`transporters/${transporterId}/`, {
        ...values,
        transport_mode: lists.transport_mode,
        transport_means: lists.transport_means,
      });
      const formData = new FormData();
      if (files.logo) formData.append("logo", files.logo);
      files.vehicle_images.forEach((file, index) => {
        if (file) formData.append(`vehicle_images[${index}][file]`, file);
      });
      if (files.logo || files.vehicle_images.some((file) => file)) {
        await authAxios.patch(`transporters/${transporterId}/`, formData);
      }
      toast.success("Transporter updated successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Update error:", err);
      toast.error(
        err.response?.data?.vehicle_images?.[0] ||
          err.response?.data?.detail ||
          "Update failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (idLoading || (transporterId && loading)) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!transporterId) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center font-montserrat">
        <div className="rounded-2xl border border-border/70 bg-card p-8">
          <p className="font-display text-lg font-semibold">
            No transporter found
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            There&apos;s no transporter associated with this account yet.
          </p>
          <Button
            asChild
            className="mt-5 bg-brand-gradient text-brand-foreground hover:opacity-90"
          >
            <Link to="/dashboard/transporter">Create transporter</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <Truck className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold">
                Edit transporter
              </h1>
              <p className="mt-1 text-sm text-white/85">
                Update your transport service profile and fleet.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              asChild
              className="bg-white text-brand hover:bg-white/90"
            >
              <Link to="/dashboard/transporter/add-business-docs">
                <FileCheck2 className="mr-1.5 h-4 w-4" /> Documents
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="border-white/40 bg-white/10 text-brand-foreground hover:bg-white/20"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
          </div>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-8 rounded-2xl border border-border/70 bg-card p-6 sm:p-8"
      >
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
                onValueChange={(v) => {
                  if (!v) return;
                  setValues((prev) => ({ ...prev, type: v }));
                }}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.length ? (
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
                    values.bio.length >= MAX_BIO
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
              <label className={labelClass}>Transport modes</label>
              <div className="flex flex-wrap gap-2">
                {modeOptions.length ? (
                  modeOptions.map((mode) => {
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
                  <span className="text-sm text-muted-foreground">
                    No transport modes available.
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className={labelClass}>Transport means</label>
              <div className="flex flex-wrap gap-2">
                {meansOptions.length ? (
                  meansOptions.map((means) => {
                    const active = lists.transport_means.includes(means.value);
                    return (
                      <button
                        type="button"
                        key={means.value}
                        aria-pressed={active}
                        onClick={() =>
                          toggleListItem("transport_means", means.value)
                        }
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
                  <span className="text-sm text-muted-foreground">
                    No transport means available.
                  </span>
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
            Add a square logo (under 2MB, JPG or PNG) and vehicle images to
            showcase your fleet.
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
            onClick={() => navigate("/dashboard")}
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
                <Save className="mr-2 h-4 w-4" /> Save changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
