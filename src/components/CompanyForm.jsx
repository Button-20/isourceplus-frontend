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
import {
  createCompany,
  getIndustryChoices,
} from "@/services/api/companies.service";
import { useAuth } from "@/services/context/app.context";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

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

const VALUE_KEYS = Object.keys(EMPTY_VALUES);
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB, per the upload guidelines below.
const MAX_BIO = 225; // Backend caps the description/bio at 225 characters.

const prettify = (s) =>
  String(s)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Top-level categories drive the dependent industry dropdown.
const CATEGORY_OPTIONS = [
  "energy",
  "materials",
  "industrials",
  "consumer_discretionary",
  "consumer_staples",
  "health_care",
  "financials",
  "information_technology",
  "communication_services",
  "utilities",
  "real_estate",
].map((value) => ({ value, label: prettify(value) }));

// Normalize the /industry-choices/ response into { value, label }[]. The exact
// shape isn't guaranteed, so handle strings, [value, label] tuples, and objects.
function normalizeChoices(data) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.choices)
        ? data.choices
        : [];
  return list
    .map((item) => {
      if (typeof item === "string")
        return { value: item, label: prettify(item) };
      if (Array.isArray(item))
        return {
          value: String(item[0]),
          label: String(item[1] ?? prettify(item[0])),
        };
      if (item && typeof item === "object") {
        const value = item.value ?? item.id ?? item.key ?? item.name ?? "";
        const label =
          item.label ?? item.display_name ?? item.name ?? prettify(value);
        return { value: String(value), label: String(label) };
      }
      return null;
    })
    .filter((c) => c && c.value !== "");
}

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

const CompanyForm = () => {
  const { setCompanyId, jobTitle } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState(EMPTY_VALUES);
  const [files, setFiles] = useState({ logo: null, image_front_view: null });
  const [filePreviews, setFilePreviews] = useState({
    logo: null,
    image_front_view: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [industryChoices, setIndustryChoices] = useState([]);
  const [industryLoading, setIndustryLoading] = useState(false);

  // Restore any in-progress draft from a previous session.
  useEffect(() => {
    try {
      const storedValues = localStorage.getItem("companyFormValues");
      const storedPreviews = localStorage.getItem("companyFormFilePreviews");

      if (storedValues) {
        const parsed = JSON.parse(storedValues);
        if (validateStoredData(parsed, VALUE_KEYS)) {
          setValues(parsed);
          toast.info("Form data restored from previous session.");
        }
      }
      if (storedPreviews) {
        const parsed = JSON.parse(storedPreviews);
        if (validateStoredData(parsed, ["logo", "image_front_view"])) {
          setFilePreviews(parsed);
        }
      }
    } catch (err) {
      console.error("Failed to load form data from localStorage:", err);
    }
  }, []);

  // Load the industry options whenever the category changes (or is restored
  // from a draft).
  useEffect(() => {
    if (!values.category) {
      setIndustryChoices([]);
      return undefined;
    }
    let cancelled = false;
    setIndustryLoading(true);
    getIndustryChoices(values.category)
      .then((data) => {
        if (!cancelled) setIndustryChoices(normalizeChoices(data));
      })
      .catch(() => {
        if (!cancelled) {
          setIndustryChoices([]);
          toast.error("Couldn't load industries for that category.");
        }
      })
      .finally(() => {
        if (!cancelled) setIndustryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [values.category]);

  const persistValues = (next) => {
    try {
      localStorage.setItem("companyFormValues", JSON.stringify(next));
    } catch (err) {
      console.error("Failed to save form values:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => {
      const next = { ...v, [name]: value };
      persistValues(next);
      return next;
    });
  };

  const handleSelect = (name, value) => {
    setValues((v) => {
      const next = { ...v, [name]: value };
      persistValues(next);
      return next;
    });
  };

  // The selected industry is mirrored into `field`.
  const handleIndustryChange = (value) => {
    setValues((v) => {
      const next = { ...v, industry: value, field: value };
      persistValues(next);
      return next;
    });
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    const file = fileList[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image is too large. Maximum size is 2MB.");
      e.target.value = "";
      return;
    }
    setFiles((f) => ({ ...f, [name]: file }));
    setFilePreviews((p) => {
      const next = { ...p, [name]: URL.createObjectURL(file) };
      try {
        localStorage.setItem("companyFormFilePreviews", JSON.stringify(next));
      } catch (err) {
        console.error("Failed to save file previews:", err);
      }
      return next;
    });
  };

  const removeFile = (name) => {
    setFiles((f) => ({ ...f, [name]: null }));
    setFilePreviews((p) => {
      const next = { ...p, [name]: null };
      try {
        localStorage.setItem("companyFormFilePreviews", JSON.stringify(next));
      } catch (err) {
        console.error("Failed to save file previews:", err);
      }
      return next;
    });
  };

  const handleReset = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setValues(EMPTY_VALUES);
    setFiles({ logo: null, image_front_view: null });
    setFilePreviews({ logo: null, image_front_view: null });
    try {
      localStorage.removeItem("companyFormValues");
      localStorage.removeItem("companyFormFilePreviews");
      toast.success("Form reset successfully.");
    } catch (err) {
      console.error("Failed to clear localStorage:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.type) {
      toast.error("Please select a company type.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (v) formData.append(k, v);
      });
      Object.entries(files).forEach(([k, file]) => {
        if (file) formData.append(k, file);
      });

      // CSRF + multipart boundary are added by the shared http client.
      const data = await createCompany(formData);

      toast.success("Company registered successfully!");
      setCompanyId(data.id);
      localStorage.setItem("company_id", data.id);
      localStorage.removeItem("companyFormValues");
      localStorage.removeItem("companyFormFilePreviews");
      setValues(EMPTY_VALUES);
      setFiles({ logo: null, image_front_view: null });
      setFilePreviews({ logo: null, image_front_view: null });
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
      <section className="border-b border-border pb-6">
        <h2 className="mb-4 font-display text-base font-semibold">
          Company information
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div >
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
            <Select
              value={values.type || undefined}
              onValueChange={(v) => handleSelect("type", v)}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {jobTitle === "lead buyer" && (
                  <SelectItem value="buyer">Buyer</SelectItem>
                )}
                {jobTitle === "sales manager" && (
                  <SelectItem value="supplier">Supplier</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

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
