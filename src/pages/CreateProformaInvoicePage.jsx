import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const CreateProformaInvoicePage = () => {
  const { authAxios, jobTitle, BASE_URL } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    title: "New Proforma Invoice",
    description: "Test event response",
    spend_category: "",
    priority: "urgent",
    items: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAutoPopulationData = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const eventRefNum = params.get("event_ref_num");
        const response = await authAxios.get(
          `proforma-invoices/create-offer/?event_ref_num=${eventRefNum}&mn=waybill`
        );
        const { spend_category, items } = response.data.auto_population_data;
        setFormValues((prev) => ({
          ...prev,
          spend_category,
          items: items.map((item) => ({
            name: item.name,
            description: item.description,
            unit_of_measure: item.unit_of_measure,
            quantity: item.quantity,
            unit_price: "0.00",
            special_handles: item.special_handles,
          })),
        }));
      } catch (error) {
        toast.error("Failed to load auto-population data.");
        console.error("Fetch auto-population error:", error);
      } finally {
        setLoading(false);
      }
    };
    if (jobTitle === "logistics manager") {
      fetchAutoPopulationData();
    } else {
      setLoading(false);
    }
  }, [authAxios, location, jobTitle]);

  const handleChange = (e, index = null) => {
    const { name, value } = e.target;
    if (index !== null) {
      setFormValues((prev) => {
        const items = [...prev.items];
        items[index] = { ...items[index], [name]: value };
        return { ...prev, items };
      });
    } else {
      setFormValues((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams(location.search);
      const eventRefNum = params.get("event_ref_num");
      const response = await authAxios.post(
        `proforma-invoices/create-offer/?event_ref_num=${eventRefNum}&mn=waybill`,
        {
          ...formValues,
          start_datetime: new Date().toISOString(),
          submission_datetime: new Date().toISOString(),
        }
      );
      toast.success("Proforma invoice created successfully!");
      navigate(`/dashboard/proforma-invoices/${response.data.ref_num}`);
    } catch (error) {
      toast.error("Failed to create proforma invoice.");
      console.error("Create proforma invoice error:", error);
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
        Create Proforma Invoice
      </h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
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
            Description
          </label>
          <textarea
            name="description"
            value={formValues.description}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
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
            Priority
          </label>
          <select
            name="priority"
            value={formValues.priority}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="urgent">Urgent</option>
            <option value="non urgent">Non Urgent</option>
          </select>
        </div>
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Items</h2>
          {formValues.items.map((item, index) => (
            <div key={index} className="mb-4 p-4 border rounded-md">
              <p>
                <strong>Name:</strong> {item.name}
              </p>
              <p>
                <strong>Description:</strong> {item.description}
              </p>
              <p>
                <strong>Quantity:</strong> {item.quantity} {item.unit_of_measure}
              </p>
              <p>
                <strong>Special Handling:</strong>{" "}
                {item.special_handles[0]?.handling_description || "None"}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price
                </label>
                <input
                  type="text"
                  name="unit_price"
                  value={item.unit_price}
                  onChange={(e) => handleChange(e, index)}
                  className="block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          ))}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 flex items-center"
        >
          <Save className="w-5 h-5 mr-2" />
          {loading ? "Saving..." : "Save Proforma Invoice"}
        </button>
      </form>
    </div>
  );
};

export default CreateProformaInvoicePage;