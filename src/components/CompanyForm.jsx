import { Check, Loader2, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
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
import { getCountryChoices } from "@/services/api/choices.service";
import {
  createCompany,
  getCompanyTypeChoices,
  getIndustryChoices,
  getSubCategoryChoices,
  getSupplierTypeChoices,
} from "@/services/api/companies.service";
import { getDistrictChoices } from "@/services/api/transporters.service";
// Shared region enum endpoint (/region-choices/) — same source as the
// transporter and waitlist forms, so regions stay consistent across the app.
import { getRegionChoices } from "@/services/api/waitlist.service";
import { useAuth } from "@/services/context/app.context";
import { storage } from "@/services/lib/storage";
import { normalizeChoices, prettify } from "@/utils/choices";
import { compressImage } from "@/utils/compress-image";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

// Flat multipart keys. `supplier_type` and `sub_category` are supplier-only and
// are omitted from the payload entirely for buyers.
const EMPTY_VALUES = {
  name: "",
  type: "",
  country: "",
  supplier_type: "",
  industry: "",
  sub_category: "",
  bio: "",
  email: "",
  office_line: "",
  office_line_2: "",
  web_address: "",
  // Payment details (all optional).
  bank_account_name: "",
  bank_account_number: "",
  momo_number: "",
};

// Sent as bracketed keys: location[region], location[district], …
const EMPTY_LOCATION = {
  region: "",
  district: "",
  popular_area_name: "",
  gps: "",
  street_address: "",
};

const SUPPLIER_ONLY_KEYS = ["supplier_type", "sub_category"];
// Mobile money numbers are local Ghanaian format: leading 0 + 9 digits
// (0241234567), never the +233 international prefix.
const MOMO_RE = /^0\d{9}$/;

const VALUE_KEYS = Object.keys(EMPTY_VALUES);
const LOCATION_KEYS = Object.keys(EMPTY_LOCATION);
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB, per the upload guidelines below.
// The backend caps the whole request at ~1MB; keep the combined upload under it.
const MAX_TOTAL_UPLOAD = 900 * 1024;
const MAX_BIO = 225; // Backend caps the description/bio at 225 characters.

// Used when company-type-choices/ can't be reached.
const FALLBACK_TYPE_CHOICES = [
  { value: "buyer", label: "Buyer" },
  { value: "supplier", label: "Supplier" },
];
// Used when country-choices/ can't be reached.
const FALLBACK_COUNTRY_CHOICES = [{ value: "ghana", label: "Ghana" }];

// Prefer Ghana, otherwise the first option.
const defaultCountry = (choices) =>
  choices.find(
    (c) =>
      c.value.toLowerCase() === "ghana" || c.label.toLowerCase() === "ghana",
  )?.value ??
  choices[0]?.value ??
  "";

// Keep a restored draft value selectable even if it isn't in the loaded options
// (e.g. the options request failed or hasn't resolved yet).
const withCurrent = (choices, value) =>
  value && !choices.some((c) => c.value === value)
    ? [...choices, { value, label: prettify(value) }]
    : choices;

// Only accept a stored blob if it has the keys we expect.
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

// Generic choices Select used for every enum-backed field below.
function ChoiceSelect({
  value,
  onValueChange,
  options,
  placeholder,
  loading = false,
  disabled = false,
  emptyText = "No options available",
}) {
  return (
    <Select
      value={value || undefined}
      onValueChange={onValueChange}
      disabled={disabled || loading}
    >
      <SelectTrigger className="h-10 w-full">
        <SelectValue placeholder={loading ? "Loading…" : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.length ? (
          options.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))
        ) : (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {loading ? "Loading…" : emptyText}
          </div>
        )}
      </SelectContent>
    </Select>
  );
}

const CompanyForm = () => {
  const { setCompanyId } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState(EMPTY_VALUES);
  const [location, setLocation] = useState(EMPTY_LOCATION);
  // TIN is used only to verify the organisation (POST verify-organisation/); the
  // company model doesn't store it, so it's kept out of `values` / the create
  // payload and persisted under its own draft key.
  const [files, setFiles] = useState({ logo: null, image_front_view: null });
  const [filePreviews, setFilePreviews] = useState({
    logo: null,
    image_front_view: null,
  });
  const [submitting, setSubmitting] = useState(false);

  // Enum sources (all backend-owned).
  const [countryChoices, setCountryChoices] = useState([]);
  const [countryLoading, setCountryLoading] = useState(false);
  const [typeChoices, setTypeChoices] = useState(FALLBACK_TYPE_CHOICES);
  const [typeLoading, setTypeLoading] = useState(false);
  const [supplierTypeChoices, setSupplierTypeChoices] = useState([]);
  const [supplierTypeLoading, setSupplierTypeLoading] = useState(false);
  const [industryChoices, setIndustryChoices] = useState([]);
  const [industryLoading, setIndustryLoading] = useState(false);
  const [subCategoryChoices, setSubCategoryChoices] = useState([]);
  const [subCategoryLoading, setSubCategoryLoading] = useState(false);
  const [regionChoices, setRegionChoices] = useState([]);
  const [regionLoading, setRegionLoading] = useState(false);
  const [districtChoices, setDistrictChoices] = useState([]);
  const [districtLoading, setDistrictLoading] = useState(false);

  const isSupplier = values.type === "supplier";

  const persistValues = (next) => storage.setJSON("companyFormValues", next);
  const persistLocation = (next) =>
    storage.setJSON("companyFormLocation", next);

  // Restore any in-progress draft from a previous session.
  useEffect(() => {
    const parsedValues = storage.getJSON("companyFormValues");
    if (parsedValues && validateStoredData(parsedValues, VALUE_KEYS)) {
      setValues(parsedValues);
      toast.info("Form data restored from previous session.");
    }
    const parsedLocation = storage.getJSON("companyFormLocation");
    if (parsedLocation && validateStoredData(parsedLocation, LOCATION_KEYS)) {
      setLocation(parsedLocation);
    }
    const parsedPreviews = storage.getJSON("companyFormFilePreviews");
    if (
      parsedPreviews &&
      validateStoredData(parsedPreviews, ["logo", "image_front_view"])
    ) {
      setFilePreviews(parsedPreviews);
    }
    // Clean up the TIN draft left by older builds (the TIN field no longer
    // exists on registration — see note above the Company information section).
    storage.remove("companyFormTin");
  }, []);

  // Static enums: country, company type, supplier type, region. Country gets a
  // default (Ghana / first option) once loaded, unless a draft already set one.
  useEffect(() => {
    let cancelled = false;

    setCountryLoading(true);
    getCountryChoices()
      .then((d) => {
        if (cancelled) return;
        const list = normalizeChoices(d);
        setCountryChoices(list.length ? list : FALLBACK_COUNTRY_CHOICES);
      })
      .catch(() => {
        if (!cancelled) setCountryChoices(FALLBACK_COUNTRY_CHOICES);
      })
      .finally(() => {
        if (!cancelled) setCountryLoading(false);
      });

    setTypeLoading(true);
    getCompanyTypeChoices()
      .then((d) => {
        if (cancelled) return;
        const list = normalizeChoices(d);
        setTypeChoices(list.length ? list : FALLBACK_TYPE_CHOICES);
      })
      .catch(() => {
        if (!cancelled) setTypeChoices(FALLBACK_TYPE_CHOICES);
      })
      .finally(() => {
        if (!cancelled) setTypeLoading(false);
      });

    setSupplierTypeLoading(true);
    getSupplierTypeChoices()
      .then((d) => {
        if (!cancelled) setSupplierTypeChoices(normalizeChoices(d));
      })
      .catch(() => {
        if (!cancelled) setSupplierTypeChoices([]);
      })
      .finally(() => {
        if (!cancelled) setSupplierTypeLoading(false);
      });

    setRegionLoading(true);
    getRegionChoices()
      .then((d) => {
        if (!cancelled) setRegionChoices(normalizeChoices(d));
      })
      .catch(() => {
        if (!cancelled) {
          setRegionChoices([]);
          toast.error("Couldn't load regions.");
        }
      })
      .finally(() => {
        if (!cancelled) setRegionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Apply the country default after the options resolve (the draft, if any, has
  // already been restored by then).
  useEffect(() => {
    if (!countryChoices.length) return;
    setValues((v) => {
      if (v.country) return v;
      const next = { ...v, country: defaultCountry(countryChoices) };
      persistValues(next);
      return next;
    });
  }, [countryChoices]);

  // Industry is required for both types and keyed by the company type
  // (/industry-choices/?type=…). Runs on type change and on draft restore.
  useEffect(() => {
    if (!values.type) {
      setIndustryChoices([]);
      return undefined;
    }
    let cancelled = false;
    setIndustryLoading(true);
    getIndustryChoices(values.type)
      .then((data) => {
        if (!cancelled) setIndustryChoices(normalizeChoices(data));
      })
      .catch(() => {
        if (!cancelled) {
          setIndustryChoices([]);
          toast.error("Couldn't load industries for that type.");
        }
      })
      .finally(() => {
        if (!cancelled) setIndustryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [values.type]);

  // Suppliers additionally pick a sub-category, which depends on the industry
  // (/supplier/sub-category-choices/?type=&industry=). Buyers don't use this.
  useEffect(() => {
    if (!isSupplier || !values.industry) {
      setSubCategoryChoices([]);
      return undefined;
    }
    let cancelled = false;
    setSubCategoryLoading(true);
    getSubCategoryChoices(values.type, values.industry)
      .then((data) => {
        if (!cancelled) setSubCategoryChoices(normalizeChoices(data));
      })
      .catch(() => {
        if (!cancelled) {
          setSubCategoryChoices([]);
          toast.error("Couldn't load sub-categories for that industry.");
        }
      })
      .finally(() => {
        if (!cancelled) setSubCategoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSupplier, values.type, values.industry]);

  // Districts depend on the selected region (/district-choices/?region=…).
  useEffect(() => {
    if (!location.region) {
      setDistrictChoices([]);
      return undefined;
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => {
      const next = { ...v, [name]: value };
      persistValues(next);
      return next;
    });
  };

  // Simple enum fields (country, supplier_type).
  const handleSelectChange = (name, value) => {
    setValues((v) => {
      const next = { ...v, [name]: value };
      persistValues(next);
      return next;
    });
  };

  // Type drives the industry options (and the supplier-only fields), so reset
  // the whole dependent chain.
  const handleTypeChange = (value) => {
    setValues((v) => {
      const next = {
        ...v,
        type: value,
        industry: "",
        sub_category: "",
        supplier_type: value === "supplier" ? v.supplier_type : "",
      };
      persistValues(next);
      return next;
    });
  };

  // Industry drives the supplier sub-category options.
  const handleIndustryChange = (value) => {
    setValues((v) => {
      const next = { ...v, industry: value, sub_category: "" };
      persistValues(next);
      return next;
    });
  };

  // Region drives the district options, so a new region clears the district.
  const setLocationField = (name, value) => {
    setLocation((l) => {
      const next = { ...l, [name]: value };
      if (name === "region" && value !== l.region) next.district = "";
      persistLocation(next);
      return next;
    });
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setLocationField(name, value);
  };

  const handleFileChange = async (e) => {
    const { name, files: fileList } = e.target;
    const picked = fileList[0];
    e.target.value = ""; // let the user re-pick the same file after an error
    if (!picked) return;
    // Downscale before upload so the request stays under the backend's size cap.
    const file = await compressImage(picked);
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image is too large. Please use a smaller image.");
      return;
    }
    setFiles((f) => ({ ...f, [name]: file }));
    setFilePreviews((p) => {
      const next = { ...p, [name]: URL.createObjectURL(file) };
      storage.setJSON("companyFormFilePreviews", next);
      return next;
    });
  };

  const removeFile = (name) => {
    setFiles((f) => ({ ...f, [name]: null }));
    setFilePreviews((p) => {
      const next = { ...p, [name]: null };
      storage.setJSON("companyFormFilePreviews", next);
      return next;
    });
  };

  const clearDraft = () => {
    storage.remove("companyFormValues");
    storage.remove("companyFormLocation");
    storage.remove("companyFormFilePreviews");
  };

  const resetState = () => {
    setValues({ ...EMPTY_VALUES, country: defaultCountry(countryChoices) });
    setLocation(EMPTY_LOCATION);
    setFiles({ logo: null, image_front_view: null });
    setFilePreviews({ logo: null, image_front_view: null });
  };

  const handleReset = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    resetState();
    clearDraft();
    toast.success("Form reset successfully.");
  };

  // Returns the first validation problem, or null when the form is complete.
  const validate = () => {
    if (!values.name.trim()) return "Please enter the company name.";
    if (!values.type) return "Please select a company type.";
    if (!values.country) return "Please select a country.";
    if (!values.industry) return "Please select an industry.";
    if (isSupplier && !values.supplier_type)
      return "Please select a supplier type.";
    if (!values.email.trim()) return "Please enter the company email.";
    if (!values.office_line.trim()) return "Please enter the primary phone.";
    if (values.momo_number && !MOMO_RE.test(values.momo_number.trim()))
      return "Mobile money number must start with 0 and be 10 digits (e.g. 0241234567), not +233.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }
    const totalUpload = Object.values(files).reduce(
      (sum, f) => sum + (f?.size || 0),
      0,
    );
    if (totalUpload > MAX_TOTAL_UPLOAD) {
      toast.error(
        "Your images are too large. Please use smaller logo/front-view images.",
      );
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (!v) return;
        // supplier_type / sub_category are omitted entirely for buyers.
        if (SUPPLIER_ONLY_KEYS.includes(k) && !isSupplier) return;
        formData.append(k, v);
      });
      // Nested location via bracket notation: location[region]=…
      Object.entries(location).forEach(([k, v]) => {
        if (v) formData.append(`location[${k}]`, v);
      });
      Object.entries(files).forEach(([k, file]) => {
        if (file) formData.append(k, file);
      });

      // CSRF + multipart boundary are added by the shared http client.
      const data = await createCompany(formData);

      toast.success("Company registered successfully!");
      setCompanyId(data.id);
      storage.set("company_id", data.id);
      clearDraft();
      resetState();
      navigate("/dashboard/company/edit");
    } catch (err) {
      console.error("Registration failed:", err);
      toast.error(
        err.response?.data?.detail ||
          "Registration failed. Please check your details and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Company information */}
      {/* Company information. TIN verification is deliberately NOT here: the
          backend's verify-organisation endpoint needs an existing organisation
          ("Register an organisation to verify"), so it can only succeed after
          registration — it lives on the Edit company page instead. */}
      <section className="border-b border-border pb-6">
        <h2 className="mb-4 font-display text-base font-semibold">
          Company information
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>
              Company name <span className="text-destructive">*</span>
            </label>
            <Input
              name="name"
              value={values.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className={labelClass}>
              Type <span className="text-destructive">*</span>
            </label>
            <ChoiceSelect
              value={values.type}
              onValueChange={handleTypeChange}
              options={withCurrent(typeChoices, values.type)}
              loading={typeLoading}
              placeholder="Select type"
            />
          </div>

          <div>
            <label className={labelClass}>
              Country <span className="text-destructive">*</span>
            </label>
            <ChoiceSelect
              value={values.country}
              onValueChange={(v) => handleSelectChange("country", v)}
              options={withCurrent(countryChoices, values.country)}
              loading={countryLoading}
              placeholder="Select a country"
            />
          </div>

          <div>
            <label className={labelClass}>
              Industry <span className="text-destructive">*</span>
            </label>
            <ChoiceSelect
              value={values.industry}
              onValueChange={handleIndustryChange}
              options={withCurrent(industryChoices, values.industry)}
              loading={industryLoading}
              disabled={!values.type}
              placeholder={
                values.type ? "Select industry" : "Select a type first"
              }
              emptyText="No industries available"
            />
          </div>

          {isSupplier && (
            <>
              <div>
                <label className={labelClass}>
                  Supplier type <span className="text-destructive">*</span>
                </label>
                <ChoiceSelect
                  value={values.supplier_type}
                  onValueChange={(v) => handleSelectChange("supplier_type", v)}
                  options={withCurrent(
                    supplierTypeChoices,
                    values.supplier_type,
                  )}
                  loading={supplierTypeLoading}
                  placeholder="Select supplier type"
                />
              </div>

              <div>
                <label className={labelClass}>Sub-category</label>
                <ChoiceSelect
                  value={values.sub_category}
                  onValueChange={(v) => handleSelectChange("sub_category", v)}
                  options={withCurrent(subCategoryChoices, values.sub_category)}
                  loading={subCategoryLoading}
                  disabled={!values.industry}
                  placeholder={
                    values.industry
                      ? "Select sub-category"
                      : "Select an industry first"
                  }
                  emptyText="No sub-categories available"
                />
              </div>
            </>
          )}

          <div className="sm:col-span-2">
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Company bio
              </label>
              <span
                className={`text-xs ${
                  values.bio.length > MAX_BIO
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
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
              placeholder="Briefly describe what your company does"
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

      {/* Payment details */}
      <section className="border-b border-border pb-6">
        <h2 className="mb-4 font-display text-base font-semibold">
          Payment details
        </h2>
        <p className="-mt-2 mb-4 text-sm text-muted-foreground">
          Optional. Used for settlements and escrow payouts.
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
              Local format starting with 0 (10 digits), not +233.
            </p>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="border-b border-border pb-6">
        <h2 className="mb-4 font-display text-base font-semibold">Location</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Region</label>
            <ChoiceSelect
              value={location.region}
              onValueChange={(v) => setLocationField("region", v)}
              options={withCurrent(regionChoices, location.region)}
              loading={regionLoading}
              placeholder="Select a region"
              emptyText="No regions available"
            />
          </div>

          <div>
            <label className={labelClass}>District</label>
            <ChoiceSelect
              value={location.district}
              onValueChange={(v) => setLocationField("district", v)}
              options={withCurrent(districtChoices, location.district)}
              loading={districtLoading}
              disabled={!location.region}
              placeholder={
                location.region ? "Select a district" : "Select a region first"
              }
              emptyText="No districts available"
            />
          </div>

          <div>
            <label className={labelClass}>Popular area name</label>
            <Input
              name="popular_area_name"
              value={location.popular_area_name}
              onChange={handleLocationChange}
              placeholder="e.g. East Legon"
            />
          </div>

          <div>
            <label className={labelClass}>GPS address</label>
            <Input
              name="gps"
              value={location.gps}
              onChange={handleLocationChange}
              placeholder="e.g. GA-123-4567"
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Street address</label>
            <Input
              name="street_address"
              value={location.street_address}
              onChange={handleLocationChange}
              placeholder="Street, building, landmark"
            />
          </div>
        </div>
      </section>

      {/* Media uploads */}
      <section>
        <h2 className="mb-1 font-display text-base font-semibold">
          Media uploads
        </h2>
        <div className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Check className="h-3.5 w-3.5 text-emerald-500" /> Square logo (1:1)
          </span>
          <span className="inline-flex items-center gap-1">
            <Check className="h-3.5 w-3.5 text-emerald-500" /> Under 2MB
          </span>
          <span className="inline-flex items-center gap-1">
            <Check className="h-3.5 w-3.5 text-emerald-500" /> JPG or PNG
          </span>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <UploadTile
            label="Company logo"
            name="logo"
            preview={filePreviews.logo}
            onChange={handleFileChange}
            onRemove={() => removeFile("logo")}
          />
          <UploadTile
            label="Front view image"
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
            "Register company"
          )}
        </Button>
      </div>
    </form>
  );
};

export default CompanyForm;
