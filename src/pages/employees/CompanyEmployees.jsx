import { useAuth } from "@/contexts/app.context";
import {
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Plus,
  ArrowLeft,
  Clock,
  Activity,
  Shield,
  Briefcase,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CompanyEmployees = () => {
  const { authAxios, companyId } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Add-employee modal.
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authAxios.get(
        `companies/${companyId}/all-employees`,
      );
      setEmployees(response.data.all_employees);
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

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) return toast.error("Email is required");
    if (!form.password) return toast.error("Password is required");
    if (form.password !== form.confirm)
      return toast.error("Passwords do not match");
    setAdding(true);
    try {
      const res = await authAxios.post("/add-employee/", {
        email: form.email.trim(),
        password: form.password,
        confirm_password: form.confirm,
      });
      toast.success(res.data?.message || "Employee added!");
      setAddOpen(false);
      setForm({ email: "", password: "", confirm: "" });
      fetchEmployees();
    } catch (err) {
      const data = err.response?.data || {};
      toast.error(
        data.detail || data.error || data.email?.[0] || "Failed to add employee",
      );
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 animate-pulse">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xs border border-gray-100 p-6 text-center">
          <div className="text-red-500 mb-4">Error loading company employees</div>
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-800 font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Previous Page
          </button>
        </div>
      </div>
    );
  }

  const filteredEmployees = employees.filter(employee =>
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="p-4">
      {/* Header with search and add button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Company Employees</h1>
          <p className="text-sm text-gray-500 mt-1">
            {employees.length} {employees.length === 1 ? 'employee' : 'employees'} registered
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Employee</span>
          </button>
        </div>
      </div>

      {filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-8 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Briefcase className="text-gray-400" size={40} />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {searchTerm ? 'No matching employees found' : 'No employees in this company yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? 'Try a different search term' 
              : 'Add employees to build your team'}
          </p>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus size={16} />
            Add New Employee
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <div
              key={employee.id}
              className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                {/* Employee header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="text-gray-600" size={24} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-800">
                      {employee.email.split('@')[0]}
                    </h2>
                    <p className="text-sm text-gray-500">{employee.email}</p>
                  </div>
                </div>

                {/* Employee details */}
                <div className="space-y-4">
                  {/* Email Verification */}
                  <div className="flex items-center gap-3">
                    {employee.email_is_verified ? (
                      <CheckCircle className="text-green-500" size={18} />
                    ) : (
                      <XCircle className="text-yellow-500" size={18} />
                    )}
                    <span className="text-sm">
                      {employee.email_is_verified ? 'Verified' : 'Unverified'} Email
                    </span>
                  </div>

                  {/* Account Status */}
                  <div className="flex items-center gap-3">
                    {employee.is_active ? (
                      <Activity className="text-green-500" size={18} />
                    ) : (
                      <Shield className="text-gray-400" size={18} />
                    )}
                    <span className="text-sm">
                      {employee.is_active ? 'Active' : 'Inactive'} Account
                    </span>
                  </div>

                  {/* Last Login */}
                  <div className="flex items-center gap-3">
                    <Clock className="text-gray-500" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Last Login</p>
                      <p className="text-sm font-medium">
                        {formatDate(employee.last_login)}
                      </p>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-center gap-3">
                    <Calendar className="text-gray-500" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Joined Company</p>
                      <p className="text-sm font-medium">
                        {formatDate(employee.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* View Details */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                  <Link
                    to={`/dashboard/employees/${employee.id}`}
                    className="text-sm font-medium text-gray-600 hover:text-gray-800 flex items-center gap-1"
                    title={`View details for ${employee.email}`}
                    aria-label={`View details for ${employee.email}`}
                    state={{employee}}
                  >
                    View profile
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add employee modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="font-montserrat sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add company employee</DialogTitle>
            <DialogDescription>
              Create an account for a new team member. They&apos;ll sign in with
              this email and password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Work email
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="employee@company.com"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  placeholder="Minimum 8 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Confirm password
              </label>
              <Input
                type={showPassword ? "text" : "password"}
                value={form.confirm}
                onChange={(e) =>
                  setForm((f) => ({ ...f, confirm: e.target.value }))
                }
                placeholder="Re-enter password"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAddOpen(false)}
                disabled={adding}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={adding}
                className="bg-brand-gradient text-brand-foreground hover:opacity-90"
              >
                {adding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding…
                  </>
                ) : (
                  "Add employee"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyEmployees;