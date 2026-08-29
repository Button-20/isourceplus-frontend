import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Building2,
  Send,
  Trash2,
  FileText,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  format,
  formatDistanceToNow,
} from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
      <span className="w-32 shrink-0 font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-foreground">{children}</span>
    </div>
  );
}

const TenderDetailPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const { refNum } = useParams();
  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [itemsOpen, setItemsOpen] = useState(true);
  const [attachmentsOpen, setAttachmentsOpen] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchTenderDetails = async () => {
      setLoading(true);
      try {
        const response = await authAxios.get(`/tenders/${refNum}/`);
        setTender(response.data);
      } catch (error) {
        toast.error("Failed to load tender details.");
        console.error("Fetch tender details error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTenderDetails();
  }, [authAxios, refNum]);

  const handleSendOffer = async () => {
    if (jobTitle !== "sales manager") {
      toast.error("Only sales managers can send offers.");
      return;
    }
    setModalLoading(true);
    try {
      const response = await authAxios.get(`/tenders/${refNum}/send-offer/`, {
        maxRedirects: 0,
      });
      const url = response.data.event_response_create_url;
      if (!url || !url.startsWith("/api/v1/proforma-invoices/create-offer/")) {
        throw new Error("Invalid redirect URL received.");
      }
      navigate(
        url.replace(
          "/api/v1/proforma-invoices/create-offer",
          "/dashboard/proforma-invoices/create-offer-tender",
        ),
      );
    } catch (error) {
      if (error.response && error.response.status === 302) {
        const url = error.response.data.event_response_create_url;
        if (url?.startsWith("/api/v1/proforma-invoices/create-offer/")) {
          navigate(
            url.replace(
              "/api/v1/proforma-invoices/create-offer",
              "/dashboard/proforma-invoices/create-offer-tender",
            ),
          );
          return;
        }
      }
      toast.error(error.response?.data?.detail || "Failed to initiate offer.");
      console.error("Send offer error:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteTender = async () => {
    if (jobTitle !== "lead buyer") {
      toast.error("Only lead buyers can delete tenders.");
      setShowDeleteModal(false);
      return;
    }
    setModalLoading(true);
    try {
      await authAxios.delete(`/tenders/${refNum}/`);
      toast.success("Tender deleted successfully!");
      navigate("/dashboard/tenders");
    } catch (error) {
      toast.error("Failed to delete tender.");
      console.error("Delete tender error:", error);
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

  const notAllowed = !["lead buyer", "sales manager"].includes(jobTitle);

  if (notAllowed || (!loading && !tender)) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center font-montserrat">
        <div className="rounded-2xl border border-border/70 bg-card p-8">
          <p className="font-display text-lg font-semibold">
            {notAllowed ? "Access denied" : "Tender not found"}
          </p>
          {notAllowed && (
            <p className="mt-2 text-sm text-muted-foreground">
              Only lead buyers and sales managers can view tender details.
            </p>
          )}
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => navigate("/dashboard/tenders")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to tenders
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !tender) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const created = formatDateTime(tender.created_at);
  const updated = formatDateTime(tender.updated_at);

  return (
    <div className="mx-auto max-w-5xl space-y-6 font-montserrat">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {tender.issuing_company_display_logo ? (
              <img
                src={tender.issuing_company_display_logo}
                alt="Issuing company logo"
                className="h-14 w-14 rounded-xl border border-white/30 bg-white/10 object-contain p-1"
              />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15">
                <Building2 className="h-7 w-7" />
              </span>
            )}
            <div>
              <p className="text-xs text-white/80">{tender.ref_num}</p>
              <h1 className="font-display text-2xl font-bold">
                {tender.title || "Untitled tender"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {jobTitle === "sales manager" && (
              <Button
                onClick={handleSendOffer}
                disabled={modalLoading}
                className="bg-white text-brand hover:bg-white/90"
              >
                {modalLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-4 w-4" /> Send offer
                  </>
                )}
              </Button>
            )}
            {jobTitle === "lead buyer" && (
              <Button
                onClick={() => setShowDeleteModal(true)}
                disabled={modalLoading}
                className="bg-white/15 text-brand-foreground hover:bg-white/25"
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Delete
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/tenders")}
              className="border-white/40 bg-white/10 text-brand-foreground hover:bg-white/20"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
          </div>
        </div>
      </div>

      {/* Details */}
      <Section
        title="Tender details"
        open={detailsOpen}
        onToggle={() => setDetailsOpen((o) => !o)}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Row label="Reference">{tender.ref_num}</Row>
          <Row label="Title">{tender.title}</Row>
          <Row label="Issuing company">{tender.issuing_company_info}</Row>
          <Row label="Status">
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium capitalize text-emerald-700">
              {tender.status}
            </span>
          </Row>
          <Row label="Type">{tender.type}</Row>
          <Row label="Procedure">{tender.procedure}</Row>
          <Row label="Method">{tender.method}</Row>
          <Row label="Supplier market">{tender.spend_category}</Row>
          <Row label="Priority">
            {tender.priority === "urgent" ? "Urgent" : "Non-Urgent"}
          </Row>
          <Row label="Reach">
            {tender.reach
              ? [
                  tender.reach.region,
                  tender.reach.district,
                  tender.reach.city,
                  tender.reach.town,
                ]
                  .filter(Boolean)
                  .join(", ") || "N/A"
              : "N/A"}
          </Row>
          <Row label="Created">
            <span title={created.relative}>{created.formatted}</span>
          </Row>
          <Row label="Updated">
            <span title={updated.relative}>{updated.formatted}</span>
          </Row>
        </div>
        <div className="mt-4">
          <Row label="Note">{tender.note || "N/A"}</Row>
        </div>
      </Section>

      {/* Items */}
      <Section
        title="Items"
        open={itemsOpen}
        onToggle={() => setItemsOpen((o) => !o)}
      >
        {tender.items?.length > 0 ? (
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
                {tender.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2.5 font-medium">
                      {item.name || "N/A"}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {item.description || "N/A"}
                    </td>
                    <td className="px-4 py-2.5">{item.quantity}</td>
                    <td className="px-4 py-2.5">{item.unit_of_measure}</td>
                    <td className="px-4 py-2.5">
                      {item.special_handling?.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {item.special_handling.map((sh) => (
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

      {/* Attachments */}
      <Section
        title="Attachments"
        open={attachmentsOpen}
        onToggle={() => setAttachmentsOpen((o) => !o)}
      >
        {tender.attachments?.length > 0 ? (
          <div className="space-y-2">
            {tender.attachments.map((attachment) => (
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

      {/* Delete confirmation */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete tender</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {tender.title}
              </span>{" "}
              ({tender.ref_num})? This action cannot be undone.
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
              onClick={handleDeleteTender}
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

export default TenderDetailPage;
