import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import {
  Loader2,
  Building2,
  ArrowLeft,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import {
  format,
  formatDistanceToNow,
} from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";

import { Button } from "@/components/ui/button";

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
      <span className="w-36 shrink-0 font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-foreground">{children}</span>
    </div>
  );
}

const ProformaInvoiceDetailPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const { refNum } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [itemsOpen, setItemsOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      try {
        const response = await authAxios.get(`proforma-invoices/${refNum}/`);
        setInvoice(response.data);
      } catch (error) {
        toast.error("Failed to load proforma invoice details.");
        console.error("Fetch proforma invoice error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [authAxios, refNum]);

  const handleSendPurchaseOrder = async () => {
    setModalLoading(true);
    try {
      const response = await authAxios.get(
        `proforma-invoices/${refNum}/send-purchase-order/`,
      );
      const apiUrl = response.data.event_response_create_url;
      if (
        !apiUrl ||
        !apiUrl.startsWith("/api/v1/purchase-orders/create-business-award/")
      ) {
        throw new Error("Invalid redirect URL received.");
      }
      navigate(apiUrl.replace("/api/v1", "/dashboard"), {
        state: { redirectUrl: apiUrl },
      });
    } catch (error) {
      if (error.response && error.response.status === 302) {
        const apiUrl = error.response.data.event_response_create_url;
        if (
          apiUrl?.startsWith("/api/v1/purchase-orders/create-business-award/")
        ) {
          navigate(apiUrl.replace("/api/v1", "/dashboard"), {
            state: { redirectUrl: apiUrl },
          });
          return;
        }
      }
      toast.error(
        error.response?.data?.detail || "Failed to initiate purchase order.",
      );
      console.error("Send purchase order error:", error);
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

  if (!loading && !invoice) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center font-montserrat">
        <div className="rounded-2xl border border-border/70 bg-card p-8">
          <p className="font-display text-lg font-semibold">
            Proforma invoice not found
          </p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => navigate("/dashboard/proforma-invoices")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to proforma invoices
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !invoice) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const created = formatDateTime(invoice.created_at);
  const updated = formatDateTime(invoice.updated_at);

  return (
    <div className="mx-auto max-w-5xl space-y-6 font-montserrat">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {invoice.issuing_company_display_logo ? (
              <img
                src={invoice.issuing_company_display_logo}
                alt="Issuing company logo"
                className="h-14 w-14 rounded-xl border border-white/30 bg-white/10 object-contain p-1"
              />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15">
                <Building2 className="h-7 w-7" />
              </span>
            )}
            <div>
              <p className="text-xs text-white/80">{invoice.ref_num}</p>
              <h1 className="font-display text-2xl font-bold">
                {invoice.title || "Untitled invoice"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {jobTitle === "lead buyer" && invoice.status === "draft" && (
              <Button
                onClick={handleSendPurchaseOrder}
                disabled={modalLoading}
                className="bg-white text-brand hover:bg-white/90"
              >
                {modalLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-4 w-4" /> Send purchase order
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/proforma-invoices")}
              className="border-white/40 bg-white/10 text-brand-foreground hover:bg-white/20"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
          </div>
        </div>
      </div>

      {/* Details */}
      <Section
        title="Invoice details"
        open={detailsOpen}
        onToggle={() => setDetailsOpen((o) => !o)}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Row label="Reference">{invoice.ref_num}</Row>
          <Row label="Title">{invoice.title}</Row>
          <Row label="Description">{invoice.description || "N/A"}</Row>
          <Row label="Issuing company">{invoice.issuing_company_name}</Row>
          <Row label="Status">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                invoice.status === "draft"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {invoice.status === "draft" ? "Open" : "Closed"}
            </span>
          </Row>
          <Row label="Spend category">{invoice.spend_category}</Row>
          <Row label="Priority">
            {invoice.priority === "urgent" ? "Urgent" : "Non-Urgent"}
          </Row>
          <Row label="Entity type">{invoice.type_of_entity || "N/A"}</Row>
          <Row label="Start date">
            {formatDateTime(invoice.start_datetime).formatted}
          </Row>
          <Row label="Submission date">
            {formatDateTime(invoice.submission_datetime).formatted}
          </Row>
          <Row label="Created">
            <span title={created.relative}>{created.formatted}</span>
          </Row>
          <Row label="Updated">
            <span title={updated.relative}>{updated.formatted}</span>
          </Row>
          <Row label="Active">{invoice.is_active ? "Yes" : "No"}</Row>
          <Row label="Approved">{invoice.is_approved ? "Yes" : "No"}</Row>
          <Row label="Total cost">{invoice.total_cost}</Row>
          <Row label="Waybill reference">
            {invoice.external_event_ref_num || "N/A"}
          </Row>
        </div>
      </Section>

      {/* Items */}
      <Section
        title="Items"
        open={itemsOpen}
        onToggle={() => setItemsOpen((o) => !o)}
      >
        {invoice.items?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Description</th>
                  <th className="px-4 py-2.5 font-medium">Qty</th>
                  <th className="px-4 py-2.5 font-medium">Unit</th>
                  <th className="px-4 py-2.5 font-medium">Special handling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2.5 font-medium">{item.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {item.description || "N/A"}
                    </td>
                    <td className="px-4 py-2.5">{item.quantity}</td>
                    <td className="px-4 py-2.5">{item.unit_of_measure}</td>
                    <td className="px-4 py-2.5">
                      {item.special_handles?.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {item.special_handles.map((sh) => (
                            <span key={sh.id} className="text-muted-foreground">
                              {sh.handling_description}
                            </span>
                          ))}
                        </div>
                      ) : (
                        "N/A"
                      )}
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
      </Section>
    </div>
  );
};

export default ProformaInvoiceDetailPage;
