import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const IssuedSalesInvoicesPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const [salesInvoices, setSalesInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
  });

  useEffect(() => {
    // if (jobTitle !== "lead buyer") {
    //   toast.error("Only lead buyers can view issued sales invoices.");
    //   navigate("/dashboard");
    //   return;
    // }
    const fetchSalesInvoices = async (url = "sales-invoices/") => {
      try {
        const response = await authAxios.get(url);
        console.log("IssuedSalesInvoicesPage: Sales invoices fetched:", response.data);
        setSalesInvoices(response.data.results || []);
        setPagination({
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          currentPage: pagination.currentPage,
        });
      } catch (error) {
        toast.error("Failed to load issued sales invoices.");
        console.error("IssuedSalesInvoicesPage: Fetch error:", error.response?.data || error);
      } finally {
        setLoading(false);
      }
    };
    fetchSalesInvoices();
  }, [authAxios, jobTitle, navigate]);

  const handlePageChange = async (url, page) => {
    if (!url) return;
    setLoading(true);
    try {
      const response = await authAxios.get(url.replace("http://127.0.0.1:8000/api/v1/", ""));
      console.log("IssuedSalesInvoicesPage: Paginated sales invoices fetched:", response.data);
      setSalesInvoices(response.data.results || []);
      setPagination({
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,
        currentPage: page,
      });
    } catch (error) {
      toast.error("Failed to load issued sales invoices.");
      console.error("IssuedSalesInvoicesPage: Pagination fetch error:", error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600 text-lg">Loading Issued Sales Invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Issued Sales Invoices</h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
        <div className="bg-white shadow-lg rounded-lg p-6">
          {salesInvoices.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spend Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesInvoices.map((invoice) => (
                      <tr
                        key={invoice.ref_num}
                        onClick={() => navigate(`/dashboard/sales-invoices/${invoice.ref_num}`)}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.ref_num}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.status}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.spend_category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.total_cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => handlePageChange(pagination.previous, pagination.currentPage - 1)}
                  disabled={!pagination.previous}
                  className="flex items-center bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-200 disabled:bg-gray-400"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Previous
                </button>
                <span className="text-gray-600">Page {pagination.currentPage} of {Math.ceil(pagination.count / 10)}</span>
                <button
                  onClick={() => handlePageChange(pagination.next, pagination.currentPage + 1)}
                  disabled={!pagination.next}
                  className="flex items-center bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-200 disabled:bg-gray-400"
                >
                  Next
                  <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-600">No issued sales invoices available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssuedSalesInvoicesPage;