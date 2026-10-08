import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import {
  Loader2,
  PackageCheck,
  ArrowLeft,
  ShoppingCart,
  Send,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import QuestionsForum from "@/components/questions/QuestionsForum";
import FundEscrowModal from "@/components/escrow/FundEscrowModal";
import EscrowPanel from "@/components/escrow/EscrowPanel";
import CancelEscrowModal from "@/components/escrow/CancelEscrowModal";
import EscrowPayModal from "@/components/escrow/EscrowPayModal";
import ManualPayModal from "@/components/escrow/ManualPayModal";
import ConfirmReceiptModal from "@/components/escrow/ConfirmReceiptModal";
import GrnInspectionPanel from "@/components/grn/GrnInspectionPanel";
import { findGrnForPurchaseOrder } from "@/services/api/grn.service";

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
import ArchiveButton from "@/components/archive/ArchiveButton";
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
  const [cancelOpen, setCancelOpen] = useState(false);
  const [escrowPayOpen, setEscrowPayOpen] = useState(false);
  const [manualPayOpen, setManualPayOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  // Goods received note for this PO (null until goods are received).
  const [grn, setGrn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);

  // `quiet` refreshes after an action without the full-page spinner.
  const fetchPurchaseOrder = useCallback(
    async ({ quiet = false } = {}) => {
      if (!quiet) setLoading(true);
      try {
        const response = await authAxios.get(`purchase-orders/${refNum}/`);
        setPurchaseOrder(response.data);
        // The PO payload may embed the existing escrow once one has been created.
        if (response.data?.escrow) setEscrow(response.data.escrow);
        // The GRN appears once goods are received; absence isn't an error.
        findGrnForPurchaseOrder(response.data)
          .then(setGrn)
          .catch(() => setGrn(null));
      } catch (error) {
        toast.error("Failed to load purchase order details.");
        console.error("Fetch purchase order error:", error);
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [authAxios, refNum],
  );

  useEffect(() => {
    fetchPurchaseOrder();
  }, [fetchPurchaseOrder]);

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
      ? "/dashboard/purchase-orders?filter=draft"
      : "/dashboard/purchase-orders";
  const canArchive = jobTitle === "lead buyer";

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

  // Buyer actions after funding: cancel the escrow before dispatch, inspect
  // the goods received note, then pay — from escrow when it holds the funds,
  // otherwise manually (no-escrow orders).
  const isBuyer = jobTitle === "lead buyer";
  const escrowStatus = escrow?.escrow_status;
  const canCancelEscrow =
    isBuyer && Boolean(escrow) && ["CREATED", "SECURED"].includes(escrowStatus);
  const poCompleted = /complet/i.test(purchaseOrder?.status || "");
  const grnConfirmed = /confirm/i.test(grn?.status || "");
  const awaitingPayment =
    isBuyer && Boolean(grn) && !grnConfirmed && !poCompleted;
  const canEscrowPay =
    awaitingPayment && ["SECURED", "PARTIAL_RELEASED"].includes(escrowStatus);
  const canManualPay = awaitingPayment && !escrowRequired;
  // Before the GRN exists the buyer confirms receipt, which creates it. With
  // escrow, only once the funds are secured (goods ship after funding).
  const canConfirmReceipt =
    isBuyer &&
    !grn &&
    !poCompleted &&
    !/cancel/i.test(purchaseOrder?.status || "") &&
    (!escrowRequired || escrowFunded);

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

        {(canFundEscrow || canSendSalesInvoice || canArchive) && (
          <DetailFooter>
            <Button variant="outline" onClick={() => navigate(backTo)}>
              Cancel
            </Button>
            {canArchive && (
              <ArchiveButton
                kind="purchaseOrder"
                refNum={purchaseOrder.ref_num}
                title={purchaseOrder.title}
                onArchived={() => navigate(backTo)}
              />
            )}
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
        <EscrowPanel
          escrow={escrow}
          actions={
            canCancelEscrow && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelOpen(true)}
                className="text-destructive hover:text-destructive"
              >
                <XCircle className="mr-1.5 h-4 w-4" /> Cancel escrow
              </Button>
            )
          }
        />
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

      {/* Receipt → goods received note inspection → payment */}
      {canConfirmReceipt && (
        <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <PackageCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-base font-semibold">
                Have the goods arrived?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Confirm receipt to get a goods received note you can inspect
                before paying.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setReceiptOpen(true)}
            className="shrink-0 bg-brand-gradient text-brand-foreground hover:opacity-90"
          >
            <PackageCheck className="mr-1.5 h-4 w-4" /> Confirm receipt
          </Button>
        </div>
      )}

      {grn && (
        <GrnInspectionPanel
          grn={grn}
          editable={awaitingPayment}
          onSaved={(updated) => {
            if (updated?.lines) setGrn(updated);
            else fetchPurchaseOrder({ quiet: true });
          }}
        />
      )}

      {(canEscrowPay || canManualPay) && (
        <div className="flex flex-col gap-4 rounded-2xl border border-brand/30 bg-brand/5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-base font-semibold">
              Ready to pay the supplier?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {canEscrowPay
                ? "Save your inspection first. Paying confirms the goods received note and releases funds from escrow based on it."
                : "Save your inspection first. Paying confirms the goods received note and records your payment."}
            </p>
          </div>
          <Button
            onClick={() =>
              canEscrowPay ? setEscrowPayOpen(true) : setManualPayOpen(true)
            }
            className="shrink-0 bg-brand-gradient text-brand-foreground hover:opacity-90"
          >
            {canEscrowPay ? (
              <>
                <ShieldCheck className="mr-1.5 h-4 w-4" /> Pay from escrow
              </>
            ) : (
              <>
                <Wallet className="mr-1.5 h-4 w-4" /> Record payment
              </>
            )}
          </Button>
        </div>
      )}

      <QuestionsForum
        entity="purchase-order"
        refNum={refNum}
        className="mt-6"
      />

      <ConfirmReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        refNum={refNum}
        onConfirmed={() => fetchPurchaseOrder({ quiet: true })}
      />
      <CancelEscrowModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        refNum={refNum}
        onCancelled={(updated) => {
          if (updated?.escrow_status) setEscrow(updated);
          fetchPurchaseOrder({ quiet: true });
        }}
      />
      <EscrowPayModal
        open={escrowPayOpen}
        onOpenChange={setEscrowPayOpen}
        refNum={refNum}
        onPaid={() => fetchPurchaseOrder({ quiet: true })}
      />
      <ManualPayModal
        open={manualPayOpen}
        onOpenChange={setManualPayOpen}
        refNum={refNum}
        onPaid={() => fetchPurchaseOrder({ quiet: true })}
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
