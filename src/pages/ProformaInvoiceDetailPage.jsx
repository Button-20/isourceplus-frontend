import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import {
  Loader2,
  FileText,
  Building2,
  CircleDot,
  Tag,
  Clock,
  Package,
  AlertCircle,
  ArrowLeft,
  Send,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";

const ProformaInvoiceDetailPage = () => {
  const { authAxios, jobTitle, BASE_URL } = useAuth();
  const { refNum } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [itemsOpen, setItemsOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await authAxios.get(`proforma-invoices/${refNum}/`);
        console.log("ProformaInvoiceDetailPage: Fetched invoice details:", response.data);
        setInvoice(response.data);
      } catch (error) {
        toast.error("Failed to load proforma invoice details.");
        console.error("Fetch proforma invoice error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [authAxios, refNum]);

  const handleSendPurchaseOrder = async () => {
    setModalLoading(true);
    try {
      console.log("ProformaInvoiceDetailPage: Sending purchase order for refNum:", refNum);
      const response = await authAxios.get(`proforma-invoices/${refNum}/send-purchase-order/`);
      console.log("ProformaInvoiceDetailPage: Send purchase order response:", response.data);
      const apiUrl = response.data.event_response_create_url;
      console.log("ProformaInvoiceDetailPage: API URL received:", apiUrl);
      if (!apiUrl || !apiUrl.startsWith("/api/v1/purchase-orders/create-business-award/")) {
        throw new Error("Invalid redirect URL received.");
      }
      const dashboardUrl = apiUrl.replace("/api/v1", "/dashboard");
      console.log("ProformaInvoiceDetailPage: Navigating to:", dashboardUrl);
      navigate(dashboardUrl, { state: { redirectUrl: apiUrl } });
    } catch (error) {
      if (error.response && error.response.status === 302) {
        const apiUrl = error.response.data.event_response_create_url;
        if (!apiUrl || !apiUrl.startsWith("/api/v1/purchase-orders/create-business-award/")) {
          throw new Error("Invalid redirect URL received.");
        }
        const dashboardUrl = apiUrl.replace("/api/v1", "/dashboard");
        console.log("ProformaInvoiceDetailPage: Navigating to:", dashboardUrl);
        navigate(dashboardUrl, { state: { redirectUrl: apiUrl } });
      } else {
        const errorMessage = error.response?.data?.detail || "Failed to initiate purchase order.";
        toast.error(errorMessage);
        console.error("Send purchase order error:", error);
      }
    } finally {
      setModalLoading(false);
    }
  };

  const toggleDetails = () => setDetailsOpen(!detailsOpen);
  const toggleItems = () => setItemsOpen(!itemsOpen);

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return {
      formatted: format(date, "dd MMM yyyy, HH:mm:ss"),
      relative: formatDistanceToNow(date, { addSuffix: true }),
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
        <p className="mt-4 text-lg text-gray-700 font-medium">Loading Proforma Invoice Details...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <AlertCircle className="h-16 w-16 text-red-500" />
        <p className="mt-4 text-xl text-gray-800 font-medium">Proforma Invoice not found.</p>
        <button
          onClick={() => navigate("/dashboard/proforma-invoices")}
          className="mt-6 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200 shadow-sm"
        >
          Back to Proforma Invoices
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {invoice.issuing_company_display_logo ? (
              <img
                src={invoice.issuing_company_display_logo}
                alt="Issuing Company Logo"
                className="h-16 w-16 object-contain rounded-md border border-gray-200"
              />
            ) : (
              <Building2 className="h-16 w-16 text-gray-400" />
            )}
            <h1 className="text-3xl font-semibold text-gray-900">
              Proforma Invoice: {invoice.ref_num}
            </h1>
          </div>
          <button
            onClick={() => navigate("/dashboard/proforma-invoices")}
            className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Proforma Invoices
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Invoice Details Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <button
              onClick={toggleDetails}
              className="w-full flex justify-between items-center p-4 hover:bg-gray-200 transition duration-200"
            >
              <h2 className="text-xl font-medium text-gray-900">Invoice Details</h2>
              <span className="text-indigo-600 font-medium">
                {detailsOpen ? "Collapse" : "Expand"}
              </span>
            </button>
          </div>
          {detailsOpen && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Reference Number</span>
                    <span className="text-gray-900">{invoice.ref_num}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Title</span>
                    <span className="text-gray-900">{invoice.title}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Description</span>
                    <span className="text-gray-900">{invoice.description || "N/A"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Issuing Company</span>
                    <span className="text-gray-900">{invoice.issuing_company_name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Status</span>
                    <span className="text-gray-900">{invoice.status === "draft" ? "Open" : "Closed"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Spend Category</span>
                    <span className="text-gray-900">{invoice.spend_category}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Priority</span>
                    <span className="text-gray-900">{invoice.priority === "urgent" ? "Urgent" : "Non-Urgent"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Entity Type</span>
                    <span className="text-gray-900">{invoice.type_of_entity || "N/A"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Start Date</span>
                    <div className="relative group">
                      <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                        {formatDateTime(invoice.start_datetime).formatted}
                      </span>
                      <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                        {formatDateTime(invoice.start_datetime).relative}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Submission Date</span>
                    <div className="relative group">
                      <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                        {formatDateTime(invoice.submission_datetime).formatted}
                      </span>
                      <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                        {formatDateTime(invoice.submission_datetime).relative}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Created At</span>
                    <div className="relative group">
                      <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                        {formatDateTime(invoice.created_at).formatted}
                      </span>
                      <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                        {formatDateTime(invoice.created_at).relative}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Updated At</span>
                    <div className="relative group">
                      <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                        {formatDateTime(invoice.updated_at).formatted}
                      </span>
                      <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                        {formatDateTime(invoice.updated_at).relative}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Is Active</span>
                    <span className="text-gray-900">{invoice.is_active ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Is Approved</span>
                    <span className="text-gray-900">{invoice.is_approved ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Total Cost</span>
                    <span className="text-gray-900">{invoice.total_cost}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Waybill Reference</span>
                    <span className="text-gray-900">{invoice.external_event_ref_num}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Items Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <button
              onClick={toggleItems}
              className="w-full flex justify-between items-center p-4 hover:bg-gray-200 transition duration-200"
            >
              <h2 className="text-xl font-medium text-gray-900">Items</h2>
              <span className="text-indigo-600 font-medium">
                {itemsOpen ? "Collapse" : "Expand"}
              </span>
            </button>
          </div>
          {itemsOpen && (
            <div className="p-6">
              {invoice.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Name</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Description</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Quantity</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Unit of Measure</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Special Handling</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, index) => (
                        <tr
                          key={item.id}
                          className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition duration-200`}
                        >
                          <td className="py-3 px-4 text-gray-900">{item.name}</td>
                          <td className="py-3 px-4 text-gray-900">{item.description || "N/A"}</td>
                          <td className="py-3 px-4 text-gray-900">{item.quantity}</td>
                          <td className="py-3 px-4 text-gray-900">{item.unit_of_measure}</td>
                          <td className="py-3 px-4 text-gray-900">
                            {item.special_handles.length > 0 ? (
                              <div className="flex flex-col gap-2">
                                {item.special_handles.map((sh, shIndex) => (
                                  <div key={sh.id} className="relative group">
                                    <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                                      Handling Description: {sh.handling_description}
                                    </span>
                                    <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                                      Created: {formatDateTime(sh.created_at).relative}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600 text-center font-medium">No items available.</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {(jobTitle === "lead buyer" || jobTitle === "sales manager") && invoice.status === "draft" && (
          <div className="p-6 flex justify-end">
            <button
              onClick={handleSendPurchaseOrder}
              disabled={modalLoading}
              className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 transition duration-200 shadow-md disabled:opacity-50"
            >
              <Send className="w-5 h-5 mr-2 inline" />
              {modalLoading ? "Processing..." : "Send Purchase Order"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProformaInvoiceDetailPage;