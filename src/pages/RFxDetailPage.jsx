import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ChevronDown, ChevronUp, Building2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { format, formatDistanceToNow } from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";

const RFxDetailPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const { refNum } = useParams();
  const [rfx, setRfx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [itemsOpen, setItemsOpen] = useState(true);

  useEffect(() => {
    const fetchRfxDetails = async () => {
      setLoading(true);
      try {
        const response = await authAxios.get(`/rfxs/${refNum}/`);
        setRfx(response.data);
      } catch (error) {
        toast.error("Failed to load RFx details.");
        console.error("Fetch RFx details error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRfxDetails();
  }, [authAxios, refNum]);

  const handleSendOffer = async () => {
    if (jobTitle !== "sales manager") {
      toast.error("Only sales managers can send offers.");
      return;
    }
    setModalLoading(true);
    try {
      const response = await authAxios.get(`/rfxs/${refNum}/send-offer/`);
      const url = response.data.event_response_create_url;
      if (!url || !url.startsWith("/api/v1/proforma-invoices/create-offer/")) {
        throw new Error("Invalid redirect URL received.");
      }
      const dashboardUrl = url.replace("/api/v1/proforma-invoices/create-offer", "/dashboard/proforma-invoices/create-offer-rfx");
      console.log("Navigating to:", dashboardUrl);
      navigate(dashboardUrl);
    } catch (error) {
      if (error.response && error.response.status === 302) {
        const url = error.response.data.event_response_create_url;
        if (!url || !url.startsWith("/api/v1/proforma-invoices/create-offer/")) {
          throw new Error("Invalid redirect URL received.");
        }
        const dashboardUrl = url.replace("/api/v1/proforma-invoices/create-offer", "/dashboard/proforma-invoices/create-offer-rfx");
        console.log("Navigating to:", dashboardUrl);
        navigate(dashboardUrl);
      } else {
        const errorMessage = error.response?.data?.detail || "Failed to initiate offer.";
        toast.error(errorMessage);
        console.error("Send offer error:", error);
      }
    } finally {
      setModalLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return {
      formatted: format(date, "dd MMM yyyy, HH:mm:ss"),
      relative: formatDistanceToNow(date, { addSuffix: true }),
    };
  };

  if (!["lead buyer", "sales manager"].includes(jobTitle)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <p className="text-xl text-gray-800 font-medium">Access denied. Only lead buyers and sales managers can view RFx details.</p>
        <button
          onClick={() => navigate("/dashboard/rfxs/issued/")}
          className="mt-6 flex items-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to RFxs
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
        <p className="mt-4 text-lg text-gray-700 font-medium">Loading RFx Details...</p>
      </div>
    );
  }

  if (!rfx) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <p className="text-xl text-gray-800 font-medium">RFx not found.</p>
        <button
          onClick={() => navigate("/dashboard/rfxs/issued/")}
          className="mt-6 flex items-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to RFxs
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {rfx.issuing_company_display_logo ? (
              <img
                src={rfx.issuing_company_display_logo}
                alt="Issuing Company Logo"
                className="h-16 w-16 object-contain rounded-md border border-gray-200"
              />
            ) : (
              <Building2 className="h-16 w-16 text-gray-400" />
            )}
            <h1 className="text-3xl font-semibold text-gray-900">
              RFx: {rfx.title || "Untitled"} <span className="text-gray-500 text-sm">({rfx.ref_num})</span>
            </h1>
          </div>
          <button
            onClick={() => navigate("/dashboard/rfxs")}
            className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to RFxs
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* RFx Details Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <button
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="w-full flex justify-between items-center p-4 hover:bg-gray-200 transition duration-200"
            >
              <h2 className="text-xl font-medium text-gray-900">RFx Details</h2>
              <span className="flex items-center text-indigo-600 font-medium">
                {detailsOpen ? "Collapse" : "Expand"}
                {detailsOpen ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
              </span>
            </button>
          </div>
          {detailsOpen && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Reference Number</span>
                    <span className="text-gray-900">{rfx.ref_num}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Title</span>
                    <span className="text-gray-900">{rfx.title}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Issuing Company</span>
                    <span className="text-gray-900">{rfx.issuing_company_info}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Status</span>
                    <span className="text-gray-900">{rfx.status}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Type</span>
                    <span className="text-gray-900">{rfx.type}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Procedure</span>
                    <span className="text-gray-900">{rfx.procedure}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Priority</span>
                    <span className="text-gray-900">{rfx.priority === "urgent" ? "Urgent" : "Non-Urgent"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Created At</span>
                    <div className="relative group">
                      <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                        {formatDateTime(rfx.created_at).formatted}
                      </span>
                      <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                        {formatDateTime(rfx.created_at).relative}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Updated At</span>
                    <div className="relative group">
                      <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                        {formatDateTime(rfx.updated_at).formatted}
                      </span>
                      <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                        {formatDateTime(rfx.updated_at).relative}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center overflow-auto">
                    <span className="w-1/3 font-medium text-gray-700">Note</span>
                    <span className="text-gray-900">{rfx.note || "N/A"}</span>
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
              onClick={() => setItemsOpen(!itemsOpen)}
              className="w-full flex justify-between items-center p-4 hover:bg-gray-200 transition duration-200"
            >
              <h2 className="text-xl font-medium text-gray-900">Items</h2>
              <span className="flex items-center text-indigo-600 font-medium">
                {itemsOpen ? "Collapse" : "Expand"}
                {itemsOpen ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
              </span>
            </button>
          </div>
          {itemsOpen && (
            <div className="p-6">
              {rfx.items.length > 0 ? (
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
                      {rfx.items.map((item, index) => (
                        <tr
                          key={item.id}
                          className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition duration-200`}
                        >
                          <td className="py-3 px-4 text-gray-900">{item.name || "N/A"}</td>
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
        <div className="p-6 flex justify-end space-x-4">
          {jobTitle === "sales manager" && (
            <button
              onClick={handleSendOffer}
              disabled={modalLoading}
              className="bg-black text-white py-2 px-6 rounded-md hover:bg-gray-700 transition duration-200 shadow-md disabled:opacity-50"
            >
              {modalLoading ? "Processing..." : "Send Offer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RFxDetailPage;