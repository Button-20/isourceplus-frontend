// pages/ProfilePage.jsx — user onboarding / profile setup.
import { useAuth } from "@/services/context/app.context";
import ProfileForm from "@/components/ProfileForm";
import Logo from "@/components/common/Logo";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, Truck, ShieldCheck, UserPlus } from "lucide-react";

const ProfilePage = () => {
  const { userProfileId, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-brand" />
          <p className="text-muted-foreground">Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 font-montserrat">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Logo imgClassName="h-8" />
          <Button variant="ghost" size="sm" onClick={() => logout()}>
            Log out
          </Button>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Info column */}
          <aside className="space-y-4 lg:col-span-1">
            <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-brand-foreground">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <span className="relative inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                <UserPlus className="h-3.5 w-3.5" /> Getting started
              </span>
              <h1 className="relative mt-4 font-display text-2xl font-bold">
                Complete your profile
              </h1>
              <p className="relative mt-2 text-sm text-white/85">
                A few details to set up your workspace and unlock the full
                iSource+ platform.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-5">
              <h3 className="font-display text-sm font-semibold">
                What your role unlocks
              </h3>
              <ul className="mt-4 space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Lead Buyer
                    </span>{" "}
                    or{" "}
                    <span className="font-medium text-foreground">
                      Sales Manager
                    </span>{" "}
                    can create a company profile.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Truck className="h-4 w-4" />
                  </span>
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Logistics Manager
                    </span>{" "}
                    can create a transporter profile.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <span className="text-muted-foreground">
                    Verify your phone number to secure your account.
                  </span>
                </li>
              </ul>
            </div>
          </aside>

          {/* Form column */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8">
              {!userProfileId ? (
                <div className="py-10 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <h2 className="font-display text-lg font-semibold">
                    Let&apos;s create your profile
                  </h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    We couldn&apos;t find a profile for your account yet. Please
                    sign in again to continue setup.
                  </p>
                  <Button
                    className="mt-5 bg-brand-gradient text-brand-foreground hover:opacity-90"
                    onClick={() => logout()}
                  >
                    Sign in again
                  </Button>
                </div>
              ) : (
                <ProfileForm profileId={userProfileId} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
