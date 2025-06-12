import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/app.context";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { getCookie } from "@/utility/getCookie";

export default function EditTransporter() {
  const { authAxios, transporterId } = useAuth();
  const navigate = useNavigate();

  // don’t fetch until we have transporterId
  if (!transporterId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading transporter info…</p>
      </div>
    );
  }

  // form state
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
    image_front_view: null,
    vehicle_image: null,
  });
  const [filePreviews, setFilePreviews] = useState({
    logo: null,
    image_front_view: null,
    vehicle_image: null,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // fetch existing transporter
  useEffect(() => {
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
          image_front_view: data.image_front_view || null,
          vehicle_image: data.vehicle_image || null,
        });
      } catch {
        toast.error("Failed to load transporter data");
      } finally {
        setLoading(false);
      }
    })();
  }, [authAxios, transporterId]);

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
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    setFiles((f) => ({ ...f, [name]: file }));
    setFilePreviews((p) => ({ ...p, [name]: URL.createObjectURL(file) }));
  };
  const removeFile = (name) => {
    setFiles((f) => ({ ...f, [name]: null }));
    setFilePreviews((p) => ({ ...p, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const csrfToken = getCookie("csrftoken");
      // 1) patch JSON fields
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

      // 2) patch files if any
      const formData = new FormData();
      Object.entries(files).forEach(([k, file]) => {
        if (file) formData.append(k, file);
      });
      if (
        formData.has("logo") ||
        formData.has("image_front_view") ||
        formData.has("vehicle_image")
      ) {
        const csrf = getCookie("csrftoken");
        await authAxios.patch(`transporters/${transporterId}/`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-CSRFToken": csrf,
          },
        });
      }

      toast.success("Transporter updated successfully!");
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
      {/* Sidebar */}
      <div className="md:col-span-1">
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="font-medium mb-3">Edit Transporter</h3>
          <div className="w-full bg-gray-200 h-2.5 mb-3 rounded-full">
            <div
              className="bg-black h-2.5 rounded-full"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </div>

      {/* Main form */}
      <div className="md:col-span-2 space-y-6">
        {/* Basic Info */}
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

        {/* Contact */}
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

        {/* Transport Services */}
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
                    <span className="ml-2">
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </span>
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

        {/* Media Uploads */}
        <div>
          <h2 className="text-lg font-medium mb-4">Media Uploads</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {["logo", "image_front_view", "vehicle_image"].map((name) => (
              <div key={name}>
                <label className="block mb-2">
                  {name.replace("_", " ").toUpperCase()}
                </label>
                <div className="flex items-center">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 p-4 w-full hover:bg-gray-100">
                    {filePreviews[name] ? (
                      <img
                        src={filePreviews[name]}
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
                      name={name}
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {filePreviews[name] && (
                    <button
                      type="button"
                      onClick={() => removeFile(name)}
                      className="ml-2 text-red-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
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
