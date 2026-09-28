// File: RFxDetailPage.jsx
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Building2, Send } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import QuestionsForum from "@/components/questions/QuestionsForum";
import {
  format,
  formatDistanceToNow,
} from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";

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

const RFxDetailPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const { refNum } = useParams();
  const [rfx, setRfx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchRfxDetails = async () => {
      setLoading(true);
      try {
        const response = await authAxios.get(`/rfxs/${refNum}/`);
        setRfx(response.data);
      } catch (error) {
        toast.error("Failed to load RFx details.");
        console.error("Fetch RFx details error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRfxDetails();
  }, [authAxios, refNum]);

  const handleSendOffer = async () => {
    if (jobTitle !== "sales manager") {
      toast.error("Only sales managers can send offers.");
      return;
    }
    setModalLoading(true);
    try {
      const response = await authAxios.get(`/rfxs/${refNum}/send-offer/`);
      const url = response.data.event_response_create_url;
      if (!url || !url.startsWith("/api/v1/proforma-invoices/create-offer/")) {
        throw new Error("Invalid redirect URL received.");
      }
      navigate(
        url.replace(
          "/api/v1/proforma-invoices/create-offer",
          "/dashboard/proforma-invoices/create-offer-rfx",
        ),
      );
    } catch (error) {
      if (error.response && error.response.status === 302) {
        const url = error.response.data.event_response_create_url;
        if (url?.startsWith("/api/v1/proforma-invoices/create-offer/")) {
          navigate(
            url.replace(
              "/api/v1/proforma-invoices/create-offer",
              "/dashboard/proforma-invoices/create-offer-rfx",
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

  const formatDateTime = (dateString) => {
    if (!dateString) return { formatted: "N/A", relative: "" };
    const date = new Date(dateString);
    return {
      formatted: format(date, "dd MMM yyyy, HH:mm"),
      relative: formatDistanceToNow(date, { addSuffix: true }),
    };
  };

  const notAllowed = !["lead buyer", "sales manager"].includes(jobTitle);

  if (notAllowed || (!loading && !rfx)) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center font-montserrat">
        <div className="rounded-2xl border border-border/70 bg-card p-8">
          <p className="font-display text-lg font-semibold">
            {notAllowed ? "Access denied" : "RFx not found"}
          </p>
          {notAllowed && (
            <p className="mt-2 text-sm text-muted-foreground">
              Only lead buyers and sales managers can view RFx details.
            </p>
          )}
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => navigate("/dashboard/rfxs")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to RFxs
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !rfx) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const created = formatDateTime(rfx.created_at);
  const updated = formatDateTime(rfx.updated_at);
  const isSalesManager = jobTitle === "sales manager";

  return (
    <DetailPage onBack={() => navigate("/dashboard/rfxs")} backLabel="Back to RFxs">
      <DetailCard>
        <DetailHeader
          icon={Building2}
          logo={rfx.issuing_company_display_logo}
          title={rfx.title || "Untitled RFx"}
          subtitle={rfx.ref_num}
          badge={
            <StatusBadge
              label={rfx.status === "draft" ? "Open" : "Closed"}
              tone={rfx.status === "draft" ? "open" : "closed"}
            />
          }
        />

        <Section title="RFx details">
          <DetailGrid>
            <Row label="Reference">{rfx.ref_num}</Row>
            <Row label="Title">{rfx.title}</Row>
            <Row label="Issuing company">{rfx.issuing_company_info}</Row>
            <Row label="Type">{rfx.type}</Row>
            <Row label="Procedure">{rfx.procedure}</Row>
            <Row label="Spend category">{rfx.spend_category}</Row>
            <Row label="Priority">
              {rfx.priority === "urgent" ? "Urgent" : "Non-Urgent"}
            </Row>
            <Row label="Created">
              <span title={created.relative}>{created.formatted}</span>
            </Row>
            <Row label="Updated">
              <span title={updated.relative}>{updated.formatted}</span>
            </Row>
          </DetailGrid>
          <div className="mt-3">
            <Row label="Note">{rfx.note || "N/A"}</Row>
          </div>
        </Section>

        <Section title="Reach">
          <DetailGrid>
            <Row label="Region">{rfx.reach?.region || "N/A"}</Row>
            <Row label="District">{rfx.reach?.district || "N/A"}</Row>
            <Row label="City">{rfx.reach?.city || "N/A"}</Row>
            <Row label="Town">{rfx.reach?.town || "N/A"}</Row>
          </DetailGrid>
        </Section>

        <Section title="Items requested">
          {rfx.items?.length > 0 ? (
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
                  {rfx.items.map((item, i) => (
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

        {isSalesManager && (
          <DetailFooter>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/rfxs")}
            >
              Cancel
            </Button>
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
          </DetailFooter>
        )}
      </DetailCard>

      <QuestionsForum entity="rfx" refNum={refNum} />
    </DetailPage>
  );
};

export default RFxDetailPage;
