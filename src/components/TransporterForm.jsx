import { Landmark, Loader2, Upload, X } from "lucide-react";
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
import { getCountryChoices } from "@/services/api/choices.service";
import {
  createTransporter as createTransporterRequest,
  getDistrictChoices,
  getTransporterTypeChoices,
  getTransportMeansChoices,
  getTransportModeChoices,
} from "@/services/api/transporters.service";
// Shared region enum endpoint (/region-choices/) — the same source the waitlist
// form uses, so regions stay consistent across the app.
import { getRegionChoices } from "@/services/api/waitlist.service";
import { useAuth } from "@/services/context/app.context";
import { storage } from "@/services/lib/storage";
import { compressImage } from "@/utils/compress-image";
import { normalizeChoices, prettify } from "@/utils/choices";

// Create-transporter form. Matches the Cargo Transporters API (OpenAPI v1):
// POST /transporters/ as multipart/form-data with required logo +
// image_front_view images, optional vehicle_images[N][file] gallery files, a
// TOP-LEVEL `country`, a nested `location` (bracket notation, no country) and
// `transport_modes` / `transport_means` as slotted dicts. type/modes/means and
// country come from the backend choices endpoints; region comes from
// /region-choices/; district from /district-choices/?region=….
// (Category is intentionally omitted for now.)

const labelClass = "mb-1 block text-sm font-medium text-foreground";
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
// The backend caps the WHOLE multipart body (~1MB), so all files together —
// logo + front view + every vehicle image — must stay under this.
const MAX_TOTAL_UPLOAD = 900 * 1024;
const MAX_BIO = 225; // Backend caps the description/bio at 225 characters.

const EMPTY_VALUES = {
  name: "",
  type: "",
  bio: "",
  email: "",
  office_line: "",
  office_line_2: "",
  web_address: "",
  country: "", // top-level per the API (not location[country])
  // Banking details (settlements / escrow payouts). Bank account is required.
  bank_account_name: "",
  bank_account_number: "",
  momo_number: "",
};
// Keys newer than older drafts — not required for a draft to be restored.
const NEWER_DRAFT_KEYS = [
  "country",
  "bank_account_name",
  "bank_account_number",
  "momo_number",
];
const MOMO_RE = /^0\d{9}$/;
// TIN verification is deliberately NOT on registration (same as companies):
// verify-organisation needs an existing organisation, so it lives on the Edit
// transporter page.
const EMPTY_LOCATION = {
  region: "",
  district: "",
  popular_area_name: "",
  gps: "",
  street_address: "",
};

// Used only if /country-choices/ can't be fetched.
const FALLBACK_COUNTRIES = [
  { value: "ghana", label: "Ghana" },
  { value: "nigeria", label: "Nigeria" },
];
const VALUE_KEYS = Object.keys(EMPTY_VALUES);
const LOCATION_KEYS = Object.keys(EMPTY_LOCATION);

// Only the keys we own; drops stale keys from older drafts (e.g. a
// `location.country` persisted before country moved to the top level).
const pickKeys = (obj, keys) =>
  Object.fromEntries(keys.map((k) => [k, obj[k] ?? ""]));

// The API doesn't express which transport means belong to which mode, so both
// are classified into land / sea / air buckets by keyword and the means list is
// filtered to the selected mode(s). Anything unclassifiable stays visible
// (fail open) so a means is never wrongly hidden.
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
  // Gallery files sent as vehicle_images[N][file]: [{ file, preview }].
  const [vehicleImages, setVehicleImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [countryChoices, setCountryChoices] = useState([]);
  const [countryLoading, setCountryLoading] = useState(false);
  const [typeChoices, setTypeChoices] = useState([]);
  const [typeLoading, setTypeLoading] = useState(false);
  const [modeChoices, setModeChoices] = useState([]);
  const [modeLoading, setModeLoading] = useState(false);
  const [meansChoices, setMeansChoices] = useState([]);
  const [meansLoading, setMeansLoading] = useState(false);
  const [regionChoices, setRegionChoices] = useState([]);
  const [regionLoading, setRegionLoading] = useState(false);
  const [districtChoices, setDistrictChoices] = useState([]);
  const [districtLoading, setDistrictLoading] = useState(false);

  // Restore any in-progress draft once on mount. (File objects can't be
  // persisted, so previews are restored but the files must be re-picked.)
  useEffect(() => {
    const parsedValues = storage.getJSON("transporterFormValues");
    const parsedLocation = storage.getJSON("transporterFormLocation");
    // Older drafts kept country under location; lift it to the top level.
    const legacyCountry = parsedLocation?.country || "";
    if (
      parsedValues &&
      validateStoredData(
        parsedValues,
        VALUE_KEYS.filter((k) => !NEWER_DRAFT_KEYS.includes(k)),
      )
    ) {
      setValues({
        ...pickKeys(parsedValues, VALUE_KEYS),
        country: parsedValues.country || legacyCountry,
      });
      toast.info("Form data restored from previous session.");
    }
    if (parsedLocation && validateStoredData(parsedLocation, LOCATION_KEYS)) {
      setLocation(pickKeys(parsedLocation, LOCATION_KEYS));
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
  useEffect(
    () =>
      loadChoices(getRegionChoices, setRegionChoices, setRegionLoading, "regions"),
    [],
  );
  // Countries come from /country-choices/; fall back to Ghana/Nigeria so the
  // (required) field is never left without options.
  useEffect(() => {
    let cancelled = false;
    setCountryLoading(true);
    getCountryChoices()
      .then((data) => {
        if (cancelled) return;
        const list = normalizeChoices(data);
        setCountryChoices(list.length ? list : FALLBACK_COUNTRIES);
      })
      .catch(() => {
        if (!cancelled) setCountryChoices(FALLBACK_COUNTRIES);
      })
      .finally(() => {
        if (!cancelled) setCountryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
        if (!cancelled) {
          setDistrictChoices([]);
          toast.error("Couldn't load districts.");
        }
      })
      .finally(() => {
        if (!cancelled) setDistrictLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [location.region]);

  // Keep a restored draft district selectable before its options load.
  const districtOptions = useMemo(() => {
    if (
      location.district &&
      !districtChoices.some((c) => c.value === location.district)
    ) {
      return [
        ...districtChoices,
        { value: location.district, label: prettify(location.district) },
      ];
    }
    return districtChoices;
  }, [districtChoices, location.district]);

  // Which land/sea/air buckets the selected modes cover.
  const activeModeBuckets = useMemo(
    () => new Set(lists.transport_modes.map((v) => bucketOf(v)).filter(Boolean)),
    [lists.transport_modes],
  );

  // Show only the means matching the selected mode(s); before any mode is
  // chosen, show them all.
  const visibleMeans = useMemo(
    () =>
      meansChoices.filter((m) => {
        if (!activeModeBuckets.size) return true;
        const b = meansBucket(m);
        return b == null || activeModeBuckets.has(b);
      }),
    [meansChoices, activeModeBuckets],
  );

  // Drop any already-selected means that no longer match the chosen modes, so
  // a now-hidden means can't be submitted.
  useEffect(() => {
    setLists((prev) => {
      if (!prev.transport_means.length || !activeModeBuckets.size) return prev;
      const valid = prev.transport_means.filter((v) => {
        const m = meansChoices.find((c) => c.value === v);
        const b = m ? meansBucket(m) : null;
        return b == null || activeModeBuckets.has(b);
      });
      if (valid.length === prev.transport_means.length) return prev;
      const next = { ...prev, transport_means: valid };
      persist("transporterFormLists", next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModeBuckets, meansChoices]);

  // Guarantee a restored type value always has a matching option before the
  // async choices resolve, so the trigger doesn't fall back to the placeholder.
  const typeOptions = useMemo(() => {
    if (values.type && !typeChoices.some((c) => c.value === values.type)) {
      return [...typeChoices, { value: values.type, label: prettify(values.type) }];
    }
    return typeChoices;
  }, [typeChoices, values.type]);

  // Same guarantee for a restored country value.
  const countryOptions = useMemo(() => {
    if (
      values.country &&
      !countryChoices.some((c) => c.value === values.country)
    ) {
      return [
        ...countryChoices,
        { value: values.country, label: prettify(values.country) },
      ];
    }
    return countryChoices;
  }, [countryChoices, values.country]);

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
  // Set a location dropdown value (region/district). Guards the empty value
  // Radix can emit while options reconcile.
  const setLocationField = (name, value) => {
    if (!value) return;
    setLocation((l) => {
      const next = { ...l, [name]: value };
      // Region drives the district options, so a new region clears the district.
      if (name === "region") next.district = "";
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

  // Multi-file vehicle gallery: validate + compress each picked image and
  // append to the list (File objects can't be persisted in the draft).
  const handleVehicleImagesChange = async (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-picking the same files
    if (!picked.length) return;
    const accepted = [];
    for (const raw of picked) {
      if (!raw.type.startsWith("image/")) {
        toast.error(`${raw.name} is not an image and was skipped.`);
        continue;
      }
      const file = await compressImage(raw);
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`${raw.name} is too large and was skipped.`);
        continue;
      }
      accepted.push({ file, preview: URL.createObjectURL(file) });
    }
    if (accepted.length) setVehicleImages((prev) => [...prev, ...accepted]);
  };

  const removeVehicleImage = (index) => {
    setVehicleImages((prev) => {
      const target = prev[index];
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearDraft = () => {
    storage.remove("transporterFormValues");
    storage.remove("transporterFormLocation");
    storage.remove("transporterFormLists");
    // TIN draft left by an earlier build that had the field on registration.
    storage.remove("transporterFormTin");
  };

  const handleReset = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setValues(EMPTY_VALUES);
    setLocation(EMPTY_LOCATION);
    setLists({ transport_modes: [], transport_means: [] });
    setFiles({ logo: null, image_front_view: null });
    setFilePreviews({ logo: null, image_front_view: null });
    vehicleImages.forEach((v) => v.preview && URL.revokeObjectURL(v.preview));
    setVehicleImages([]);
    clearDraft();
    toast.success("Form reset successfully.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Required fields per the spec.
    const missingScalar = [
      ["name", "transporter name"],
      ["type", "type"],
      ["bio", "bio"],
      ["email", "email"],
      ["office_line", "primary phone"],
      ["country", "country"],
    ].find(([k]) => !String(values[k]).trim());
    if (missingScalar)
      return toast.error(`Please provide the ${missingScalar[1]}.`);
    if (!values.bank_account_name.trim())
      return toast.error("Please provide the bank account name.");
    if (!values.bank_account_number.trim())
      return toast.error("Please provide the bank account number.");
    if (values.momo_number && !MOMO_RE.test(values.momo_number.trim()))
      return toast.error(
        "Mobile money number must start with 0 and be 10 digits (e.g. 0241234567), not +233.",
      );

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

    // The backend caps the whole multipart body, so guard the combined size of
    // every file (logo + front view + vehicle images).
    const totalUpload = [
      files.logo,
      files.image_front_view,
      ...vehicleImages.map((v) => v.file),
    ].reduce((sum, f) => sum + (f?.size || 0), 0);
    if (totalUpload > MAX_TOTAL_UPLOAD)
      return toast.error(
        "Your images are too large altogether. Please use smaller or fewer images.",
      );

    setSubmitting(true);
    try {
      // multipart/form-data (required for the image uploads). `country` is a
      // top-level scalar in `values`, so it's appended here as `country`.
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (String(v).trim()) fd.append(k, v);
      });
      // Nested location via bracket notation: location[region]=… (no country).
      Object.entries(location).forEach(([k, v]) => {
        if (String(v).trim()) fd.append(`location[${k}]`, v);
      });
      // The backend expects these as nested DICTIONARIES (it rejects repeated
      // string keys with "Expected a dictionary, but got str"). Send each
      // selection into a slotted bracket key: transport_modes[mode_1]=land,
      // transport_means[means_1]=truck, …
      lists.transport_modes.forEach((v, i) =>
        fd.append(`transport_modes[mode_${i + 1}]`, v),
      );
      lists.transport_means.forEach((v, i) =>
        fd.append(`transport_means[means_${i + 1}]`, v),
      );
      fd.append("logo", files.logo);
      fd.append("image_front_view", files.image_front_view);
      // Gallery: vehicle_images[0][file], vehicle_images[1][file], …
      vehicleImages.forEach(({ file }, i) =>
        fd.append(`vehicle_images[${i}][file]`, file),
      );

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
      const vehicleErr = data?.vehicle_images?.[0];
      toast.error(
        data?.detail ||
          data?.country?.[0] ||
          data?.logo?.[0] ||
          data?.image_front_view?.[0] ||
          (typeof vehicleErr === "string" ? vehicleErr : vehicleErr?.file?.[0]) ||
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

      {/* Banking details */}
      <section className="border-b border-border pb-6">
        <h2 className="mb-1 flex items-center gap-2 font-display text-base font-semibold">
          <Landmark className="h-4 w-4 text-brand" /> Banking details
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Where your delivery payments and escrow payouts are settled.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              Bank account name <span className="text-destructive">*</span>
            </label>
            <Input
              name="bank_account_name"
              value={values.bank_account_name}
              onChange={handleChange}
              placeholder="Name on the account"
              autoComplete="off"
              required
            />
          </div>
          <div>
            <label className={labelClass}>
              Bank account number <span className="text-destructive">*</span>
            </label>
            <Input
              name="bank_account_number"
              value={values.bank_account_number}
              onChange={handleChange}
              inputMode="numeric"
              placeholder="Account number"
              autoComplete="off"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Mobile money number</label>
            <Input
              type="tel"
              name="momo_number"
              value={values.momo_number}
              onChange={handleChange}
              inputMode="numeric"
              maxLength={10}
              placeholder="0241234567"
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Optional. Local format starting with 0 (10 digits), not +233.
            </p>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="border-b border-border pb-6">
        <h2 className="mb-4 font-display text-base font-semibold">Location</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              Country <span className="text-destructive">*</span>
            </label>
            <Select
              value={values.country || undefined}
              onValueChange={(v) => setValue("country", v)}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue
                  placeholder={
                    countryLoading ? "Loading countries…" : "Select a country"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {countryLoading && !countryOptions.length ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
                  </div>
                ) : countryOptions.length ? (
                  countryOptions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))
                ) : (
                  <div className="py-2 text-center text-sm text-muted-foreground">
                    No countries available
                  </div>
                )}
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
                <SelectValue
                  placeholder={regionLoading ? "Loading regions…" : "Select a region"}
                />
              </SelectTrigger>
              <SelectContent>
                {regionLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
                  </div>
                ) : regionChoices.length ? (
                  regionChoices.map((r) => (
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
            {renderChips("transport_modes", modeChoices, modeLoading)}
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
            {renderChips("transport_means", visibleMeans, meansLoading)}
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
          You can also add photos of your vehicles.
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

        {/* Vehicle gallery (vehicle_images[N][file]) */}
        <div className="mt-6">
          <label className={labelClass}>Vehicle images</label>
          <label className="relative flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-input bg-muted/30 text-center transition-colors hover:border-brand/50 hover:bg-brand/5">
            <Upload className="mb-1 h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Click to add one or more vehicle photos
            </span>
            <input
              type="file"
              name="vehicle_images"
              accept="image/*"
              multiple
              onChange={handleVehicleImagesChange}
              className="hidden"
            />
          </label>
          {vehicleImages.length > 0 && (
            <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {vehicleImages.map((v, index) => (
                <li
                  key={`${v.file.name}-${index}`}
                  className="group relative overflow-hidden rounded-xl border border-border bg-muted/30"
                >
                  <img
                    src={v.preview}
                    alt={v.file.name}
                    className="h-24 w-full object-cover"
                  />
                  <p
                    className="truncate px-2 py-1 text-[11px] text-muted-foreground"
                    title={v.file.name}
                  >
                    {v.file.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeVehicleImage(index)}
                    aria-label={`Remove ${v.file.name}`}
                    className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-muted-foreground shadow transition-colors hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
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
