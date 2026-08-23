import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const CreateProformaInvoiceForTenderPage = () => {
  const { authAxios, jobTitle, BASE_URL } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    title: "New Proforma Invoice",
    description: "Test tender response",
    spend_category: "",
    priority: "urgent",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAutoPopulationData = async () => {
      try {
        console.log("CreateProformaInvoiceForTenderPage: Fetching auto-population data...");
        const params = new URLSearchParams(location.search);
        const eventRefNum = params.get("event_ref_num");
        console.log("CreateProformaInvoiceForTenderPage: Event Reference Number:", eventRefNum);
        const response = await authAxios.get(
          `proforma-invoices/create-offer/?event_ref_num=${eventRefNum}&mn=tender`
        );
        console.log("CreateProformaInvoiceForTenderPage: Auto-population data fetched successfully:", response.data);
        const { spend_category } = response.data.auto_population_data;
        console.log("CreateProformaInvoiceForTenderPage: Spend Category:", spend_category);
        setFormValues((prev) => ({
          ...prev,
          spend_category,
        }));
      } catch (error) {
        toast.error("Failed to load auto-population data.");
        console.error("Fetch auto-population error:", error);
      } finally {
        setLoading(false);
        console.log("CreateProformaInvoiceForTenderPage: Auto-population data fetch completed.");
      }
    };
    if (jobTitle === "sales manager") {
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
      console.log("CreateProformaInvoiceForTenderPage: Submitting form values:", formValues);
      const params = new URLSearchParams(location.search);
      const eventRefNum = params.get("event_ref_num");
      console.log("CreateProformaInvoiceForTenderPage: Event Reference Number for submission:", eventRefNum);
      const response = await authAxios.post(
        `proforma-invoices/create-offer/?event_ref_num=${eventRefNum}&mn=tender`,
        {
          ...formValues,
          start_datetime: new Date().toISOString(),
          submission_datetime: new Date().toISOString(),
        }
      );
      console.log("CreateProformaInvoiceForTenderPage: Proforma invoice created successfully:", response.data);
      const { url } = response.data;
      if (!url || !url.startsWith(`${BASE_URL}proforma-invoices/`)) {
        throw new Error("Invalid response URL received.");
      }
      const refNum = url.split('/').filter(Boolean).pop();
      console.log("CreateProformaInvoiceForTenderPage: Extracted ref_num:", refNum);
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
        Create Proforma Invoice for Tender
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

export default CreateProformaInvoiceForTenderPage;