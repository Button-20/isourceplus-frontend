import { Link } from "react-router-dom";
import {
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Shield,
  ArrowRight,
} from "lucide-react";

const formatDate = (dateString) => {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
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

/** Branded responsive grid of employee cards. */
export default function EmployeeGrid({ employees, joinedLabel = "Member since" }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {employees.map((employee) => (
        <div
          key={employee.id}
          className="overflow-hidden rounded-2xl border border-border/70 bg-card transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5"
        >
          <div className="p-6">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                <User size={22} />
              </div>
              <div className="min-w-0">
                <h2 className="truncate font-display font-semibold">
                  {employee.email.split("@")[0]}
                </h2>
                <p className="truncate text-sm text-muted-foreground">
                  {employee.email}
                </p>
              </div>
            </div>

            <div className="space-y-3">
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
              <DetailRow
                icon={Clock}
                iconClass="text-muted-foreground"
                label="Last login"
                value={formatDate(employee.last_login)}
              />
              <DetailRow
                icon={Calendar}
                iconClass="text-muted-foreground"
                label={joinedLabel}
                value={formatDate(employee.created_at)}
              />
            </div>

            <div className="mt-5 flex justify-end border-t border-border/60 pt-4">
              <Link
                to={`/dashboard/employees/${employee.id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                state={{ employee }}
              >
                View profile <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
