import { Link } from "react-router-dom";
import {
  Users,
  UserPlus,
  UserCheck,
  Building2,
  Truck,
  ArrowRight,
} from "lucide-react";

const ACTIONS = [
  {
    title: "Add New Employee",
    desc: "Invite a new person to your organization.",
    href: "/dashboard/employee/new",
    icon: UserPlus,
  },
  {
    title: "Add Existing Employee",
    desc: "Link an existing iSource+ user to your team.",
    href: "/dashboard/employee/existing",
    icon: UserCheck,
  },
  {
    title: "Company Employees",
    desc: "View and manage your company staff.",
    href: "/dashboard/company/employees",
    icon: Building2,
  },
  {
    title: "Transporter Employees",
    desc: "View and manage your transport team.",
    href: "/dashboard/transporter/employees",
    icon: Truck,
  },
];

const Employees = () => {
  return (
    <div className="mx-auto max-w-5xl space-y-8 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <span className="relative inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
          <Users className="h-3.5 w-3.5" /> Team
        </span>
        <h1 className="relative mt-4 font-display text-2xl font-bold sm:text-3xl">
          Employees
        </h1>
        <p className="relative mt-2 max-w-2xl text-sm text-white/85">
          Manage the people in your organization — add new members or review
          your company and transport teams.
        </p>
      </div>

      {/* Action cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              to={a.href}
              className="group flex items-start gap-4 rounded-2xl border border-border/70 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand-gradient group-hover:text-brand-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-base font-semibold">
                  {a.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Employees;
