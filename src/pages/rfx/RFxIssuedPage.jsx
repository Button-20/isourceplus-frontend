import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Plus,
  FileText,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  format,
  formatDistanceToNow,
} from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";

import Pagination from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import RFxCreateModal from "@/components/rfx/RFxCreateModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const RFxIssuedPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const navigate = useNavigate();
  const [rfxs, setRfxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rfxToDelete, setRfxToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchRfxs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authAxios.get(`/rfxs/issued/?page=${page}`);
      setRfxs(response.data.results || []);
      setPagination({
        count: response.data.count || 0,
        next: response.data.next || null,
        previous: response.data.previous || null,
      });
    } catch (error) {
      setRfxs([]);
      toast.error(error.response?.data?.detail || "Failed to load issued RFxs.");
    } finally {
      setLoading(false);
    }
  }, [authAxios, page]);

  useEffect(() => {
    fetchRfxs();
  }, [fetchRfxs]);

  useEffect(() => {
    if (searchParams.get("new") && jobTitle === "lead buyer") {
      setCreateOpen(true);
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, jobTitle]);

  const handleDelete = async () => {
    if (jobTitle !== "lead buyer") {
      toast.error("Only lead buyers can delete RFxs.");
      setRfxToDelete(null);
      return;
    }
    setDeleteLoading(true);
    try {
      await authAxios.delete(`/rfxs/${rfxToDelete.ref_num}/`);
      toast.success("RFx deleted successfully!");
      setRfxs((prev) =>
        prev.filter((rfx) => rfx.ref_num !== rfxToDelete.ref_num),
      );
      setRfxToDelete(null);
    } catch (error) {
      toast.error("Failed to delete RFx.");
      console.error("Delete RFx error:", error);
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
            Only lead buyers and sales managers can view issued RFxs.
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
    status === "draft"
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
              <FileText className="h-3.5 w-3.5" /> RFx management
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
              Issued RFxs
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/85">
              RFxs you&apos;ve issued to the market.
            </p>
          </div>
          {jobTitle === "lead buyer" && (
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-white text-brand hover:bg-white/90"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Create RFx
            </Button>
          )}
        </div>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-brand" /> Loading issued
            RFxs…
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
                  <th className="px-5 py-3 font-medium">Reach</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {Array.isArray(rfxs) && rfxs.length > 0 ? (
                  rfxs.map((rfx) => {
                    const created = formatDateTime(rfx.created_at);
                    return (
                      <tr
                        key={rfx.ref_num}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <td className="whitespace-nowrap px-5 py-3 font-medium">
                          {rfx.ref_num}
                        </td>
                        <td className="px-5 py-3">{rfx.title}</td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {rfx.issuing_company_info || "N/A"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses(
                              rfx.status,
                            )}`}
                          >
                            {rfx.status === "draft" ? "Open" : "Closed"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {rfx.reach
                            ? `${rfx.reach.region || "N/A"}, ${
                                rfx.reach.district || "N/A"
                              }`
                            : "N/A"}
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
                              to={`/dashboard/rfxs/${rfx.ref_num}`}
                              className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                            >
                              View <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                            {jobTitle === "lead buyer" && (
                              <button
                                type="button"
                                onClick={() => setRfxToDelete(rfx)}
                                className="text-muted-foreground transition-colors hover:text-destructive"
                                aria-label="Delete RFx"
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
                      No issued RFxs found.
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

      {/* Create wizard modal */}
      {jobTitle === "lead buyer" && (
        <RFxCreateModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={() => {
            setPage(1);
            fetchRfxs();
          }}
        />
      )}

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(rfxToDelete)}
        onOpenChange={(o) => !o && setRfxToDelete(null)}
      >
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete RFx</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {rfxToDelete?.title}
              </span>{" "}
              ({rfxToDelete?.ref_num})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRfxToDelete(null)}
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

export default RFxIssuedPage;
