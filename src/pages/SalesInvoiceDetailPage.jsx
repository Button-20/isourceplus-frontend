import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Trash2, FileText } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const SalesInvoiceDetailPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const { refNum } = useParams();
  const navigate = useNavigate();
  const [salesInvoice, setSalesInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({ title: "", notes: "", priority: "normal" });

  useEffect(() => {
    const fetchSalesInvoice = async () => {
      try {
        const response = await authAxios.get(`sales-invoices/${refNum}/`);
        console.log("SalesInvoiceDetailPage: Sales invoice fetched:", response.data);
        setSalesInvoice(response.data);
        setFormData({
          title: response.data.title,
          notes: response.data.notes || "",
          priority: response.data.priority,
        });
      } catch (error) {
        toast.error("Failed to load sales invoice details.");
        console.error("SalesInvoiceDetailPage: Fetch error:", error.response?.data || error);
      } finally {
        setLoading(false);
      }
    };
    fetchSalesInvoice();
  }, [authAxios, refNum]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (jobTitle !== "sales manager") {
      toast.error("Only sales managers can update sales invoices.");
      return;
    }
    setModalLoading(true);
    try {
      const csrfToken = document.cookie.split("; ").find(row => row.startsWith("csrftoken="))?.split("=")[1];
      const response = await authAxios.patch(`sales-invoices/${refNum}/`, {
        title: formData.title,
        notes: formData.notes,
        priority: formData.priority,
      }, { headers: { "X-CSRFToken": csrfToken } });
      console.log("SalesInvoiceDetailPage: Sales invoice updated:", response.data);
      setSalesInvoice(response.data);
      toast.success("Sales invoice updated successfully!");
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Failed to update sales invoice.";
      toast.error(errorMessage);
      console.error("SalesInvoiceDetailPage: Update error:", error.response?.data || error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (jobTitle !== "sales manager") {
      toast.error("Only sales managers can delete sales invoices.");
      return;
    }
    setModalLoading(true);
    try {
      const csrfToken = document.cookie.split("; ").find(row => row.startsWith("csrftoken="))?.split("=")[1];
      await authAxios.delete(`sales-invoices/${refNum}/`, { headers: { "X-CSRFToken": csrfToken } });
      toast.success("Sales invoice deleted successfully!");
      navigate("/dashboard/sales-invoices");
    } catch (error) {
      toast.error("Failed to delete sales invoice.");
      console.error("SalesInvoiceDetailPage: Delete error:", error.response?.data || error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleSendPaymentOrder = async () => {
    if (!["sales manager", "logistics manager"].includes(jobTitle)) {
      toast.error("Only sales or logistics managers can send payment orders.");
      return;
    }
    setModalLoading(true);
    try {
      const response = await authAxios.get(`sales-invoices/${refNum}/send-payment-order/`, {
        maxRedirects: 0,
      });
      console.log("SalesInvoiceDetailPage: Send payment order response:", response.data);
      const url = response.data.event_response_create_url;
      if (!url || !url.startsWith("/api/v1/payment-orders/create-payment-order/")) {
        throw new Error("Invalid redirect URL received.");
      }
      const dashboardUrl = url.replace("/api/v1/payment-orders/create-payment-order", "/dashboard/payment-orders/create-payment-order");
      console.log("SalesInvoiceDetailPage: Navigating to:", dashboardUrl);
      navigate(dashboardUrl);
    } catch (error) {
      if (error.response && error.response.status === 302) {
        const url = error.response.data.event_response_create_url;
        console.log("SalesInvoiceDetailPage: Caught 302 redirect with URL:", url);
        if (!url || !url.startsWith("/api/v1/payment-orders/create-payment-order/")) {
          throw new Error("Invalid redirect URL received.");
        }
        const dashboardUrl = url.replace("/api/v1/payment-orders/create-payment-order", "/dashboard/payment-orders/create-payment-order");
        console.log("SalesInvoiceDetailPage: Navigating to:", dashboardUrl);
        navigate(dashboardUrl);
      } else {
        const errorMessage = error.response?.data?.detail || "Failed to initiate payment order.";
        toast.error(errorMessage);
        console.error("SalesInvoiceDetailPage: Send payment order error:", error.response?.data || error);
      }
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600 text-lg">Loading Sales Invoice Details...</p>
        </div>
      </div>
    );
  }

  if (!salesInvoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <p className="text-xl font-semibold text-gray-900 mb-4">Sales Invoice Not Found</p>
          <button
            onClick={() => navigate("/dashboard/sales-invoices")}
            className="flex items-center justify-center w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Sales Invoices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sales Invoice: {salesInvoice.ref_num}</h1>
          <button
            onClick={() => navigate("/dashboard/sales-invoices")}
            className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Sales Invoices
          </button>
        </div>
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  rows="4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Spend Category</label>
                <p className="text-lg text-gray-900">{salesInvoice.spend_category}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <p className="text-lg text-gray-900">{salesInvoice.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Total Cost</label>
                <p className="text-lg text-gray-900">{salesInvoice.total_cost}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Purchase Order Reference</label>
                <p className="text-lg text-gray-900">{salesInvoice.po_ref_num}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Issuing Company</label>
                <p className="text-lg text-gray-900">{salesInvoice.issuing_company_name}</p>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h2>
            {salesInvoice.attachments?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orientation</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesInvoice.attachments.map((attachment) => (
                      <tr key={attachment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{attachment.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{attachment.orientation}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a
                            href={attachment.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-indigo-600 hover:text-indigo-800"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No attachments available.</p>
            )}
          </div>
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
            {salesInvoice.items?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesInvoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity} {item.unit_of_measure}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No items available.</p>
            )}
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            {jobTitle === "sales manager" && (
              <>
                <button
                  onClick={handleUpdate}
                  disabled={modalLoading}
                  className="bg-indigo-600 text-white py-2 px-6 rounded-lg hover:bg-indigo-700 transition duration-200 disabled:bg-indigo-400"
                >
                  {modalLoading ? "Updating..." : "Update Sales Invoice"}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={modalLoading}
                  className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 transition duration-200 disabled:bg-red-400 flex items-center"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  {modalLoading ? "Deleting..." : "Delete Sales Invoice"}
                </button>
              </>
            )}
            {["sales manager", "logistics manager"].includes(jobTitle) && (
              <button
                onClick={handleSendPaymentOrder}
                disabled={modalLoading}
                className="bg-indigo-600 text-white py-2 px-6 rounded-lg hover:bg-indigo-700 transition duration-200 disabled:bg-indigo-400"
              >
                {modalLoading ? "Processing..." : "Send Payment Order"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesInvoiceDetailPage;