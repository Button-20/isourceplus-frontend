import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  User,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Clock,
  Activity,
  Shield,
  Briefcase,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/app.context";

const EmployeeDetailPage = () => {
  const { authAxios, companyId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location.state?.employee) {
      setEmployee(location.state.employee);
      setLoading(false);
    } else {
      setError("Employee data not found");
      setLoading(false);
      toast.error("Failed to load employee details");
    }
  }, [location.state]);

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
            <div className="h-32 w-full bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Employees
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Back to Employees
          </button>
        </div>
        {/* <Link
          to={`/dashboard/employee/edit/${employee.id}`}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Edit2 size={18} />
          Edit Employee
        </Link> */}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-6 mb-6">
            <img
              src="https://via.placeholder.com/100"
              alt="Employee Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-indigo-100"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {employee.email.split("@")[0]}
              </h1>
              <p className="text-gray-500">{employee.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {employee.email_is_verified ? (
                  <CheckCircle className="text-green-500" size={18} />
                ) : (
                  <XCircle className="text-yellow-500" size={18} />
                )}
                <span className="text-sm">
                  {employee.email_is_verified ? "Verified" : "Unverified"} Email
                </span>
              </div>
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
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="text-gray-500" size={18} />
                <div>
                  <p className="text-sm text-gray-500">Last Login</p>
                  <p className="text-sm font-medium">
                    {formatDate(employee.last_login)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="text-gray-500" size={18} />
                <div>
                  <p className="text-sm text-gray-500">Joined Company</p>
                  <p className="text-sm font-medium">
                    {formatDate(employee.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Additional Information
            </h3>
            {/* <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Briefcase className="text-gray-500" size={18} />
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="text-sm font-medium">
                    {employee.company || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="text-gray-500" size={18} />
                <div>
                  <p className="text-sm text-gray-500">Profile</p>
                  <p className="text-sm font-medium">
                    {employee.profile || "N/A"}
                  </p>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailPage;
