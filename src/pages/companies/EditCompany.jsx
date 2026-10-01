import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/app.context";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  X,
  Building2,
  FileText,
  BadgeCheck,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VerifyOrganisation from "@/components/organisation/VerifyOrganisation";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCountryChoices } from "@/services/api/choices.service";
import {
  getCompanyTypeChoices,
  getIndustryChoices,
  getSubCategoryChoices,
  getSupplierTypeChoices,
} from "@/services/api/companies.service";
import { getDistrictChoices } from "@/services/api/transporters.service";
// Shared region enum endpoint (/region-choices/) — same source as the
// transporter and waitlist forms, so regions stay consistent across the app.
import { getRegionChoices } from "@/services/api/waitlist.service";
import { normalizeChoices, prettify } from "@/utils/choices";
import { compressImage } from "@/utils/compress-image";

const labelClass = "mb-1 block text-sm font-medium text-foreground";
const MAX_TOTAL_UPLOAD = 900 * 1024; // keep under the backend's ~1MB request cap
const MAX_BIO = 225;

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

// Enum values may come back as plain strings or as { value | id | name }
// objects; always reduce to the string the Select / payload expects.
const toValue = (v) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return String(v.value ?? v.id ?? v.name ?? "");
  return String(v);
};

// Keep the company's current value selectable even if it isn't in the loaded
// options (e.g. the options request failed or hasn't resolved yet).
const withCurrent = (choices, value) =>
  value && !choices.some((c) => c.value === value)
    ? [...choices, { value, label: prettify(value) }]
    : choices;

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

const EditCompany = () => {
  const { authAxios, companyId, setCompanyId } = useAuth();
  const navigate = useNavigate();
  const [idLoading, setIdLoading] = useState(!companyId);

  const [values, setValues] = useState(EMPTY_VALUES);
  const [location, setLocation] = useState(EMPTY_LOCATION);
  const [files, setFiles] = useState({ logo: null, image_front_view: null });
  const [filePreviews, setFilePreviews] = useState({
    logo: null,
    image_front_view: null,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // TIN is verification-only: it is never part of the PATCH payload. The
  // record's `tin_number` (set by the backend once the organisation has been
  // verified) seeds the field, and `is_verified` drives the header badge.
  const [tin, setTin] = useState("");
  const [verification, setVerification] = useState({
    isVerified: false,
    kycStatus: "",
  });

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

  // Resolve companyId if it isn't in context yet.
  useEffect(() => {
    if (!companyId) {
      (async () => {
        try {
          setIdLoading(true);
          const res = await authAxios.get("users/");
          const userData = res.data.results[0];
          if (userData.company && userData.company.includes("/companies/")) {
            setCompanyId(userData.company.split("/").slice(-2)[0]);
          } else {
            toast.error("No company associated with this user");
          }
        } catch (err) {
          toast.error("Failed to load company ID");
          console.error("Fetch user error:", err);
        } finally {
          setIdLoading(false);
        }
      })();
    }
  }, [authAxios, companyId, setCompanyId]);

  // Prefill from the fetched company.
  useEffect(() => {
    if (!companyId) return;
    (async function fetchCompany() {
      try {
        const { data } = await authAxios.get(`companies/${companyId}/`);
        const loc =
          data.location && typeof data.location === "object"
            ? data.location
            : {};
        setTin(data.tin_number || data.tin || "");
        setVerification({
          isVerified: Boolean(data.is_verified),
          kycStatus: data.kyc_status || "",
        });
        setValues({
          name: data.name || "",
          type: toValue(data.type),
          country: toValue(data.country),
          supplier_type: toValue(data.supplier_type),
          industry: toValue(data.industry),
          sub_category: toValue(data.sub_category),
          bio: data.bio || "",
          email: data.email || "",
          office_line: data.office_line || "",
          office_line_2: data.office_line_2 || "",
          web_address: data.web_address || "",
          bank_account_name: data.bank_account_name || "",
          bank_account_number: data.bank_account_number || "",
          momo_number: data.momo_number || "",
        });
        setLocation({
          region: toValue(loc.region),
          district: toValue(loc.district),
          popular_area_name: loc.popular_area_name || "",
          gps: loc.gps || "",
          street_address: loc.street_address || "",
        });
        setFilePreviews({
          logo: data.logo || null,
          image_front_view: data.image_front_view || null,
        });
      } catch {
        toast.error("Failed to load company data");
      } finally {
        setLoading(false);
      }
    })();
  }, [authAxios, companyId]);

  // Static enums: country, company type, supplier type, region.
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
        if (!cancelled) setRegionChoices([]);
      })
      .finally(() => {
        if (!cancelled) setRegionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Once the company is loaded, default the country (Ghana / first option) if
  // the record doesn't have one yet.
  useEffect(() => {
    if (loading || !countryChoices.length) return;
    setValues((v) =>
      v.country ? v : { ...v, country: defaultCountry(countryChoices) },
    );
  }, [loading, countryChoices]);

  // Industry is required for both types and keyed by the company type
  // (/industry-choices/?type=…).
  useEffect(() => {
    if (!values.type) {
      setIndustryChoices([]);
      return undefined;
    }
    let cancelled = false;
    setIndustryLoading(true);
    getIndustryChoices(values.type)
      .then((d) => {
        if (!cancelled) setIndustryChoices(normalizeChoices(d));
      })
      .catch(() => {
        if (!cancelled) setIndustryChoices([]);
      })
      .finally(() => {
        if (!cancelled) setIndustryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [values.type]);

  // Suppliers additionally pick a sub-category, which depends on the industry
  // (/supplier/sub-category-choices/?type=&industry=).
  useEffect(() => {
    if (!isSupplier || !values.industry) {
      setSubCategoryChoices([]);
      return undefined;
    }
    let cancelled = false;
    setSubCategoryLoading(true);
    getSubCategoryChoices(values.type, values.industry)
      .then((d) => {
        if (!cancelled) setSubCategoryChoices(normalizeChoices(d));
      })
      .catch(() => {
        if (!cancelled) setSubCategoryChoices([]);
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
        if (!cancelled) setDistrictChoices([]);
      })
      .finally(() => {
        if (!cancelled) setDistrictLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [location.region]);

  // When the organisation is verified, adopt its official registered name if
  // the name field is empty; otherwise just point out a mismatch.
  const handleOrganisationVerified = ({ organisationName }) => {
    if (!organisationName) return;
    if (!values.name.trim()) {
      setValues((v) => ({ ...v, name: organisationName }));
      toast.success("Company name filled from the verified organisation.");
    } else if (values.name.trim() !== organisationName.trim()) {
      toast.info(
        `Registered name is "${organisationName}". Update the name below if it should match.`,
      );
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  // Simple enum fields (country, supplier_type, sub_category).
  const handleSelectChange = (name, value) =>
    setValues((v) => ({ ...v, [name]: value }));

  // Type drives the industry options (and the supplier-only fields), so reset
  // the whole dependent chain.
  const handleTypeChange = (value) =>
    setValues((v) => ({
      ...v,
      type: value,
      industry: "",
      sub_category: "",
      supplier_type: value === "supplier" ? v.supplier_type : "",
    }));

  // Industry drives the supplier sub-category options.
  const handleIndustryChange = (value) =>
    setValues((v) => ({ ...v, industry: value, sub_category: "" }));

  // Region drives the district options, so a new region clears the district.
  const setLocationField = (name, value) =>
    setLocation((l) => {
      const next = { ...l, [name]: value };
      if (name === "region" && value !== l.region) next.district = "";
      return next;
    });

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setLocationField(name, value);
  };

  const handleFileChange = async (e) => {
    const { name, files: fileList } = e.target;
    const picked = fileList[0];
    e.target.value = "";
    if (!picked) return;
    if (!["image/jpeg", "image/png"].includes(picked.type)) {
      toast.error("Only JPG and PNG formats are accepted");
      return;
    }
    const file = await compressImage(picked);
    if (file.size > 2 * 1024 * 1024) {
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
      toast.error("Your images are too large. Please use smaller images.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, val]) => {
        if (val === null || val === "") return;
        // supplier_type / sub_category are omitted entirely for buyers.
        if (SUPPLIER_ONLY_KEYS.includes(key) && !isSupplier) return;
        formData.append(key, val);
      });
      // Nested location via bracket notation: location[region]=…
      Object.entries(location).forEach(([key, val]) => {
        if (val) formData.append(`location[${key}]`, val);
      });
      // Files are sent only if the user re-picked them.
      Object.entries(files).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });
      await authAxios.patch(`companies/${companyId}/`, formData);
      toast.success("Company updated successfully!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (idLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="mx-auto max-w-md py-24 text-center font-montserrat">
        <div className="rounded-2xl border border-border/70 bg-card p-8">
          <p className="text-sm text-muted-foreground">
            No company associated with this user.
          </p>
          <Button
            asChild
            className="mt-5 bg-brand-gradient text-brand-foreground hover:opacity-90"
          >
            <Link to="/dashboard/company">Create company</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                <Building2 className="h-3.5 w-3.5" /> Company profile
              </span>
              {verification.isVerified ? (
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
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
              Edit your company
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/85">
              Keep your company details up to date.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-white/40 bg-white/10 text-brand-foreground hover:bg-white/20"
          >
            <Link to="/dashboard/company/add-business-docs">
              <FileText className="mr-1.5 h-4 w-4" /> Add documents
            </Link>
          </Button>
        </div>
      </div>

      {/* Form card */}
      <div className="mt-6 rounded-2xl border border-border/70 bg-card p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company information */}
          <section className="border-b border-border pb-6">
            <h2 className="mb-4 font-display text-base font-semibold">
              Company information
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <VerifyOrganisation
                  value={tin}
                  onChange={setTin}
                  onVerified={handleOrganisationVerified}
                  verified={verification.isVerified}
                  disabled={verification.isVerified}
                  hint={
                    verification.isVerified
                      ? "Your organisation's TIN is verified. Contact support if it needs to change."
                      : "Verify your organisation to pull its official registered name."
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Name <span className="text-destructive">*</span>
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
                      onValueChange={(v) =>
                        handleSelectChange("supplier_type", v)
                      }
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
                      onValueChange={(v) =>
                        handleSelectChange("sub_category", v)
                      }
                      options={withCurrent(
                        subCategoryChoices,
                        values.sub_category,
                      )}
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
                  placeholder="Tell us about your company…"
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
            <h2 className="mb-4 font-display text-base font-semibold">
              Location
            </h2>
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
                    location.region
                      ? "Select a district"
                      : "Select a region first"
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
            <h2 className="mb-4 font-display text-base font-semibold">
              Media uploads
            </h2>
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
          <div className="flex justify-end border-t border-border pt-5">
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
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCompany;
