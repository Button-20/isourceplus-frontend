import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const CreateProformaInvoiceForRFxPage = () => {
  const { authAxios, jobTitle, BASE_URL } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    title: "New Proforma Invoice",
    description: "Test RFx response",
    spend_category: "",
    priority: "urgent",
    items: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAutoPopulationData = async () => {
      try {
        console.log("CreateProformaInvoiceForRFxPage: Fetching auto-population data...");
        const params = new URLSearchParams(location.search);
        const eventRefNum = params.get("event_ref_num");
        console.log("CreateProformaInvoiceForRFxPage: Event Reference Number:", eventRefNum);
        const response = await authAxios.get(
          `proforma-invoices/create-offer/?event_ref_num=${eventRefNum}&mn=rfx`
        );
        console.log("CreateProformaInvoiceForRFxPage: Auto-population data fetched successfully:", response.data);
        const { spend_category, items } = response.data.auto_population_data;
        console.log("CreateProformaInvoiceForRFxPage: Spend Category:", spend_category);
        console.log("CreateProformaInvoiceForRFxPage: Items:", items);
        setFormValues((prev) => ({
          ...prev,
          spend_category,
          items: items.map((item) => ({
            name: item.name || "N/A",
            description: item.description || "N/A",
            unit_of_measure: item.unit_of_measure || "",
            quantity: item.quantity || 0,
            unit_price: "0.00",
            special_handles: Array.isArray(item.special_handles) ? item.special_handles : [],
          })),
        }));
      } catch (error) {
        toast.error("Failed to load auto-population data.");
        console.error("Fetch auto-population error:", error);
      } finally {
        setLoading(false);
        console.log("CreateProformaInvoiceForRFxPage: Auto-population data fetch completed.");
      }
    };
    if (jobTitle === "sales manager") {
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
      console.log("CreateProformaInvoiceForRFxPage: Submitting form values:", formValues);
      const params = new URLSearchParams(location.search);
      const eventRefNum = params.get("event_ref_num");
      console.log("CreateProformaInvoiceForRFxPage: Event Reference Number for submission:", eventRefNum);
      const response = await authAxios.post(
        `proforma-invoices/create-offer/?event_ref_num=${eventRefNum}&mn=rfx`,
        {
          ...formValues,
          start_datetime: new Date().toISOString(),
          submission_datetime: new Date().toISOString(),
        }
      );
      console.log("CreateProformaInvoiceForRFxPage: Proforma invoice created successfully:", response.data);
      const { url } = response.data;
      if (!url || !url.startsWith(`${BASE_URL}proforma-invoices/`)) {
        throw new Error("Invalid response URL received.");
      }
      const refNum = url.split('/').filter(Boolean).pop(); // Extract ref_num from URL
      console.log("CreateProformaInvoiceForRFxPage: Extracted ref_num:", refNum);
      toast.success("Proforma invoice created successfully!");
      navigate(`/dashboard/proforma-invoices/${refNum}`);
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
        Create Proforma Invoice for RFx
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
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              Auto-populated
            </span>
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Items
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              Autogenerated
            </span>
          </h2>
          {formValues.items.length > 0 ? (
            formValues.items.map((item, index) => (
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
                  {item.special_handles.length > 0 ? item.special_handles.map((handle) => handle.handling_description).join(", ") : "None"}
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
            ))
          ) : (
            <p className="text-gray-600">No items available.</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white py-2 px-4 rounded-md hover:bg-gray-700 flex items-center"
        >
          <Save className="w-5 h-5 mr-2" />
          {loading ? "Saving..." : "Save Proforma Invoice"}
        </button>
      </form>
    </div>
  );
};

export default CreateProformaInvoiceForRFxPage;