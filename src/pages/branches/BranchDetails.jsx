import { useAuth } from "@/contexts/app.context";
import {
  Phone,
  Mail,
  Building,
  Navigation,
  Edit,
  ArrowLeft,
  Globe,
  Map,
  Home,
  Layers,
  Trash2,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

function Field({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 shrink-0 text-muted-foreground" size={16} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

const BranchDetails = () => {
  const { authAxios } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchBranchDetails = async () => {
      setLoading(true);
      try {
        const response = await authAxios.get(`branches/${id}/`);
        setBranch(response.data);
      } catch (err) {
        toast.error("Failed to load branch details");
        console.error("Error fetching branch:", err);
        navigate("/dashboard/branches", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    fetchBranchDetails();
  }, [id, authAxios, navigate]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await authAxios.delete(`branches/${id}/`);
      toast.success("Branch deleted successfully!");
      navigate("/dashboard/branches");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete branch");
      console.error("Error deleting branch:", err);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading || !branch) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 font-montserrat">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15">
              <Building className="h-7 w-7" />
            </span>
            <div>
              <p className="text-xs text-white/80">Branch</p>
              <h1 className="font-display text-2xl font-bold">{branch.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              asChild
              className="bg-white text-brand hover:bg-white/90"
            >
              <Link to={`/dashboard/branches/${id}/edit`}>
                <Edit className="mr-1.5 h-4 w-4" /> Edit
              </Link>
            </Button>
            <Button
              onClick={() => setShowDeleteModal(true)}
              className="bg-white/15 text-brand-foreground hover:bg-white/25"
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/branches")}
              className="border-white/40 bg-white/10 text-brand-foreground hover:bg-white/20"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card p-6">
          <h2 className="mb-4 font-display text-base font-semibold">
            Contact information
          </h2>
          <div className="space-y-4 text-sm">
            <Field icon={Mail} label="Email address" value={branch.email || "Not provided"} />
            <Field
              icon={Phone}
              label="Primary phone"
              value={branch.office_line || "Not provided"}
            />
            {branch.office_line_2 && (
              <Field
                icon={Phone}
                label="Secondary phone"
                value={branch.office_line_2}
              />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-6">
          <h2 className="mb-4 font-display text-base font-semibold">
            Location details
          </h2>
          <div className="space-y-4 text-sm">
            {branch.location.street_address && (
              <Field
                icon={Home}
                label="Street address"
                value={branch.location.street_address}
              />
            )}
            {branch.location.popular_area_name && (
              <Field
                icon={Map}
                label="Landmark / nearby"
                value={branch.location.popular_area_name}
              />
            )}
            <Field
              icon={Layers}
              label="Region / district"
              value={
                [branch.location.region, branch.location.district]
                  .filter(Boolean)
                  .join(", ") || "N/A"
              }
            />
            <Field
              icon={Globe}
              label="City / town"
              value={
                [branch.location.city, branch.location.town]
                  .filter(Boolean)
                  .join(", ") || "N/A"
              }
            />
            {branch.location.gps && (
              <Field
                icon={Navigation}
                label="GPS coordinates"
                value={branch.location.gps}
              />
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-6">
        <h2 className="mb-4 font-display text-base font-semibold">
          Additional information
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Company</p>
            <p className="mt-0.5 font-medium">
              {branch.company ? "Linked company" : "Not assigned"}
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Subscription plan</p>
            <p className="mt-0.5 font-medium">
              {branch.sub_plan || "No active subscription"}
            </p>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete branch</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">{branch.name}</span>?
              This action cannot be undone.
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
    </div>
  );
};

export default BranchDetails;
