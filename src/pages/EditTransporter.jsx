import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/app.context";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, Loader2, Upload, X } from "lucide-react";
import { getCookie } from "@/utility/getCookie";

export default function EditTransporter() {
  const { authAxios, transporterId, setTransporterId } = useAuth();
  const navigate = useNavigate();
  const [idLoading, setIdLoading] = useState(!transporterId);

  // Fetch transporterId if missing
  useEffect(() => {
    if (!transporterId) {
      (async () => {
        try {
          setIdLoading(true);
          const res = await authAxios.get("users/");
          const userData = res.data.results[0];
          if (userData.company && userData.company.includes("/transporters/")) {
            const id = userData.company.split("/").slice(-2)[0];
            setTransporterId(id);
          } else {
            toast.error("No transporter associated with this user");
          }
        } catch (err) {
          toast.error("Failed to load transporter ID");
          console.error("Fetch user error:", err);
        } finally {
          setIdLoading(false);
        }
      })();
    }
  }, [authAxios, transporterId, setTransporterId]);

  // Form state
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch transporter data
  useEffect(() => {
    if (transporterId) {
      (async () => {
        try {
          const { data } = await authAxios.get(`transporters/${transporterId}/`);
          setValues({
            name: data.name || "",
            field: data.field || "",
            type: data.type || "",
            industry: data.industry || "",
            sector: data.sector || "",
            bio: data.bio || "",
            email: data.email || "",
            office_line: data.office_line || "",
            office_line_2: data.office_line_2 || "",
            web_address: data.web_address || "",
          });
          setLists({
            transport_mode: data.transport_mode || [],
            transport_means: data.transport_means || [],
          });
          setFilePreviews({
            logo: data.logo || null,
            vehicle_images: data.vehicle_images?.map((img) => img.file) || [],
          });
          setFiles({
            logo: null,
            vehicle_images: [],
          });
        } catch {
          toast.error("Failed to load transporter data");
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [authAxios, transporterId]);

  useEffect(() => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };
  const handleListChange = (e) => {
    const { name, value, checked } = e.target;
    setLists((prev) => {
      const set = new Set(prev[name]);
      checked ? set.add(value) : set.delete(value);
      return { ...prev, [name]: Array.from(set) };
    });
  };
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
        setFilePreviews((p) => ({ ...p, logo: URL.createObjectURL(file) }));
      } else if (name === "vehicle_image" && index !== null) {
        setFiles((f) => {
          const newVehicleImages = [...f.vehicle_images];
          newVehicleImages[index] = file;
          return { ...f, vehicle_images: newVehicleImages };
        });
        setFilePreviews((p) => {
          const newPreviews = [...p.vehicle_images];
          newPreviews[index] = URL.createObjectURL(file);
          return { ...p, vehicle_images: newPreviews };
        });
      }
    }
  };
  const addVehicleImageSlot = () => {
    setFiles((f) => ({ ...f, vehicle_images: [...f.vehicle_images, null] }));
    setFilePreviews((p) => ({
      ...p,
      vehicle_images: [...p.vehicle_images, null],
    }));
  };
  const removeFile = (name, index = null) => {
    if (name === "logo") {
      setFiles((f) => ({ ...f, logo: null }));
      setFilePreviews((p) => ({ ...p, logo: null }));
    } else if (name === "vehicle_image" && index !== null) {
      setFiles((f) => {
        const newVehicleImages = [...f.vehicle_images];
        newVehicleImages.splice(index, 1);
        return { ...f, vehicle_images: newVehicleImages };
      });
      setFilePreviews((p) => {
        const newPreviews = [...p.vehicle_images];
        newPreviews.splice(index, 1);
        return { ...p, vehicle_images: newPreviews };
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const csrfToken = getCookie("csrftoken");
      await authAxios.patch(
        `transporters/${transporterId}/`,
        {
          ...values,
          transport_mode: lists.transport_mode,
          transport_means: lists.transport_means,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
        }
      );
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
        await authAxios.patch(`transporters/${transporterId}/`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-CSRFToken": csrfToken,
          },
        });
      }
      toast.success("Transporter updated successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Update error:", err);
      toast.error(
        err.response?.data?.vehicle_images?.[0] ||
          err.response?.data?.detail ||
          "Update failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (idLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
        <p className="ml-2 text-gray-500">Loading transporter ID…</p>
      </div>
    );
  }

  if (!transporterId) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-500 mb-4">No transporter associated with this user.</p>
        <Link
          to="/dashboard/transporter/new"
          className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800"
        >
          Create Transporter
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
        <p className="ml-2 text-gray-500">Loading transporter data…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 grid md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="font-medium mb-3">Edit Transporter</h3>
          <div className="w-full bg-gray-200 h-2.5 mb-3 rounded-full">
            <div className="bg-black h-2.5 rounded-full" style={{ width: "100%" }} />
          </div>
        </div>
        <div title="Add Business Documents" className="bg-black hover:bg-gray-800 p-2 text-white mt-4 rounded-lg border">
          <Link to="/dashboard/transporter/add-business-docs" className="font-medium mb-3">
            Add Documents
          </Link>
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
      <div className="md:col-span-2 space-y-6">
        <div>
          <h2 className="text-lg font-medium mb-4">Basic Information</h2>
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
                onChange={handleChange}
                required
                className="w-full border rounded p-2"
              >
                <option value="">Select</option>
                <option value="individual">Individual</option>
                <option value="organisation">Organization</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Industry</label>
              <input
                name="industry"
                value={values.industry}
                onChange={handleChange}
                className="w-full border rounded p-2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block mb-1">Description</label>
              <textarea
                name="bio"
                rows={3}
                value={values.bio}
                onChange={handleChange}
                className="w-full border rounded p-2"
              />
            </div>
          </div>
        </div>
        <div>
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
              />
            </div>
            <div>
              <label className="block mb-1">Secondary Phone</label>
              <input
                name="office_line_2"
                value={values.office_line_2}
                onChange={handleChange}
                className="w-full border rounded p-2"
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
              />
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-medium mb-4">Transport Services</h2>
          <div className="grid gap-4">
            <div>
              <label className="block mb-2">Transport Modes *</label>
              <div className="grid grid-cols-3 gap-3">
                {["air", "land", "sea"].map((mode) => (
                  <label key={mode} className="flex items-center">
                    <input
                      type="checkbox"
                      name="transport_mode"
                      value={mode}
                      checked={lists.transport_mode.includes(mode)}
                      onChange={handleListChange}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="ml-2">{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block mb-2">Transport Means *</label>
              <div className="grid grid-cols-2 gap-3">
                {["car", "truck", "bicycle", "motor-cycle"].map((m) => (
                  <label key={m} className="flex items-center">
                    <input
                      type="checkbox"
                      name="transport_means"
                      value={m}
                      checked={lists.transport_means.includes(m)}
                      onChange={handleListChange}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="ml-2">
                      {m
                        .split("-")
                        .map((w) => w[0].toUpperCase() + w.slice(1))
                        .join(" ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-medium mb-4">Media Uploads</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload up to three vehicle images to showcase your transport means.
          </p>
          <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block mb-2">Logo</label>
              <div className="flex items-center">
                <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 p-4 w-full hover:bg-gray-100">
                  {filePreviews.logo ? (
                    <img
                      src={filePreviews.logo}
                      alt="Logo preview"
                      className="h-20 w-20 object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-6 h-6 mb-2 text-gray-500" />
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
                <label className="block mb-2">Vehicle Image {index + 1}</label>
                <div className="flex items-center">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 p-4 w-full hover:bg-gray-100">
                    {preview ? (
                      <img
                        src={preview}
                        alt={`Vehicle preview ${index + 1}`}
                        className="h-20 w-20 object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 mb-2 text-gray-500" />
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
            <button
              type="button"
              onClick={addVehicleImageSlot}
              className="mt-4 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300"
            >
              Add Vehicle Image
            </button>
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
}