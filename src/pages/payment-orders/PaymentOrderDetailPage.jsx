import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Trash2,
  ChevronDown,
  ChevronUp,
  Wallet,
  Save,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  format,
  formatDistanceToNow,
} from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

function Section({ title, open, onToggle, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted/40"
      >
        <h2 className="font-display text-base font-semibold">{title}</h2>
        {open ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      {open && <div className="border-t border-border/60 p-5">{children}</div>}
    </div>
  );
}

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
  const [formData, setFormData] = useState({
    title: "",
    priority: "normal",
    payment_method: "",
  });

  const canManage = ["sales manager", "logistics manager"].includes(jobTitle);

  useEffect(() => {
    const fetchPaymentOrder = async () => {
      setLoading(true);
      try {
        const response = await authAxios.get(`payment-orders/${refNum}/`);
        setPaymentOrder(response.data);
        setFormData({
          title: response.data.title,
          priority: response.data.priority,
          payment_method: response.data.payment_method,
        });
      } catch (error) {
        toast.error("Failed to load payment order details.");
        console.error("Fetch payment order error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentOrder();
  }, [authAxios, refNum]);

  const handleUpdate = async () => {
    if (!canManage) {
      toast.error("You cannot update payment orders.");
      return;
    }
    setModalLoading(true);
    try {
      const response = await authAxios.patch(`payment-orders/${refNum}/`, {
        title: formData.title,
        priority: formData.priority,
        payment_method: formData.payment_method,
      });
      setPaymentOrder(response.data);
      toast.success("Payment order updated successfully!");
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to update payment order.",
      );
      console.error("Update error:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canManage) {
      toast.error("You cannot delete payment orders.");
      setShowDeleteModal(false);
      return;
    }
    setModalLoading(true);
    try {
      await authAxios.delete(`payment-orders/${refNum}/`);
      toast.success("Payment order deleted successfully!");
      navigate("/dashboard/payment-orders/issued");
    } catch (error) {
      toast.error("Failed to delete payment order.");
      console.error("Delete error:", error);
    } finally {
      setModalLoading(false);
      setShowDeleteModal(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return { formatted: "N/A", relative: "" };
    const date = new Date(dateString);
    return {
      formatted: format(date, "dd MMM yyyy, HH:mm"),
      relative: formatDistanceToNow(date, { addSuffix: true }),
    };
  };

  if (!loading && !paymentOrder) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center font-montserrat">
        <div className="rounded-2xl border border-border/70 bg-card p-8">
          <p className="font-display text-lg font-semibold">
            Payment order not found
          </p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => navigate("/dashboard/payment-orders/issued")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to payment orders
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !paymentOrder) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const created = formatDateTime(paymentOrder.created_at);
  const updated = formatDateTime(paymentOrder.updated_at);

  return (
    <div className="mx-auto max-w-5xl space-y-6 font-montserrat">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15">
              <Wallet className="h-7 w-7" />
            </span>
            <div>
              <p className="text-xs text-white/80">{paymentOrder.ref_num}</p>
              <h1 className="font-display text-2xl font-bold">
                {paymentOrder.title || "Untitled order"}
              </h1>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/payment-orders/issued")}
            className="border-white/40 bg-white/10 text-brand-foreground hover:bg-white/20"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
        </div>
      </div>

      {/* Details */}
      <Section
        title="Payment order details"
        open={detailsOpen}
        onToggle={() => setDetailsOpen((o) => !o)}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Title</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, title: e.target.value }))
                }
                disabled={!canManage}
              />
            </div>
            <div>
              <label className={labelClass}>Priority</label>
              <Select
                value={formData.priority}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, priority: v }))
                }
                disabled={!canManage}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={labelClass}>Payment method</label>
              <Input
                value={formData.payment_method}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, payment_method: e.target.value }))
                }
                disabled={!canManage}
              />
            </div>
            <Row label="Status">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  paymentOrder.status === "draft"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {paymentOrder.status === "draft" ? "Open" : "Closed"}
              </span>
            </Row>
          </div>
          <div className="space-y-3">
            <Row label="Reference">{paymentOrder.ref_num}</Row>
            <Row label="Spend category">{paymentOrder.spend_category}</Row>
            <Row label="Total cost">{paymentOrder.total_cost}</Row>
            <Row label="Sales invoice ref">
              {paymentOrder.sales_invoice_ref_num}
            </Row>
            <Row label="Issuing company">
              {paymentOrder.issuing_company_name}
            </Row>
            <Row label="Created">
              <span title={created.relative}>{created.formatted}</span>
            </Row>
            <Row label="Updated">
              <span title={updated.relative}>{updated.formatted}</span>
            </Row>
          </div>
        </div>
      </Section>

      {/* Items */}
      <Section
        title="Items"
        open={itemsOpen}
        onToggle={() => setItemsOpen((o) => !o)}
      >
        {paymentOrder.items?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Description</th>
                  <th className="px-4 py-2.5 font-medium">Quantity</th>
                  <th className="px-4 py-2.5 font-medium">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paymentOrder.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2.5 font-medium">{item.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {item.description || "N/A"}
                    </td>
                    <td className="px-4 py-2.5">{item.quantity}</td>
                    <td className="px-4 py-2.5">{item.unit_of_measure}</td>
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
      </Section>

      {/* Actions */}
      {canManage && (
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleUpdate}
            disabled={modalLoading}
          >
            <Save className="mr-1.5 h-4 w-4" /> Update
          </Button>
          <Button
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={() => setShowDeleteModal(true)}
            disabled={modalLoading}
          >
            <Trash2 className="mr-1.5 h-4 w-4" /> Delete
          </Button>
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete payment order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {paymentOrder.title || "Untitled"}
              </span>{" "}
              ({paymentOrder.ref_num})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(false)}
              disabled={modalLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={modalLoading}
            >
              {modalLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentOrderDetailPage;
