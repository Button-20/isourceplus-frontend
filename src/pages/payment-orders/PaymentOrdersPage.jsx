import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import {
  format,
  formatDistanceToNow,
} from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";

import { Button } from "@/components/ui/button";

const PaymentOrdersPage = () => {
  const NODE_ENV = import.meta.env.VITE_NODE_ENV || "development";
  const BASE_URL =
    NODE_ENV === "development"
      ? `${import.meta.env.VITE_SERVER_URL}`
      : ` ${import.meta.env.VITE_SECURE_URL}`;

  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const [paymentOrders, setPaymentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
  });

  useEffect(() => {
    const fetchPaymentOrders = async () => {
      setLoading(true);
      try {
        const response = await authAxios.get("payment-orders/issued/");
        setPaymentOrders(response.data.results || response.data || []);
        setPagination({
          count: response.data.count || response.data.length || 0,
          next: response.data.next,
          previous: response.data.previous,
          currentPage: 1,
        });
      } catch (error) {
        setPaymentOrders([]);
        toast.error("Failed to load payment orders.");
        console.error("Fetch payment orders error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentOrders();
  }, [authAxios]);

  const handlePageChange = async (url, page) => {
    if (!url) return;
    setLoading(true);
    try {
      const response = await authAxios.get(url.replace(`${BASE_URL}`, ""));
      setPaymentOrders(response.data.results || response.data || []);
      setPagination({
        count: response.data.count || response.data.length || 0,
        next: response.data.next,
        previous: response.data.previous,
        currentPage: page,
      });
    } catch (error) {
      toast.error("Failed to load payment orders.");
      console.error("Pagination fetch error:", error);
    } finally {
      setLoading(false);
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

  if (!["sales manager", "logistics manager"].includes(jobTitle)) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center font-montserrat">
        <div className="rounded-2xl border border-border/70 bg-card p-8">
          <p className="font-display text-lg font-semibold">Access denied</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Only sales managers and logistics managers can view payment orders.
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

  const totalPages = Math.max(1, Math.ceil(pagination.count / 10));

  return (
    <div className="mx-auto max-w-6xl space-y-8 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <Wallet className="h-3.5 w-3.5" /> Payment orders
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
            Issued payment orders
          </h1>
          <p className="mt-2 max-w-lg text-sm text-white/85">
            Payment orders your organization has issued.
          </p>
        </div>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-brand" /> Loading
            payment orders…
          </div>
        ) : Array.isArray(paymentOrders) && paymentOrders.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Reference</th>
                    <th className="px-5 py-3 font-medium">Title</th>
                    <th className="px-5 py-3 font-medium">Issuing company</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Spend category</th>
                    <th className="px-5 py-3 font-medium">Total cost</th>
                    <th className="px-5 py-3 font-medium">Created</th>
                    <th className="px-5 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paymentOrders.map((order) => {
                    const created = formatDateTime(order.created_at);
                    return (
                      <tr
                        key={order.ref_num}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <td className="whitespace-nowrap px-5 py-3 font-medium">
                          {order.ref_num}
                        </td>
                        <td className="px-5 py-3">{order.title || "N/A"}</td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {order.issuing_company_name || "N/A"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              order.status === "draft"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {order.status === "draft" ? "Open" : "Closed"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {order.spend_category}
                        </td>
                        <td className="px-5 py-3">{order.total_cost}</td>
                        <td
                          className="whitespace-nowrap px-5 py-3 text-muted-foreground"
                          title={created.relative}
                        >
                          {created.formatted}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right">
                          <Link
                            to={`/dashboard/payment-orders/${order.ref_num}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                          >
                            View <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {(pagination.next || pagination.previous) && (
              <div className="flex items-center justify-between gap-3 border-t border-border/70 px-5 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handlePageChange(
                      pagination.previous,
                      pagination.currentPage - 1,
                    )
                  }
                  disabled={!pagination.previous}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handlePageChange(pagination.next, pagination.currentPage + 1)
                  }
                  disabled={!pagination.next}
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="px-5 py-16 text-center text-muted-foreground">
            Nothing here yet. Payment orders you issue from a sales invoice will
            appear here.
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentOrdersPage;
