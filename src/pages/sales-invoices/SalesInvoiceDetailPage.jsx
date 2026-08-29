import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  Send,
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

const SalesInvoiceDetailPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const { refNum } = useParams();
  const navigate = useNavigate();
  const [salesInvoice, setSalesInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [attachmentsOpen, setAttachmentsOpen] = useState(true);
  const [itemsOpen, setItemsOpen] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    notes: "",
    priority: "normal",
  });

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
              <p className="text-xs text-white/80">{salesInvoice.ref_num}</p>
              <h1 className="font-display text-2xl font-bold">
                {salesInvoice.title || "Untitled invoice"}
              </h1>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/sales-invoices")}
            className="border-white/40 bg-white/10 text-brand-foreground hover:bg-white/20"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
        </div>
      </div>

      {/* Details */}
      <Section
        title="Invoice details"
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
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-3">
            <Row label="Reference">{salesInvoice.ref_num}</Row>
            <Row label="Status">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  salesInvoice.status === "draft"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {salesInvoice.status === "draft" ? "Open" : "Closed"}
              </span>
            </Row>
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

      {/* Attachments */}
      <Section
        title="Attachments"
        open={attachmentsOpen}
        onToggle={() => setAttachmentsOpen((o) => !o)}
      >
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

      {/* Items */}
      <Section
        title="Items"
        open={itemsOpen}
        onToggle={() => setItemsOpen((o) => !o)}
      >
        {salesInvoice.items?.length > 0 ? (
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
                {salesInvoice.items.map((item) => (
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
        </div>
      )}

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
    </div>
  );
};

export default SalesInvoiceDetailPage;
