import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/app.context";
import { toast } from "sonner";
import { Loader2, Plus, Truck, ArrowRight, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  format,
  formatDistanceToNow,
} from "https://cdn.jsdelivr.net/npm/date-fns@2.30.0/+esm";

import { Button } from "@/components/ui/button";
import WaybillCreateModal from "@/components/waybills/WaybillCreateModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const IssuedWaybillsPage = () => {
  const { authAxios, jobTitle } = useAuth();
  const [waybills, setWaybills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [waybillToDelete, setWaybillToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const canCreateWaybill = ["lead buyer", "sales manager"].includes(jobTitle);

  const fetchWaybills = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authAxios.get("waybills/issued/");
      setWaybills(response.data.results || response.data || []);
    } catch (error) {
      setWaybills([]);
      toast.error("Failed to load issued waybills.");
      console.error("Fetch issued waybills error:", error);
    } finally {
      setLoading(false);
    }
  }, [authAxios]);

  useEffect(() => {
    fetchWaybills();
  }, [fetchWaybills]);

  const handleDeleteWaybill = async () => {
    setDeleteLoading(true);
    try {
      await authAxios.delete(`waybills/${waybillToDelete.ref_num}/`);
      toast.success("Waybill deleted successfully!");
      setWaybillToDelete(null);
      fetchWaybills();
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

  return (
    <div className="mx-auto max-w-6xl space-y-8 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <Truck className="h-3.5 w-3.5" /> Waybills
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
              Issued waybills
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/85">
              Waybills your organization has issued.
            </p>
          </div>
          {canCreateWaybill && (
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-white text-brand hover:bg-white/90"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Create waybill
            </Button>
          )}
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
                            {waybill.status === "draft" ? "Draft" : "Published"}
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
                              to={`/dashboard/waybills/${waybill.ref_num}`}
                              className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                            >
                              View <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                            {canCreateWaybill && (
                              <button
                                type="button"
                                onClick={() => setWaybillToDelete(waybill)}
                                className="text-muted-foreground transition-colors hover:text-destructive"
                                aria-label="Delete waybill"
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
                      colSpan={6}
                      className="px-5 py-16 text-center text-muted-foreground"
                    >
                      No issued waybills found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create wizard modal */}
      {canCreateWaybill && (
        <WaybillCreateModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={() => fetchWaybills()}
        />
      )}

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(waybillToDelete)}
        onOpenChange={(o) => !o && setWaybillToDelete(null)}
      >
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete waybill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {waybillToDelete?.title}
              </span>{" "}
              ({waybillToDelete?.ref_num})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setWaybillToDelete(null)}
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
    </div>
  );
};

export default IssuedWaybillsPage;
