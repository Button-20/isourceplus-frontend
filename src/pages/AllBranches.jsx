import { useAuth } from "@/contexts/app.context";
import { Plus, MapPin, Phone, Mail, Building, Navigation } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const AllBranches = () => {
  const { authAxios } = useAuth();
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

  useEffect(() => {
    fetchBranches();
  }, [authAxios]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
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

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header with search and add button */}
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
          <Link
            to="/dashboard/branches/new"
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Branch</span>
          </Link>
        </div>
      </div>

      {branches.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Building className="text-gray-400" size={40} />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No branches found</h3>
          <p className="text-gray-500 mb-4">Create your first branch to get started</p>
          <Link
            to="/dashboard/branches/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
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
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{branch.name}</h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      Branch
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Email */}
                    <div className="flex items-start gap-3">
                      <Mail className="flex-shrink-0 text-gray-500 mt-0.5" size={18} />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-gray-800 font-medium">
                          {branch.email || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    {/* Phone Numbers */}
                    <div className="flex items-start gap-3">
                      <Phone className="flex-shrink-0 text-gray-500 mt-0.5" size={18} />
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

                    {/* Address - Now properly structured */}
                    <div className="flex items-start gap-3">
                      <MapPin className="flex-shrink-0 text-gray-500 mt-0.5" size={18} />
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
                            <p className="flex items-center gap-1 text-sm text-indigo-600">
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
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
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

          {/* Pagination */}
          {pagination.count > 0 && (
            <div className="flex justify-between items-center mt-8">
              <button
                onClick={() => fetchBranches(pagination.currentPage - 1)}
                disabled={!pagination.previous}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  !pagination.previous
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-indigo-600 border border-gray-300 hover:bg-gray-50"
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
                    : "bg-white text-indigo-600 border border-gray-300 hover:bg-gray-50"
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
    </div>
  );
};

export default AllBranches;