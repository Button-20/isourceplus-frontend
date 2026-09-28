import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ReceiptText, Trash2, ArrowLeft } from "lucide-react";
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

const ProformaInvoiceIssuedDetailPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const { refNum } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (jobTitle !== "logistics manager") {
      setLoading(false);
      return;
    }
    const fetchInvoiceDetails = async () => {
      setLoading(true);
      try {
        const response = await authAxios.get(`proforma-invoices/${refNum}/`);
        setInvoice(response.data);
      } catch (error) {
        toast.error("Failed to load proforma invoice details.");
        console.error("Fetch invoice details error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoiceDetails();
  }, [authAxios, refNum, jobTitle]);

  const handleDelete = async () => {
    if (jobTitle !== "logistics manager") {
      toast.error("Only logistics managers can delete proforma invoices.");
      setShowDeleteModal(false);
      return;
    }
    setDeleting(true);
    try {
      await authAxios.delete(`proforma-invoices/${refNum}/`);
      toast.success("Proforma invoice deleted successfully.");
      navigate("/dashboard/proforma-invoices/issued");
    } catch (error) {
      toast.error("Failed to delete proforma invoice.");
      console.error("Delete invoice error:", error);
    } finally {
      setDeleting(false);
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

  if (jobTitle !== "logistics manager" || (!loading && !invoice)) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center font-montserrat">
        <div className="rounded-2xl border border-border/70 bg-card p-8">
          <p className="font-display text-lg font-semibold">
            {jobTitle !== "logistics manager"
              ? "Access denied"
              : "Proforma invoice not found"}
          </p>
          {jobTitle !== "logistics manager" && (
            <p className="mt-2 text-sm text-muted-foreground">
              Only logistics managers can view issued proforma invoice details.
            </p>
          )}
          <Button
            variant="outline"
            className="mt-5"
            onClick={() =>
              navigate(
                jobTitle !== "logistics manager"
                  ? "/dashboard"
                  : "/dashboard/proforma-invoices/issued",
              )
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
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
    <DetailPage
      onBack={() => navigate("/dashboard/proforma-invoices/issued")}
      backLabel="Back to issued proforma invoices"
    >
      <DetailCard>
        <DetailHeader
          icon={ReceiptText}
          title={invoice.title || "Untitled invoice"}
          subtitle={invoice.ref_num}
          badge={
            <StatusBadge
              label={invoice.status === "draft" ? "Open" : "Closed"}
              tone={invoice.status === "draft" ? "warn" : "closed"}
            />
          }
        />

        <Section title="Invoice details">
          <DetailGrid>
            <Row label="Reference">{invoice.ref_num}</Row>
            <Row label="Title">{invoice.title || "N/A"}</Row>
            <Row label="Description">{invoice.description || "N/A"}</Row>
            <Row label="Issuing company">{invoice.issuing_company_name}</Row>
            <Row label="Spend category">{invoice.spend_category}</Row>
            <Row label="Priority">
              {invoice.priority === "urgent" ? "Urgent" : "Non-Urgent"}
            </Row>
            <Row label="Total cost">{invoice.total_cost}</Row>
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
          </DetailGrid>
        </Section>

        <Section title="Items">
          {invoice.items?.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">#</th>
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="px-4 py-2.5 font-medium">Description</th>
                    <th className="px-4 py-2.5 font-medium">Qty</th>
                    <th className="px-4 py-2.5 font-medium">Unit</th>
                    <th className="px-4 py-2.5 font-medium">Unit price</th>
                    <th className="px-4 py-2.5 font-medium">Extended value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {invoice.items.map((item, i) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-4 py-2.5 font-medium">
                        {item.name || "N/A"}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {item.description || "N/A"}
                      </td>
                      <td className="px-4 py-2.5">{item.quantity}</td>
                      <td className="px-4 py-2.5">{item.unit_of_measure}</td>
                      <td className="px-4 py-2.5">{item.unit_price}</td>
                      <td className="px-4 py-2.5">{item.extended_value}</td>
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

        <DetailFooter>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/proforma-invoices/issued")}
          >
            Cancel
          </Button>
          <Button
            onClick={() => setShowDeleteModal(true)}
            disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            <Trash2 className="mr-1.5 h-4 w-4" /> Delete
          </Button>
        </DetailFooter>
      </DetailCard>

      {/* Delete confirmation */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete proforma invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {invoice.title || "Untitled"}
              </span>{" "}
              ({invoice.ref_num})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
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

      <QuestionsForum entity="proforma-invoice" refNum={refNum} />
    </DetailPage>
  );
};

export default ProformaInvoiceIssuedDetailPage;
