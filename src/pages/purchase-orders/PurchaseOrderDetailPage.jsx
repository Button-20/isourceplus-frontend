import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  ShoppingCart,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import QuestionsForum from "@/components/questions/QuestionsForum";
import FundEscrowModal from "@/components/escrow/FundEscrowModal";
import EscrowPanel from "@/components/escrow/EscrowPanel";

import { Button } from "@/components/ui/button";
import {
  DetailPage,
  DetailCard,
  DetailHeader,
  Section,
  DetailGrid,
  Row,
  StatusBadge,
  DetailFooter,
} from "@/components/detail/DetailShell";
import LineItemsTable from "@/components/detail/LineItemsTable";
import { formatMoney } from "@/utils/money";

const statusTone = (status) => {
  const s = String(status || "").toLowerCase();
  if (/(fund|active|open|secured)/.test(s)) return "open";
  if (/(pending|draft|await)/.test(s)) return "warn";
  if (/(cancel|closed|reject)/.test(s)) return "closed";
  return "neutral";
};

const PurchaseOrderDetailPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const { refNum } = useParams();
  const navigate = useNavigate();
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [escrow, setEscrow] = useState(null);
  const [fundOpen, setFundOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchPurchaseOrder = async () => {
      setLoading(true);
      try {
        const response = await authAxios.get(`purchase-orders/${refNum}/`);
        setPurchaseOrder(response.data);
        // The PO payload may embed the existing escrow once one has been created.
        if (response.data?.escrow) setEscrow(response.data.escrow);
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

  // Escrow is a buyer action, and only relevant to POs that require it. Once the
  // escrow is secured (or beyond), funding is a no-op, so hide the CTA.
  const escrowRequired =
    purchaseOrder?.escrow_required ?? Boolean(purchaseOrder?.escrow);
  const escrowFunded =
    escrow &&
    [
      "SECURED",
      "PARTIAL_RELEASED",
      "FULLY_RELEASED",
      "REFUNDED",
      "FROZEN",
      "DISPUTED",
    ].includes(escrow.escrow_status);
  const canFundEscrow =
    jobTitle === "lead buyer" && escrowRequired && !escrowFunded;

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

  const canSendSalesInvoice =
    jobTitle === "sales manager" || jobTitle === "logistics manager";

  return (
    <DetailPage
      onBack={() => navigate(backTo)}
      backLabel="Back to purchase orders"
    >
      <DetailCard>
        <DetailHeader
          icon={ShoppingCart}
          title={purchaseOrder.title || purchaseOrder.ref_num}
          subtitle={purchaseOrder.ref_num}
          badge={
            purchaseOrder.status ? (
              <StatusBadge
                label={purchaseOrder.status}
                tone={statusTone(purchaseOrder.status)}
              />
            ) : null
          }
        />

        <Section title="Purchase order details">
          <DetailGrid>
            <Row label="Reference">{purchaseOrder.ref_num}</Row>
            <Row label="Title">{purchaseOrder.title}</Row>
            <Row label="Issuing company">
              {purchaseOrder.issuing_company_name}
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
            <Row label="Total sales value">
              {formatMoney(
                purchaseOrder.total_sales_value ?? purchaseOrder.total_cost,
                purchaseOrder.currency,
              )}
            </Row>
            <Row label="Proforma reference">
              {purchaseOrder.proforma_ref_num || "N/A"}
            </Row>
          </DetailGrid>
        </Section>

        <Section title="Items">
          <LineItemsTable
            items={purchaseOrder.items}
            total={purchaseOrder.total_sales_value ?? purchaseOrder.total_cost}
            totalLabel="Total sales value"
            currency={purchaseOrder.currency}
          />
        </Section>

        {(canFundEscrow || canSendSalesInvoice) && (
          <DetailFooter>
            <Button variant="outline" onClick={() => navigate(backTo)}>
              Cancel
            </Button>
            {canFundEscrow && (
              <Button
                onClick={() => setFundOpen(true)}
                className="bg-brand-gradient text-brand-foreground hover:opacity-90"
              >
                <ShieldCheck className="mr-1.5 h-4 w-4" /> Fund escrow
              </Button>
            )}
            {canSendSalesInvoice && (
              <Button
                onClick={handleSendSalesInvoice}
                disabled={modalLoading}
                className="bg-brand-gradient text-brand-foreground hover:opacity-90"
              >
                {modalLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Processing…
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-4 w-4" /> Send sales invoice
                  </>
                )}
              </Button>
            )}
          </DetailFooter>
        )}
      </DetailCard>

      {/* Escrow */}
      {escrow ? (
        <EscrowPanel escrow={escrow} />
      ) : (
        escrowRequired && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-card p-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="font-display text-base font-semibold">
                This purchase order requires escrow
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {canFundEscrow
                  ? "Lodge funds into the Isourceplus escrow account to secure this order."
                  : "Awaiting the buyer to lodge funds into escrow."}
              </p>
            </div>
            {canFundEscrow && (
              <Button
                onClick={() => setFundOpen(true)}
                className="bg-brand-gradient text-brand-foreground hover:opacity-90"
              >
                <ShieldCheck className="mr-1.5 h-4 w-4" /> Fund escrow
              </Button>
            )}
          </div>
        )
      )}

      <QuestionsForum
        entity="purchase-order"
        refNum={refNum}
        className="mt-6"
      />

      <FundEscrowModal
        open={fundOpen}
        onOpenChange={setFundOpen}
        refNum={refNum}
        onSecured={(secured) => {
          setEscrow(secured);
          setPurchaseOrder((prev) =>
            prev ? { ...prev, status: "ESCROW_FUNDED", escrow: secured } : prev,
          );
        }}
      />
    </DetailPage>
  );
};

export default PurchaseOrderDetailPage;
