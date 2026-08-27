import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/app.context";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Upload, X, Check } from "lucide-react";
import { getCookie } from "@/utility/getCookie";
import {
  getCategoryChoices,
  getIndustryChoices,
} from "@/services/api/companies.service";
import { compressImage } from "@/utils/compress-image";

// The backend caps the whole request at ~1MB; keep the combined upload under it.
const MAX_TOTAL_UPLOAD = 900 * 1024;

// Normalize a choices response ([{value,label}] | strings | ...) to {value,label}[].
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

const EditCompany = () => {
  const { authAxios, companyId, setCompanyId } = useAuth();
  const navigate = useNavigate();
  const [idLoading, setIdLoading] = useState(!companyId);

  // Fetch companyId if missing
  useEffect(() => {
    if (!companyId) {
      (async () => {
        try {
          setIdLoading(true);
          const res = await authAxios.get("users/");
          const userData = res.data.results[0];
          if (userData.company && userData.company.includes("/companies/")) {
            const id = userData.company.split("/").slice(-2)[0];
            setCompanyId(id);
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
  const [files, setFiles] = useState({
    logo: null,
    image_front_view: null,
  });
  const [filePreviews, setFilePreviews] = useState({
    logo: null,
    image_front_view: null,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isSupplier = values.type === "supplier";

  useEffect(() => {
    if (companyId) {
      async function fetchCompany() {
        try {
          const res = await authAxios.get(`companies/${companyId}/`);
          const data = res.data;
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
      }
      fetchCompany();
    }
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

  // Changing the type changes which categories are valid, so reset the chain.
  const handleTypeChange = (e) => {
    const value = e.target.value;
    setValues((v) => ({
      ...v,
      type: value,
      category: "",
      sector: "",
      industry: "",
      field: "",
    }));
  };

  // For suppliers the category is mirrored into `sector`; buyers just set it.
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setValues((v) => ({
      ...v,
      category: value,
      sector: v.type === "supplier" ? value : "",
      industry: "",
      field: "",
    }));
  };

  // The selected industry is mirrored into `field` (suppliers only).
  const handleIndustryChange = (e) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, industry: value, field: value }));
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
      const csrfToken = getCookie("csrftoken");
      await authAxios.patch(`companies/${companyId}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-CSRFToken": csrfToken,
        },
      });
      toast.success("Company updated successfully!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (idLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
        <p className="ml-2 text-gray-500">Loading company ID…</p>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-500 mb-4">No company associated with this user.</p>
        <Link
          to="/dashboard/company"
          className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800"
        >
          Create Company
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
        <p className="ml-2 text-gray-500">Loading company data…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 grid md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Edit Progress</h3>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
            <div className="bg-black h-2.5 rounded-full" style={{ width: "100%" }} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-black rounded-full mr-2" />
              <span className="text-sm">Basic Info</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-black rounded-full mr-2" />
              <span className="text-sm">Contact</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-black rounded-full mr-2" />
              <span className="text-sm">Media</span>
            </div>
          </div>
        </div>
        <div title="Add Business Documents" className="bg-black hover:bg-gray-800 p-2 text-white mt-4 rounded-lg border">
          <Link to="/dashboard/company/add-business-docs" className="font-medium mb-3">
            Add Documents
          </Link>
        </div>
        <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Upload Guidelines</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0" />
              <span>Logo should be square (1:1 ratio)</span>
            </li>
            <li className="flex items-start">
              <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0" />
              <span>Images must be under 2MB</span>
            </li>
            <li className="flex items-start">
              <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0" />
              <span>Acceptable formats: JPG, PNG</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="md:col-span-2 space-y-6">
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-medium mb-4">Company Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block mb-1">Name *</label>
              <input
                name="name"
                value={values.name}
                onChange={handleChange}
                required
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block mb-1">Type *</label>
              <select
                name="type"
                value={values.type}
                onChange={handleTypeChange}
                required
                className="w-full border rounded p-2"
              >
                <option value="">Select</option>
                <option value="buyer">Buyer</option>
                <option value="supplier">Supplier</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Category</label>
              <select
                name="category"
                value={values.category}
                onChange={handleCategoryChange}
                disabled={!values.type}
                className="w-full border rounded p-2 disabled:bg-gray-100"
              >
                <option value="">
                  {values.type ? "Select category" : "Select a type first"}
                </option>
                {categoryChoices.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            {isSupplier && (
              <div>
                <label className="block mb-1">Industry</label>
                <select
                  name="industry"
                  value={values.industry}
                  onChange={handleIndustryChange}
                  disabled={!values.category}
                  className="w-full border rounded p-2 disabled:bg-gray-100"
                >
                  <option value="">
                    {values.category
                      ? "Select industry"
                      : "Select a category first"}
                  </option>
                  {industryChoices.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="block mb-1">Company Bio</label>
              <textarea
                name="bio"
                rows={3}
                maxLength={225}
                value={values.bio}
                onChange={handleChange}
                className="w-full border rounded p-2"
                placeholder="Tell us about your company..."
              />
            </div>
          </div>
        </div>
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-medium mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={values.email}
                onChange={handleChange}
                required
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block mb-1">Primary Phone *</label>
              <input
                name="office_line"
                value={values.office_line}
                onChange={handleChange}
                required
                className="w-full border rounded p-2"
                placeholder="+233..."
              />
            </div>
            <div>
              <label className="block mb-1">Secondary Phone</label>
              <input
                name="office_line_2"
                value={values.office_line_2}
                onChange={handleChange}
                className="w-full border rounded p-2"
                placeholder="Optional"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block mb-1">Website</label>
              <input
                type="url"
                name="web_address"
                value={values.web_address}
                onChange={handleChange}
                className="w-full border rounded p-2"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
        <div className="pb-6">
          <h2 className="text-lg font-medium mb-4">Media Uploads</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2">Company Logo</label>
              <div className="flex items-center">
                <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 p-4 w-full">
                  {filePreviews.logo ? (
                    <img
                      src={filePreviews.logo}
                      alt="Logo preview"
                      className="h-20 w-20 object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-6 h-6 mb-2" />
                      <span className="text-xs">Click to upload</span>
                    </div>
                  )}
                  <input
                    type="file"
                    name="logo"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {filePreviews.logo && (
                  <button
                    type="button"
                    onClick={() => removeFile("logo")}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block mb-2">Front View Image</label>
              <div className="flex items-center">
                <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 p-4 w-full">
                  {filePreviews.image_front_view ? (
                    <img
                      src={filePreviews.image_front_view}
                      alt="Front view preview"
                      className="h-20 w-20 object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-6 h-6 mb-2" />
                      <span className="text-xs">Click to upload</span>
                    </div>
                  )}
                  <input
                    type="file"
                    name="image_front_view"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {filePreviews.image_front_view && (
                  <button
                    type="button"
                    onClick={() => removeFile("image_front_view")}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={submitting}
            className="bg-black text-white py-2 px-6 rounded flex items-center disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default EditCompany;
