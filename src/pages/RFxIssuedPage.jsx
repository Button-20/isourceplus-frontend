import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Plus, ArrowLeft, X, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";
import { getCookie } from "@/utility/getCookie";
import Pagination from "@/components/Pagination";

const RFxIssuedPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const [rfxs, setRfxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rfxToDelete, setRfxToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchRfxs = async () => {
      setLoading(true);
      try {
        const response = await authAxios.get(`/rfxs/issued/?page=${page}`);
        console.log("RFxIssuedPage: API response:", response.data);
        const results =response.data;
        setRfxs(results);
        setPagination({
          count: response.data.count || 0,
          next: response.data.next || null,
          previous: response.data.previous || null,
        });
      } catch (error) {
        setRfxs([]);
        toast.error(error.response?.data?.detail || "Failed to load issued RFxs.");
        console.error("Fetch issued RFxs error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRfxs();
  }, [authAxios, page]);

  const handleDelete = async () => {
    if (jobTitle !== "lead buyer") {
      toast.error("Only lead buyers can delete RFxs.");
      setShowDeleteModal(false);
      return;
    }
    setDeleteLoading(true);
    const csrfToken = getCookie("csrftoken");
    try {
      await authAxios.delete(`/rfxs/${rfxToDelete.ref_num}/`, {
        headers: {
          "X-CSRFToken": csrfToken,
        },
      });
      toast.success("RFx deleted successfully!");
      setRfxs(rfxs.filter((rfx) => rfx.ref_num !== rfxToDelete.ref_num));
      setShowDeleteModal(false);
      setRfxToDelete(null);
    } catch (error) {
      toast.error("Failed to delete RFx.");
      console.error("Delete RFx error:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteModal = (rfx) => {
    setRfxToDelete(rfx);
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

  if (!["lead buyer", "sales manager"].includes(jobTitle)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <p className="text-xl text-gray-800 font-medium">
          Access denied. Only lead buyers and sales managers can view issued RFxs.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-6 flex items-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Issued RFxs</h1>
        {jobTitle === "lead buyer" && (
          <button
            onClick={() => navigate("/dashboard/rfxs/new")}
            className="bg-black text-white py-2 px-4 rounded-md hover:bg-gray-700 flex items-center shadow-md"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New RFx
          </button>
        )}
      </div>
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full border border-gray-200 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium text-gray-900">Delete RFx</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6 font-medium">
              Are you sure you want to delete the RFx "{rfxToDelete?.title}" ({rfxToDelete?.ref_num})? This action cannot be undone.
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
      <div className="bg-white overflow-auto border border-gray-200 rounded-lg shadow-md">
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
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(rfxs) && rfxs.length > 0 ? (
              rfxs.map((rfx) => (
                <tr key={rfx.ref_num}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rfx.ref_num}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rfx.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rfx.issuing_company_info}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rfx.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="relative group">
                      <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                        {formatDateTime(rfx.created_at).formatted}
                      </span>
                      <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                        {formatDateTime(rfx.created_at).relative}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-4">
                      <Link
                        to={`/dashboard/rfxs/${rfx.ref_num}`}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        View Details
                      </Link>
                      {jobTitle === "lead buyer" && (
                        <button
                          onClick={() => openDeleteModal(rfx)}
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
                <td colSpan="6" className="px-6 py-4 text-sm text-gray-900 text-center">
                  No issued RFxs found.
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

export default RFxIssuedPage;