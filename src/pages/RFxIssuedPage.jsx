import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Pagination from "@/components/pagination";

const RFxIssuedPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const [rfxs, setRfxs] = useState([]);
  const [loading, setLoading] = useState(true);
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
        console.log("RFxIssuedPage: API response:", response.data); // Debugging
        const results = Array.isArray(response.data) ? response.data : [];
        setRfxs(results);
        setPagination({
          count: response.data.count || 0,
          next: response.data.next || null,
          previous: response.data.previous || null,
        });
      } catch (error) {
        setRfxs([]); // Ensure rfxs is an array even on error
        toast.error(error.response?.data?.detail || "Failed to load issued RFxs.");
        console.error("Fetch issued RFxs error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRfxs();
  }, [authAxios, page]);

  if (!["lead buyer", "sales manager"].includes(jobTitle)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <p className="text-xl text-gray-900">
          Access denied. Only lead buyers and sales managers can view issued RFxs.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-6 flex items-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handleDelete = async (refNum) => {
    if (jobTitle !== "lead buyer") {
      toast.error("Only lead buyers can delete RFxs.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this RFx?")) {
      try {
        await authAxios.delete(`/rfxs/${refNum}/`);
        setRfxs(rfxs.filter((rfx) => rfx.ref_num !== refNum));
        toast.success("RFx deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete RFx.");
        console.error("Delete RFx error:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
        <p className="mt-4 text-gray-600 text-lg">Loading Issued RFxs...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Issued RFxs</h1>
        {jobTitle === "lead buyer" && (
          <button
            onClick={() => navigate("/dashboard/rfxs/new")}
            className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200"
          >
            Create New RFx
          </button>
        )}
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6">
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
                Status
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
                    <a
                      href={`/dashboard/rfxs/${rfx.ref_num}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {rfx.ref_num}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rfx.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rfx.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => navigate(`/dashboard/rfxs/${rfx.ref_num}`)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      View
                    </button>
                    {jobTitle === "lead buyer" && (
                      <button
                        onClick={() => handleDelete(rfx.ref_num)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-600">
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