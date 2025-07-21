import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCookie } from "@/utility/getCookie";

const PurchaseOrderCreationPage = () => {
  const { authAxios, BASE_URL } = useAuth();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    spend_category: "",
    quantity: "",
    total_cost: "",
    items: [],
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { redirectUrl } = location.state || {};

  useEffect(() => {
    const fetchAutoPopulationData = async () => {
      if (!redirectUrl || !redirectUrl.startsWith("/api/v1/purchase-orders/create-business-award/")) {
        setError("Invalid document creation URL.");
        setLoading(false);
        return;
      }
      try {
        const cleanUrl = redirectUrl.replace(/^\/api\/v1/, "");
        console.log("PurchaseOrderCreationPage: Fetching auto-population data from:", `${BASE_URL}${cleanUrl}`);
        const response = await authAxios.get(cleanUrl);
        console.log("PurchaseOrderCreationPage: Auto-population data fetched successfully:", response.data);
        setFormData((prev) => ({
          ...prev,
          spend_category: response.data.auto_population_data?.spend_category || "",
          items: response.data.auto_population_data?.items || [],
        }));
      } catch (error) {
        const errorMessage = error.response?.data?.detail || "Failed to load auto-population data.";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("PurchaseOrderCreationPage: Fetch auto-population data error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAutoPopulationData();
  }, [authAxios, redirectUrl, BASE_URL]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!redirectUrl) {
      toast.error("Invalid document creation URL.");
      return;
    }
    if (formData.quantity <= 0) {
      toast.error("Quantity must be a positive integer.");
      return;
    }
    if (formData.total_cost <= 0) {
      toast.error("Total cost must be a positive number.");
      return;
    }
    setLoading(true);
    try {
      const cleanUrl = redirectUrl.replace(/^\/api\/v1/, "");
      console.log("PurchaseOrderCreationPage: Posting to:", `${BASE_URL}${cleanUrl}`);
          let csrfToken = getCookie("csrftoken");

      const response = await authAxios.post(
        cleanUrl,
        {
          spend_category: formData.spend_category,
          quantity: parseInt(formData.quantity, 10),
          total_cost: parseFloat(formData.total_cost),
          // items: formData.items,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken, // Include CSRF token for security
          },
        }
      );
      console.log("PurchaseOrderCreationPage: Purchase order created successfully:", response.data);
      toast.success("Purchase order created successfully!");
      navigate("/dashboard/proforma-invoices");
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Failed to create purchase order.";
      toast.error(errorMessage);
      console.error("PurchaseOrderCreationPage: Create purchase order error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
        <p className="mt-4 text-gray-600 text-lg">Loading Document Creation Data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <X className="h-16 w-16 text-red-500" />
        <p className="mt-4 text-xl text-gray-900">{error}</p>
        <button
          onClick={() => navigate("/dashboard/proforma-invoices")}
          className="mt-6 flex items-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Proforma Invoices
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Save className="w-8 h-8 mr-2 text-indigo-600" />
          Create Purchase Order
        </h1>
        <button
          onClick={() => navigate("/dashboard/proforma-invoices")}
          className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Proforma Invoices
        </button>
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spend Category
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                Auto-populated
              </span>
            </label>
            <input
              type="text"
              name="spend_category"
              value={formData.spend_category}
              readOnly
              className="block w-full border border-gray-300 rounded-md p-2 bg-gray-100 text-gray-900 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Cost
            </label>
            <input
              type="number"
              name="total_cost"
              value={formData.total_cost}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
              step="0.01"
              min="0"
            />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Items
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                Auto-populated
              </span>
            </h2>
            {formData.items.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit of Measure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.description || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.unit_of_measure}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.unit_price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-600">No items available.</p>
            )}
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard/proforma-invoices")}
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
              {loading ? "Creating..." : "Create Purchase Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseOrderCreationPage;