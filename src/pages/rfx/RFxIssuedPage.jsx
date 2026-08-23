import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Plus, ArrowLeft, X, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";
import { getCookie } from "@/utility/getCookie";
import Pagination from "@/components/Pagination";

// NO CHANGES
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

  // NO CHANGES
  useEffect(() => {
    const fetchRfxs = async () => {
      setLoading(true);
      try {
        const response = await authAxios.get(`/rfxs/issued/?page=${page}`);
        console.log("RFxIssuedPage: API response:", response.data);
        const results = response.data.results; // UPDATED: Corrected data access
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

  // NO CHANGES
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

  // NO CHANGES
  const openDeleteModal = (rfx) => {
    setRfxToDelete(rfx);
    setShowDeleteModal(true);
  };

  // NO CHANGES
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return {
      formatted: format(date, "dd MMM yyyy, HH:mm:ss"),
      relative: formatDistanceToNow(date, { addSuffix: true }),
    };
  };

  // NO CHANGES
  if (!["lead buyer", "sales manager"].includes(jobTitle)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <p className="text-xl font-semibold text-gray-900 mb-4">Access Denied</p>
          <p className="text-gray-600 mb-6">Only lead buyers and sales managers can view issued RFxs.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center justify-center w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200 shadow-xs"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // NO CHANGES
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="animate-spin h-12 w-12 text-black" />
        <p className="mt-4 text-lg text-gray-700 font-medium">Loading Issued RFxs...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Issued RFxs</h1>
        {jobTitle === "lead buyer" && (
          <Link
            to="/dashboard/rfxs/create"
            className="flex items-center bg-black text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200 shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create RFx
          </Link>
        )}
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
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
              {/* NEW ADDITION: Reach column */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reach
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
                  {/* NEW ADDITION: Display reach column */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rfx.reach ? `${rfx.reach.region || "N/A"}, ${rfx.reach.district || "N/A"}` : "N/A"}
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
                {/* UPDATED: Adjusted colSpan to account for new Reach column */}
                <td colSpan="7" className="px-6 py-4 text-sm text-gray-900 text-center">
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
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Delete RFx</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete RFx "{rfxToDelete?.title}" ({rfxToDelete?.ref_num})? This action cannot be undone.
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
                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex items-center disabled:opacity-50"
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
    </div>
  );
};

export default RFxIssuedPage;