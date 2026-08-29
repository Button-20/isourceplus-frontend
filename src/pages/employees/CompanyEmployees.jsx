import { useAuth } from "@/contexts/app.context";
import { Plus, ArrowLeft, Search, Briefcase, Loader2, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmployeeGrid from "@/components/employees/EmployeeGrid";
import AddEmployeeModal from "@/components/employees/AddEmployeeModal";

const CompanyEmployees = () => {
  const { authAxios, companyId } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authAxios.get(
        `companies/${companyId}/all-employees`,
      );
      setEmployees(response.data.all_employees || []);
    } catch (err) {
      setError(err.message || "Failed to fetch employees");
      toast.error("Failed to load company employees");
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  }, [authAxios, companyId]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center font-montserrat">
        <div className="rounded-2xl border border-border/70 bg-card p-8">
          <p className="font-display text-lg font-semibold">
            Error loading employees
          </p>
          <Button variant="outline" className="mt-5" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back
          </Button>
        </div>
      </div>
    );
  }

  const filteredEmployees = employees.filter((e) =>
    e.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 font-montserrat">
      {/* Branded header */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <Users className="h-3.5 w-3.5" /> Team
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
              Company employees
            </h1>
            <p className="mt-2 text-sm text-white/85">
              {employees.length}{" "}
              {employees.length === 1 ? "employee" : "employees"} registered.
            </p>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-white text-brand hover:bg-white/90"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add employee
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search employees…"
          className="pl-9"
        />
      </div>

      {filteredEmployees.length === 0 ? (
        <div className="rounded-2xl border border-border/70 bg-card p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
            <Briefcase className="h-7 w-7 text-brand" />
          </div>
          <h3 className="font-display text-lg font-semibold">
            {searchTerm ? "No matching employees" : "No employees yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm
              ? "Try a different search term."
              : "Add employees to build your team."}
          </p>
          {!searchTerm && (
            <Button
              className="mt-5 bg-brand-gradient text-brand-foreground hover:opacity-90"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add employee
            </Button>
          )}
        </div>
      ) : (
        <EmployeeGrid employees={filteredEmployees} joinedLabel="Joined company" />
      )}

      <AddEmployeeModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={fetchEmployees}
      />
    </div>
  );
};

export default CompanyEmployees;
