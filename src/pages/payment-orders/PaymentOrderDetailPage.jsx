import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { getPriorityChoices } from "@/services/api/choices.service";
import { normalizeChoices, prettify } from "@/utils/choices";
import { Loader2, ArrowLeft, Trash2, Wallet, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import QuestionsForum from "@/components/questions/QuestionsForum";
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
import {
  DetailPage,
  DetailCard,
  DetailHeader,
  Section,
  Row,
  StatusBadge,
  DetailFooter,
} from "@/components/detail/DetailShell";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

// Fallback only — the live list comes from GET priority-choices/.
const PRIORITY_FALLBACK = [
  { value: "non urgent", label: "Non-Urgent" },
  { value: "urgent", label: "Urgent" },
];

const PaymentOrderDetailPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const { refNum } = useParams();
  const navigate = useNavigate();
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    priority: "",
    payment_method: "",
  });

  // Priority enum from GET priority-choices/ (falls back to the hardcoded
  // list). The saved value is always kept selectable even if the backend
  // list changes.
  const [priorityChoices, setPriorityChoices] = useState(PRIORITY_FALLBACK);
  useEffect(() => {
    let cancelled = false;
    getPriorityChoices()
      .then((d) => {
        const list = normalizeChoices(d);
        if (!cancelled && list.length) setPriorityChoices(list);
      })
      .catch(() => {
        if (!cancelled) setPriorityChoices(PRIORITY_FALLBACK);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const priorityOptions =
    formData.priority &&
    !priorityChoices.some((o) => o.value === formData.priority)
      ? [
          ...priorityChoices,
          { value: formData.priority, label: prettify(formData.priority) },
        ]
      : priorityChoices;

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
  const isDraft = paymentOrder.status === "draft";

  return (
    <DetailPage
      onBack={() => navigate("/dashboard/payment-orders/issued")}
      backLabel="Back to payment orders"
    >
      <DetailCard>
        <DetailHeader
          icon={Wallet}
          title={paymentOrder.title || "Untitled order"}
          subtitle={paymentOrder.ref_num}
          badge={
            <StatusBadge
              label={isDraft ? "Open" : "Closed"}
              tone={isDraft ? "open" : "closed"}
            />
          }
        />

        <Section title="Payment order details">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
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
                    {priorityOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={labelClass}>Payment method</label>
                <Input
                  value={formData.payment_method}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      payment_method: e.target.value,
                    }))
                  }
                  disabled={!canManage}
                />
              </div>
            </div>
            <div className="space-y-1">
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

        <Section title="Items">
          {paymentOrder.items?.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">#</th>
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="px-4 py-2.5 font-medium">Description</th>
                    <th className="px-4 py-2.5 font-medium">Quantity</th>
                    <th className="px-4 py-2.5 font-medium">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paymentOrder.items.map((item, i) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {i + 1}
                      </td>
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

        {canManage && (
          <DetailFooter>
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
          </DetailFooter>
        )}
      </DetailCard>

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

      <QuestionsForum entity="payment-order" refNum={refNum} />
    </DetailPage>
  );
};

export default PaymentOrderDetailPage;
