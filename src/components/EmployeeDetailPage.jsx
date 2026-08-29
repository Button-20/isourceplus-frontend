import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  User,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Clock,
  Activity,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const formatDate = (dateString) => {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function DetailRow({ icon: Icon, iconClass, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className={iconClass} size={18} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

const EmployeeDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location.state?.employee) {
      setEmployee(location.state.employee);
      setLoading(false);
    } else {
      setError("Employee data not found");
      setLoading(false);
      toast.error("Failed to load employee details");
    }
  }, [location.state]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <User className="h-8 w-8 animate-pulse text-brand" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center font-montserrat">
        <div className="rounded-2xl border border-border/70 bg-card p-8">
          <p className="font-display text-lg font-semibold">
            Employee not found
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Open an employee from the team list to view their profile.
          </p>
          <Button variant="outline" className="mt-5" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to employees
          </Button>
        </div>
      </div>
    );
  }

  const initials = (employee.email[0] || "U").toUpperCase();

  return (
    <div className="mx-auto max-w-4xl space-y-6 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 font-display text-2xl font-bold">
              {initials}
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl font-bold">
                {employee.email.split("@")[0]}
              </h1>
              <p className="truncate text-sm text-white/85">{employee.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="border-white/40 bg-white/10 text-brand-foreground hover:bg-white/20"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-2xl border border-border/70 bg-card p-6">
        <h2 className="mb-4 font-display text-base font-semibold">
          Account overview
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              {employee.email_is_verified ? (
                <CheckCircle className="text-emerald-500" size={18} />
              ) : (
                <XCircle className="text-amber-500" size={18} />
              )}
              <span>
                Email {employee.email_is_verified ? "verified" : "unverified"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {employee.is_active ? (
                <Activity className="text-emerald-500" size={18} />
              ) : (
                <Shield className="text-muted-foreground" size={18} />
              )}
              <span>{employee.is_active ? "Active" : "Inactive"} account</span>
            </div>
          </div>
          <div className="space-y-4">
            <DetailRow
              icon={Clock}
              iconClass="text-muted-foreground"
              label="Last login"
              value={formatDate(employee.last_login)}
            />
            <DetailRow
              icon={Calendar}
              iconClass="text-muted-foreground"
              label="Joined"
              value={formatDate(employee.created_at)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailPage;
