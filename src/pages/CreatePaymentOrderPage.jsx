import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const CreatePaymentOrderPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventRefNum = searchParams.get("event_ref_num");
  const mn = searchParams.get("mn");
  const [formData, setFormData] = useState({
    title: "",
    spend_category: "",
    priority: "urgent",
    payment_method: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!["sales manager", "logistics manager"].includes(jobTitle)) {
      toast.error("Only sales or logistics managers can create payment orders.");
      navigate("/dashboard/sales-invoices");
      return;
    }
    const fetchAutoPopulationData = async () => {
      try {
        const response = await authAxios.get(`/payment-orders/create-payment-order/?event_ref_num=${eventRefNum}&mn=${mn}`);
        console.log("CreatePaymentOrderPage: Auto-population data fetched:", response.data);
        setFormData((prev) => ({
          ...prev,
          spend_category: response.data.auto_population_data.spend_category || "",
        }));
      } catch (error) {
        toast.error("Failed to load auto-population data.");
        console.error("CreatePaymentOrderPage: Fetch auto-population error:", error.response?.data || error);
      } finally {
        setLoading(false);
      }
    };
    if (eventRefNum && mn === "salesinvoice") {
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
    data.append("priority", formData.priority);
    data.append("payment_method", formData.payment_method);

    try {
      const csrfToken = document.cookie.split("; ").find(row => row.startsWith("csrftoken="))?.split("=")[1];
      console.log("CreatePaymentOrderPage: FormData:", Object.fromEntries(data));
      const response = await authAxios.post(
        `/payment-orders/create-payment-order/?event_ref_num=${eventRefNum}&mn=${mn}`,
        data,
        { headers: { "X-CSRFToken": csrfToken } }
      );
      console.log("CreatePaymentOrderPage: Payment order created:", response.data);
      const refNum = response.data.url.split("/").slice(-2)[0];
      const paymentOrderUrl = `/dashboard/payment-orders/${refNum}`;
      console.log("CreatePaymentOrderPage: Navigating to:", paymentOrderUrl);
      navigate(paymentOrderUrl);
      toast.success("Payment order created successfully!");
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.title?.[0] ||
        error.response?.data?.spend_category?.[0] ||
        error.response?.data?.priority?.[0] ||
        error.response?.data?.payment_method?.[0] ||
        "Failed to create payment order.";
      toast.error(errorMessage);
      console.error("CreatePaymentOrderPage: Create error:", error.response?.data || error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-gray-600 mx-auto" />
          <p className="mt-4 text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Payment Order</h1>
          <button
            onClick={() => navigate("/dashboard/sales-invoices")}
            className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Sales Invoices
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
                className="mt-1 block w-full border-gray-300 rounded-md shadow-xs focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
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
                className="mt-1 block w-full border-gray-300 rounded-md shadow-xs focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-xs focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
              >
                <option value="urgent">Urgent</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Payment Method</label>
              <input
                type="text"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-xs focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-black text-white py-2 px-6 rounded-lg hover:bg-gray-700 transition duration-200 disabled:bg-gray-400"
              >
                {submitting ? "Submitting..." : "Create Payment Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePaymentOrderPage;