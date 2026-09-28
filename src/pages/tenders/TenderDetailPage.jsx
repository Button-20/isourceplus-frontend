import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Building2, Send, Trash2, FileText } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import QuestionsForum from "@/components/questions/QuestionsForum";
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

const statusTone = (status) => {
  const value = (status || "").toLowerCase();
  if (["active", "open", "issued"].includes(value)) return "open";
  if (["pending", "draft"].includes(value)) return "warn";
  if (["cancelled", "canceled", "closed"].includes(value)) return "closed";
  return "neutral";
};

const TenderDetailPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const { refNum } = useParams();
  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
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
  const isSalesManager = jobTitle === "sales manager";
  const isLeadBuyer = jobTitle === "lead buyer";

  return (
    <DetailPage
      onBack={() => navigate("/dashboard/tenders")}
      backLabel="Back to tenders"
    >
      <DetailCard>
        <DetailHeader
          icon={Building2}
          logo={tender.issuing_company_display_logo}
          title={tender.title || "Untitled tender"}
          subtitle={tender.ref_num}
          badge={
            tender.status ? (
              <StatusBadge
                label={tender.status}
                tone={statusTone(tender.status)}
              />
            ) : null
          }
        />

        <Section title="Tender details">
          <DetailGrid>
            <Row label="Reference">{tender.ref_num}</Row>
            <Row label="Title">{tender.title}</Row>
            <Row label="Issuing company">{tender.issuing_company_info}</Row>
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
          </DetailGrid>
          <div className="mt-3">
            <Row label="Note">{tender.note || "N/A"}</Row>
          </div>
        </Section>

        <Section title="Items">
          {tender.items?.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">#</th>
                    <th className="px-4 py-2.5 font-medium">Item description</th>
                    <th className="px-4 py-2.5 font-medium">Qty</th>
                    <th className="px-4 py-2.5 font-medium">Unit</th>
                    <th className="px-4 py-2.5 font-medium">Special handling</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tender.items.map((item, i) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-medium">{item.name || "N/A"}</span>
                        {item.description && (
                          <span className="block text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">{item.quantity}</td>
                      <td className="px-4 py-2.5">{item.unit_of_measure}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {item.special_handling?.length > 0
                          ? item.special_handling
                              .map((sh) => sh.handling_description)
                              .join(", ")
                          : "N/A"}
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

        <Section title="Attachments">
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

        {(isSalesManager || isLeadBuyer) && (
          <DetailFooter>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/tenders")}
            >
              Cancel
            </Button>
            {isLeadBuyer && (
              <Button
                onClick={() => setShowDeleteModal(true)}
                disabled={modalLoading}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Delete
              </Button>
            )}
            {isSalesManager && (
              <Button
                onClick={handleSendOffer}
                disabled={modalLoading}
                className="bg-brand-gradient text-brand-foreground hover:opacity-90"
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
          </DetailFooter>
        )}
      </DetailCard>

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

      <QuestionsForum entity="tender" refNum={refNum} />
    </DetailPage>
  );
};

export default TenderDetailPage;
