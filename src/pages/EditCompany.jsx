import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/app.context"; // for authAxios & BASE_URL
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { getCookie } from "@/utility/getCookie";

const EditCompany = () => {
  const { authAxios, BASE_URL, companyId } = useAuth();
  const navigate = useNavigate();

  console.log("object",companyId)

  // If we don’t have an ID yet, either redirect or show nothing:
if (!companyId) {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">Loading company info…</p>
    </div>
  );
}


  // form values
  const [values, setValues] = useState({
    name: "",
    type: "",
    field: "",
    industry: "",
    sector: "",
    bio: "",
    email: "",
    office_line: "",
    office_line_2: "",
    web_address: "",
  });

  // file uploads (if you support logo/front-view)
  const [files, setFiles] = useState({
    logo: null,
    image_front_view: null,
  });
  const [filePreviews, setFilePreviews] = useState({
    logo: null,
    image_front_view: null,
  });

  // loading flags
  const [loading, setLoading] = useState(true); // initial GET
  const [submitting, setSubmitting] = useState(false); // PATCH



  useEffect(() => {
    async function fetchCompany() {
      try {
        const res = await authAxios.get(`companies/${companyId}/`);
        const data = res.data;

        // populate text fields
        setValues({
          name: data.name || "",
          type: data.type || "",
          field: data.field || "",
          industry: data.industry || "",
          sector: data.sector || "",
          bio: data.bio || "",
          email: data.email || "",
          office_line: data.office_line || "",
          office_line_2: data.office_line_2 || "",
          web_address: data.web_address || "",
        });

        // if you want previews for already-uploaded images:
        setFilePreviews({
          logo: data.logo || null,
          image_front_view: data.image_front_view || null,
        });
      } catch (err) {
        toast.error("Failed to load company data");
      } finally {
        setLoading(false);
      }
    }

    fetchCompany();
  }, [authAxios, companyId]);

  // text/select inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  // file inputs
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (file) {
      setFiles((f) => ({ ...f, [name]: file }));
      setFilePreviews((p) => ({ ...p, [name]: URL.createObjectURL(file) }));
    }
  };
  const removeFile = (name) => {
    setFiles((f) => ({ ...f, [name]: null }));
    setFilePreviews((p) => ({ ...p, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();

      // only append changed values
      Object.entries(values).forEach(([key, val]) => {
        if (val !== null && val !== "") formData.append(key, val);
      });

      // append new files if any
      Object.entries(files).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });

      // CSRF
      const csrfToken = getCookie("csrftoken");

      await authAxios.patch(`companies/${companyId}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-CSRFToken": csrfToken,
        },
      });

      toast.success("Company updated successfully!");
    //   navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 grid md:grid-cols-3 gap-8">
      {/* Left Sidebar (copy-paste from CompanyForm) */}
      <div className="md:col-span-1">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Edit Progress</h3>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
            <div
              className="bg-black h-2.5 rounded-full"
              style={{ width: "100%" }}
            ></div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-black rounded-full mr-2"></div>
              <span className="text-sm">Basic Info</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-black rounded-full mr-2"></div>
              <span className="text-sm">Contact</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-black rounded-full mr-2"></div>
              <span className="text-sm">Media</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="md:col-span-2 space-y-6">
        {/* Company Information */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-medium mb-4">Company Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
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

            {/* Type */}
            <div>
              <label className="block mb-1">Type *</label>
              <select
                name="type"
                value={values.type}
                onChange={handleChange}
                required
                className="w-full border rounded p-2"
              >
                <option value="">Select</option>
                <option value="buyer">Buyer</option>
                <option value="supplier">Supplier</option>
              </select>
            </div>

            {/* Field */}
            <div>
              <label className="block mb-1">Field of Operation</label>
              <input
                name="field"
                value={values.field}
                onChange={handleChange}
                className="w-full border rounded p-2"
                placeholder="e.g. Logistics"
              />
            </div>

            {/* Industry */}
            <div>
              <label className="block mb-1">Industry</label>
              <input
                name="industry"
                value={values.industry}
                onChange={handleChange}
                className="w-full border rounded p-2"
                placeholder="e.g. Manufacturing"
              />
            </div>

            {/* Sector */}
            <div>
              <label className="block mb-1">Sector</label>
              <input
                name="sector"
                value={values.sector}
                onChange={handleChange}
                className="w-full border rounded p-2"
                placeholder="e.g. Procurement"
              />
            </div>

            {/* Bio */}
            <div className="sm:col-span-2">
              <label className="block mb-1">Company Bio</label>
              <textarea
                name="bio"
                rows={3}
                value={values.bio}
                onChange={handleChange}
                className="w-full border rounded p-2"
                placeholder="Tell us about your company..."
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-medium mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
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

            {/* Primary Phone */}
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

            {/* Secondary Phone */}
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

            {/* Website */}
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

        {/* Media Uploads */}
        <div className="pb-6">
          <h2 className="text-lg font-medium mb-4">Media Uploads</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Logo */}
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
                    className="ml-2 text-red-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Front View */}
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
                    className="ml-2 text-red-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
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
