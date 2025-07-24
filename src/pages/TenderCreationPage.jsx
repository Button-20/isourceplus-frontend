import React, { useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Save, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TenderCreationPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    title: "",
    spend_category: "",
    type: "nct",
    procedure: "open",
    method: "general sourcing",
    priority: "non urgent",
    note: "",
    region: "",
    district: "",
    city: "",
    town: "",
    attachments: [], // Array of { name, file }
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleAttachmentChange = (index, field, value) => {
    setFormValues((prev) => {
      const newAttachments = [...prev.attachments];
      newAttachments[index] = { ...newAttachments[index], [field]: value };
      return { ...prev, attachments: newAttachments };
    });
  };

  const addAttachment = () => {
    setFormValues((prev) => ({
      ...prev,
      attachments: [...prev.attachments, { name: "", file: null }],
    }));
  };

  const removeAttachment = (index) => {
    setFormValues((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (jobTitle !== "lead buyer") {
      toast.error("Only lead buyers can create tenders.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", formValues.title);
      formData.append("spend_category", formValues.spend_category);
      formData.append("type", formValues.type);
      formData.append("procedure", formValues.procedure);
      formData.append("method", formValues.method);
      formData.append("priority", formValues.priority);
      formData.append("note", formValues.note);
      formData.append("start_datetime", new Date().toISOString());
      formData.append("submission_datetime", new Date().toISOString());
      formData.append("delivery_datetime", new Date().toISOString());
      formData.append("reach[region]", formValues.region);
      formData.append("reach[district]", formValues.district);
      formData.append("reach[city]", formValues.city);
      formData.append("reach[town]", formValues.town);

      // Add attachments if provided
      formValues.attachments.forEach((attachment, index) => {
        if (attachment.name && attachment.file) {
          formData.append(`attachments[${index}][name]`, attachment.name);
          formData.append(`attachments[${index}][orientation]`, "document");
          formData.append(`attachments[${index}][file]`, attachment.file);
        }
      });

      // Log FormData for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`FormData: ${key} = ${value instanceof File ? value.name : value}`);
      }

      const response = await authAxios.post("/tenders/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("TenderCreationPage: Tender created successfully:", response.data);
      toast.success("Tender created successfully!");
      navigate(`/dashboard/tenders/${response.data.ref_num}`);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Failed to create tender.";
      toast.error(errorMessage);
      console.error("TenderCreationPage: Create tender error:", error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  if (jobTitle !== "lead buyer") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <p className="text-xl font-semibold text-gray-900 mb-4">Access Denied</p>
          <p className="text-gray-600 mb-6">Only lead buyers can create tenders.</p>
          <button
            onClick={() => navigate("/dashboard/tenders")}
            className="flex items-center justify-center w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Tenders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Tender</h1>
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={formValues.title}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spend Category</label>
              <input
                type="text"
                name="spend_category"
                value={formValues.spend_category}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                name="type"
                value={formValues.type}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              >
                <option value="nct">NCT</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Procedure</label>
              <select
                name="procedure"
                value={formValues.procedure}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <select
                name="method"
                value={formValues.method}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              >
                <option value="general sourcing">General Sourcing</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                name="priority"
                value={formValues.priority}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              >
                <option value="urgent">Urgent</option>
                <option value="non urgent">Non Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                name="note"
                value={formValues.note}
                onChange={handleChange}
                className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                rows="4"
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Reach</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <input
                    type="text"
                    name="region"
                    value={formValues.region}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                  <input
                    type="text"
                    name="district"
                    value={formValues.district}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formValues.city}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Town</label>
                  <input
                    type="text"
                    name="town"
                    value={formValues.town}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    required
                  />
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Attachments (Optional)</h2>
                <button
                  type="button"
                  onClick={addAttachment}
                  className="flex items-center text-indigo-600 hover:text-indigo-800"
                >
                  <Plus className="w-5 h-5 mr-1" />
                  Add Attachment
                </button>
              </div>
              {formValues.attachments.map((attachment, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4 relative">
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Attachment Name</label>
                      <input
                        type="text"
                        value={attachment.name}
                        onChange={(e) => handleAttachmentChange(index, "name", e.target.value)}
                        className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Enter attachment name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Attachment File</label>
                      <input
                        type="file"
                        onChange={(e) => handleAttachmentChange(index, "file", e.target.files[0])}
                        className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                      {attachment.file && (
                        <p className="mt-2 text-sm text-gray-600">Selected: {attachment.file.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center justify-center disabled:bg-indigo-400"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? "Saving..." : "Create Tender"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenderCreationPage;