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
  ChevronDown,
  ChevronUp,
  Send,
  X,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

const ProformaInvoiceDetailPage = () => {
  const { authAxios, jobTitle, BASE_URL } = useAuth();
  const { refNum } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [itemsOpen, setItemsOpen] = useState(true);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await authAxios.get(`proforma-invoices/${refNum}/`);
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
      const response = await authAxios.get(`proforma-invoices/${refNum}/send-purchase-order/`);
      const url = response.data.event_response_create_url;
      if (!url || !url.startsWith("/api/v1/purchase-orders/create-business-award/")) {
        throw new Error("Invalid redirect URL received.");
      }
      setRedirectUrl(url);
      setShowRedirectModal(true);
    } catch (error) {
      if (error.response && error.response.status === 302) {
        const url = error.response.data.event_response_create_url;
        if (!url || !url.startsWith("/api/v1/purchase-orders/create-business-award/")) {
          throw new Error("Invalid redirect URL received.");
        }
        setRedirectUrl(url);
        setShowRedirectModal(true);
      } else {
        const errorMessage = error.response?.data?.detail || "Failed to initiate purchase order.";
        toast.error(errorMessage);
        console.error("Send purchase order error:", error);
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleRedirect = () => {
    const dashboardUrl = redirectUrl.replace("/api/v1", "/dashboard");
    console.log("Navigating to:", dashboardUrl, "with redirectUrl:", redirectUrl);
    navigate(dashboardUrl, { state: { redirectUrl } });
    setShowRedirectModal(false);
  };

  const toggleDetails = () => setDetailsOpen(!detailsOpen);
  const toggleItems = () => setItemsOpen(!itemsOpen);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
        <p className="mt-4 text-gray-600 text-lg">Loading Proforma Invoice Details...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <AlertCircle className="h-16 w-16 text-red-500" />
        <p className="mt-4 text-xl text-gray-900">Proforma Invoice not found.</p>
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
          <FileText className="w-8 h-8 mr-2 text-indigo-600" />
          Proforma Invoice: {invoice.ref_num}
        </h1>
        <button
          onClick={() => navigate("/dashboard/proforma-invoices")}
          className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Proforma Invoices
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Invoice Details Section */}
        <div className="border-b border-gray-200">
          <button
            onClick={toggleDetails}
            className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition duration-200"
          >
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-indigo-600" />
              Invoice Details
            </h2>
            {detailsOpen ? (
              <ChevronUp className="w-6 h-6 text-gray-600" />
            ) : (
              <ChevronDown className="w-6 h-6 text-gray-600" />
            )}
          </button>
          {detailsOpen && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <p className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-gray-500" />
                  <span className="font-medium text-gray-700">Title:</span>
                  <span className="ml-2 text-gray-900">{invoice.title}</span>
                </p>
                <p className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-gray-500" />
                  <span className="font-medium text-gray-700">Issuing Company:</span>
                  <span className="ml-2 text-gray-900">{invoice.issuing_company_name}</span>
                </p>
                <p className="flex items-center">
                  <CircleDot className="w-5 h-5 mr-2 text-gray-500" />
                  <span className="font-medium text-gray-700">Status:</span>
                  <span
                    className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invoice.status === "draft"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {invoice.status === "draft" ? "Open" : "Closed"}
                  </span>
                </p>
                <p className="flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-gray-500" />
                  <span className="font-medium text-gray-700">Spend Category:</span>
                  <span className="ml-2 text-gray-900">{invoice.spend_category}</span>
                </p>
              </div>
              <div className="space-y-4">
                <p className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-gray-500" />
                  <span className="font-medium text-gray-700">Priority:</span>
                  <span
                    className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invoice.priority === "urgent"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {invoice.priority === "urgent" ? "Urgent" : "Non-Urgent"}
                  </span>
                </p>
                <p className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-gray-500" />
                  <span className="font-medium text-gray-700">Start Date:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(invoice.start_datetime).toLocaleString()}
                  </span>
                </p>
                <p className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-gray-500" />
                  <span className="font-medium text-gray-700">Submission Date:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(invoice.submission_datetime).toLocaleString()}
                  </span>
                </p>
                <p className="flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-gray-500" />
                  <span className="font-medium text-gray-700">Total Cost:</span>
                  <span className="ml-2 text-gray-900">{invoice.total_cost}</span>
                </p>
                <p className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-gray-500" />
                  <span className="font-medium text-gray-700">Waybill Reference:</span>
                  <span className="ml-2 text-gray-900">{invoice.external_event_ref_num}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Items Section */}
        <div className="border-b border-gray-200">
          <button
            onClick={toggleItems}
            className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition duration-200"
          >
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Package className="w-6 h-6 mr-2 text-indigo-600" />
              Items
            </h2>
            {itemsOpen ? (
              <ChevronUp className="w-6 h-6 text-gray-600" />
            ) : (
              <ChevronDown className="w-6 h-6 text-gray-600" />
            )}
          </button>
          {itemsOpen && (
            <div className="p-6">
              {invoice.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {invoice.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition duration-200"
                    >
                      <p className="flex items-center mb-2">
                        <Package className="w-5 h-5 mr-2 text-gray-500" />
                        <span className="font-medium text-gray-700">Name:</span>
                        <span className="ml-2 text-gray-900">{item.name}</span>
                      </p>
                      <p className="flex items-center mb-2">
                        <FileText className="w-5 h-5 mr-2 text-gray-500" />
                        <span className="font-medium text-gray-700">Description:</span>
                        <span className="ml-2 text-gray-900">{item.description}</span>
                      </p>
                      <p className="flex items-center mb-2">
                        <Package className="w-5 h-5 mr-2 text-gray-500" />
                        <span className="font-medium text-gray-700">Quantity:</span>
                        <span className="ml-2 text-gray-900">
                          {item.quantity} {item.unit_of_measure}
                        </span>
                      </p>
                      {item.special_handles.length > 0 && (
                        <p className="flex items-center">
                          <AlertCircle className="w-5 h-5 mr-2 text-gray-500" />
                          <span className="font-medium text-gray-700">Special Handling:</span>
                          <span className="ml-2 text-gray-900">
                            {item.special_handles[0].handling_description}
                          </span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center">No items available.</p>
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
              className="flex items-center bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 transition duration-200 shadow-md disabled:opacity-50"
            >
              <Send className="w-5 h-5 mr-2" />
              {modalLoading ? "Processing..." : "Send Purchase Order"}
            </button>
          </div>
        )}

        {showRedirectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Send className="w-6 h-6 mr-2 text-indigo-600" />
                  Send Purchase Order
                </h2>
                <button
                  onClick={() => setShowRedirectModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Click below to proceed to the document creation page for the purchase order.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={handleRedirect}
                  disabled={!redirectUrl}
                  className="flex items-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200 shadow-md disabled:opacity-50"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Redirect to Document Creation Page
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProformaInvoiceDetailPage;