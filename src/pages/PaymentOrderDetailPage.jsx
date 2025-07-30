import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const PaymentOrderDetailPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const { refNum } = useParams();
  const navigate = useNavigate();
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({ title: "", priority: "normal", payment_method: "" });

  useEffect(() => {
    const fetchPaymentOrder = async () => {
      try {
        const response = await authAxios.get(`payment-orders/${refNum}/`);
        console.log("PaymentOrderDetailPage: Payment order fetched:", response.data);
        setPaymentOrder(response.data);
        setFormData({
          title: response.data.title,
          priority: response.data.priority,
          payment_method: response.data.payment_method,
        });
      } catch (error) {
        toast.error("Failed to load payment order details.");
        console.error("PaymentOrderDetailPage: Fetch error:", error.response?.data || error);
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentOrder();
  }, [authAxios, refNum]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (!["sales manager", "logistics manager"].includes(jobTitle)) {
      toast.error("Only sales or logistics managers can update payment orders.");
      return;
    }
    setModalLoading(true);
    try {
      const csrfToken = document.cookie.split("; ").find(row => row.startsWith("csrftoken="))?.split("=")[1];
      const response = await authAxios.patch(`payment-orders/${refNum}/`, {
        title: formData.title,
        priority: formData.priority,
        payment_method: formData.payment_method,
      }, { headers: { "X-CSRFToken": csrfToken } });
      console.log("PaymentOrderDetailPage: Payment order updated:", response.data);
      setPaymentOrder(response.data);
      toast.success("Payment order updated successfully!");
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Failed to update payment order.";
      toast.error(errorMessage);
      console.error("PaymentOrderDetailPage: Update error:", error.response?.data || error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!["sales manager", "logistics manager"].includes(jobTitle)) {
      toast.error("Only sales or logistics managers can delete payment orders.");
      return;
    }
    setModalLoading(true);
    try {
      const csrfToken = document.cookie.split("; ").find(row => row.startsWith("csrftoken="))?.split("=")[1];
      await authAxios.delete(`payment-orders/${refNum}/`, { headers: { "X-CSRFToken": csrfToken } });
      toast.success("Payment order deleted successfully!");
      navigate("/dashboard/payment-orders/issued");
    } catch (error) {
      toast.error("Failed to delete payment order.");
      console.error("PaymentOrderDetailPage: Delete error:", error.response?.data || error);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600 text-lg">Loading Payment Order Details...</p>
        </div>
      </div>
    );
  }

  if (!paymentOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <p className="text-xl font-semibold text-gray-900 mb-4">Payment Order Not Found</p>
          <button
            onClick={() => navigate("/dashboard/payment-orders/issued")}
            className="flex items-center justify-center w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Payment Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment Order: {paymentOrder.ref_num}</h1>
          <button
            onClick={() => navigate("/dashboard/payment-orders/issued")}
            className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Payment Orders
          </button>
        </div>
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Payment Method</label>
                <input
                  type="text"
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Spend Category</label>
                <p className="text-lg text-gray-900">{paymentOrder.spend_category}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <p className="text-lg text-gray-900">{paymentOrder.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Total Cost</label>
                <p className="text-lg text-gray-900">{paymentOrder.total_cost}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Sales Invoice Reference</label>
                <p className="text-lg text-gray-900">{paymentOrder.sales_invoice_ref_num}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Issuing Company</label>
                <p className="text-lg text-gray-900">{paymentOrder.issuing_company_name}</p>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
            {paymentOrder.items?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity} {item.unit_of_measure}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No items available.</p>
            )}
          </div>
          {["sales manager", "logistics manager"].includes(jobTitle) && (
            <div className="mt-8 flex justify-end space-x-4">
              <button
                onClick={handleUpdate}
                disabled={modalLoading}
                className="bg-indigo-600 text-white py-2 px-6 rounded-lg hover:bg-indigo-700 transition duration-200 disabled:bg-indigo-400"
              >
                {modalLoading ? "Updating..." : "Update Payment Order"}
              </button>
              <button
                onClick={handleDelete}
                disabled={modalLoading}
                className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 transition duration-200 disabled:bg-red-400 flex items-center"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                {modalLoading ? "Deleting..." : "Delete Payment Order"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentOrderDetailPage;