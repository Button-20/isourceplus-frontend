import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ChevronDown, ChevronUp, X, Building2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";

const WaybillDetailPage = () => {
  const { authAxios, jobTitle, BASE_URL } = useAuth();
  const { refNum } = useParams();
  const [waybill, setWaybill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [itemsOpen, setItemsOpen] = useState(true);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWaybill = async () => {
      try {
        const response = await authAxios.get(`waybills/${refNum}/`);
        setWaybill(response.data);
        console.log("Fetched waybill:", response.data);
      } catch (error) {
        toast.error("Failed to load waybill details.");
        console.error("Fetch waybill error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWaybill();
  }, [authAxios, refNum]);

  const handleSendOffer = async () => {
    setModalLoading(true);
    try {
      const response = await authAxios.get(`waybills/${refNum}/send-offer/`);
      const url = response.data.event_response_create_url;
      if (!url || !url.startsWith("/api/v1/proforma-invoices/create-offer/")) {
        throw new Error("Invalid redirect URL received.");
      }
      setRedirectUrl(url);
      setShowRedirectModal(true);
    } catch (error) {
      if (error.response && error.response.status === 302) {
        const url = error.response.data.event_response_create_url;
        if (!url || !url.startsWith("/api/v1/proforma-invoices/create-offer/")) {
          throw new Error("Invalid redirect URL received.");
        }
        setRedirectUrl(url);
        setShowRedirectModal(true);
      } else {
        const errorMessage = error.response?.data?.detail || "Failed to initiate offer.";
        toast.error(errorMessage);
        console.error("Send offer error:", error);
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
        <p className="mt-4 text-lg text-gray-700 font-medium">Loading Waybill Details...</p>
      </div>
    );
  }

  if (!waybill) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <p className="mt-4 text-xl text-gray-800 font-medium">Waybill not found.</p>
        <button
          onClick={() => navigate("/dashboard/waybills")}
          className="mt-6 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200 shadow-sm"
        >
          Back to Waybills
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {waybill.issuing_company_display_logo ? (
              <img
                src={waybill.issuing_company_display_logo}
                alt="Issuing Company Logo"
                className="h-16 w-16 object-contain rounded-md border border-gray-200"
              />
            ) : (
              <Building2 className="h-16 w-16 text-gray-400" />
            )}
            <h1 className="text-3xl font-semibold text-gray-900">
              Waybill: {waybill.ref_num}
            </h1>
          </div>
          <button
            onClick={() => navigate("/dashboard/waybills")}
            className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Waybills
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Waybill Details Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <button
              onClick={toggleDetails}
              className="w-full flex justify-between items-center p-4 hover:bg-gray-200 transition duration-200"
            >
              <h2 className="text-xl font-medium text-gray-900">Waybill Details</h2>
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
                    <span className="text-gray-900">{waybill.ref_num}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Title</span>
                    <span className="text-gray-900">{waybill.title}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Issuing Company</span>
                    <span className="text-gray-900">{waybill.issuing_company_info}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Status</span>
                    <span className="text-gray-900">{waybill.status === "draft" ? "Open" : "Closed"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Procedure</span>
                    <span className="text-gray-900">{waybill.procedure}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Spend Category</span>
                    <span className="text-gray-900">{waybill.spend_category}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Priority</span>
                    <span className="text-gray-900">{waybill.priority === "urgent" ? "Urgent" : "Non-Urgent"}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Start Date</span>
                    <div className="relative group">
                      <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                        {formatDateTime(waybill.start_datetime).formatted}
                      </span>
                      <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                        {formatDateTime(waybill.start_datetime).relative}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Submission Date</span>
                    <div className="relative group">
                      <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                        {formatDateTime(waybill.submission_datetime).formatted}
                      </span>
                      <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                        {formatDateTime(waybill.submission_datetime).relative}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Departure Date</span>
                    <div className="relative group">
                      <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                        {formatDateTime(waybill.departure_datetime).formatted}
                      </span>
                      <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                        {formatDateTime(waybill.departure_datetime).relative}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Delivery Date</span>
                    <div className="relative group">
                      <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                        {formatDateTime(waybill.delivery_datetime).formatted}
                      </span>
                      <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                        {formatDateTime(waybill.delivery_datetime).relative}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Is Active</span>
                    <span className="text-gray-900">{waybill.is_active ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Is Approved</span>
                    <span className="text-gray-900">{waybill.is_approved ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Created At</span>
                    <div className="relative group">
                      <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                        {formatDateTime(waybill.created_at).formatted}
                      </span>
                      <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                        {formatDateTime(waybill.created_at).relative}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Updated At</span>
                    <div className="relative group">
                      <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                        {formatDateTime(waybill.updated_at).formatted}
                      </span>
                      <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                        {formatDateTime(waybill.updated_at).relative}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Region</span>
                    <span className="text-gray-900">{waybill.reach?.region || "N/A"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">District</span>
                    <span className="text-gray-900">{waybill.reach?.district || "N/A"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">City</span>
                    <span className="text-gray-900">{waybill.reach?.city || "N/A"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Town</span>
                    <span className="text-gray-900">{waybill.reach?.town || "N/A"}</span>
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
              {waybill.items.length > 0 ? (
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
                      {waybill.items.map((item, index) => (
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
        {jobTitle === "logistics manager" && (
          <div className="p-6 flex justify-end">
            <button
              onClick={handleSendOffer}
              disabled={modalLoading}
              className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 transition duration-200 shadow-md disabled:opacity-50"
            >
              {modalLoading ? "Processing..." : "Send Offer"}
            </button>
          </div>
        )}

        {/* Redirect Modal */}
        {showRedirectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 transition-opacity duration-200">
            <div className="bg-white rounded-lg p-6 max-w-md w-full border border-gray-200 shadow-lg transform transition-transform duration-200 scale-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium text-gray-900">Send Offer</h2>
                <button
                  onClick={() => setShowRedirectModal(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 mb-6 font-medium">
                Proceed to the document creation page for the proforma invoice.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={handleRedirect}
                  disabled={!redirectUrl}
                  className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200 shadow-sm disabled:opacity-50"
                >
                  Redirect to Document Creation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaybillDetailPage;