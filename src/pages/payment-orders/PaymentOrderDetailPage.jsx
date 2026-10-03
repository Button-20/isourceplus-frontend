import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { getPriorityChoices } from "@/services/api/choices.service";
import { normalizeChoices, prettify } from "@/utils/choices";
import {
  Loader2,
  ArrowLeft,
  Trash2,
  Wallet,
  Save,
  Truck,
  CheckCircle2,
} from "lucide-react";
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
import { isDraftStatus } from "@/utils/status";

const labelClass = "mb-1 block text-sm font-medium text-foreground";

// Dispatch form (POST payment-orders/{ref}/dispatch/). All fields required.
const DISPATCH_FIELDS = [
  {
    name: "waybill_ref",
    label: "Waybill reference",
    placeholder: "WB-2026-00001",
  },
  {
    name: "vehicle_number",
    label: "Vehicle number",
    placeholder: "GT-1234-24",
  },
  { name: "driver_name", label: "Driver name", placeholder: "Full name" },
  {
    name: "driver_phone",
    label: "Driver phone",
    placeholder: "0241234567",
    type: "tel",
    inputMode: "numeric",
    maxLength: 10,
    hint: "Local format starting with 0 (10 digits), not +233.",
  },
];
const EMPTY_DISPATCH = {
  waybill_ref: "",
  vehicle_number: "",
  driver_name: "",
  driver_phone: "",
};
// Local Ghanaian mobile format: leading 0 + 9 digits.
const PHONE_RE = /^0\d{9}$/;

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
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchForm, setDispatchForm] = useState(EMPTY_DISPATCH);
  const [dispatchErrors, setDispatchErrors] = useState({});
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

  const openDispatch = () => {
    // Pre-fill the waybill ref if the order already references one.
    setDispatchForm({
      ...EMPTY_DISPATCH,
      waybill_ref: typeof paymentOrder?.wb === "string" ? paymentOrder.wb : "",
    });
    setDispatchErrors({});
    setShowDispatchModal(true);
  };

  const setDispatchField = (name, value) => {
    setDispatchForm((f) => ({ ...f, [name]: value }));
    setDispatchErrors((e) => (e[name] ? { ...e, [name]: undefined } : e));
  };

  const validateDispatch = () => {
    const errors = {};
    DISPATCH_FIELDS.forEach(({ name, label }) => {
      if (!dispatchForm[name].trim()) errors[name] = `${label} is required.`;
    });
    const phone = dispatchForm.driver_phone.trim();
    if (phone && !PHONE_RE.test(phone))
      errors.driver_phone =
        "Driver phone must start with 0 and be 10 digits (e.g. 0241234567).";
    setDispatchErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // POST payment-orders/{ref}/dispatch/ with the waybill + driver details. The
  // backend then attaches the goods delivery note / waybill; the order is
  // reloaded so the page flips to "Dispatched". Irreversible.
  const handleDispatch = async (e) => {
    e?.preventDefault();
    if (!canManage) {
      toast.error("You cannot dispatch payment orders.");
      setShowDispatchModal(false);
      return;
    }
    if (!validateDispatch()) return;
    setDispatching(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(dispatchForm).map(([k, v]) => [k, v.trim()]),
      );
      const { data } = await authAxios.post(
        `payment-orders/${refNum}/dispatch/`,
        payload,
      );
      toast.success(
        data?.message || data?.detail || "Payment order dispatched.",
      );
      setShowDispatchModal(false);
      try {
        const fresh = await authAxios.get(`payment-orders/${refNum}/`);
        setPaymentOrder(fresh.data);
      } catch {
        // The dispatch succeeded; a failed refresh just leaves stale data.
      }
    } catch (error) {
      const data = error.response?.data;
      // Field errors ({ driver_phone: ["…"] }) go inline; keep the form open.
      const fieldErrors = {};
      if (data && typeof data === "object") {
        DISPATCH_FIELDS.forEach(({ name }) => {
          const v = data[name] ?? data.errors?.[name];
          if (v) fieldErrors[name] = Array.isArray(v) ? v[0] : String(v);
        });
      }
      setDispatchErrors(fieldErrors);
      toast.error(
        data?.message ||
          data?.detail ||
          Object.values(fieldErrors)[0] ||
          "Failed to dispatch payment order.",
      );
      console.error("Dispatch error:", error);
    } finally {
      setDispatching(false);
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
  const isDraft = isDraftStatus(paymentOrder.status);
  // Dispatched once the backend has attached a goods delivery note or waybill.
  const isDispatched = Boolean(paymentOrder.gdn || paymentOrder.wb);
  const canDispatch = canManage && isDraft && !isDispatched;

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
            {isDispatched ? (
              <Button
                disabled
                className="bg-emerald-600 text-white disabled:opacity-100"
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Dispatched
              </Button>
            ) : (
              <Button
                className="bg-brand-gradient text-brand-foreground hover:opacity-90"
                onClick={openDispatch}
                disabled={modalLoading || dispatching || !canDispatch}
                title={
                  !isDraft
                    ? "Only open payment orders can be dispatched"
                    : undefined
                }
              >
                {dispatching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Dispatching…
                  </>
                ) : (
                  <>
                    <Truck className="mr-1.5 h-4 w-4" /> Dispatch
                  </>
                )}
              </Button>
            )}
          </DetailFooter>
        )}
      </DetailCard>

      {/* Dispatch form */}
      <Dialog
        open={showDispatchModal}
        onOpenChange={(o) => !dispatching && setShowDispatchModal(o)}
      >
        <DialogContent className="font-montserrat sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Dispatch goods</DialogTitle>
            <DialogDescription>
              Enter the waybill and driver details for{" "}
              <span className="font-medium text-foreground">
                {paymentOrder.title || paymentOrder.ref_num}
              </span>
              . The buyer will be notified and this can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>

          <form
            id="dispatch-form"
            onSubmit={handleDispatch}
            noValidate
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {DISPATCH_FIELDS.map((f) => (
              <div key={f.name}>
                <label htmlFor={`dispatch-${f.name}`} className={labelClass}>
                  {f.label} <span className="text-destructive">*</span>
                </label>
                <Input
                  id={`dispatch-${f.name}`}
                  name={f.name}
                  type={f.type || "text"}
                  inputMode={f.inputMode}
                  maxLength={f.maxLength}
                  placeholder={f.placeholder}
                  autoComplete="off"
                  value={dispatchForm[f.name]}
                  onChange={(e) => setDispatchField(f.name, e.target.value)}
                  aria-invalid={Boolean(dispatchErrors[f.name])}
                  className={
                    dispatchErrors[f.name]
                      ? "border-destructive focus-visible:ring-destructive"
                      : undefined
                  }
                  disabled={dispatching}
                />
                {dispatchErrors[f.name] ? (
                  <p className="mt-1 text-xs text-destructive">
                    {dispatchErrors[f.name]}
                  </p>
                ) : (
                  f.hint && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {f.hint}
                    </p>
                  )
                )}
              </div>
            ))}
          </form>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDispatchModal(false)}
              disabled={dispatching}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="dispatch-form"
              className="bg-brand-gradient text-brand-foreground hover:opacity-90"
              disabled={dispatching}
            >
              {dispatching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Dispatching…
                </>
              ) : (
                <>
                  <Truck className="mr-1.5 h-4 w-4" /> Dispatch
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
