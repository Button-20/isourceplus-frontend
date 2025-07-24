import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Trash2, FileText } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const TenderDetailPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const { refNum } = useParams();
  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchTenderDetails = async () => {
      setLoading(true);
      try {
        const response = await authAxios.get(`/tenders/${refNum}/`);
        console.log("TenderDetailPage: Tender details fetched successfully:", response.data);
        setTender(response.data);
      } catch (error) {
        toast.error("Failed to load tender details.");
        console.error("TenderDetailPage: Fetch tender details error:", error.response?.data || error);
      } finally {
        setLoading(false);
      }
    };
    fetchTenderDetails();
  }, [authAxios, refNum]);

  const handleSendOffer = async () => {
    if (jobTitle !== "sales manager") {
      toast.error("Only sales managers can send offers.");
      return;
    }
    setModalLoading(true);
    try {
      const response = await authAxios.get(`/tenders/${refNum}/send-offer/`, {
        maxRedirects: 0, // Prevent Axios from following redirects
      });
      console.log("TenderDetailPage: Send offer response:", response.data);
      const url = response.data.event_response_create_url;
      if (!url || !url.startsWith("/api/v1/proforma-invoices/create-offer/")) {
        throw new Error("Invalid redirect URL received.");
      }
      const dashboardUrl = url.replace("/api/v1/proforma-invoices/create-offer", "/dashboard/proforma-invoices/create-offer-tender");
      console.log("TenderDetailPage: Navigating to:", dashboardUrl);
      navigate(dashboardUrl);
    } catch (error) {
      if (error.response && error.response.status === 302) {
        const url = error.response.data.event_response_create_url;
        console.log("TenderDetailPage: Caught 302 redirect with URL:", url);
        if (!url || !url.startsWith("/api/v1/proforma-invoices/create-offer/")) {
          throw new Error("Invalid redirect URL received.");
        }
        const dashboardUrl = url.replace("/api/v1/proforma-invoices/create-offer", "/dashboard/proforma-invoices/create-offer-tender");
        console.log("TenderDetailPage: Navigating to:", dashboardUrl);
        navigate(dashboardUrl);
      } else {
        const errorMessage = error.response?.data?.detail || "Failed to initiate offer.";
        toast.error(errorMessage);
        console.error("TenderDetailPage: Send offer error:", error.response?.data || error);
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteTender = async () => {
    if (jobTitle !== "lead buyer") {
      toast.error("Only lead buyers can delete tenders.");
      return;
    }
    setModalLoading(true);
    try {
      await authAxios.delete(`/tenders/${refNum}/`);
      toast.success("Tender deleted successfully!");
      navigate("/dashboard/tenders");
    } catch (error) {
      toast.error("Failed to delete tender.");
      console.error("TenderDetailPage: Delete tender error:", error.response?.data || error);
    } finally {
      setModalLoading(false);
    }
  };

  if (!["lead buyer", "sales manager"].includes(jobTitle)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <p className="text-xl font-semibold text-gray-900 mb-4">Access Denied</p>
          <p className="text-gray-600 mb-6">Only lead buyers and sales managers can view tender details.</p>
          <button
            onClick={() => navigate("/dashboard/tenders")}
            className="flex items-center justify-center w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Tenders
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600 text-lg">Loading Tender Details...</p>
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <p className="text-xl font-semibold text-gray-900 mb-4">Tender Not Found</p>
          <button
            onClick={() => navigate("/dashboard/tenders")}
            className="flex items-center justify-center w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Tenders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tender Details: {tender.ref_num}</h1>
          <button
            onClick={() => navigate("/dashboard/tenders")}
            className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Tenders
          </button>
        </div>
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Title</label>
                <p className="text-lg text-gray-900">{tender.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Spend Category</label>
                <p className="text-lg text-gray-900">{tender.spend_category}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <p className="text-lg text-gray-900">{tender.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Type</label>
                <p className="text-lg text-gray-900">{tender.type}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Procedure</label>
                <p className="text-lg text-gray-900">{tender.procedure}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Method</label>
                <p className="text-lg text-gray-900">{tender.method}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Priority</label>
                <p className="text-lg text-gray-900">{tender.priority}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Issuing Company</label>
                <p className="text-lg text-gray-900">{tender.issuing_company_info}</p>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-500">Note</label>
            <p className="text-lg text-gray-900">{tender.note || "N/A"}</p>
          </div>
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-500">Reach</label>
            <p className="text-lg text-gray-900">
              {tender.reach
                ? `${tender.reach.region || "N/A"}, ${tender.reach.district || "N/A"}, ${tender.reach.city || "N/A"}, ${tender.reach.town || "N/A"}`
                : "N/A"}
            </p>
          </div>
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h2>
            {tender.attachments?.length > 0 ? (
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
                    {tender.attachments.map((attachment) => (
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
          <div className="mt-8 flex justify-end space-x-4">
            {jobTitle === "sales manager" && (
              <button
                onClick={handleSendOffer}
                disabled={modalLoading}
                className="bg-indigo-600 text-white py-2 px-6 rounded-lg hover:bg-indigo-700 transition duration-200 disabled:bg-indigo-400"
              >
                {modalLoading ? "Processing..." : "Send Offer"}
              </button>
            )}
            {jobTitle === "lead buyer" && (
              <button
                onClick={handleDeleteTender}
                disabled={modalLoading}
                className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 transition duration-200 disabled:bg-red-400 flex items-center"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                {modalLoading ? "Deleting..." : "Delete Tender"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenderDetailPage;