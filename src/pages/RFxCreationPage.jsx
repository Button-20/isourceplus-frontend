import React, { useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCookie } from "@/utility/getCookie";

const RFxCreationPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    spend_category: "",
    type: "information",
    procedure: "open",
    priority: "non urgent",
    note: "",
    items: [{ name: "", description: "", unit_of_measure: "pc", quantity: 1, attachment: null, special_handles: [] }],
  });

  if (jobTitle !== "lead buyer") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <p className="text-xl text-gray-900">Access denied. Only lead buyers can create RFxs.</p>
        <button
          onClick={() => navigate("/dashboard/rfxs")}
          className="mt-6 flex items-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to RFxs
        </button>
      </div>
    );
  }

  const handleInputChange = (e, index) => {
    const { name, value } = e.target;
    if (name.startsWith("item_")) {
      const field = name.split("_")[1];
      const updatedItems = [...formData.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      setFormData((prev) => ({ ...prev, items: updatedItems }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { name: "", description: "", unit_of_measure: "pc", quantity: 1, attachment: null, special_handles: [] }],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        let csrfToken = getCookie("csrftoken");
      const response = await authAxios.post(
        "/rfxs/",
        {
          title: formData.title,
          spend_category: formData.spend_category,
          type: formData.type,
          procedure: formData.procedure,
          priority: formData.priority,
          note: formData.note,
          items: formData.items.map((item) => ({
            name: item.name,
            description: item.description,
            unit_of_measure: item.unit_of_measure,
            quantity: parseInt(item.quantity, 10),
            special_handles: item.special_handles,
          })),
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken, // Include CSRF token for security
          },
        }
      );
      console.log("RFx created successfully:", response.data);
      toast.success("RFx created successfully!");
      navigate("/dashboard/rfxs/issued");
    } catch (error) {
      const errorMessage = error.response?.data?.detail  || error.response?.data?.spend_category[0] || "Failed to create RFx.";
      toast.error(errorMessage);
      console.error("RFx creation error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Save className="w-8 h-8 mr-2 text-indigo-600" />
          Create RFx
        </h1>
        <button
          onClick={() => navigate("/dashboard/rfxs")}
          className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to RFxs
        </button>
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Spend Category</label>
            <input
              type="text"
              name="spend_category"
              value={formData.spend_category}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="information">Information</option>
              <option value="quotation">Quotation</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Procedure</label>
            <select
              name="procedure"
              value={formData.procedure}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="open">Open</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="non urgent">Non Urgent</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Items</h2>
            {formData.items.map((item, index) => (
              <div key={index} className="space-y-4 border-t pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                  <input
                    type="text"
                    name={`item_name_${index}`}
                    value={item.name}
                    onChange={(e) => handleInputChange(e, index)}
                    className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    name={`item_description_${index}`}
                    value={item.description}
                    onChange={(e) => handleInputChange(e, index)}
                    className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    name={`item_quantity_${index}`}
                    value={item.quantity}
                    onChange={(e) => handleInputChange(e, index)}
                    className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    name={`item_unit_of_measure_${index}`}
                    value={item.unit_of_measure}
                    onChange={(e) => handleInputChange(e, index)}
                    className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="mt-4 bg-indigo-100 text-indigo-700 py-2 px-4 rounded-md hover:bg-indigo-200 transition duration-200"
            >
              Add Item
            </button>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard/rfxs")}
              className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200 shadow-md disabled:opacity-50"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? "Creating..." : "Create RFx"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RFxCreationPage;