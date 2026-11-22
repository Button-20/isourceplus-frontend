import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import ProfileForm from "@/components/ProfileForm";

// Resolve the UserProfile id from the employee's `profile` hyperlink
// (e.g. ".../user-profiles/<uuid>/").
const profileIdFrom = (employee) => {
  const url = typeof employee?.profile === "string" ? employee.profile : "";
  return url.split("/").filter(Boolean).pop() || null;
};

const EmployeeEditPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const employee = location.state?.employee;
  const profileId = profileIdFrom(employee);

  if (!profileId) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center font-montserrat">
        <div className="rounded-2xl border border-border/70 bg-card p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
            <UserX className="h-6 w-6" />
          </div>
          <p className="font-display text-lg font-semibold">
            Profile not found
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Open an employee from the team list to edit their profile.
          </p>
          <Button variant="outline" className="mt-5" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 font-montserrat">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8">
        <ProfileForm profileId={profileId} />
      </div>
    </div>
  );
};

export default EmployeeEditPage;
