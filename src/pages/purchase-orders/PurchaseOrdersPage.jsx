import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PurchaseOrdersPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // if (jobTitle !== "sales manager") {
    //   toast.error("Only sales managers can view all purchase orders.");
    //   navigate("/dashboard");
    //   return;
    // }
    const fetchPurchaseOrders = async () => {
      try {
        const response = await authAxios.get("purchase-orders/");
        console.log("PurchaseOrdersPage: Purchase orders fetched:", response.data);
        setPurchaseOrders(response.data.results || []);
      } catch (error) {
        toast.error("Failed to load purchase orders.");
        console.error("PurchaseOrdersPage: Fetch error:", error.response?.data || error);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchaseOrders();
  }, [authAxios, jobTitle, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-gray-600 mx-auto" />
          <p className="mt-4 text-gray-600 text-lg">Loading Purchase Orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
        <div className="bg-white shadow-lg rounded-lg p-6">
          {purchaseOrders.length > 0 ? (
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
                  {purchaseOrders.map((order) => (
                    <tr
                      key={order.ref_num}
                      onClick={() => navigate(`/dashboard/purchase-orders/${order.ref_num}`)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.ref_num}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.spend_category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.total_cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No purchase orders available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrdersPage;