import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";

const AllWaybillsPage = () => {
  const { authAxios, jobTitle, BASE_URL } = useAuth();
  const navigate = useNavigate();
  const [waybills, setWaybills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Restrict access for "lead buyer" and "sales manager"
  useEffect(() => {
    if (["lead buyer", "sales manager"].includes(jobTitle)) {
      navigate("/dashboard/waybills/issued", { replace: true });
    }
  }, [jobTitle, navigate]);

  const fetchWaybills = async () => {
    try {
      console.log(`Fetching all waybills from: ${BASE_URL}waybills/`);
      const response = await authAxios.get("waybills/");
      setWaybills(response.data.results);
    } catch (error) {
      toast.error("Failed to load waybills.");
      console.error("Fetch waybills error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!["lead buyer", "sales manager"].includes(jobTitle)) {
      fetchWaybills();
    }
  }, [authAxios, BASE_URL, jobTitle]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return {
      formatted: format(date, "dd MMM yyyy, HH:mm:ss"),
      relative: formatDistanceToNow(date, { addSuffix: true }),
    };
  };

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
        <h1 className="text-2xl font-bold text-gray-900">All Waybills</h1>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg shadow-md">
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
            {waybills.map((waybill) => (
              <tr key={waybill.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {waybill.ref_num}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {waybill.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {waybill.issuing_company_info}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {waybill.status === "draft" ? "Open" : "Closed"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="relative group">
                    <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                      {formatDateTime(waybill.created_at).formatted}
                    </span>
                    <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                      {formatDateTime(waybill.created_at).relative}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex space-x-4">
                    <Link
                      to={`/dashboard/waybills/${waybill.ref_num}`}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      View Details
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllWaybillsPage;