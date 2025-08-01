import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, FileText, Trash2, ArrowLeft, ChevronDown, ChevronUp, AlertCircle, X } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";
import { getCookie } from "@/utility/getCookie";

const ProformaInvoiceIssuedDetailPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const { refNum } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [itemsOpen, setItemsOpen] = useState(true);

  useEffect(() => {
    if (jobTitle !== "logistics manager") {
      return;
    }
    const fetchInvoiceDetails = async () => {
      try {
        const response = await authAxios.get(`proforma-invoices/${refNum}/`);
        console.log("ProformaInvoiceIssuedDetailPage: Fetched invoice details:", response.data);
        setInvoice(response.data);
      } catch (error) {
        toast.error("Failed to load proforma invoice details.");
        console.error("Fetch invoice details error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoiceDetails();
  }, [authAxios, refNum, jobTitle]);

  const handleDelete = async () => {
    if (jobTitle !== "logistics manager") {
      toast.error("Only logistics managers can delete proforma invoices.");
      setShowDeleteModal(false);
      return;
    }
    setDeleting(true);
    const csrfToken = getCookie("csrftoken");
    try {
      await authAxios.delete(`proforma-invoices/${refNum}/`, {
        headers: {
          "X-CSRFToken": csrfToken,
        },
      });
      toast.success("Proforma invoice deleted successfully.");
      navigate("/dashboard/proforma-invoices/issued");
    } catch (error) {
      toast.error("Failed to delete proforma invoice.");
      console.error("Delete invoice error:", error);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
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

  if (jobTitle !== "logistics manager") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <p className="text-xl font-semibold text-gray-900 mb-4">Access Denied</p>
          <p className="text-gray-600 mb-6">Only logistics managers can view issued proforma invoice details.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center justify-center w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
        <p className="mt-4 text-lg text-gray-700 font-medium">Loading Invoice Details...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <p className="mt-4 text-xl font-semibold text-gray-900">Proforma Invoice not found.</p>
          <button
            onClick={() => navigate("/dashboard/proforma-invoices/issued")}
            className="mt-6 flex items-center justify-center w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Issued Proforma Invoices
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
            <FileText className="h-16 w-16 text-indigo-600" />
            <h1 className="text-3xl font-semibold text-gray-900">
              Proforma Invoice: {invoice.title || "Untitled"} <span className="text-gray-500 text-sm">({invoice.ref_num})</span>
            </h1>
          </div>
          <button
            onClick={() => navigate("/dashboard/proforma-invoices/issued")}
            className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Issued Proforma Invoices
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Invoice Details Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <button
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="w-full flex justify-between items-center p-4 hover:bg-gray-200 transition duration-200"
            >
              <h2 className="text-xl font-medium text-gray-900">Invoice Details</h2>
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
                    <span className="text-gray-900">{invoice.ref_num}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Title</span>
                    <span className="text-gray-900">{invoice.title || "N/A"}</span>
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
                    <span className="text-gray-900">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.status === "draft"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {invoice.status === "draft" ? "Open" : "Closed"}
                      </span>
                    </span>
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
                    <span className="w-1/3 font-medium text-gray-700">Total Cost</span>
                    <span className="text-gray-900">{invoice.total_cost}</span>
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
                  {invoice.created_at && (
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
                  )}
                  {invoice.updated_at && (
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
                  )}
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
              {invoice.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Name</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Description</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Quantity</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Unit of Measure</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Unit Price</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Extended Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, index) => (
                        <tr
                          key={item.id}
                          className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition duration-200`}
                        >
                          <td className="py-3 px-4 text-gray-900">{item.name || "N/A"}</td>
                          <td className="py-3 px-4 text-gray-900">{item.description || "N/A"}</td>
                          <td className="py-3 px-4 text-gray-900">{item.quantity}</td>
                          <td className="py-3 px-4 text-gray-900">{item.unit_of_measure}</td>
                          <td className="py-3 px-4 text-gray-900">{item.unit_price}</td>
                          <td className="py-3 px-4 text-gray-900">{item.extended_value}</td>
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
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting}
              className="bg-red-600 text-white py-2 px-6 rounded-md hover:bg-red-700 transition duration-200 flex items-center shadow-md disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="animate-spin w-5 h-5 mr-2" />
              ) : (
                <Trash2 className="w-5 h-5 mr-2" />
              )}
              {deleting ? "Deleting..." : "Delete Invoice"}
            </button>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full border border-gray-200 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium text-gray-900">Delete Proforma Invoice</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 mb-6 font-medium">
                Are you sure you want to delete the proforma invoice "{invoice.title || "Untitled"}" ({invoice.ref_num})? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex items-center shadow-md disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="animate-spin w-5 h-5 mr-2" />
                  ) : (
                    <Trash2 className="w-5 h-5 mr-2" />
                  )}
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProformaInvoiceIssuedDetailPage;