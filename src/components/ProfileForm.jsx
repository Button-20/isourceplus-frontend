// components/ProfileForm.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  User,
  CheckCircle,
  XCircle,
  Shield,
  Info,
} from "lucide-react";

import { useAuth } from "@/services/context/app.context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  canCreateCompany as jobCanCreateCompany,
  canCreateTransporter as jobCanCreateTransporter,
  canCreateOrganization,
} from "@/utils/account-type";
import ScrollToTop from "./ScrollToTop";

const JOB_TITLES = [
  "logistics manager",
  "lead buyer",
  "sales manager",
  "sourcing_officer",
  "sales officer",
  "chief buyer",
  "stores officer",
  "finance officer",
];

const labelClass = "mb-1 block text-sm font-medium text-foreground";
const fieldClass =
  "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30";

const ProfileForm = ({ profileId }) => {
  const { authAxios, userProfileId } = useAuth();
  const [formValues, setFormValues] = useState({
    job_title: "",
    job_position: "",
    cell_1: "",
    cell_2: "",
    social_links: "",
    cell_1_is_verified: false,
    cell_2_is_verified: false,
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const navigate = useNavigate();

  const canCreateCompany = jobCanCreateCompany(formValues.job_title);
  const isAdmin = jobCanCreateTransporter(formValues.job_title);

  const handleVerifyNumber = async (numberType) => {
    const number = formValues[numberType];
    if (!number) {
      toast.error("Please enter a phone number first");
      return;
    }
    try {
      await authAxios.get(
        `send-verification-code/?phone=${encodeURIComponent(number)}`,
      );
      navigate(
        `/onboarding/mobile-verification/?phone=${encodeURIComponent(
          number,
        )}&number_type=${numberType}`,
      );
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not send code.");
    }
  };

  useEffect(() => {
    if (!profileId) return;
    const fetchProfile = async () => {
      try {
        const res = await authAxios.get(`user-profiles/${profileId}/`);
        const data = res.data;
        setFormValues({
          job_title: data.job_title || "",
          job_position: data.job_position || "",
          cell_1: data.cell_1 || "",
          cell_2: data.cell_2 || "",
          social_links: data.social_links || "",
          cell_1_is_verified: data.cell_1_is_verified || false,
          cell_2_is_verified: data.cell_2_is_verified || false,
        });
        if (data.profile_photo) setPhotoPreview(data.profile_photo);
      } catch (error) {
        toast.error("Failed to load profile. Please log in again.");
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, [authAxios, profileId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Enforce the 2MB limit the UI promises, so an oversized image never
    // reaches (and gets rejected by) the API.
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image is too large. Maximum size is 2MB.");
      e.target.value = "";
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // The backend stores social_links as a URL; validate before sending so a
    // malformed value doesn't come back as a 400.
    if (formValues.social_links) {
      let valid = false;
      try {
        valid = /^https?:$/.test(new URL(formValues.social_links).protocol);
      } catch {
        valid = false;
      }
      if (!valid) {
        toast.error("Enter a valid social link, including https://");
        return;
      }
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formValues).forEach(([key, val]) => {
        if (val !== "" && !key.endsWith("_is_verified")) data.append(key, val);
      });
      if (photoFile) data.append("profile_photo", photoFile);

      // CSRF + multipart boundary are handled by the shared client / axios.
      const response = await authAxios.patch(
        `user-profiles/${profileId}/`,
        data,
      );

      const updatedCell1 = data.get("cell_1");
      const updatedCell2 = data.get("cell_2");
      const needsVerification =
        (updatedCell1 && !response.data.cell_1_is_verified) ||
        (updatedCell2 && !response.data.cell_2_is_verified);

      if (needsVerification) {
        const numberToVerify =
          updatedCell1 && !response.data.cell_1_is_verified
            ? updatedCell1
            : updatedCell2;
        const numberType =
          updatedCell1 && !response.data.cell_1_is_verified
            ? "cell_1"
            : "cell_2";
        // Continue the flow forward after verifying (account-type for roles
        // that can own an org, otherwise the dashboard) rather than looping
        // back to this profile form.
        const nextAfterVerify = canCreateOrganization(formValues.job_title)
          ? "/onboarding/account-type"
          : "/dashboard";
        navigate(
          `/onboarding/mobile-verification/?phone=${encodeURIComponent(
            numberToVerify,
          )}&number_type=${numberType}&redirect=${encodeURIComponent(
            nextAfterVerify,
          )}`,
        );
      } else {
        toast.success("Profile updated successfully!");
        // Roles that can own an organization continue to the account-type
        // step; everyone else goes straight to the dashboard.
        navigate(
          canCreateOrganization(formValues.job_title)
            ? "/onboarding/account-type"
            : "/dashboard",
        );
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <ScrollToTop />

      {/* Profile photo */}
      <section className="border-b border-border pb-6">
        <h2 className="mb-4 font-display text-base font-semibold">
          Profile image
        </h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-muted ring-2 ring-brand/10">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-9 w-9 text-muted-foreground" />
              )}
            </div>
            <label
              htmlFor="profile-photo"
              className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-brand-gradient text-brand-foreground shadow hover:opacity-90"
            >
              <Upload className="h-3.5 w-3.5" />
              <input
                id="profile-photo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              JPG, GIF or PNG. Max size 2MB.
            </p>
            {photoPreview && (
              <button
                type="button"
                className="mt-2 text-sm font-medium text-destructive hover:underline"
                onClick={() => {
                  setPhotoPreview(null);
                  setPhotoFile(null);
                }}
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Professional info */}
      <section className="border-b border-border pb-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <h2 className="font-display text-base font-semibold">
            Professional information
          </h2>
          <div className="flex flex-col items-end gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                canCreateCompany ? "text-emerald-600" : "text-muted-foreground",
              )}
            >
              {canCreateCompany ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              Can create company
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                isAdmin ? "text-emerald-600" : "text-muted-foreground",
              )}
            >
              {isAdmin ? (
                <Shield className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              Can create transporter
            </span>
          </div>
        </div>

        <div className="mb-5 flex items-start gap-2 rounded-lg border border-brand/20 bg-brand/5 p-3 text-sm text-brand">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Your job title determines your permissions.{" "}
            <span className="font-medium">Lead Buyer</span> /{" "}
            <span className="font-medium">Sales Manager</span> can create a
            company; <span className="font-medium">Logistics Manager</span> can
            create a transporter.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Job title</label>
            <Select
              value={formValues.job_title || undefined}
              onValueChange={(value) =>
                setFormValues((prev) => ({ ...prev, job_title: value }))
              }
            >
              <SelectTrigger className="h-10 w-full capitalize">
                <SelectValue placeholder="Select your job title" />
              </SelectTrigger>
              <SelectContent>
                {JOB_TITLES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Job description</label>
            <textarea
              name="job_position"
              value={formValues.job_position}
              onChange={handleChange}
              rows={3}
              className={fieldClass}
              placeholder="Describe your role and responsibilities"
            />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="border-b border-border pb-6">
        <h2 className="mb-4 font-display text-base font-semibold">
          Contact information
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { name: "cell_1", label: "Primary phone" },
            { name: "cell_2", label: "Secondary phone" },
          ].map(({ name, label }) => {
            const verified = formValues[`${name}_is_verified`];
            return (
              <div key={name}>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    {label}
                  </label>
                  {formValues[name] && !verified && (
                    <button
                      type="button"
                      onClick={() => handleVerifyNumber(name)}
                      className="text-xs font-medium text-brand hover:underline"
                    >
                      Verify
                    </button>
                  )}
                  {verified && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
                <Input
                  type="tel"
                  name={name}
                  maxLength={15}
                  value={formValues[name]}
                  onChange={handleChange}
                  placeholder="+233 …"
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Social */}
      <section>
        <h2 className="mb-4 font-display text-base font-semibold">
          Social profile
        </h2>
        <div>
          <label className={labelClass}>Social link</label>
          <Input
            type="url"
            inputMode="url"
            name="social_links"
            value={formValues.social_links}
            onChange={handleChange}
            placeholder="https://linkedin.com/in/your-profile"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Full URL to your LinkedIn, X/Twitter, or other professional profile.
          </p>
        </div>
      </section>

      {/* Submit */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        <div className="flex items-center gap-3">
          {userProfileId && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/dashboard")}
            >
              Go to dashboard
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="bg-brand-gradient text-brand-foreground hover:opacity-90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              "Save profile"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ProfileForm;
