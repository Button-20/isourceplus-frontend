import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const RFxDetailPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const { refNum } = useParams();
  const [rfx, setRfx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);

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

  if (!["lead buyer", "sales manager"].includes(jobTitle)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <p className="text-xl text-gray-900">Access denied. Only lead buyers and sales managers can view RFx details.</p>
        <button
          onClick={() => navigate("/dashboard/rfxs")}
          className="mt-6 flex items-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to RFxs
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
        <p className="mt-4 text-gray-600 text-lg">Loading RFx Details...</p>
      </div>
    );
  }

  if (!rfx) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <p className="text-xl text-gray-900">RFx not found.</p>
        <button
          onClick={() => navigate("/dashboard/rfxs")}
          className="mt-6 flex items-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to RFxs
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">RFx Details: {rfx.ref_num}</h1>
        <button
          onClick={() => navigate("/dashboard/rfxs")}
          className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to RFxs
        </button>
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <p className="text-gray-900">{rfx.title}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Spend Category</label>
            <p className="text-gray-900">{rfx.spend_category}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <p className="text-gray-900">{rfx.status}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <p className="text-gray-900">{rfx.type}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Procedure</label>
            <p className="text-gray-900">{rfx.procedure}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <p className="text-gray-900">{rfx.priority}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Note</label>
            <p className="text-gray-900">{rfx.note || "N/A"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Issuing Company</label>
            <p className="text-gray-900">{rfx.issuing_company_info}</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Items</h2>
            {rfx.items.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit of Measure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Special Handles
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rfx.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.description || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.unit_of_measure}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.special_handles.map((handle) => handle.handling_description).join(", ") || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-600">No items available.</p>
            )}
          </div>
          {jobTitle === "sales manager" && (
            <div className="flex justify-end">
              <button
                onClick={handleSendOffer}
                disabled={modalLoading}
                className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
              >
                {modalLoading ? "Processing..." : "Send Offer"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RFxDetailPage;