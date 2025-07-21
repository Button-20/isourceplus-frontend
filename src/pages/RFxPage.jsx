import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import  Pagination  from "@/components/pagination";

const RFxPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const [rfxs, setRfxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [page, setPage] = useState(1);

  if (!["lead buyer", "sales manager"].includes(jobTitle)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <p className="text-xl text-gray-900">Access denied. Only lead buyers and sales managers can view RFxs.</p>
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

  useEffect(() => {
    const fetchRfxs = async () => {
      setLoading(true);
      try {
        const response = await authAxios.get(`/rfxs/?page=${page}`);
        setRfxs(response.data.results);
        setPagination({
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
        });
      } catch (error) {
        toast.error("Failed to load RFxs.");
        console.error("Fetch RFxs error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRfxs();
  }, [authAxios, page]);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">RFxs</h1>
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
        {rfxs.length > 0 ? (
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
              {rfxs.map((rfx) => (
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600">No RFxs found.</p>
        )}
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

export default RFxPage;