import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

const PurchaseOrderDetailPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const { refNum } = useParams();
  const navigate = useNavigate();
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchPurchaseOrder = async () => {
      try {
        const response = await authAxios.get(`purchase-orders/${refNum}/`);
        console.log("PurchaseOrderDetailPage: Purchase order fetched:", response.data);
        setPurchaseOrder(response.data);
      } catch (error) {
        toast.error("Failed to load purchase order details.");
        console.error("PurchaseOrderDetailPage: Fetch error:", error.response?.data || error);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchaseOrder();
  }, [authAxios, refNum]);

  const handleSendSalesInvoice = async () => {
    if (jobTitle !== "sales manager") {
      toast.error("Only sales managers can send sales invoices.");
      return;
    }
    setModalLoading(true);
    try {
      const response = await authAxios.get(`purchase-orders/${refNum}/send-sales-invoice/`, {
        maxRedirects: 0,
      });
      console.log("PurchaseOrderDetailPage: Send sales invoice response:", response.data);
      const url = response.data.event_response_create_url;
      if (!url || !url.startsWith("/api/v1/sales-invoices/create-sales-invoice/")) {
        throw new Error("Invalid redirect URL received.");
      }
      const dashboardUrl = url.replace("/api/v1/sales-invoices/create-sales-invoice", "/dashboard/sales-invoices/create-sales-invoice");
      console.log("PurchaseOrderDetailPage: Navigating to:", dashboardUrl);
      navigate(dashboardUrl);
    } catch (error) {
      if (error.response && error.response.status === 302) {
        const url = error.response.data.event_response_create_url;
        console.log("PurchaseOrderDetailPage: Caught 302 redirect with URL:", url);
        if (!url || !url.startsWith("/api/v1/sales-invoices/create-sales-invoice/")) {
          throw new Error("Invalid redirect URL received.");
        }
        const dashboardUrl = url.replace("/api/v1/sales-invoices/create-sales-invoice", "/dashboard/sales-invoices/create-sales-invoice");
        console.log("PurchaseOrderDetailPage: Navigating to:", dashboardUrl);
        navigate(dashboardUrl);
      } else {
        const errorMessage = error.response?.data?.detail || "Failed to initiate sales invoice.";
        toast.error(errorMessage);
        console.error("PurchaseOrderDetailPage: Send sales invoice error:", error.response?.data || error);
      }
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600 text-lg">Loading Purchase Order Details...</p>
        </div>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <p className="text-xl font-semibold text-gray-900 mb-4">Purchase Order Not Found</p>
          <button
            onClick={() => navigate("/dashboard/purchase-orders")}
            className="flex items-center justify-center w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Purchase Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Purchase Order: {purchaseOrder.ref_num}</h1>
          {jobTitle === "sales manager" || jobTitle === "logistics manager" && <button
            onClick={() => navigate("/dashboard/purchase-orders")}
            className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Purchase Orders
          </button>}
            {jobTitle === "lead buyer" && <button
            onClick={() => navigate("/dashboard/purchase-orders/issued")}
            className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Purchase Orders
          </button>}
        </div>
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Title</label>
                <p className="text-lg text-gray-900">{purchaseOrder.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Issuing Company</label>
                <p className="text-lg text-gray-900">{purchaseOrder.issuing_company_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <p className="text-lg text-gray-900">{purchaseOrder.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Type</label>
                <p className="text-lg text-gray-900">{purchaseOrder.type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Spend Category</label>
                <p className="text-lg text-gray-900">{purchaseOrder.spend_category}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Preferred Payment Channel</label>
                <p className="text-lg text-gray-900">{purchaseOrder.preferred_payment_channel}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Delivery Date</label>
                <p className="text-lg text-gray-900">{new Date(purchaseOrder.delivery_datetime).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">VAT Type</label>
                <p className="text-lg text-gray-900">{purchaseOrder.vat_type || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Total Cost</label>
                <p className="text-lg text-gray-900">{purchaseOrder.total_cost}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Proforma Invoice Reference</label>
                <p className="text-lg text-gray-900">{purchaseOrder.proforma_ref_num}</p>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
            {purchaseOrder.items?.length > 0 ? (
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
                    {purchaseOrder.items.map((item) => (
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
          {jobTitle === "sales manager" && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSendSalesInvoice}
                disabled={modalLoading}
                className="bg-indigo-600 text-white py-2 px-6 rounded-lg hover:bg-indigo-700 transition duration-200 disabled:bg-indigo-400"
              >
                {modalLoading ? "Processing..." : "Send Sales Invoice"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetailPage;