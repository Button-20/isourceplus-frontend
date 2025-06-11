import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/app.context"; // for authAxios & BASE_URL
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
      navigate("/dashboard/company"); // or wherever you want
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
      {/* Left Sidebar (progress / instructions) */}
      <div className="md:col-span-1">
        {/* …you can copy the sidebar from CompanyForm verbatim… */}
      </div>

      {/* Main Form */}
      <div className="md:col-span-2 space-y-6">
        {/* Company Info */}
        <div className="border-b pb-6">
          <h2 className="text-lg font-medium mb-4">Company Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block mb-1">Name *</label>
              <input
                name="name"
                value={values.name}
                onChange={handleChange}
                
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
                
                className="w-full border rounded p-2"
              >
                <option value="">Select</option>
                <option value="buyer">Buyer</option>
                <option value="supplier">Supplier</option>
              </select>
            </div>
            {/* Field, Industry, Sector, Bio… copy CompanyForm inputs, using values.* & handleChange */}
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-b pb-6">
          <h2 className="text-lg font-medium mb-4">Contact Information</h2>
          {/* Email, office_line, office_line_2, web_address */}
        </div>

        {/* Media Uploads */}
        <div>
          <h2 className="text-lg font-medium mb-4">Media Uploads</h2>
          {/* Copy the file-upload blocks for logo & front view, using handleFileChange & removeFile */}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={submitting}
            className={`bg-black text-white py-2 px-6 rounded flex items-center disabled:opacity-50`}
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
