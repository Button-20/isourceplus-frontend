import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Upload, Check, X } from "lucide-react";
import { useNavigate } from "react-router";
import { getCookie } from "@/utility/getCookie";
import ScrollToTop from "./ScrollToTop";

// Validation function for localStorage data
const validateStoredData = (data, expectedKeys) => {
  if (!data || typeof data !== "object") return false;
  return expectedKeys.every((key) =>
    Object.prototype.hasOwnProperty.call(data, key)
  );
};

const TransporterForm = () => {
  const { authAxios, setTransporterId } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState({
    name: "",
    field: "",
    type: "",
    industry: "",
    sector: "",
    bio: "",
    email: "",
    office_line: "",
    office_line_2: "",
    web_address: "",
  });

  const [lists, setLists] = useState({
    transport_mode: [],
    transport_means: [],
  });

  const [files, setFiles] = useState({
    logo: null,
    vehicle_images: [],
  });

  const [filePreviews, setFilePreviews] = useState({
    logo: null,
    vehicle_images: [],
  });

  const [submitting, setSubmitting] = useState(false);

  // Load form data from localStorage on component mount
  useEffect(() => {
    try {
      const storedValues = localStorage.getItem("transporterFormValues");
      const storedLists = localStorage.getItem("transporterFormLists");
      const storedPreviews = localStorage.getItem("transporterFormFilePreviews");

      if (storedValues) {
        const parsedValues = JSON.parse(storedValues);
        const expectedKeys = [
          "name",
          "field",
          "type",
          "industry",
          "sector",
          "bio",
          "email",
          "office_line",
          "office_line_2",
          "web_address",
        ];
        if (validateStoredData(parsedValues, expectedKeys)) {
          setValues(parsedValues);
          toast.info("Form data restored from previous session.");
        } else {
          console.warn("Invalid stored values in localStorage, skipping load.");
        }
      }

      if (storedLists) {
        const parsedLists = JSON.parse(storedLists);
        const expectedKeys = ["transport_mode", "transport_means"];
        if (validateStoredData(parsedLists, expectedKeys)) {
          setLists(parsedLists);
        } else {
          console.warn("Invalid stored lists in localStorage, skipping load.");
        }
      }

      if (storedPreviews) {
        const parsedPreviews = JSON.parse(storedPreviews);
        const expectedKeys = ["logo", "vehicle_images"];
        if (validateStoredData(parsedPreviews, expectedKeys)) {
          setFilePreviews(parsedPreviews);
          setFiles((prev) => ({
            ...prev,
            vehicle_images: parsedPreviews.vehicle_images.map(() => null), // Files can't be stored in localStorage, so reset to null
          }));
        } else {
          console.warn("Invalid stored file previews in localStorage, skipping load.");
        }
      }
    } catch (err) {
      console.error("Failed to load form data from localStorage:", err);
      toast.error("Unable to restore form data. Local storage may be disabled.");
    }

    // Clean up object URLs
    return () => {
      filePreviews.vehicle_images.forEach((preview) => {
        if (preview && preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
      if (filePreviews.logo && filePreviews.logo.startsWith("blob:")) {
        URL.revokeObjectURL(filePreviews.logo);
      }
    };
  }, [filePreviews]);

  // Handle text input changes and save to localStorage
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => {
      const updatedValues = { ...v, [name]: value };
      try {
        localStorage.setItem("transporterFormValues", JSON.stringify(updatedValues));
      } catch (err) {
        console.error("Failed to save form values to localStorage:", err);
        toast.error("Unable to save form data. Local storage may be disabled.");
      }
      return updatedValues;
    });
  };

  // Handle list (checkbox) changes and save to localStorage
  const handleListChange = (e) => {
    const { name, value, checked } = e.target;
    setLists((prev) => {
      const set = new Set(prev[name]);
      if (checked) set.add(value);
      else set.delete(value);
      const updatedLists = { ...prev, [name]: Array.from(set) };
      try {
        localStorage.setItem("transporterFormLists", JSON.stringify(updatedLists));
      } catch (err) {
        console.error("Failed to save lists to localStorage:", err);
        toast.error("Unable to save form data. Local storage may be disabled.");
      }
      return updatedLists;
    });
  };

  // Handle file input changes and save previews to localStorage
  const handleFileChange = (e, index = null) => {
    const { name, files } = e.target;
    const file = files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be under 2MB");
        return;
      }
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        toast.error("Only JPG and PNG formats are accepted");
        return;
      }
      if (name === "logo") {
        setFiles((f) => ({ ...f, logo: file }));
        setFilePreviews((p) => {
          const updatedPreviews = { ...p, logo: URL.createObjectURL(file) };
          try {
            localStorage.setItem("transporterFormFilePreviews", JSON.stringify(updatedPreviews));
          } catch (err) {
            console.error("Failed to save file previews to localStorage:", err);
            toast.error("Unable to save file previews. Local storage may be disabled.");
          }
          return updatedPreviews;
        });
      } else if (name === "vehicle_image" && index !== null) {
        setFiles((f) => {
          const newVehicleImages = [...f.vehicle_images];
          newVehicleImages[index] = file;
          return { ...f, vehicle_images: newVehicleImages };
        });
        setFilePreviews((p) => {
          const newPreviews = [...p.vehicle_images];
          newPreviews[index] = URL.createObjectURL(file);
          const updatedPreviews = { ...p, vehicle_images: newPreviews };
          try {
            localStorage.setItem("transporterFormFilePreviews", JSON.stringify(updatedPreviews));
          } catch (err) {
            console.error("Failed to save file previews to localStorage:", err);
            toast.error("Unable to save file previews. Local storage may be disabled.");
          }
          return updatedPreviews;
        });
      }
    }
  };

  // Remove file and update localStorage
  const removeFile = (name, index = null) => {
    if (name === "logo") {
      setFiles((f) => ({ ...f, logo: null }));
      setFilePreviews((p) => {
        const updatedPreviews = { ...p, logo: null };
        try {
          localStorage.setItem("transporterFormFilePreviews", JSON.stringify(updatedPreviews));
        } catch (err) {
          console.error("Failed to save file previews to localStorage:", err);
          toast.error("Unable to save file previews. Local storage may be disabled.");
        }
        return updatedPreviews;
      });
    } else if (name === "vehicle_image" && index !== null) {
      setFiles((f) => {
        const newVehicleImages = [...f.vehicle_images];
        newVehicleImages.splice(index, 1);
        return { ...f, vehicle_images: newVehicleImages };
      });
      setFilePreviews((p) => {
        const newPreviews = [...p.vehicle_images];
        newPreviews.splice(index, 1);
        const updatedPreviews = { ...p, vehicle_images: newPreviews };
        try {
          localStorage.setItem("transporterFormFilePreviews", JSON.stringify(updatedPreviews));
        } catch (err) {
          console.error("Failed to save file previews to localStorage:", err);
          toast.error("Unable to save file previews. Local storage may be disabled.");
        }
        return updatedPreviews;
      });
    }
  };

  // Add vehicle image slot and update localStorage
  const addVehicleImageSlot = () => {
    setFiles((f) => ({ ...f, vehicle_images: [...f.vehicle_images, null] }));
    setFilePreviews((p) => {
      const updatedPreviews = { ...p, vehicle_images: [...p.vehicle_images, null] };
      try {
        localStorage.setItem("transporterFormFilePreviews", JSON.stringify(updatedPreviews));
      } catch (err) {
        console.error("Failed to save file previews to localStorage:", err);
        toast.error("Unable to save file previews. Local storage may be disabled.");
      }
      return updatedPreviews;
    });
  };

  // Reset form and clear localStorage
  const handleReset = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const resetValues = {
      name: "",
      field: "",
      type: "",
      industry: "",
      sector: "",
      bio: "",
      email: "",
      office_line: "",
      office_line_2: "",
      web_address: "",
    };
    const resetLists = {
      transport_mode: [],
      transport_means: [],
    };
    const resetPreviews = { logo: null, vehicle_images: [] };
    setValues(resetValues);
    setLists(resetLists);
    setFiles(resetPreviews);
    setFilePreviews(resetPreviews);
    try {
      localStorage.removeItem("transporterFormValues");
      localStorage.removeItem("transporterFormLists");
      localStorage.removeItem("transporterFormFilePreviews");
      toast.success("Form reset successfully.");
    } catch (err) {
      console.error("Failed to clear localStorage:", err);
      toast.error("Unable to reset form. Local storage may be disabled.");
    }
  };

  const createTransporter = async () => {
    const payload = {
      ...values,
      transport_mode: lists.transport_mode,
      transport_means: lists.transport_means,
    };
    const csrfToken = getCookie("csrftoken");
    const res = await authAxios.post("transporters/", payload, {
      headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    });
    const results = res.data;
    setTransporterId(results.id);
    localStorage.setItem("transporter_id", results.id);
    return res.data;
  };

  const uploadFiles = async (transporterId) => {
    const formData = new FormData();
    if (files.logo) {
      formData.append("logo", files.logo);
    }
    files.vehicle_images.forEach((file, index) => {
      if (file) {
        formData.append(`vehicle_images[${index}][file]`, file);
      }
    });
    if (files.logo || files.vehicle_images.some((file) => file)) {
      const csrfToken = getCookie("csrftoken");
      await authAxios.patch(`transporters/${transporterId}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-CSRFToken": csrfToken,
        },
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await createTransporter();
      if (files.logo || files.vehicle_images.some((file) => file)) {
        await uploadFiles(created.id);
      }
      toast.success("Transporter registered successfully!");
      try {
        localStorage.removeItem("transporterFormValues");
        localStorage.removeItem("transporterFormLists");
        localStorage.removeItem("transporterFormFilePreviews");
      } catch (err) {
        console.error("Failed to clear localStorage:", err);
        toast.error("Unable to clear form data. Local storage may be disabled.");
      }
      navigate("/dashboard");
    } catch (err) {
      console.error("Registration failed", err);
      toast.error(
        err.response?.data?.vehicle_images?.[0] ||
          err.response?.data?.detail ||
          "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (<div>
    <ScrollToTop/>
    <form onSubmit={handleSubmit} className="p-6 sm:p-8 grid md:grid-cols-3 gap-8">
      {/* Left Sidebar */}
      <div className="md:col-span-1">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Lorem, ipsum dolor.</h3>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
            <div className="bg-black h-2.5 rounded-full" style={{ width: "60%" }} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-black rounded-full mr-2" />
              <span className="text-sm">Lorem, ipsum dolor.</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-300 rounded-full mr-2" />
              <span className="text-sm text-gray-500">Lorem, ipsum.</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-300 rounded-full mr-2" />
              <span className="text-sm text-gray-500">Lorem.</span>
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

      {/* Right Content */}
      <div className="md:col-span-2 space-y-6">
        {/* Basic Information */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transporter Name <span className="text-red-500">*</span>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <input
                type="text"
                name="type"
                value={values.type}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field</label>
              <input
                type="text"
                name="field"
                value={values.field}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <input
                type="text"
                name="industry"
                value={values.industry}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
              <input
                type="text"
                name="sector"
                value={values.sector}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Transporter Bio</label>
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Phone</label>
              <input
                type="text"
                name="office_line_2"
                value={values.office_line_2}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-black focus:border-black"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
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

        {/* Transport Services */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Transport Services</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transport Modes <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {["air", "land", "sea"].map((mode) => (
                  <label key={mode} className="flex items-center">
                    <input
                      type="checkbox"
                      name="transport_mode"
                      value={mode}
                      checked={lists.transport_mode.includes(mode)}
                      onChange={handleListChange}
                      className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transport Means <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["car", "truck", "bicycle", "motor-cycle"].map((m) => (
                  <label key={m} className="flex items-center">
                    <input
                      type="checkbox"
                      name="transport_means"
                      value={m}
                      checked={lists.transport_means.includes(m)}
                      onChange={handleListChange}
                      className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {m
                        .split("-")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Media Uploads */}
        <div className="pb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Media Uploads</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload a logo and as many vehicle images as needed to showcase your transport means.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
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
                      <span className="text-xs text-gray-500">Click to upload logo</span>
                    </div>
                  )}
                  <input
                    type="file"
                    name="logo"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e)}
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
            {filePreviews.vehicle_images.map((preview, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Image {index + 1}
                </label>
                <div className="flex items-center">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 p-4 w-full">
                    {preview ? (
                      <img
                        src={preview}
                        alt={`Vehicle preview ${index + 1}`}
                        className="h-20 w-20 object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                        <span className="text-xs text-gray-500">Click to upload vehicle</span>
                      </div>
                    )}
                    <input
                      type="file"
                      name="vehicle_image"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, index)}
                      className="hidden"
                    />
                  </label>
                  {preview && (
                    <button
                      type="button"
                      onClick={() => removeFile("vehicle_image", index)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addVehicleImageSlot}
            className="mt-4 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300"
          >
            Add Vehicle Image
          </button>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end pt-4 border-t border-gray-200 space-x-4">
          <button
            type="button"
            onClick={handleReset}
            disabled={submitting}
            className="bg-gray-200 text-gray-700 py-2.5 px-6 rounded-md font-medium hover:bg-gray-300 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            Reset Form
          </button>
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
              "Register Transporter"
            )}
          </button>
        </div>
      </div>
    </form></div>
  );
};

export default TransporterForm;