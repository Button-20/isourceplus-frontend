import React, { useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, Loader2, Upload, X } from "lucide-react";
import { getCookie } from "@/utility/getCookie";

export default function AddBusinessDocs() {
  const { authAxios, transporterId } = useAuth();
  const navigate = useNavigate();

  // Check if transporterId exists
  if (!transporterId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading transporter info…</p>
      </div>
    );
  }

  // Form state for files
  const [files, setFiles] = useState({
    image_front_view: null,
    business_doc_1: null,
    business_doc_2: null,
    business_doc_3: null,
  });

  const [filePreviews, setFilePreviews] = useState({
    image_front_view: null,
    business_doc_1: null,
    business_doc_2: null,
    business_doc_3: null,
  });

  const [submitting, setSubmitting] = useState(false);

  // Handle file changes with validation
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (file) {
      // Validate file size (<10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be under 10MB");
        return;
      }
      // Validate file type (webp, png, jpeg, jpg)
      if (!["image/webp", "image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
        toast.error("Only webp, png, jpeg, or jpg formats are accepted");
        return;
      }
      setFiles((f) => ({ ...f, [name]: file }));
      setFilePreviews((p) => ({ ...p, [name]: URL.createObjectURL(file) }));
    }
  };

  // Remove a file
  const removeFile = (name) => {
    setFiles((f) => ({ ...f, [name]: null }));
    setFilePreviews((p) => ({ ...p, [name]: null }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const csrfToken = getCookie("csrftoken");
      const formData = new FormData();

      // Append image_front_view
      if (files.image_front_view) {
        formData.append("image_front_view", files.image_front_view);
      }

      // Append business documents as vehicle_images (fallback)
      if (files.business_doc_1) {
        formData.append("vehicle_images", files.business_doc_1);
      }
      if (files.business_doc_2) {
        formData.append("vehicle_images", files.business_doc_2);
      }
      if (files.business_doc_3) {
        formData.append("vehicle_images", files.business_doc_3);
      }

      // Log FormData for debugging
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      // Only send request if files are present
      if (
        files.image_front_view ||
        files.business_doc_1 ||
        files.business_doc_2 ||
        files.business_doc_3
      ) {
        await authAxios.post(
          `transporters/${transporterId}/add-business-docs/`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              "X-CSRFToken": csrfToken,
            },
          }
        );
        toast.success("Business documents uploaded successfully!");
        navigate("/dashboard/transporter/edit");
      } else {
        toast.warning("Please upload at least one document.");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.vehicle_images?.[0] ||
        err.response?.data?.image_front_view?.[0] ||
        err.response?.data?.detail ||
        "Failed to upload documents. Please try again.";
      toast.error(errorMessage);
      console.error("Upload error:", err.response?.data || err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-8 grid md:grid-cols-3 gap-8">
      {/* Sidebar */}
      <div className="md:col-span-1">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Add Business Documents</h3>
          <div className="w-full bg-gray-200 h-2.5 mb-3 rounded-full">
            <div className="bg-black h-2.5 rounded-full" style={{ width: "100%" }} />
          </div>
        </div>
        <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Upload Guidelines</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Files must be under 10MB</span>
            </li>
            <li className="flex items-start">
              <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Acceptable formats: webp, png, jpeg, jpg</span>
            </li>
            <li className="flex items-start">
              <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Ensure documents are clear and legible</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Form */}
      <div className="md:col-span-2 space-y-6">
        {/* Document Uploads */}
        <div className="pb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Business Documents</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload your company’s front-view image and up to three business documents (e.g., licenses, certificates).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Image Front View */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Front-Entry Image
              </label>
              <div className="flex items-center">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100 p-3 w-full h-28">
                  {filePreviews.image_front_view ? (
                    <img
                      src={filePreviews.image_front_view}
                      alt="Front view preview"
                      className="h-20 w-20 object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-gray-500 mb-1 mx-auto" />
                      <span className="text-xs text-gray-500">Upload image</span>
                    </div>
                  )}
                  <input
                    type="file"
                    name="image_front_view"
                    accept="image/webp,image/png,image/jpeg,image/jpg"
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

            {/* Business Documents */}
            {["business_doc_1", "business_doc_2", "business_doc_3"].map((name, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Document {index + 1}
                </label>
                <div className="flex items-center">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100 p-3 w-full h-28">
                    {filePreviews[name] ? (
                      <img
                        src={filePreviews[name]}
                        alt={`Document ${index + 1} preview`}
                        className="h-20 w-20 object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-gray-500 mb-1 mx-auto" />
                        <span className="text-xs text-gray-500">Upload document</span>
                      </div>
                    )}
                    <input
                      type="file"
                      name={name}
                      accept="image/webp,image/png,image/jpeg,image/jpg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {filePreviews[name] && (
                    <button
                      type="button"
                      onClick={() => removeFile(name)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={submitting}
            className="bg-black text-white py-2.5 px-6 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Uploading…
              </>
            ) : (
              "Upload Documents"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}