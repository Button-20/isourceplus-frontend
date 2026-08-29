import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ReceiptText, ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  format,
  formatDistanceToNow,
} from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";
import ScrollToTop from "@/components/ScrollToTop";
import Pagination from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const IssuedProformaInvoicesPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const [proformaInvoices, setProformaInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });
  const [page, setPage] = useState(1);

  const fetchIssuedProformaInvoices = useCallback(async () => {
    if (jobTitle !== "logistics manager") {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await authAxios.get(
        `proforma-invoices/issued/?page=${page}`,
      );
      setProformaInvoices(response.data.results || response.data || []);
      setPagination({
        count: response.data.count || 0,
        next: response.data.next || null,
        previous: response.data.previous || null,
      });
    } catch (error) {
      setProformaInvoices([]);
      toast.error("Failed to load issued proforma invoices.");
      console.error("Fetch issued proforma invoices error:", error);
    } finally {
      setLoading(false);
    }
  }, [authAxios, jobTitle, page]);

  useEffect(() => {
    fetchIssuedProformaInvoices();
  }, [fetchIssuedProformaInvoices]);

  const handleDelete = async () => {
    if (jobTitle !== "logistics manager") {
      toast.error("Only logistics managers can delete proforma invoices.");
      setInvoiceToDelete(null);
      return;
    }
    setDeleteLoading(true);
    try {
      await authAxios.delete(`proforma-invoices/${invoiceToDelete.ref_num}/`);
      toast.success("Proforma invoice deleted successfully!");
      setProformaInvoices((prev) =>
        prev.filter((invoice) => invoice.ref_num !== invoiceToDelete.ref_num),
      );
      setInvoiceToDelete(null);
    } catch (error) {
      toast.error("Failed to delete proforma invoice.");
      console.error("Delete proforma invoice error:", error);
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

  if (jobTitle !== "logistics manager") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center font-montserrat">
        <div className="rounded-2xl border border-border/70 bg-card p-8">
          <p className="font-display text-lg font-semibold">Access denied</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Only logistics managers can view issued proforma invoices.
          </p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 font-montserrat">
      <ScrollToTop />
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <ReceiptText className="h-3.5 w-3.5" /> Proforma invoices
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
            Issued proforma invoices
          </h1>
          <p className="mt-2 max-w-lg text-sm text-white/85">
            Proforma invoices your organization has issued.
          </p>
        </div>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-brand" /> Loading
            issued proforma invoices…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Issuing company</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Priority</th>
                  <th className="px-5 py-3 font-medium">Total cost</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {Array.isArray(proformaInvoices) &&
                proformaInvoices.length > 0 ? (
                  proformaInvoices.map((invoice) => {
                    const created = formatDateTime(invoice.created_at);
                    return (
                      <tr
                        key={invoice.id || invoice.ref_num}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <td className="whitespace-nowrap px-5 py-3 font-medium">
                          {invoice.ref_num}
                        </td>
                        <td className="px-5 py-3">{invoice.title}</td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {invoice.issuing_company_name || "N/A"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              invoice.status === "draft"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {invoice.status === "draft" ? "Open" : "Closed"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {invoice.priority === "urgent"
                            ? "Urgent"
                            : "Non-Urgent"}
                        </td>
                        <td className="px-5 py-3">{invoice.total_cost}</td>
                        <td
                          className="whitespace-nowrap px-5 py-3 text-muted-foreground"
                          title={created.relative}
                        >
                          {created.formatted}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              to={`/dashboard/proforma-invoices/issued/${invoice.ref_num}`}
                              className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                            >
                              View <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setInvoiceToDelete(invoice)}
                              className="text-muted-foreground transition-colors hover:text-destructive"
                              aria-label="Delete proforma invoice"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center text-muted-foreground"
                    >
                      No issued proforma invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          count={pagination.count}
          page={page}
          setPage={setPage}
          next={pagination.next}
          previous={pagination.previous}
        />
      </div>

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(invoiceToDelete)}
        onOpenChange={(o) => !o && setInvoiceToDelete(null)}
      >
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete proforma invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {invoiceToDelete?.title}
              </span>{" "}
              ({invoiceToDelete?.ref_num})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setInvoiceToDelete(null)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
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
    </div>
  );
};

export default IssuedProformaInvoicesPage;
