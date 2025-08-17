import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight, Plus, AlertCircle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { format, formatDistanceToNow } from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";

const PaymentOrdersPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const [paymentOrders, setPaymentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
  });
  
  useEffect(() => {
    const fetchPaymentOrders = async (url = "payment-orders/issued/") => {
      try {
        const response = await authAxios.get(url);
        console.log("PaymentOrdersPage: Payment orders fetched:", response.data);
        setPaymentOrders(response.data.results || response.data || []);
        setPagination({
          count: response.data.count || response.data.length || 0,
          next: response.data.next,
          previous: response.data.previous,
          currentPage: url.includes("page=")
            ? parseInt(new URL(url, "http://127.0.0.1:8000").searchParams.get("page"), 10)
            : 1,
        });
      } catch (error) {
        setPaymentOrders([]);
        toast.error("Failed to load payment orders.");
        console.error("PaymentOrdersPage: Fetch error:", error.response?.data || error);
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentOrders();
  }, [authAxios]);

  if (!["sales manager", "logistics manager"].includes(jobTitle)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <p className="mt-4 text-xl font-semibold text-gray-900">Access Denied</p>
          <p className="text-gray-600 mt-2 font-medium">Only sales managers and logistics managers can view payment orders.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-6 flex items-center justify-center w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }


  const handlePageChange = async (url, page) => {
    if (!url) return;
    setLoading(true);
    try {
      const response = await authAxios.get(url.replace("http://127.0.0.1:8000/api/v1/", ""));
      console.log("PaymentOrdersPage: Paginated payment orders fetched:", response.data);
      setPaymentOrders(response.data.results || response.data || []);
      setPagination({
        count: response.data.count || response.data.length || 0,
        next: response.data.next,
        previous: response.data.previous,
        currentPage: page,
      });
    } catch (error) {
      toast.error("Failed to load payment orders.");
      console.error("PaymentOrdersPage: Pagination fetch error:", error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="animate-spin h-12 w-12 text-gray-600" />
        <p className="mt-4 text-lg text-gray-700 font-medium">Loading Payment Orders...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Issued Payment Orders</h1>
        <div className="flex items-center space-x-4">
          {["sales manager", "logistics manager"].includes(jobTitle) && (
            <button
              onClick={() => navigate("/dashboard/payment-orders/create")}
              className="bg-black text-white py-2 px-4 rounded-md hover:bg-gray-700 flex items-center shadow-md"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Payment Order
            </button>
          )}
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-auto">
        {Array.isArray(paymentOrders) && paymentOrders.length > 0 ? (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left font-medium text-gray-700">Reference Number</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-700">Title</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-700">Issuing Company</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-700">Status</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-700">Spend Category</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-700">Total Cost</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-700">Created At</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paymentOrders.map((order, index) => (
                  <tr
                    key={order.ref_num}
                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition duration-200`}
                  >
                    <td className="py-3 px-4 text-gray-900">{order.ref_num}</td>
                    <td className="py-3 px-4 text-gray-900">{order.title || "N/A"}</td>
                    <td className="py-3 px-4 text-gray-900">{order.issuing_company_name || "N/A"}</td>
                    <td className="py-3 px-4 text-gray-900">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === "draft"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {order.status === "draft" ? "Open" : "Closed"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{order.spend_category}</td>
                    <td className="py-3 px-4 text-gray-900">{order.total_cost}</td>
                    <td className="py-3 px-4 text-gray-900">
                      <div className="relative group">
                        <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                          {formatDateTime(order.created_at).formatted}
                        </span>
                        <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                          {formatDateTime(order.created_at).relative}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      <Link
                        to={`/dashboard/payment-orders/${order.ref_num}`}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 flex justify-between items-center border-t border-gray-200">
              <button
                onClick={() => handlePageChange(pagination.previous, pagination.currentPage - 1)}
                disabled={!pagination.previous}
                className="flex items-center bg-black text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200 shadow-md disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </button>
              <span className="text-gray-700 font-medium">
                Page {pagination.currentPage} of {Math.ceil(pagination.count / 10)}
              </span>
              <button
                onClick={() => handlePageChange(pagination.next, pagination.currentPage + 1)}
                disabled={!pagination.next}
                className="flex items-center bg-black text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200 shadow-md disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </>
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-600 font-medium">Nothing here yet. After you create a payment order(s), they will appear here.</p>
            {["sales manager", "logistics manager"].includes(jobTitle) && (
              <button
                onClick={() => navigate("/dashboard/payment-orders/create")}
                className="mt-4 bg-black text-white py-2 px-4 rounded-md hover:bg-gray-700 flex items-center mx-auto shadow-md"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Payment Order
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentOrdersPage;