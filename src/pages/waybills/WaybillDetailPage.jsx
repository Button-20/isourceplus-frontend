import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Building2, Trash2, Send } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
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

const WaybillDetailPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const { refNum } = useParams();
  const [waybill, setWaybill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();

  const canCreateWaybill = ["lead buyer", "sales manager"].includes(jobTitle);

  useEffect(() => {
    const fetchWaybill = async () => {
      setLoading(true);
      try {
        const response = await authAxios.get(`waybills/${refNum}/`);
        setWaybill(response.data);
      } catch (error) {
        toast.error("Failed to load waybill details.");
        console.error("Fetch waybill error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWaybill();
  }, [authAxios, refNum]);

  const handleSendOffer = async () => {
    setModalLoading(true);
    try {
      const response = await authAxios.get(`waybills/${refNum}/send-offer/`);
      const url = response.data.event_response_create_url;
      if (!url || !url.startsWith("/api/v1/proforma-invoices/create-offer/")) {
        throw new Error("Invalid redirect URL received.");
      }
      navigate(url.replace("/api/v1", "/dashboard"));
    } catch (error) {
      if (error.response && error.response.status === 302) {
        const url = error.response.data.event_response_create_url;
        if (url?.startsWith("/api/v1/proforma-invoices/create-offer/")) {
          navigate(url.replace("/api/v1", "/dashboard"));
          return;
        }
      }
      toast.error(error.response?.data?.detail || "Failed to initiate offer.");
      console.error("Send offer error:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteWaybill = async () => {
    setDeleteLoading(true);
    try {
      await authAxios.delete(`waybills/${refNum}/`);
      toast.success("Waybill deleted successfully!");
      setShowDeleteModal(false);
      navigate("/dashboard/waybills/issued");
    } catch (error) {
      toast.error("Failed to delete waybill.");
      console.error("Delete waybill error:", error);
    } finally {
      setDeleteLoading(false);
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

  if (!loading && !waybill) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center font-montserrat">
        <div className="rounded-2xl border border-border/70 bg-card p-8">
          <p className="font-display text-lg font-semibold">Waybill not found</p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => navigate("/dashboard/waybills")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to waybills
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !waybill) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const created = formatDateTime(waybill.created_at);
  const updated = formatDateTime(waybill.updated_at);
  const isLogisticsManager = jobTitle === "logistics manager";

  return (
    <DetailPage
      onBack={() => navigate("/dashboard/waybills")}
      backLabel="Back to waybills"
    >
      <DetailCard>
        <DetailHeader
          icon={Building2}
          logo={waybill.issuing_company_display_logo}
          title={waybill.title || "Untitled waybill"}
          subtitle={waybill.ref_num}
          badge={
            waybill.status ? (
              <StatusBadge
                label={waybill.status}
                tone={statusTone(waybill.status)}
              />
            ) : null
          }
        />

        <Section title="Waybill details">
          <DetailGrid>
            <Row label="Reference">{waybill.ref_num}</Row>
            <Row label="Title">{waybill.title}</Row>
            <Row label="Issuing company">{waybill.issuing_company_info}</Row>
            <Row label="Procedure">{waybill.procedure}</Row>
            <Row label="Spend category">{waybill.spend_category}</Row>
            <Row label="Priority">
              {waybill.priority === "urgent" ? "Urgent" : "Non-Urgent"}
            </Row>
            <Row label="Start date">
              {formatDateTime(waybill.start_datetime).formatted}
            </Row>
            <Row label="Submission date">
              {formatDateTime(waybill.submission_datetime).formatted}
            </Row>
            <Row label="Departure date">
              {formatDateTime(waybill.departure_datetime).formatted}
            </Row>
            <Row label="Delivery date">
              {formatDateTime(waybill.delivery_datetime).formatted}
            </Row>
            <Row label="Active">{waybill.is_active ? "Yes" : "No"}</Row>
            <Row label="Approved">{waybill.is_approved ? "Yes" : "No"}</Row>
            <Row label="Reach">
              {waybill.reach
                ? [
                    waybill.reach.region,
                    waybill.reach.district,
                    waybill.reach.city,
                    waybill.reach.town,
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
        </Section>

        <Section title="Items">
          {waybill.items?.length > 0 ? (
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
                  {waybill.items.map((item, i) => (
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
                        {item.special_handles?.length > 0
                          ? item.special_handles
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

        {(isLogisticsManager || canCreateWaybill) && (
          <DetailFooter>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/waybills")}
            >
              Cancel
            </Button>
            {canCreateWaybill && (
              <Button
                onClick={() => setShowDeleteModal(true)}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Delete
              </Button>
            )}
            {isLogisticsManager && (
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
            <DialogTitle>Delete waybill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {waybill.title}
              </span>{" "}
              ({waybill.ref_num})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDeleteWaybill}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
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

      <QuestionsForum entity="waybill" refNum={refNum} />
    </DetailPage>
  );
};

export default WaybillDetailPage;
