import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";

const PurchaseOrderDetailPage = () => {
  const { authAxios, BASE_URL } = useAuth();
  const { refNum } = useParams();
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchaseOrder = async () => {
      try {
        const response = await authAxios.get(`purchase-orders/${refNum}/`);
        setPurchaseOrder(response.data);
      } catch (error) {
        toast.error("Failed to load purchase order details.");
        console.error("Fetch purchase order error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchaseOrder();
  }, [authAxios, refNum]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  if (!purchaseOrder) {
    return <div className="text-center p-6">Purchase Order not found.</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Purchase Order: {purchaseOrder.ref_num}
      </h1>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Purchase Order Details
            </h2>
            <p>
              <strong>Title:</strong> {purchaseOrder.title}
            </p>
            <p>
              <strong>Issuing Company:</strong> {purchaseOrder.issuing_company_name}
            </p>
            <p>
              <strong>Status:</strong> {purchaseOrder.status}
            </p>
            <p>
              <strong>Type:</strong> {purchaseOrder.type}
            </p>
            <p>
              <strong>Spend Category:</strong> {purchaseOrder.spend_category}
            </p>
            <p>
              <strong>Preferred Payment Channel:</strong>{" "}
              {purchaseOrder.preferred_payment_channel}
            </p>
            <p>
              <strong>Delivery Date:</strong>{" "}
              {new Date(purchaseOrder.delivery_datetime).toLocaleString()}
            </p>
            <p>
              <strong>VAT Type:</strong> {purchaseOrder.vat_type}
            </p>
            <p>
              <strong>Total Cost:</strong> {purchaseOrder.total_cost}
            </p>
            <p>
              <strong>Proforma Invoice Reference:</strong>{" "}
              {purchaseOrder.proforma_ref_num}
            </p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Items</h2>
            {purchaseOrder.items.length > 0 ? (
              purchaseOrder.items.map((item) => (
                <div key={item.id} className="mb-4">
                  <p>
                    <strong>Name:</strong> {item.name}
                  </p>
                  <p>
                    <strong>Description:</strong> {item.description}
                  </p>
                  <p>
                    <strong>Quantity:</strong> {item.quantity} {item.unit_of_measure}
                  </p>
                </div>
              ))
            ) : (
              <p>No items available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetailPage;