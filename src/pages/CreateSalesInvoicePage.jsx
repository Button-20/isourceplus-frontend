import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const CreateSalesInvoicePage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventRefNum = searchParams.get("event_ref_num");
  const mn = searchParams.get("mn");
  const [formData, setFormData] = useState({
    title: "",
    spend_category: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (jobTitle !== "sales manager" && jobTitle !== "logistics manager") {
      toast.error("Only sales managers and logistics managers can create sales invoices.");
      navigate("/dashboard/purchase-orders");
      return;
    }
    const fetchAutoPopulationData = async () => {
      try {
        const response = await authAxios.get(`/sales-invoices/create-sales-invoice/?event_ref_num=${eventRefNum}&mn=${mn}`);
        console.log("CreateSalesInvoicePage: Auto-population data fetched:", response.data);
        setFormData((prev) => ({
          ...prev,
          spend_category: response.data.auto_population_data.spend_category || "",
        }));
      } catch (error) {
        toast.error("Failed to load auto-population data.");
        console.error("CreateSalesInvoicePage: Fetch auto-population error:", error.response?.data || error);
      } finally {
        setLoading(false);
      }
    };
    if (eventRefNum && mn === "purchaseorder") {
      fetchAutoPopulationData();
    } else {
      setLoading(false);
    }
  }, [authAxios, eventRefNum, mn, jobTitle, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const data = new FormData();
    data.append("title", formData.title);
    data.append("spend_category", formData.spend_category);

    try {
      const csrfToken = document.cookie.split("; ").find(row => row.startsWith("csrftoken="))?.split("=")[1];
      console.log("CreateSalesInvoicePage: FormData:", Object.fromEntries(data));
      const response = await authAxios.post(
        `/sales-invoices/create-sales-invoice/?event_ref_num=${eventRefNum}&mn=${mn}`,
        data,
        { headers: { "X-CSRFToken": csrfToken } }
      );
      console.log("CreateSalesInvoicePage: Sales invoice created:", response.data);
      // Extract ref_num from the response URL (e.g., http://127.0.0.1:8000/api/v1/sales-invoices/SC250727566593141/)
      const refNum = response.data.url.split("/").slice(-2)[0];
      const salesInvoiceUrl = `/dashboard/sales-invoices/${refNum}`;
      console.log("CreateSalesInvoicePage: Navigating to:", salesInvoiceUrl);
      navigate(salesInvoiceUrl);
      toast.success("Sales invoice created successfully!");
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.title?.[0] ||
        error.response?.data?.spend_category?.[0] ||
        "Failed to create sales invoice.";
      toast.error(errorMessage);
      console.error("CreateSalesInvoicePage: Create error:", error.response?.data || error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Sales Invoice</h1>
          <button
            onClick={() => navigate("/dashboard/purchase-orders")}
            className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Purchase Orders
          </button>
        </div>
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-500">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-gray-700 sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Spend Category</label>
              <input
                type="text"
                name="spend_category"
                value={formData.spend_category}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-gray-700 sm:text-sm"
                readOnly
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-black text-white py-2 px-6 rounded-lg hover:bg-gray-700 transition duration-200 disabled:bg-gray-400"
              >
                {submitting ? "Submitting..." : "Create Sales Invoice"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSalesInvoicePage;