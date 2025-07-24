import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TenderPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenders = async () => {
      setLoading(true);
      try {
        const endpoint = jobTitle === "lead buyer" ? "/tenders/issued/" : "/tenders/";
        const response = await authAxios.get(endpoint);
        setTenders(response.data.results || response.data);
      } catch (error) {
        toast.error("Failed to load tenders.");
        console.error("Fetch tenders error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTenders();
  }, [authAxios, jobTitle]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
        <p className="mt-4 text-gray-600 text-lg">Loading Tenders...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tenders</h1>
        {jobTitle === "lead buyer" && (
          <button
            onClick={() => navigate("/dashboard/tenders/new")}
            className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200"
          >
            Create New Tender
          </button>
        )}
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6">
        {tenders.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spend Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tenders.map((tender) => (
                <tr key={tender.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tender.ref_num}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tender.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tender.spend_category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tender.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => navigate(`/dashboard/tenders/${tender.ref_num}`)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600">No tenders available.</p>
        )}
      </div>
    </div>
  );
};

export default TenderPage;