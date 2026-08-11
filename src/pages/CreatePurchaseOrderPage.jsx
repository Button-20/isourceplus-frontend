import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const CreatePurchaseOrderPage = () => {
  const { authAxios, jobTitle, BASE_URL } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    title: "New Purchase Order",
    type: "lpo",
    spend_category: "",
    preferred_payment_channel: "denarii and shekels",
    delivery_datetime: new Date().toISOString(),
    vat_type: "standard",
    total_cost: "0.00",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAutoPopulationData = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const eventRefNum = params.get("event_ref_num");
        const response = await authAxios.get(
          `purchase-orders/create-business-award/?event_ref_num=${eventRefNum}&mn=proformainvoice`
        );
        const { spend_category } = response.data.auto_population_data;
        setFormValues((prev) => ({ ...prev, spend_category }));
      } catch (error) {
        toast.error("Failed to load auto-population data.");
        console.error("Fetch auto-population error:", error);
      } finally {
        setLoading(false);
      }
    };
    if (["lead buyer", "sales manager"].includes(jobTitle)) {
      fetchAutoPopulationData();
    } else {
      setLoading(false);
    }
  }, [authAxios, location, jobTitle]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams(location.search);
      const eventRefNum = params.get("event_ref_num");
      const response = await authAxios.post(
        `purchase-orders/create-business-award/?event_ref_num=${eventRefNum}&mn=proformainvoice`,
        formValues
      );
      toast.success("Purchase order created successfully!");
      navigate(`/dashboard/purchase-orders/${response.data.ref_num}`);
    } catch (error) {
      toast.error("Failed to create purchase order.");
      console.error("Create purchase order error:", error);
    } finally {
      setLoading(false);
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
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Create Purchase Order
      </h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={formValues.title}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            name="type"
            value={formValues.type}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="lpo">LPO</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Spend Category
          </label>
          <input
            type="text"
            name="spend_category"
            value={formValues.spend_category}
            readOnly
            className="block w-full border border-gray-300 rounded-md p-2 bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Payment Channel
          </label>
          <input
            type="text"
            name="preferred_payment_channel"
            value={formValues.preferred_payment_channel}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Date
          </label>
          <input
            type="datetime-local"
            name="delivery_datetime"
            value={formValues.delivery_datetime.slice(0, 16)}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            VAT Type
          </label>
          <select
            name="vat_type"
            value={formValues.vat_type}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="standard">Standard</option>
            <option value="exempt">Exempt</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Cost
          </label>
          <input
            type="text"
            name="total_cost"
            value={formValues.total_cost}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 flex items-center"
        >
          <Save className="w-5 h-5 mr-2" />
          {loading ? "Saving..." : "Save Purchase Order"}
        </button>
      </form>
    </div>
  );
};

export default CreatePurchaseOrderPage;