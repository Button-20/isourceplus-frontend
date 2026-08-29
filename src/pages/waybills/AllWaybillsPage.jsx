import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Truck, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  format,
  formatDistanceToNow,
} from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";
import ScrollToTop from "@/components/ScrollToTop";
import { Button } from "@/components/ui/button";

const AllWaybillsPage = () => {
  const { authAxios, jobTitle, BASE_URL } = useAuth();
  const navigate = useNavigate();
  const [waybills, setWaybills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [previousPage, setPreviousPage] = useState(null);
  const pageSize = 10;

  useEffect(() => {
    if (["lead buyer", "sales manager"].includes(jobTitle)) {
      navigate("/dashboard/waybills/issued", { replace: true });
    }
  }, [jobTitle, navigate]);

  const fetchWaybills = async (page = 1) => {
    try {
      setLoading(true);
      const response = await authAxios.get(`waybills/?page=${page}`);
      setWaybills(response.data.results || []);
      setTotalCount(response.data.count);
      setNextPage(response.data.next);
      setPreviousPage(response.data.previous);
      setCurrentPage(page);
    } catch (error) {
      toast.error("Failed to load waybills.");
      console.error("Fetch waybills error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!["lead buyer", "sales manager"].includes(jobTitle)) {
      fetchWaybills();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authAxios, BASE_URL, jobTitle]);

  const formatDateTime = (dateString) => {
    if (!dateString) return { formatted: "N/A", relative: "" };
    const date = new Date(dateString);
    return {
      formatted: format(date, "dd MMM yyyy, HH:mm"),
      relative: formatDistanceToNow(date, { addSuffix: true }),
    };
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchWaybills(page);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 font-montserrat">
      <ScrollToTop />
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <Truck className="h-3.5 w-3.5" /> Waybills
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
            All waybills
          </h1>
          <p className="mt-2 max-w-lg text-sm text-white/85">
            Waybills available to your organization for delivery.
          </p>
        </div>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-brand" /> Loading
            waybills…
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
                {waybills.length > 0 ? (
                  waybills.map((waybill) => {
                    const created = formatDateTime(waybill.created_at);
                    return (
                      <tr
                        key={waybill.id || waybill.ref_num}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <td className="whitespace-nowrap px-5 py-3 font-medium">
                          {waybill.ref_num}
                        </td>
                        <td className="px-5 py-3">{waybill.title}</td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {waybill.issuing_company_info || "N/A"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              waybill.status === "draft"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {waybill.status === "draft" ? "Open" : "Closed"}
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
                            to={`/dashboard/waybills/${waybill.ref_num}`}
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
                      No waybills found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-border/70 px-5 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!previousPage}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({totalCount} waybills)
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!nextPage}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllWaybillsPage;
