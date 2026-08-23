import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Trash2, FileText, ChevronDown, ChevronUp, Building2, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { format, formatDistanceToNow } from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";
import { getCookie } from "@/utility/getCookie";

const TenderDetailPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const { refNum } = useParams();
  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [attachmentsOpen, setAttachmentsOpen] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
        maxRedirects: 0,
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
      setShowDeleteModal(false);
      return;
    }
    setModalLoading(true);
    const csrfToken = getCookie("csrftoken");
    try {
      await authAxios.delete(`/tenders/${refNum}/`, {
        headers: {
          "X-CSRFToken": csrfToken,
        },
      });
      toast.success("Tender deleted successfully!");
      navigate("/dashboard/tenders");
    } catch (error) {
      toast.error("Failed to delete tender.");
      console.error("TenderDetailPage: Delete tender error:", error.response?.data || error);
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
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <p className="text-xl font-semibold text-gray-900 mb-4">Access Denied</p>
          <p className="text-gray-600 mb-6">Only lead buyers and sales managers can view tender details.</p>
          <button
            onClick={() => navigate("/dashboard/tenders")}
            className="flex items-center justify-center w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200 shadow-xs"
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
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
        <p className="mt-4 text-lg text-gray-700 font-medium">Loading Tender Details...</p>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <p className="text-xl font-semibold text-gray-900 mb-4">Tender Not Found</p>
          <button
            onClick={() => navigate("/dashboard/tenders")}
            className="flex items-center justify-center w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200 shadow-xs"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Tenders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {tender.issuing_company_display_logo ? (
              <img
                src={tender.issuing_company_display_logo}
                alt="Issuing Company Logo"
                className="h-16 w-16 object-contain rounded-md border border-gray-200"
              />
            ) : (
              <Building2 className="h-16 w-16 text-gray-400" />
            )}
            <h1 className="text-3xl font-semibold text-gray-900">
              Tender: {tender.title || "Untitled"} <span className="text-gray-500 text-sm">({tender.ref_num})</span>
            </h1>
          </div>
          <button
            onClick={() => navigate("/dashboard/tenders")}
            className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200 shadow-xs"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Tenders
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Tender Details Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md">
          <div className="bg-linear-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <button
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="w-full flex justify-between items-center p-4 hover:bg-gray-200 transition duration-200"
            >
              <h2 className="text-xl font-medium text-gray-900">Tender Details</h2>
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
                    <span className="text-gray-900">{tender.ref_num}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Title</span>
                    <span className="text-gray-900">{tender.title}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Issuing Company</span>
                    <span className="text-gray-900">{tender.issuing_company_info}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Status</span>
                    <span className="text-gray-900">{tender.status}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Type</span>
                    <span className="text-gray-900">{tender.type}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Procedure</span>
                    <span className="text-gray-900">{tender.procedure}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Method</span>
                    <span className="text-gray-900">{tender.method}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Priority</span>
                    <span className="text-gray-900">{tender.priority === "urgent" ? "Urgent" : "Non-Urgent"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Created At</span>
                    <div className="relative group">
                      <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                        {formatDateTime(tender.created_at).formatted}
                      </span>
                      <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                        {formatDateTime(tender.created_at).relative}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Updated At</span>
                    <div className="relative group">
                      <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                        {formatDateTime(tender.updated_at).formatted}
                      </span>
                      <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                        {formatDateTime(tender.updated_at).relative}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center">
                <span className="w-1/3 font-medium text-gray-700">Reach</span>
                <span className="text-gray-900">
                  {tender.reach
                    ? `${tender.reach.region || "N/A"}, ${tender.reach.district || "N/A"}, ${tender.reach.city || "N/A"}, ${tender.reach.town || "N/A"}`
                    : "N/A"}
                </span>
              </div>
              <div className="mt-6 flex items-center overflow-auto">
                <span className="w-1/3 font-medium text-gray-700">Note</span>
                <span className="text-gray-900">{tender.note || "N/A"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Attachments Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md">
          <div className="bg-linear-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <button
              onClick={() => setAttachmentsOpen(!attachmentsOpen)}
              className="w-full flex justify-between items-center p-4 hover:bg-gray-200 transition duration-200"
            >
              <h2 className="text-xl font-medium text-gray-900">Attachments</h2>
              <span className="flex items-center text-indigo-600 font-medium">
                {attachmentsOpen ? "Collapse" : "Expand"}
                {attachmentsOpen ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
              </span>
            </button>
          </div>
          {attachmentsOpen && (
            <div className="p-6">
              {tender.attachments?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Name</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Orientation</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">File</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tender.attachments.map((attachment, index) => (
                        <tr
                          key={attachment.id}
                          className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition duration-200`}
                        >
                          <td className="py-3 px-4 text-gray-900">{attachment.name}</td>
                          <td className="py-3 px-4 text-gray-900">{attachment.orientation}</td>
                          <td className="py-3 px-4 text-gray-900">
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
                <p className="text-gray-600 text-center font-medium">No attachments available.</p>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full border border-gray-200 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium text-gray-900">Delete Tender</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 mb-6 font-medium">
                Are you sure you want to delete the tender "{tender.title}" ({tender.ref_num})? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTender}
                  disabled={modalLoading}
                  className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex items-center shadow-md disabled:opacity-50"
                >
                  {modalLoading ? (
                    <Loader2 className="animate-spin w-5 h-5 mr-2" />
                  ) : (
                    <Trash2 className="w-5 h-5 mr-2" />
                  )}
                  {modalLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

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
          {jobTitle === "lead buyer" && (
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={modalLoading}
              className="bg-red-600 text-white py-2 px-6 rounded-md hover:bg-red-700 flex items-center shadow-md disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              {modalLoading ? "Deleting..." : "Delete Tender"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenderDetailPage;