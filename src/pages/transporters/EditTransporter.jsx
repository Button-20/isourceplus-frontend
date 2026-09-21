import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/app.context";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Upload, X, Truck, ArrowLeft, FileCheck2, Save } from "lucide-react";

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
  getDistrictChoices,
  getTransporterTypeChoices,
  getTransportModeChoices,
  getTransportMeansChoices,
} from "@/services/api/transporters.service";
import { getRegionChoices } from "@/services/api/waitlist.service";

const labelClass = "mb-1 block text-sm font-medium text-foreground";
const MAX_BIO = 255;

const COUNTRIES = [
  { value: "ghana", label: "Ghana" },
  { value: "nigeria", label: "Nigeria" },
];

// The API doesn't relate modes↔means, so both are classified into land/sea/air
// buckets by keyword and the means list is filtered to the selected mode(s).
const bucketOf = (text) => {
  const s = String(text || "").toLowerCase();
  if (/air|plane|aircraft|helicopter|jet|drone|flight|fly/.test(s)) return "air";
  if (/sea|marine|ocean|ship|boat|ferry|barge|vessel|canoe|water/.test(s))
    return "sea";
  if (/land|road|ground|rail|train|truck|lorry|van|bus|car|bike|bicycle|motor/.test(s))
    return "land";
  return null;
};
const meansBucket = (m) => bucketOf(`${m?.value ?? m} ${m?.label ?? ""}`);

// Take only the populated mode_N / means_N slots from the API's keyed dict
// ({id, mode_1:"air", mode_2:null,…}); never the id. Accepts a plain array too.
const slotValues = (v) => {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (v && typeof v === "object")
    return Object.entries(v)
      .filter(([k, val]) => /_\d+$/.test(k) && val)
      .map(([, val]) => val);
  return [];
};

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
  const [location, setLocation] = useState({
    country: "",
    region: "",
    district: "",
    popular_area_name: "",
    gps: "",
    street_address: "",
  });
  const [lists, setLists] = useState({
    transport_mode: [],
    transport_means: [],
  });
  const [files, setFiles] = useState({ logo: null, image_front_view: null });
  const [filePreviews, setFilePreviews] = useState({
    logo: null,
    image_front_view: null,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [typeChoices, setTypeChoices] = useState([]);
  const [modeChoices, setModeChoices] = useState([]);
  const [meansChoices, setMeansChoices] = useState([]);
  const [regionChoices, setRegionChoices] = useState([]);
  const [districtChoices, setDistrictChoices] = useState([]);
  const [districtLoading, setDistrictLoading] = useState(false);

  // Type/mode/means/region options come from the backend (same source as the
  // create form) so saved values match an option and display correctly.
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
    getRegionChoices()
      .then((d) => !cancelled && setRegionChoices(normalizeChoices(d)))
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

  // Which land/sea/air buckets the selected modes cover, and the means visible
  // for them. Currently-selected means always stay visible (so they can be
  // deselected and saved data is never hidden).
  const activeModeBuckets = useMemo(
    () => new Set(lists.transport_mode.map((v) => bucketOf(v)).filter(Boolean)),
    [lists.transport_mode],
  );
  const visibleMeans = useMemo(
    () =>
      meansOptions.filter((m) => {
        if (lists.transport_means.includes(m.value)) return true;
        if (!activeModeBuckets.size) return true;
        const b = meansBucket(m);
        return b == null || activeModeBuckets.has(b);
      }),
    [meansOptions, activeModeBuckets, lists.transport_means],
  );

  const regionOptions = useMemo(() => {
    if (location.region && !regionChoices.some((c) => c.value === location.region))
      return [
        ...regionChoices,
        { value: location.region, label: prettify(location.region) },
      ];
    return regionChoices;
  }, [regionChoices, location.region]);

  const districtOptions = useMemo(() => {
    if (
      location.district &&
      !districtChoices.some((c) => c.value === location.district)
    )
      return [
        ...districtChoices,
        { value: location.district, label: prettify(location.district) },
      ];
    return districtChoices;
  }, [districtChoices, location.district]);

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
          const loc = data.location || {};
          setLocation({
            country: loc.country || "",
            region: loc.region || "",
            district: loc.district || "",
            popular_area_name: loc.popular_area_name || "",
            gps: loc.gps || "",
            street_address: loc.street_address || "",
          });
          setLists({
            transport_mode: slotValues(data.transport_modes ?? data.transport_mode),
            transport_means: slotValues(data.transport_means),
          });
          setFilePreviews({
            logo: data.logo || null,
            image_front_view: data.image_front_view || null,
          });
          setFiles({ logo: null, image_front_view: null });
        } catch {
          toast.error("Failed to load transporter data");
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [authAxios, transporterId]);

  // Districts depend on the selected region (/district-choices/?region=…).
  useEffect(() => {
    if (!location.region) {
      setDistrictChoices([]);
      return;
    }
    let cancelled = false;
    setDistrictLoading(true);
    getDistrictChoices(location.region)
      .then((d) => {
        if (!cancelled) setDistrictChoices(normalizeChoices(d));
      })
      .catch(() => {
        if (!cancelled) setDistrictChoices([]);
      })
      .finally(() => {
        if (!cancelled) setDistrictLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [location.region]);

  // Revoke object URLs for any locally-previewed uploads on unmount.
  useEffect(() => {
    return () => {
      Object.values(filePreviews).forEach((preview) => {
        if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
      });
    };
  }, [filePreviews]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setLocation((l) => ({ ...l, [name]: value }));
  };

  const setLocationField = (name, value) => {
    if (!value) return;
    setLocation((l) => {
      const next = { ...l, [name]: value };
      // Region drives district options, so a new region clears the district.
      if (name === "region") next.district = "";
      return next;
    });
  };

  const setType = (v) => {
    if (!v) return;
    setValues((prev) => ({ ...prev, type: v }));
  };

  const toggleListItem = (name, value) => {
    setLists((prev) => {
      const set = new Set(prev[name]);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...prev, [name]: Array.from(set) };
    });
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    const file = fileList[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be under 2MB");
      return;
    }
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Only JPG and PNG formats are accepted");
      return;
    }
    setFiles((f) => ({ ...f, [name]: file }));
    setFilePreviews((p) => ({ ...p, [name]: URL.createObjectURL(file) }));
  };

  const removeFile = (name) => {
    setFiles((f) => ({ ...f, [name]: null }));
    setFilePreviews((p) => ({ ...p, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const missingLocation = [
      ["region", "region"],
      ["district", "district"],
      ["gps", "GPS address"],
      ["street_address", "street address"],
    ].find(([k]) => !String(location[k]).trim());
    if (missingLocation)
      return toast.error(`Please provide the ${missingLocation[1]}.`);
    if (!lists.transport_mode.length)
      return toast.error("Please select at least one transport mode.");
    if (!lists.transport_means.length)
      return toast.error("Please select at least one transport means.");

    setSubmitting(true);
    try {
      // Single multipart/form-data PATCH (partial update). Nested location via
      // bracket notation; modes/means as slotted dicts; images only if a new
      // one was picked (otherwise the existing one is kept).
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (String(v).trim()) fd.append(k, v);
      });
      Object.entries(location).forEach(([k, v]) => {
        if (String(v).trim()) fd.append(`location[${k}]`, v);
      });
      lists.transport_mode.forEach((v, i) =>
        fd.append(`transport_modes[mode_${i + 1}]`, v),
      );
      lists.transport_means.forEach((v, i) =>
        fd.append(`transport_means[means_${i + 1}]`, v),
      );
      if (files.logo) fd.append("logo", files.logo);
      if (files.image_front_view)
        fd.append("image_front_view", files.image_front_view);

      await authAxios.patch(`transporters/${transporterId}/`, fd);
      toast.success("Transporter updated successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Update error:", err);
      const data = err.response?.data;
      toast.error(
        data?.detail ||
          data?.logo?.[0] ||
          data?.image_front_view?.[0] ||
          (typeof data === "string" ? data : null) ||
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

  const renderChips = (name, options) => (
    <div className="flex flex-wrap gap-2">
      {options.length ? (
        options.map((c) => {
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
        <span className="text-sm text-muted-foreground">None available.</span>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
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
            <Button asChild className="bg-white text-brand hover:bg-white/90">
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
              <Input name="name" value={values.name} onChange={handleChange} required />
            </div>
            <div>
              <label className={labelClass}>
                Type <span className="text-destructive">*</span>
              </label>
              <Select value={values.type || undefined} onValueChange={setType}>
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

        {/* Location */}
        <section className="border-b border-border pb-6">
          <h2 className="mb-4 font-display text-base font-semibold">Location</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Country</label>
              <Select
                value={location.country || undefined}
                onValueChange={(v) => setLocationField("country", v)}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={labelClass}>
                Region <span className="text-destructive">*</span>
              </label>
              <Select
                value={location.region || undefined}
                onValueChange={(v) => setLocationField("region", v)}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent>
                  {regionOptions.length ? (
                    regionOptions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="py-2 text-center text-sm text-muted-foreground">
                      No regions available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={labelClass}>
                District <span className="text-destructive">*</span>
              </label>
              <Select
                value={location.district || undefined}
                onValueChange={(v) => setLocationField("district", v)}
                disabled={!location.region}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue
                    placeholder={
                      !location.region
                        ? "Select a region first"
                        : districtLoading
                          ? "Loading districts…"
                          : "Select a district"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {districtLoading && !districtOptions.length ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
                    </div>
                  ) : districtOptions.length ? (
                    districtOptions.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="py-2 text-center text-sm text-muted-foreground">
                      No districts available
                    </div>
                  )}
                </SelectContent>
              </Select>
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
              {renderChips("transport_mode", modeOptions)}
            </div>
            <div>
              <label className={labelClass}>
                Transport means <span className="text-destructive">*</span>
              </label>
              {activeModeBuckets.size > 0 && (
                <p className="mb-2 text-xs text-muted-foreground">
                  Showing means for your selected mode
                  {activeModeBuckets.size > 1 ? "s" : ""}.
                </p>
              )}
              {renderChips("transport_means", visibleMeans)}
            </div>
          </div>
        </section>

        {/* Media uploads */}
        <section>
          <h2 className="mb-1 font-display text-base font-semibold">
            Media uploads
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Upload a new logo or front-view image to replace the current one
            (under 2MB, JPG or PNG). Leave as-is to keep the existing image.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <UploadTile
              label="Logo"
              name="logo"
              preview={filePreviews.logo}
              onChange={handleFileChange}
              onRemove={() => removeFile("logo")}
            />
            <UploadTile
              label="Front-view image"
              name="image_front_view"
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
