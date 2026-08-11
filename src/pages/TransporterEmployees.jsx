import { useAuth } from "@/contexts/app.context";
import {
  User,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Plus,
  ArrowLeft,
  Clock,
  Activity,
  Shield,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AllTransporterEmployees = () => {
  const { authAxios, transporterId } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await authAxios.get(
          `transporters/${transporterId}/all-employees`
        );
        setEmployees(response.data.all_employees);
      } catch (err) {
        setError(err.message || "Failed to fetch employees");
        toast.error(err.response.data?.detail || "Failed to load employees");
        console.error("Error fetching employees:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [authAxios]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 animate-pulse"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
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
      <div className="p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xs border border-gray-100 p-6 text-center">
          <div className="text-red-500 mb-4">Error loading employees</div>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-gray-600 hover:text-gray-800 font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const filteredEmployees = employees.filter((employee) =>
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="p-4">
      {/* Header with search and add button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Team Members</h1>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
          <Link
            to="/dashboard/employee/new"
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Employee</span>
          </Link>
        </div>
      </div>

      {filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-8 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <User className="text-gray-400" size={40} />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {searchTerm ? "No matching employees found" : "No employees yet"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm
              ? "Try a different search term"
              : "Add your first team member to get started"}
          </p>
          <Link
            to="/dashboard/employee/new"
            className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus size={16} />
            Add New Employee
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <div
              key={employee.id}
              className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                {/* Employee header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="text-gray-600" size={24} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-800">
                      {employee.email.split("@")[0]}
                    </h2>
                    <p className="text-sm text-gray-500">{employee.email}</p>
                  </div>
                </div>

                {/* Employee details */}
                <div className="space-y-4">
                  {/* Email Verification */}
                  <div className="flex items-center gap-3">
                    {employee.email_is_verified ? (
                      <CheckCircle className="text-green-500" size={18} />
                    ) : (
                      <XCircle className="text-yellow-500" size={18} />
                    )}
                    <span className="text-sm">
                      Email{" "}
                      {employee.email_is_verified ? "Verified" : "Not Verified"}
                    </span>
                  </div>

                  {/* Account Status */}
                  <div className="flex items-center gap-3">
                    {employee.is_active ? (
                      <Activity className="text-green-500" size={18} />
                    ) : (
                      <Shield className="text-gray-400" size={18} />
                    )}
                    <span className="text-sm">
                      {employee.is_active ? "Active" : "Inactive"} Account
                    </span>
                  </div>

                  {/* Last Login */}
                  <div className="flex items-center gap-3">
                    <Clock className="text-gray-500" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Last Login</p>
                      <p className="text-sm font-medium">
                        {employee.last_login
                          ? formatDate(employee.last_login)
                          : "Never"}
                      </p>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-center gap-3">
                    <Calendar className="text-gray-500" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="text-sm font-medium">
                        {formatDate(employee.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* View Details */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                  <Link
                    to={`/dashboard/employees/${employee.id}`}
                    className="text-sm font-medium text-gray-600 hover:text-gray-800 flex items-center gap-1"
                    title={`View details for ${employee.email}`}
                    aria-label={`View details for ${employee.email}`}
                    state={{ employee }}
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
      )}
    </div>
  );
};

export default AllTransporterEmployees;
