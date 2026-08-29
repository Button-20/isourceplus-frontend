import { useAuth } from "@/contexts/app.context";
import {
  Plus,
  MapPin,
  Phone,
  Mail,
  Building,
  Navigation,
  MoreVertical,
  Search,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BranchCreateModal from "@/components/branches/BranchCreateModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const AllBranches = () => {
  const { authAxios } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const menuRef = useRef(null);

  const fetchBranches = useCallback(
    async (page = 1, search = "") => {
      setLoading(true);
      try {
        const url = search
          ? `branches/?search=${search}`
          : `branches/?page=${page}`;
        const response = await authAxios.get(url);
        setBranches(response.data.results || []);
        setPagination({
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          currentPage: page,
        });
      } catch (err) {
        toast.error("Failed to fetch branches");
        console.error("Error fetching branches:", err);
      } finally {
        setLoading(false);
      }
    },
    [authAxios],
  );

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    if (searchParams.get("new")) {
      setCreateOpen(true);
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleDelete = async (branchId) => {
    setDeleting(true);
    try {
      await authAxios.delete(`branches/${branchId}/`);
      toast.success("Branch deleted successfully!");
      setDeleteModal(null);
      fetchBranches(pagination.currentPage, searchTerm);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete branch");
      console.error("Error deleting branch:", err);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalPages = Math.max(1, Math.ceil(pagination.count / 10));

  return (
    <div className="mx-auto max-w-6xl space-y-8 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <Building className="h-3.5 w-3.5" /> Branches
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
              Branch locations
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/85">
              Manage the branches and locations across your organization.
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-white text-brand hover:bg-white/90"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add branch
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            fetchBranches(1, e.target.value);
          }}
          placeholder="Search branches…"
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-brand" /> Loading
          branches…
        </div>
      ) : branches.length === 0 ? (
        <div className="rounded-2xl border border-border/70 bg-card p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
            <Building className="h-7 w-7 text-brand" />
          </div>
          <h3 className="font-display text-lg font-semibold">
            No branches found
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first branch to get started.
          </p>
          <Button
            className="mt-5 bg-brand-gradient text-brand-foreground hover:opacity-90"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add branch
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="overflow-hidden rounded-2xl border border-border/70 bg-card transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5"
              >
                <div className="p-5">
                  <div className="relative mb-4 flex items-start justify-between">
                    <h2 className="font-display text-lg font-semibold">
                      {branch.name}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
                        Branch
                      </span>
                      <button
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === branch.id ? null : branch.id,
                          )
                        }
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Branch options"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {openMenuId === branch.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-4 top-8 z-10 overflow-hidden rounded-xl border border-border/70 bg-card shadow-lg"
                        >
                          <Link
                            to={`/dashboard/branches/${branch.id}/edit`}
                            className="block px-4 py-2 text-sm hover:bg-muted/40"
                            onClick={() => setOpenMenuId(null)}
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => {
                              setDeleteModal(branch.id);
                              setOpenMenuId(null);
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-destructive hover:bg-muted/40"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Mail className="mt-0.5 shrink-0 text-muted-foreground" size={16} />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">
                          {branch.email || "Not provided"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="mt-0.5 shrink-0 text-muted-foreground" size={16} />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">
                          {branch.office_line || "Not provided"}
                        </p>
                        {branch.office_line_2 && (
                          <p className="font-medium">{branch.office_line_2}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 shrink-0 text-muted-foreground" size={16} />
                      <div>
                        <p className="text-xs text-muted-foreground">Address</p>
                        <div className="space-y-0.5 font-medium">
                          {branch.location.street_address && (
                            <p>{branch.location.street_address}</p>
                          )}
                          {branch.location.popular_area_name && (
                            <p>{branch.location.popular_area_name}</p>
                          )}
                          <p>
                            {[
                              branch.location.town,
                              branch.location.city,
                              branch.location.district,
                              branch.location.region,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                          {branch.location.gps && (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Navigation size={12} /> GPS: {branch.location.gps}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end border-t border-border/60 pt-4">
                    <Link
                      to={`/dashboard/branches/${branch.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                    >
                      View details <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.count > 10 && (
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchBranches(pagination.currentPage - 1)}
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
                onClick={() => fetchBranches(pagination.currentPage + 1)}
                disabled={!pagination.next}
              >
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create wizard modal */}
      <BranchCreateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => fetchBranches()}
      />

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(deleteModal)}
        onOpenChange={(o) => !o && setDeleteModal(null)}
      >
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete branch</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {branches.find((b) => b.id === deleteModal)?.name ||
                  "this branch"}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteModal(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => handleDelete(deleteModal)}
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
    </div>
  );
};

export default AllBranches;
