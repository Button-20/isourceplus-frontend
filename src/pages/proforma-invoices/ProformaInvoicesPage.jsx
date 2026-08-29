import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ReceiptText, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  format,
  formatDistanceToNow,
} from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";
import Pagination from "@/components/Pagination";

const ProformaInvoicesPage = () => {
  const { authAxios } = useAuth();
  const [proformaInvoices, setProformaInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchProformaInvoices = async () => {
      setLoading(true);
      try {
        const response = await authAxios.get(`proforma-invoices/?page=${page}`);
        setProformaInvoices(response.data.results || response.data || []);
        setPagination({
          count: response.data.count || 0,
          next: response.data.next || null,
          previous: response.data.previous || null,
        });
      } catch (error) {
        setProformaInvoices([]);
        toast.error("Failed to load proforma invoices.");
        console.error("Fetch proforma invoices error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProformaInvoices();
  }, [authAxios, page]);

  const formatDateTime = (dateString) => {
    if (!dateString) return { formatted: "N/A", relative: "" };
    const date = new Date(dateString);
    return {
      formatted: format(date, "dd MMM yyyy, HH:mm"),
      relative: formatDistanceToNow(date, { addSuffix: true }),
    };
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <ReceiptText className="h-3.5 w-3.5" /> Proforma invoices
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
            Proforma invoices
          </h1>
          <p className="mt-2 max-w-lg text-sm text-white/85">
            Review the proforma invoices you&apos;ve received from suppliers.
          </p>
        </div>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-brand" /> Loading
            proforma invoices…
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
                        <td
                          className="whitespace-nowrap px-5 py-3 text-muted-foreground"
                          title={created.relative}
                        >
                          {created.formatted}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right">
                          <Link
                            to={`/dashboard/proforma-invoices/${invoice.ref_num}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                          >
                            View <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center text-muted-foreground"
                    >
                      No proforma invoices found.
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
    </div>
  );
};

export default ProformaInvoicesPage;
