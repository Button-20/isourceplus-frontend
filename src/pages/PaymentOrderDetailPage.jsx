import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Trash2, FileText, ChevronDown, ChevronUp, AlertCircle, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { format, formatDistanceToNow } from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";
import { getCookie } from "@/utility/getCookie";

const PaymentOrderDetailPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const { refNum } = useParams();
  const navigate = useNavigate();
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [itemsOpen, setItemsOpen] = useState(true);
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
      const csrfToken = getCookie("csrftoken");
      const response = await authAxios.patch(
        `payment-orders/${refNum}/`,
        {
          title: formData.title,
          priority: formData.priority,
          payment_method: formData.payment_method,
        },
        { headers: { "X-CSRFToken": csrfToken } }
      );
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
      setShowDeleteModal(false);
      return;
    }
    setModalLoading(true);
    try {
      const csrfToken = getCookie("csrftoken");
      await authAxios.delete(`payment-orders/${refNum}/`, {
        headers: { "X-CSRFToken": csrfToken },
      });
      toast.success("Payment order deleted successfully!");
      navigate("/dashboard/payment-orders/issued");
    } catch (error) {
      toast.error("Failed to delete payment order.");
      console.error("PaymentOrderDetailPage: Delete error:", error.response?.data || error);
    } finally {
      setModalLoading(false);
      setShowDeleteModal(false);
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
        <p className="mt-4 text-lg text-gray-700 font-medium">Loading Payment Order Details...</p>
      </div>
    );
  }

  if (!paymentOrder) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <p className="mt-4 text-xl font-semibold text-gray-900">Payment Order Not Found</p>
          <button
            onClick={() => navigate("/dashboard/payment-orders/issued")}
            className="mt-6 flex items-center justify-center w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Payment Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <FileText className="h-16 w-16 text-gray-600" />
            <h1 className="text-3xl font-semibold text-gray-900">
              Payment Order: {paymentOrder.title || "Untitled"} <span className="text-gray-500 text-sm">({paymentOrder.ref_num})</span>
            </h1>
          </div>
          <button
            onClick={() => navigate("/dashboard/payment-orders/issued")}
            className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Payment Orders
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Payment Order Details Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <button
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="w-full flex justify-between items-center p-4 hover:bg-gray-200 transition duration-200"
            >
              <h2 className="text-xl font-medium text-gray-900">Payment Order Details</h2>
              <span className="flex items-center text-gray-600 font-medium">
                {detailsOpen ? "Collapse" : "Expand"}
                {detailsOpen ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
              </span>
            </button>
          </div>
          {detailsOpen && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-200 rounded-md p-2 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-200 rounded-md p-2 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <input
                      type="text"
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-200 rounded-md p-2 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Status</span>
                    <span className="text-gray-900">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          paymentOrder.status === "draft"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {paymentOrder.status === "draft" ? "Open" : "Closed"}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Reference Number</span>
                    <span className="text-gray-900">{paymentOrder.ref_num}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Spend Category</span>
                    <span className="text-gray-900">{paymentOrder.spend_category}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Total Cost</span>
                    <span className="text-gray-900">{paymentOrder.total_cost}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Sales Invoice Reference</span>
                    <span className="text-gray-900">{paymentOrder.sales_invoice_ref_num}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-1/3 font-medium text-gray-700">Issuing Company</span>
                    <span className="text-gray-900">{paymentOrder.issuing_company_name}</span>
                  </div>
                  {paymentOrder.created_at && (
                    <div className="flex items-center">
                      <span className="w-1/3 font-medium text-gray-700">Created At</span>
                      <div className="relative group">
                        <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                          {formatDateTime(paymentOrder.created_at).formatted}
                        </span>
                        <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                          {formatDateTime(paymentOrder.created_at).relative}
                        </div>
                      </div>
                    </div>
                  )}
                  {paymentOrder.updated_at && (
                    <div className="flex items-center">
                      <span className="w-1/3 font-medium text-gray-700">Updated At</span>
                      <div className="relative group">
                        <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                          {formatDateTime(paymentOrder.updated_at).formatted}
                        </span>
                        <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 z-10">
                          {formatDateTime(paymentOrder.updated_at).relative}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Items Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <button
              onClick={() => setItemsOpen(!itemsOpen)}
              className="w-full flex justify-between items-center p-4 hover:bg-gray-200 transition duration-200"
            >
              <h2 className="text-xl font-medium text-gray-900">Items</h2>
              <span className="flex items-center text-gray-600 font-medium">
                {itemsOpen ? "Collapse" : "Expand"}
                {itemsOpen ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
              </span>
            </button>
          </div>
          {itemsOpen && (
            <div className="p-6">
              {paymentOrder.items?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Name</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Description</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Quantity</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Unit of Measure</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentOrder.items.map((item, index) => (
                        <tr
                          key={item.id}
                          className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition duration-200`}
                        >
                          <td className="py-3 px-4 text-gray-900">{item.name}</td>
                          <td className="py-3 px-4 text-gray-900">{item.description || "N/A"}</td>
                          <td className="py-3 px-4 text-gray-900">{item.quantity}</td>
                          <td className="py-3 px-4 text-gray-900">{item.unit_of_measure}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600 text-center font-medium">No items available.</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {["sales manager", "logistics manager"].includes(jobTitle) && (
          <div className="p-6 flex justify-end space-x-4">
            <button
              onClick={handleUpdate}
              disabled={modalLoading}
              className="bg-black text-white py-2 px-6 rounded-md hover:bg-gray-700 transition duration-200 flex items-center shadow-md disabled:opacity-50"
            >
              {modalLoading ? (
                <Loader2 className="animate-spin w-5 h-5 mr-2" />
              ) : (
                <FileText className="w-5 h-5 mr-2" />
              )}
              {modalLoading ? "Updating..." : "Update Payment Order"}
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={modalLoading}
              className="bg-red-600 text-white py-2 px-6 rounded-md hover:bg-red-700 transition duration-200 flex items-center shadow-md disabled:opacity-50"
            >
              {modalLoading ? (
                <Loader2 className="animate-spin w-5 h-5 mr-2" />
              ) : (
                <Trash2 className="w-5 h-5 mr-2" />
              )}
              {modalLoading ? "Deleting..." : "Delete Payment Order"}
            </button>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full border border-gray-200 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium text-gray-900">Delete Payment Order</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 mb-6 font-medium">
                Are you sure you want to delete the payment order "{paymentOrder.title || "Untitled"}" ({paymentOrder.ref_num})? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={modalLoading}
                  className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex items-center shadow-md disabled:opacity-50"
                >
                  {modalLoading ? (
                    <Loader2 className="animate-spin w-5 h-5 mr-2" />
                  ) : (
                    <Trash2 className="w-5 h-5 mr-2" />
                  )}
                  {modalLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentOrderDetailPage;