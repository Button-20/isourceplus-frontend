// components/CompanyForm.jsx
import React, { useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Upload, Check, X, Building2 } from "lucide-react";
import { useNavigate } from "react-router";
import { getCookie } from "@/utility/getCookie";

const CompanyForm = () => {
  const { authAxios, companyId, setCompanyId } = useAuth();

  const navigate = useNavigate();

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

  const [files, setFiles] = useState({
    logo: null,
    image_front_view: null,
  });

  const [filePreviews, setFilePreviews] = useState({
    logo: null,
    image_front_view: null,
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

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

      Object.entries(values).forEach(([k, v]) => {
        if (v) formData.append(k, v);
      });

      Object.entries(files).forEach(([k, file]) => {
        if (file) formData.append(k, file);
      });

      const csrfToken = getCookie("csrftoken");
      console.log("cookie", csrfToken);

      const res = await authAxios.post("companies/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-CSRFToken": csrfToken,
        },
      });

      const results = res.data

      console.log("raw",results)
      // console.log("name",results.name)
      // console.log("id",results.id)
      // console.log("url",results.url)

      toast.success("Company registered successfully!");
      setCompanyId(results.id)
      localStorage.setItem("company_id", results.id);
      // console.log("company id", companyId)
      // navigate("/dashboard");

      // Reset form
      setValues({
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
      setFiles({ logo: null, image_front_view: null });
      setFilePreviews({ logo: null, image_front_view: null });
    } catch (err) {
      console.error("Registration failed:", err);
      toast.error(err.response?.data.detail || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

      // console.log("company id2", companyId)


  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 sm:p-8 grid md:grid-cols-3 gap-8"
    >
      {/* Left Sidebar */}
      <div className="md:col-span-1">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">
            Registration Progress
          </h3>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
            <div
              className="bg-black h-2.5 rounded-full"
              style={{ width: "60%" }}
            ></div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-black rounded-full mr-2"></div>
              <span className="text-sm">Basic Information</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
              <span className="text-sm text-gray-500">Contact Details</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
              <span className="text-sm text-gray-500">Verification</span>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Upload Guidelines</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Logo should be square (1:1 ratio)</span>
            </li>
            <li className="flex items-start">
              <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Images must be under 2MB</span>
            </li>
            <li className="flex items-start">
              <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Acceptable formats: JPG, PNG</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Form */}
      <div className="md:col-span-2 space-y-6">
        {/* Company Information */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Company Information
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={values.name}
                onChange={handleChange}
                required
                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={values.type}
                onChange={handleChange}
                required
                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
              >
                <option value="">Select type</option>
                <option value="buyer">Buyer</option>
                <option value="supplier">Supplier</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field of Operation
              </label>
              <input
                type="text"
                name="field"
                value={values.field}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <input
                type="text"
                name="industry"
                value={values.industry}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sector
              </label>
              <input
                type="text"
                name="sector"
                value={values.sector}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Bio
              </label>
              <textarea
                name="bio"
                rows={3}
                value={values.bio}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Contact Information
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={values.email}
                onChange={handleChange}
                required
                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="office_line"
                value={values.office_line}
                onChange={handleChange}
                required
                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secondary Phone
              </label>
              <input
                type="text"
                name="office_line_2"
                value={values.office_line_2}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                name="web_address"
                value={values.web_address}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* Media Uploads */}
        <div className="pb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Media Uploads
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo
              </label>
              <div className="flex items-center">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 p-4 w-full">
                  {filePreviews.logo ? (
                    <img
                      src={filePreviews.logo}
                      alt="Logo preview"
                      className="h-20 w-20 object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                      <span className="text-xs text-gray-500">
                        Click to upload logo
                      </span>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Front View Image
              </label>
              <div className="flex items-center">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 p-4 w-full">
                  {filePreviews.image_front_view ? (
                    <img
                      src={filePreviews.image_front_view}
                      alt="Front view preview"
                      className="h-20 w-20 object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                      <span className="text-xs text-gray-500">
                        Click to upload image
                      </span>
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

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={submitting}
            className="bg-black text-white py-2.5 px-6 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Registering...
              </>
            ) : (
              "Register Company"
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CompanyForm;
