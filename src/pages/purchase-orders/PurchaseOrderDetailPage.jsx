import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ShoppingCart, Send } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

function Row({ label, children }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="w-40 shrink-0 font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-foreground">{children}</span>
    </div>
  );
}

const PurchaseOrderDetailPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const { refNum } = useParams();
  const navigate = useNavigate();
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchPurchaseOrder = async () => {
      setLoading(true);
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

  const handleSendSalesInvoice = async () => {
    if (jobTitle !== "sales manager" && jobTitle !== "logistics manager") {
      toast.error("Only sales managers can send sales invoices.");
      return;
    }
    setModalLoading(true);
    try {
      const response = await authAxios.get(
        `purchase-orders/${refNum}/send-sales-invoice/`,
        { maxRedirects: 0 },
      );
      const url = response.data.event_response_create_url;
      if (
        !url ||
        !url.startsWith("/api/v1/sales-invoices/create-sales-invoice/")
      ) {
        throw new Error("Invalid redirect URL received.");
      }
      navigate(
        url.replace(
          "/api/v1/sales-invoices/create-sales-invoice",
          "/dashboard/sales-invoices/create-sales-invoice",
        ),
      );
    } catch (error) {
      if (error.response && error.response.status === 302) {
        const url = error.response.data.event_response_create_url;
        if (url?.startsWith("/api/v1/sales-invoices/create-sales-invoice/")) {
          navigate(
            url.replace(
              "/api/v1/sales-invoices/create-sales-invoice",
              "/dashboard/sales-invoices/create-sales-invoice",
            ),
          );
          return;
        }
      }
      toast.error(
        error.response?.data?.detail || "Failed to initiate sales invoice.",
      );
      console.error("Send sales invoice error:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const backTo =
    jobTitle === "lead buyer"
      ? "/dashboard/purchase-orders/issued"
      : "/dashboard/purchase-orders";

  if (!loading && !purchaseOrder) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center font-montserrat">
        <div className="rounded-2xl border border-border/70 bg-card p-8">
          <p className="font-display text-lg font-semibold">
            Purchase order not found
          </p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => navigate(backTo)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to purchase orders
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !purchaseOrder) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 font-montserrat">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15">
              <ShoppingCart className="h-7 w-7" />
            </span>
            <div>
              <p className="text-xs text-white/80">Purchase order</p>
              <h1 className="font-display text-2xl font-bold">
                {purchaseOrder.title || purchaseOrder.ref_num}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(jobTitle === "sales manager" ||
              jobTitle === "logistics manager") && (
              <Button
                onClick={handleSendSalesInvoice}
                disabled={modalLoading}
                className="bg-white text-brand hover:bg-white/90"
              >
                {modalLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-4 w-4" /> Send sales invoice
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate(backTo)}
              className="border-white/40 bg-white/10 text-brand-foreground hover:bg-white/20"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-2xl border border-border/70 bg-card p-6">
        <h2 className="mb-4 font-display text-base font-semibold">
          Purchase order details
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Row label="Reference">{purchaseOrder.ref_num}</Row>
          <Row label="Title">{purchaseOrder.title}</Row>
          <Row label="Issuing company">
            {purchaseOrder.issuing_company_name}
          </Row>
          <Row label="Status">
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium capitalize text-emerald-700">
              {purchaseOrder.status}
            </span>
          </Row>
          <Row label="Type">{purchaseOrder.type}</Row>
          <Row label="Spend category">{purchaseOrder.spend_category}</Row>
          <Row label="Payment channel">
            {purchaseOrder.preferred_payment_channel || "N/A"}
          </Row>
          <Row label="Delivery date">
            {purchaseOrder.delivery_datetime
              ? new Date(purchaseOrder.delivery_datetime).toLocaleString()
              : "N/A"}
          </Row>
          <Row label="VAT type">{purchaseOrder.vat_type || "N/A"}</Row>
          <Row label="Total cost">{purchaseOrder.total_cost}</Row>
          <Row label="Proforma reference">
            {purchaseOrder.proforma_ref_num || "N/A"}
          </Row>
        </div>
      </div>

      {/* Items */}
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="border-b border-border/60 px-5 py-4">
          <h2 className="font-display text-base font-semibold">Items</h2>
        </div>
        <div className="p-5">
          {purchaseOrder.items?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="px-4 py-2.5 font-medium">Description</th>
                    <th className="px-4 py-2.5 font-medium">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {purchaseOrder.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2.5 font-medium">{item.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {item.description || "N/A"}
                      </td>
                      <td className="px-4 py-2.5">
                        {item.quantity} {item.unit_of_measure}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No items available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetailPage;
