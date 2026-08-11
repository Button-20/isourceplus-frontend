import { useAuth } from "@/contexts/app.context";
import { Plus, MapPin, Phone, Mail, Building, Navigation, MoreVertical } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getCookie } from "@/utility/getCookie";

// No changes to component declaration
const AllBranches = () => {
  const { authAxios } = useAuth();
  const navigate = useNavigate(); // Added: For Add Branch button navigation
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
  });
  const [searchTerm, setSearchTerm] = useState("");
  // Added: State for menu and modal
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef(null);

  // No changes to fetchBranches
  const fetchBranches = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const url = search
        ? `branches/?search=${search}`
        : `branches/?page=${page}`;
      const response = await authAxios.get(url);
      setBranches(response.data.results);
      setPagination({
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,
        currentPage: page,
      });
    } catch (err) {
      setError(err.message || "Failed to fetch branches");
      toast.error("Failed to fetch branches");
      console.error("Error fetching branches:", err);
    } finally {
      setLoading(false);
    }
  };

  // Added: Handle delete branch
  const handleDelete = async (branchId) => {
    setDeleting(true);
    try {
      const csrfToken = getCookie("csrftoken");
      await authAxios.delete(`branches/${branchId}/`, {
        headers: {
          "X-CSRFToken": csrfToken,
        },
      });
      toast.success("Branch deleted successfully!");
      setDeleteModal(null);
      fetchBranches(pagination.currentPage, searchTerm);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || "Failed to delete branch";
      toast.error(errorMessage);
      console.error("Error deleting branch:", err);
    } finally {
      setDeleting(false);
    }
  };

  // Added: Click-outside handler for submenu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Added: Focus management for modal
  const modalRef = useRef(null);
  useEffect(() => {
    if (deleteModal && modalRef.current) {
      modalRef.current.focus();
    }
  }, [deleteModal]);

  // No changes to initial useEffect
  useEffect(() => {
    fetchBranches();
  }, [authAxios]);

  // No changes to loading state
  if (loading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 animate-pulse">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 bg-gray-200 rounded-full mt-1"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No changes to error state
  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Modified: Added conditional Add Branch button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Branch Locations</h1>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Search branches..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                fetchBranches(1, e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {branches.length > 0 && (
            <button
              onClick={() => navigate("/dashboard/branches/new")}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Branch</span>
            </button>
          )}
        </div>
      </div>

      {branches.length === 0 ? (
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-8 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Building className="text-gray-400" size={40} />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No branches found</h3>
          <p className="text-gray-500 mb-4">Create your first branch to get started</p>
          <Link
            to="/dashboard/branches/new"
            className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus size={16} />
            Add New Branch
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  {/* Modified: Added three-dot menu */}
                  <div className="flex justify-between items-start mb-4 relative">
                    <h2 className="text-xl font-semibold text-gray-800">{branch.name}</h2>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Branch
                      </span>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === branch.id ? null : branch.id)}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Branch options"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {openMenuId === branch.id && (
                        <div
                          ref={menuRef}
                          className="absolute top-8 right-4 bg-white shadow-lg rounded-lg border border-gray-200 z-10"
                        >
                          <ul className="text-sm">
                            <li>
                              <Link
                                to={`/dashboard/branches/${branch.id}/edit`}
                                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                                onClick={() => setOpenMenuId(null)}
                              >
                                Edit
                              </Link>
                            </li>
                            <li>
                              <button
                                onClick={() => {
                                  setDeleteModal(branch.id);
                                  setOpenMenuId(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                              >
                                Delete
                              </button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Email - No changes */}
                    <div className="flex items-start gap-3">
                      <Mail className="shrink-0 text-gray-500 mt-0.5" size={18} />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-gray-800 font-medium">
                          {branch.email || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    {/* Phone Numbers - No changes */}
                    <div className="flex items-start gap-3">
                      <Phone className="shrink-0 text-gray-500 mt-0.5" size={18} />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <div className="space-y-1">
                          <p className="text-gray-800 font-medium">
                            {branch.office_line || 'Not provided'}
                          </p>
                          {branch.office_line_2 && (
                            <p className="text-gray-800 font-medium">
                              {branch.office_line_2}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Address - No changes */}
                    <div className="flex items-start gap-3">
                      <MapPin className="shrink-0 text-gray-500 mt-0.5" size={18} />
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <div className="text-gray-800 font-medium space-y-1">
                          {branch.location.street_address && (
                            <p>{branch.location.street_address}</p>
                          )}
                          {branch.location.popular_area_name && (
                            <p>{branch.location.popular_area_name}</p>
                          )}
                          <p>
                            {[
                              branch.location.town,
                              branch.location.city,
                              branch.location.district,
                              branch.location.region
                            ].filter(Boolean).join(', ')}
                          </p>
                          {branch.location.gps && (
                            <p className="flex items-center gap-1 text-sm text-gray-600">
                              <Navigation size={14} />
                              GPS: {branch.location.gps}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                    <Link
                      to={`/dashboard/branches/${branch.id}`}
                      className="text-sm font-medium text-gray-600 hover:text-gray-800 flex items-center gap-1"
                    >
                      View details
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination - No changes */}
          {pagination.count > 0 && (
            <div className="flex justify-between items-center mt-8">
              <button
                onClick={() => fetchBranches(pagination.currentPage - 1)}
                disabled={!pagination.previous}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  !pagination.previous
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.currentPage} of {Math.ceil(pagination.count / 10)}
              </span>
              <button
                onClick={() => fetchBranches(pagination.currentPage + 1)}
                disabled={!pagination.next}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  !pagination.next
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Next
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}
        </>
      )}

      {/* Added: Delete confirmation modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Delete Branch</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium">
                {branches.find((b) => b.id === deleteModal)?.name || "this branch"}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteModal)}
                disabled={deleting}
                className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                  deleting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {deleting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllBranches;