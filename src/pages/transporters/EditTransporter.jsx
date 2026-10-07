import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/app.context";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  FileCheck2,
  Landmark,
  Loader2,
  Save,
  Truck,
  Upload,
  X,
} from "lucide-react";

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
import { compressImage } from "@/utils/compress-image";
import { getCountryChoices } from "@/services/api/choices.service";
import VerifyOrganisation from "@/components/organisation/VerifyOrganisation";
import { storage } from "@/services/lib/storage";
import {
  getDistrictChoices,
  getTransporterTypeChoices,
  getTransportModeChoices,
  getTransportMeansChoices,
} from "@/services/api/transporters.service";
import { getRegionChoices } from "@/services/api/waitlist.service";

const labelClass = "mb-1 block text-sm font-medium text-foreground";
const MAX_BIO = 255;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
// The backend caps the WHOLE multipart body (~1MB), so every newly picked file
// (logo + front view + vehicle images) must fit under this together.
const MAX_TOTAL_UPLOAD = 900 * 1024;
const MOMO_RE = /^0\d{9}$/;
// Set by the registration form when the post-create TIN check failed.
const PENDING_TIN_KEY = "transporterPendingTin";

// Used only if /country-choices/ can't be fetched.
const FALLBACK_COUNTRIES = [
  { value: "ghana", label: "Ghana" },
  { value: "nigeria", label: "Nigeria" },
];

// The record's vehicle_images may be [{id, file}], [{file: url}] or plain
// URL strings; reduce to the displayable URLs.
const vehicleImageUrls = (list) =>
  (Array.isArray(list) ? list : [])
    .map((v) =>
      typeof v === "string" ? v : v?.file || v?.image || v?.url || null,
    )
    .filter(Boolean);

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
    country: "", // top-level per the API (not location[country])
    bank_account_name: "",
    bank_account_number: "",
    momo_number: "",
  });
  // TIN is verification-only (never PATCHed); `isVerified` drives the badge.
  const [tin, setTin] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [location, setLocation] = useState({
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
  // Already-saved gallery URLs (read-only) and newly picked files to append
  // as vehicle_images[N][file]: [{ file, preview }].
  const [existingVehicleImages, setExistingVehicleImages] = useState([]);
  const [vehicleImages, setVehicleImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [countryChoices, setCountryChoices] = useState([]);
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
    // Countries from /country-choices/, falling back to Ghana/Nigeria.
    getCountryChoices()
      .then((d) => {
        if (cancelled) return;
        const list = normalizeChoices(d);
        setCountryChoices(list.length ? list : FALLBACK_COUNTRIES);
      })
      .catch(() => !cancelled && setCountryChoices(FALLBACK_COUNTRIES));
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

  // Same guarantee for the saved country.
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
            // Country is top-level now; older records may still nest it.
            country: data.country || data.location?.country || "",
            bank_account_name: data.bank_account_name || "",
            bank_account_number: data.bank_account_number || "",
            momo_number: data.momo_number || "",
          });
          setTin(
            data.tin_number || data.tin || storage.get(PENDING_TIN_KEY) || "",
          );
          setIsVerified(Boolean(data.is_verified));
          const loc = data.location || {};
          setLocation({
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
          setExistingVehicleImages(vehicleImageUrls(data.vehicle_images));
          setVehicleImages([]);
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

  // Top-level country select (guards Radix's transient "" value).
  const setCountry = (v) => {
    if (!v) return;
    setValues((prev) => ({ ...prev, country: v }));
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

  // New vehicle photos: validate + compress each, then queue for upload.
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

  // Verified: clear the pending TIN; point out a registered-name mismatch.
  const handleOrganisationVerified = ({ organisationName }) => {
    setIsVerified(true);
    storage.remove(PENDING_TIN_KEY);
    if (!organisationName) return;
    if (!values.name.trim()) {
      setValues((v) => ({ ...v, name: organisationName }));
      toast.success("Transporter name filled from the verified organisation.");
    } else if (values.name.trim() !== organisationName.trim()) {
      toast.info(
        `Registered name is "${organisationName}". Update the name below if it should match.`,
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!String(values.country).trim())
      return toast.error("Please provide the country.");
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
    if (!lists.transport_mode.length)
      return toast.error("Please select at least one transport mode.");
    if (!lists.transport_means.length)
      return toast.error("Please select at least one transport means.");

    // The backend caps the whole multipart body, so guard the combined size of
    // every newly picked file (logo + front view + vehicle images).
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
      // Single multipart/form-data PATCH (partial update). `country` is a
      // top-level scalar in `values`; nested location via bracket notation;
      // modes/means as slotted dicts; images only if a new one was picked
      // (otherwise the existing one is kept); vehicle_images only for files
      // picked in this session (existing gallery entries are left untouched).
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
      vehicleImages.forEach(({ file }, i) =>
        fd.append(`vehicle_images[${i}][file]`, file),
      );

      await authAxios.patch(`transporters/${transporterId}/`, fd);
      toast.success("Transporter updated successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Update error:", err);
      const data = err.response?.data;
      const vehicleErr = data?.vehicle_images?.[0];
      toast.error(
        data?.detail ||
          data?.country?.[0] ||
          data?.logo?.[0] ||
          data?.image_front_view?.[0] ||
          (typeof vehicleErr === "string" ? vehicleErr : vehicleErr?.file?.[0]) ||
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
              <h1 className="flex flex-wrap items-center gap-2 font-display text-2xl font-bold">
                Edit transporter
                {isVerified ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-50 ring-1 ring-inset ring-emerald-300/60"
                    title="This organisation's TIN has been verified."
                  >
                    <BadgeCheck className="h-3.5 w-3.5" /> TIN verified
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full bg-amber-300/20 px-3 py-1 text-xs font-semibold text-amber-50 ring-1 ring-inset ring-amber-200/60"
                    title="Verify your TIN below to get your organisation verified."
                  >
                    <Clock className="h-3.5 w-3.5" /> Verification pending
                  </span>
                )}
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
            <div className="sm:col-span-2">
              <VerifyOrganisation
                value={tin}
                onChange={setTin}
                onVerified={handleOrganisationVerified}
                verified={isVerified}
                disabled={isVerified}
                hint={
                  isVerified
                    ? "Your organisation's TIN is verified. Contact support if it needs to change."
                    : "Verify your TIN to confirm your organisation."
                }
              />
            </div>
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
              <label className={labelClass}>Bank account name</label>
              <Input
                name="bank_account_name"
                value={values.bank_account_name}
                onChange={handleChange}
                placeholder="Name on the account"
                autoComplete="off"
              />
            </div>
            <div>
              <label className={labelClass}>Bank account number</label>
              <Input
                name="bank_account_number"
                value={values.bank_account_number}
                onChange={handleChange}
                inputMode="numeric"
                placeholder="Account number"
                autoComplete="off"
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
                onValueChange={setCountry}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {countryOptions.length ? (
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
            New vehicle photos are added to your existing gallery.
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

          {/* Vehicle gallery (vehicle_images[N][file]) */}
          <div className="mt-6">
            <label className={labelClass}>Vehicle images</label>
            {existingVehicleImages.length > 0 && (
              <ul className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {existingVehicleImages.map((url, index) => (
                  <li
                    key={`${url}-${index}`}
                    className="overflow-hidden rounded-xl border border-border bg-muted/30"
                  >
                    <img
                      src={url}
                      alt={`Vehicle ${index + 1}`}
                      className="h-24 w-full object-cover"
                    />
                    <p className="px-2 py-1 text-[11px] text-muted-foreground">
                      Saved
                    </p>
                  </li>
                ))}
              </ul>
            )}
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
                    className="relative overflow-hidden rounded-xl border border-border bg-muted/30"
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
