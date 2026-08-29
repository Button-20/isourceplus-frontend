import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Wallet, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SalesInvoicesPage = () => {
  const { authAxios } = useAuth();
  const navigate = useNavigate();
  const [salesInvoices, setSalesInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalesInvoices = async () => {
      setLoading(true);
      try {
        const response = await authAxios.get("sales-invoices/issued/");
        setSalesInvoices(response.data.results || response.data || []);
      } catch (error) {
        setSalesInvoices([]);
        toast.error("Failed to load sales invoices.");
        console.error("Fetch sales invoices error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSalesInvoices();
  }, [authAxios]);

  const statusClasses = (status) =>
    status === "draft" || status === "open"
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700";

  return (
    <div className="mx-auto max-w-6xl space-y-8 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <Wallet className="h-3.5 w-3.5" /> Sales invoices
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
            Issued sales invoices
          </h1>
          <p className="mt-2 max-w-lg text-sm text-white/85">
            Sales invoices your organization has issued.
          </p>
        </div>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-brand" /> Loading sales
            invoices…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Spend category</th>
                  <th className="px-5 py-3 font-medium">Total cost</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {salesInvoices.length > 0 ? (
                  salesInvoices.map((invoice) => (
                    <tr
                      key={invoice.ref_num}
                      onClick={() =>
                        navigate(`/dashboard/sales-invoices/${invoice.ref_num}`)
                      }
                      className="cursor-pointer transition-colors hover:bg-muted/30"
                    >
                      <td className="whitespace-nowrap px-5 py-3 font-medium">
                        {invoice.ref_num}
                      </td>
                      <td className="px-5 py-3">{invoice.title}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusClasses(
                            invoice.status,
                          )}`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {invoice.spend_category}
                      </td>
                      <td className="px-5 py-3">{invoice.total_cost}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-brand">
                          View <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center text-muted-foreground"
                    >
                      No sales invoices available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesInvoicesPage;
