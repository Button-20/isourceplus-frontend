import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/app.context";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Upload, X, Building2, FileText } from "lucide-react";

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
import {
  getCategoryChoices,
  getIndustryChoices,
} from "@/services/api/companies.service";
import { compressImage } from "@/utils/compress-image";

const labelClass = "mb-1 block text-sm font-medium text-foreground";
const MAX_TOTAL_UPLOAD = 900 * 1024; // keep under the backend's ~1MB request cap
const MAX_BIO = 225;

const toChoices = (data) =>
  (Array.isArray(data) ? data : data?.results || [])
    .map((c) =>
      typeof c === "string"
        ? { value: c, label: c }
        : {
            value: String(c.value ?? c.id ?? ""),
            label: String(c.label ?? c.name ?? c.value ?? ""),
          },
    )
    .filter((c) => c.value);

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

const EditCompany = () => {
  const { authAxios, companyId, setCompanyId } = useAuth();
  const navigate = useNavigate();
  const [idLoading, setIdLoading] = useState(!companyId);

  const [values, setValues] = useState({
    name: "",
    type: "",
    category: "",
    field: "",
    industry: "",
    sector: "",
    bio: "",
    email: "",
    office_line: "",
    office_line_2: "",
    web_address: "",
  });
  const [categoryChoices, setCategoryChoices] = useState([]);
  const [industryChoices, setIndustryChoices] = useState([]);
  const [files, setFiles] = useState({ logo: null, image_front_view: null });
  const [filePreviews, setFilePreviews] = useState({
    logo: null,
    image_front_view: null,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    if (!companyId) return;
    (async function fetchCompany() {
      try {
        const { data } = await authAxios.get(`companies/${companyId}/`);
        setValues({
          name: data.name || "",
          type: data.type || "",
          category: data.category || "",
          field: data.field || "",
          industry: data.industry || "",
          sector: data.sector || "",
          bio: data.bio || "",
          email: data.email || "",
          office_line: data.office_line || "",
          office_line_2: data.office_line_2 || "",
          web_address: data.web_address || "",
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

  // Category options depend on the company type.
  useEffect(() => {
    if (!values.type) {
      setCategoryChoices([]);
      return undefined;
    }
    let cancelled = false;
    getCategoryChoices(values.type)
      .then((d) => {
        if (!cancelled) setCategoryChoices(toChoices(d));
      })
      .catch(() => {
        if (!cancelled) setCategoryChoices([]);
      });
    return () => {
      cancelled = true;
    };
  }, [values.type]);

  // Suppliers pick an industry, whose options depend on the category.
  useEffect(() => {
    if (values.type !== "supplier" || !values.category) {
      setIndustryChoices([]);
      return undefined;
    }
    let cancelled = false;
    getIndustryChoices(values.category)
      .then((d) => {
        if (!cancelled) setIndustryChoices(toChoices(d));
      })
      .catch(() => {
        if (!cancelled) setIndustryChoices([]);
      });
    return () => {
      cancelled = true;
    };
  }, [values.type, values.category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const handleTypeChange = (value) =>
    setValues((v) => ({
      ...v,
      type: value,
      category: "",
      sector: "",
      industry: "",
      field: "",
    }));

  const handleCategoryChange = (value) =>
    setValues((v) => ({
      ...v,
      category: value,
      sector: v.type === "supplier" ? value : "",
      industry: "",
      field: "",
    }));

  const handleIndustryChange = (value) =>
    setValues((v) => ({ ...v, industry: value, field: value }));

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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        if (val !== null && val !== "") formData.append(key, val);
      });
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
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <Building2 className="h-3.5 w-3.5" /> Company profile
            </span>
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
                <Select
                  value={values.type || undefined}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={labelClass}>Category</label>
                <Select
                  value={values.category || undefined}
                  onValueChange={handleCategoryChange}
                  disabled={!values.type}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue
                      placeholder={
                        values.type ? "Select category" : "Select a type first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryChoices.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isSupplier && (
                <div>
                  <label className={labelClass}>Industry</label>
                  <Select
                    value={values.industry || undefined}
                    onValueChange={handleIndustryChange}
                    disabled={!values.category}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue
                        placeholder={
                          values.category
                            ? "Select industry"
                            : "Select a category first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {industryChoices.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="sm:col-span-2">
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Company bio
                  </label>
                  <span
                    className={`text-xs ${
                      values.bio.length >= MAX_BIO
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
