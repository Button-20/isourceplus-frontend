import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { getPriorityChoices } from "@/services/api/choices.service";
import { normalizeChoices, prettify } from "@/utils/choices";
import {
  Loader2,
  ArrowLeft,
  Trash2,
  FileText,
  Send,
  Wallet,
  Save,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import QuestionsForum from "@/components/questions/QuestionsForum";
import {
  format,
  formatDistanceToNow,
} from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

// Fallback only — the live list comes from GET priority-choices/.
const PRIORITY_FALLBACK = [
  { value: "non urgent", label: "Non-Urgent" },
  { value: "urgent", label: "Urgent" },
];

const SalesInvoiceDetailPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const { refNum } = useParams();
  const navigate = useNavigate();
  const [salesInvoice, setSalesInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    notes: "",
    priority: "",
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
    const fetchSalesInvoice = async () => {
      setLoading(true);
      try {
        const response = await authAxios.get(`sales-invoices/${refNum}/`);
        setSalesInvoice(response.data);
        setFormData({
          title: response.data.title,
          notes: response.data.notes || "",
          priority: response.data.priority,
        });
      } catch (error) {
        toast.error("Failed to load sales invoice details.");
        console.error("Fetch sales invoice error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSalesInvoice();
  }, [authAxios, refNum]);

  const handleUpdate = async () => {
    if (!canManage) {
      toast.error("You cannot update sales invoices.");
      return;
    }
    setModalLoading(true);
    try {
      const response = await authAxios.patch(`sales-invoices/${refNum}/`, {
        title: formData.title,
        notes: formData.notes,
        priority: formData.priority,
      });
      setSalesInvoice(response.data);
      toast.success("Sales invoice updated successfully!");
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to update sales invoice.",
      );
      console.error("Update error:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canManage) {
      toast.error("You cannot delete sales invoices.");
      setShowDeleteModal(false);
      return;
    }
    setModalLoading(true);
    try {
      await authAxios.delete(`sales-invoices/${refNum}/`);
      toast.success("Sales invoice deleted successfully!");
      navigate("/dashboard/sales-invoices");
    } catch (error) {
      toast.error("Failed to delete sales invoice.");
      console.error("Delete error:", error);
    } finally {
      setModalLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleSendPaymentOrder = async () => {
    if (!canManage) {
      toast.error("You cannot send payment orders.");
      return;
    }
    setModalLoading(true);
    try {
      const response = await authAxios.get(
        `sales-invoices/${refNum}/send-payment-order/`,
        { maxRedirects: 0 },
      );
      const url = response.data.event_response_create_url;
      if (
        !url ||
        !url.startsWith("/api/v1/payment-orders/create-payment-order/")
      ) {
        throw new Error("Invalid redirect URL received.");
      }
      navigate(
        url.replace(
          "/api/v1/payment-orders/create-payment-order",
          "/dashboard/payment-orders/create-payment-order",
        ),
      );
    } catch (error) {
      if (error.response && error.response.status === 302) {
        const url = error.response.data.event_response_create_url;
        if (url?.startsWith("/api/v1/payment-orders/create-payment-order/")) {
          navigate(
            url.replace(
              "/api/v1/payment-orders/create-payment-order",
              "/dashboard/payment-orders/create-payment-order",
            ),
          );
          return;
        }
      }
      toast.error(
        error.response?.data?.detail || "Failed to initiate payment order.",
      );
      console.error("Send payment order error:", error);
    } finally {
      setModalLoading(false);
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

  if (!loading && !salesInvoice) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center font-montserrat">
        <div className="rounded-2xl border border-border/70 bg-card p-8">
          <p className="font-display text-lg font-semibold">
            Sales invoice not found
          </p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => navigate("/dashboard/sales-invoices")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to sales invoices
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !salesInvoice) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const created = formatDateTime(salesInvoice.created_at);
  const updated = formatDateTime(salesInvoice.updated_at);
  const isDraft = isDraftStatus(salesInvoice.status);

  return (
    <DetailPage
      onBack={() => navigate("/dashboard/sales-invoices")}
      backLabel="Back to sales invoices"
    >
      <DetailCard>
        <DetailHeader
          icon={Wallet}
          title={salesInvoice.title || "Untitled invoice"}
          subtitle={salesInvoice.ref_num}
          badge={
            <StatusBadge
              label={isDraft ? "Open" : "Closed"}
              tone={isDraft ? "open" : "closed"}
            />
          }
        />

        <Section title="Invoice details">
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
                <label className={labelClass}>Notes</label>
                <Textarea
                  rows={4}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, notes: e.target.value }))
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
            </div>
            <div className="space-y-1">
              <Row label="Reference">{salesInvoice.ref_num}</Row>
              <Row label="Spend category">{salesInvoice.spend_category}</Row>
              <Row label="Total cost">{salesInvoice.total_cost}</Row>
              <Row label="Purchase order ref">{salesInvoice.po_ref_num}</Row>
              <Row label="Issuing company">
                {salesInvoice.issuing_company_name}
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

        <Section title="Attachments">
          {salesInvoice.attachments?.length > 0 ? (
            <div className="space-y-2">
              {salesInvoice.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-border/70 px-4 py-3 text-sm transition-colors hover:bg-muted/40"
                >
                  <FileText className="h-5 w-5 text-brand" />
                  <span className="flex-1 font-medium">{attachment.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {attachment.orientation}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No attachments available.
            </p>
          )}
        </Section>

        <Section title="Items">
          {salesInvoice.items?.length > 0 ? (
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
                  {salesInvoice.items.map((item, i) => (
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
            <Button
              className="bg-brand-gradient text-brand-foreground hover:opacity-90"
              onClick={handleSendPaymentOrder}
              disabled={modalLoading}
            >
              {modalLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <Send className="mr-1.5 h-4 w-4" /> Send payment order
                </>
              )}
            </Button>
          </DetailFooter>
        )}
      </DetailCard>

      {/* Delete confirmation */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete sales invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {salesInvoice.title || "Untitled"}
              </span>{" "}
              ({salesInvoice.ref_num})? This action cannot be undone.
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

      <QuestionsForum entity="sales-invoice" refNum={refNum} />
    </DetailPage>
  );
};

export default SalesInvoiceDetailPage;
