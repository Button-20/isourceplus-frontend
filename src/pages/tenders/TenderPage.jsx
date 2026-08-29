import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Plus, Gavel, ArrowRight, Trash2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  format,
  formatDistanceToNow,
} from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";

import { Button } from "@/components/ui/button";
import TenderCreateModal from "@/components/tenders/TenderCreateModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const TenderPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tenderToDelete, setTenderToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchTenders = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint =
        jobTitle === "lead buyer" ? "/tenders/issued/" : "/tenders/";
      const response = await authAxios.get(endpoint);
      setTenders(response.data.results || response.data || []);
    } catch (error) {
      setTenders([]);
      toast.error("Failed to load tenders.");
      console.error("Fetch tenders error:", error);
    } finally {
      setLoading(false);
    }
  }, [authAxios, jobTitle]);

  useEffect(() => {
    fetchTenders();
  }, [fetchTenders]);

  useEffect(() => {
    if (searchParams.get("new") && jobTitle === "lead buyer") {
      setCreateOpen(true);
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, jobTitle]);

  const handleDelete = async () => {
    if (jobTitle !== "lead buyer") {
      toast.error("Only lead buyers can delete tenders.");
      setTenderToDelete(null);
      return;
    }
    setDeleteLoading(true);
    try {
      await authAxios.delete(`/tenders/${tenderToDelete.ref_num}/`);
      toast.success("Tender deleted successfully!");
      setTenders((prev) =>
        prev.filter((t) => t.ref_num !== tenderToDelete.ref_num),
      );
      setTenderToDelete(null);
    } catch (error) {
      toast.error("Failed to delete tender.");
      console.error("Delete tender error:", error);
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

  if (!["lead buyer", "sales manager"].includes(jobTitle)) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center font-montserrat">
        <div className="rounded-2xl border border-border/70 bg-card p-8">
          <p className="font-display text-lg font-semibold">Access denied</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Only lead buyers and sales managers can view tenders.
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

  const statusClasses = (status) =>
    status === "draft" || status === "open"
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700";

  return (
    <div className="mx-auto max-w-6xl space-y-8 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <Gavel className="h-3.5 w-3.5" /> Tender management
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
              Tenders
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/85">
              Publish tenders to the market and review supplier submissions.
            </p>
          </div>
          {jobTitle === "lead buyer" && (
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-white text-brand hover:bg-white/90"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Create tender
            </Button>
          )}
        </div>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-brand" /> Loading
            tenders…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Issuing company</th>
                  <th className="px-5 py-3 font-medium">Supplier market</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {Array.isArray(tenders) && tenders.length > 0 ? (
                  tenders.map((tender) => {
                    const created = formatDateTime(tender.created_at);
                    return (
                      <tr
                        key={tender.id || tender.ref_num}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <td className="whitespace-nowrap px-5 py-3 font-medium">
                          {tender.ref_num}
                        </td>
                        <td className="px-5 py-3">{tender.title}</td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {tender.issuing_company_info || "N/A"}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {tender.spend_category || "N/A"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusClasses(
                              tender.status,
                            )}`}
                          >
                            {tender.status}
                          </span>
                        </td>
                        <td
                          className="whitespace-nowrap px-5 py-3 text-muted-foreground"
                          title={created.relative}
                        >
                          {created.formatted}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              to={`/dashboard/tenders/${tender.ref_num}`}
                              className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                            >
                              View <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                            {jobTitle === "lead buyer" && (
                              <button
                                type="button"
                                onClick={() => setTenderToDelete(tender)}
                                className="text-muted-foreground transition-colors hover:text-destructive"
                                aria-label="Delete tender"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center text-muted-foreground"
                    >
                      No tenders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create wizard modal */}
      {jobTitle === "lead buyer" && (
        <TenderCreateModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={() => fetchTenders()}
        />
      )}

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(tenderToDelete)}
        onOpenChange={(o) => !o && setTenderToDelete(null)}
      >
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete tender</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {tenderToDelete?.title}
              </span>{" "}
              ({tenderToDelete?.ref_num})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setTenderToDelete(null)}
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

export default TenderPage;
