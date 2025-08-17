import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, FileText, Plus, ArrowLeft, X, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";
import { getCookie } from "@/utility/getCookie";
import Pagination from "@/components/pagination";
import ScrollToTop from "@/components/ScrollToTop";

const IssuedProformaInvoicesPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const [proformaInvoices, setProformaInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (jobTitle !== "logistics manager") {
      return;
    }
    const fetchIssuedProformaInvoices = async () => {
      try {
        const response = await authAxios.get(`proforma-invoices/issued/?page=${page}`);
        console.log("IssuedProformaInvoicesPage: Fetched issued proforma invoices:", response.data);
        setProformaInvoices(response.data.results || response.data);
        setPagination({
          count: response.data.count || 0,
          next: response.data.next || null,
          previous: response.data.previous || null,
        });
      } catch (error) {
        setProformaInvoices([]);
        toast.error("Failed to load issued proforma invoices.");
        console.error("Fetch issued proforma invoices error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchIssuedProformaInvoices();
  }, [authAxios, jobTitle, page]);

  const handleDelete = async () => {
    if (jobTitle !== "logistics manager") {
      toast.error("Only logistics managers can delete proforma invoices.");
      setShowDeleteModal(false);
      return;
    }
    setDeleteLoading(true);
    const csrfToken = getCookie("csrftoken");
    try {
      await authAxios.delete(`proforma-invoices/${invoiceToDelete.ref_num}/`, {
        headers: {
          "X-CSRFToken": csrfToken,
        },
      });
      toast.success("Proforma Invoice deleted successfully!");
      setProformaInvoices(proformaInvoices.filter((invoice) => invoice.ref_num !== invoiceToDelete.ref_num));
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
    } catch (error) {
      toast.error("Failed to delete proforma invoice.");
      console.error("Delete proforma invoice error:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteModal = (invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
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
          <p className="text-gray-600 mb-6">Only logistics managers can view issued proforma invoices.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center justify-center w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200 shadow-sm"
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
        <Loader2 className="animate-spin h-12 w-12 text-gray-600" />
        <p className="mt-4 text-lg text-gray-700 font-medium">Loading Issued Proforma Invoices...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl"><ScrollToTop/>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 flex items-center">
          <FileText className="w-8 h-8 mr-2 text-gray-600" />
          Issued Proforma Invoices
        </h1>
        {jobTitle === "logistics manager" && (
          <button
            onClick={() => navigate("/dashboard/proforma-invoices/new")}
            className="bg-black text-white py-2 px-4 rounded-md hover:bg-gray-700 flex items-center shadow-md"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Proforma Invoice
          </button>
        )}
      </div>
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
              Are you sure you want to delete the proforma invoice "{invoiceToDelete?.title}" ({invoiceToDelete?.ref_num})? This action cannot be undone.
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
                disabled={deleteLoading}
                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex items-center shadow-md disabled:opacity-50"
              >
                {deleteLoading ? (
                  <Loader2 className="animate-spin w-5 h-5 mr-2" />
                ) : (
                  <Trash2 className="w-5 h-5 mr-2" />
                )}
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issuing Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(proformaInvoices) && proformaInvoices.length > 0 ? (
              proformaInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.ref_num}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.issuing_company_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {invoice.status === "draft" ? "Open" : "Closed"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.priority === "urgent" ? "Urgent" : "Non-Urgent"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.total_cost}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="relative group">
                      <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                        {formatDateTime(invoice.created_at).formatted}
                      </span>
                      <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                        {formatDateTime(invoice.created_at).relative}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-4">
                      <Link
                        to={`/dashboard/proforma-invoices/issued/${invoice.ref_num}`}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        View Details
                      </Link>
                      {jobTitle === "logistics manager" && (
                        <button
                          onClick={() => openDeleteModal(invoice)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-sm text-gray-900 text-center">
                  No issued proforma invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination
          count={pagination.count}
          page={page}
          setPage={setPage}
          next={pagination.next}
          previous={pagination.previous}
        />
      </div>
    </div>
  );
};

export default IssuedProformaInvoicesPage;