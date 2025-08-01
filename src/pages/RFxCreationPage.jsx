import React, { useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCookie } from "@/utility/getCookie";

const RFxCreationPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    spend_category: "communications",
    type: "information",
    procedure: "open",
    priority: "non urgent",
    note: "",
    items: [
      {
        name: "",
        description: "",
        unit_of_measure: "pc",
        quantity: 1,
        attachment: null,
        special_handles: [],
      },
    ],
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
      // Enforce max length for description
      if (field === "description" && value.length > 225) {
        toast.error("Item description cannot exceed 225 characters.");
        return;
      }
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      setFormData((prev) => ({ ...prev, items: updatedItems }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          name: "",
          description: "",
          unit_of_measure: "pc",
          quantity: 1,
          attachment: null,
          special_handles: [],
        },
      ],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length <= 1) {
      toast.error("At least one item is required.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error("Title is required.");
      return false;
    }
    if (!formData.spend_category) {
      toast.error("Spend category is required.");
      return false;
    }
    const validItems = formData.items.filter(
      (item) => item.name.trim() && item.unit_of_measure.trim() && item.quantity > 0
    );
    if (validItems.length === 0) {
      toast.error("At least one valid item is required (with name, unit of measure, and positive quantity).");
      return false;
    }
    // Check for description length
    const invalidDescriptions = formData.items.filter((item) => item.description.length > 225);
    if (invalidDescriptions.length > 0) {
      toast.error("One or more item descriptions exceed 225 characters.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    try {
      const csrfToken = getCookie("csrftoken");
      if (!csrfToken) {
        throw new Error("CSRF token is missing.");
      }
      const response = await authAxios.post(
        "/rfxs/",
        {
          title: formData.title,
          spend_category: formData.spend_category,
          type: formData.type,
          procedure: formData.procedure,
          priority: formData.priority,
          note: formData.note,
          items: formData.items
            .filter((item) => item.name.trim() && item.unit_of_measure.trim() && item.quantity > 0)
            .map((item) => ({
              name: item.name,
              description: item.description || "",
              unit_of_measure: item.unit_of_measure,
              quantity: parseInt(item.quantity, 10),
              special_handles: item.special_handles,
            })),
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
        }
      );
      console.log("RFx created successfully:", response.data);
      toast.success("RFx created successfully!");
      navigate("/dashboard/rfxs/issued");
    } catch (error) {
      console.error("RFx creation error:", error.response?.data || error);
      let errorMessage = "Failed to create RFx.";
      if (error.response?.data) {
        // Handle item-specific errors
        if (error.response.data.items && Array.isArray(error.response.data.items)) {
          const descriptionErrors = error.response.data.items
            .map((item, index) =>
              item.description && item.description.length > 0
                ? `Item ${index + 1}: ${item.description.join(", ")}`
                : null
            )
            .filter(Boolean);
          if (descriptionErrors.length > 0) {
            errorMessage = descriptionErrors.join("; ");
          } else {
            errorMessage = error.response.data.detail || JSON.stringify(error.response.data);
          }
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.spend_category) {
          errorMessage = error.response.data.spend_category[0];
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      }
      toast.error(errorMessage);
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
            <select
              name="spend_category"
              value={formData.spend_category}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="communications">Communications</option>
            </select>
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
                  <textarea
                    name={`item_description_${index}`}
                    value={item.description}
                    onChange={(e) => handleInputChange(e, index)}
                    className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    maxLength={225}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {item.description.length}/225 characters
                  </p>
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
                  <select
                    name={`item_unit_of_measure_${index}`}
                    value={item.unit_of_measure}
                    onChange={(e) => handleInputChange(e, index)}
                    className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="pc">Pieces</option>
                    <option value="kg">Kilogram</option>
                    <option value="g">Gram</option>
                    <option value="mg">Milligram</option>
                    <option value="t">Ton</option>
                    <option value="lb">Pound</option>
                    <option value="oz">Ounce</option>
                    <option value="L">Liter</option>
                    <option value="mL">Milliliter</option>
                    <option value="m³">Cubic meter</option>
                    <option value="cm³">Cubic centimeter</option>
                    <option value="gal">Gallon</option>
                    <option value="qt">Quart</option>
                    <option value="pt">Pint</option>
                    <option value="fl oz">Fluid ounce</option>
                  </select>
                </div>
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="mt-2 flex items-center bg-red-100 text-red-700 py-2 px-4 rounded-md hover:bg-red-200 transition duration-200"
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    Remove Item
                  </button>
                )}
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