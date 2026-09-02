// App-wide auth + user context.
//
// Slimmed from the original 526-line monolith: all HTTP/CSRF/token plumbing now
// lives in services/lib and services/api. This file owns React state and wiring
// only. The public shape of `useAuth()` is unchanged so existing pages keep
// working (notably `authAxios`, which is now the single shared `http` client).

import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

import http, { registerLogoutHandler } from "@/services/lib/http";
import { authStorage } from "@/services/lib/auth";
import { storage } from "@/services/lib/storage";
import { ENV } from "@/services/lib/env";
import { ensureCsrfToken, clearCsrfToken } from "@/services/lib/csrf";
import {
  loginRequest,
  signupRequest,
  logoutRequest,
  logoutAllRequest,
  refreshSession,
} from "@/services/api/auth.service";
import {
  getCurrentUser,
  getUserProfile,
} from "@/services/api/users.service";

export const AppContext = createContext();

const REFRESH_INTERVAL_MS = 4.5 * 60 * 1000;

export const AppProvider = ({ children }) => {
  const BASE_URL = ENV.API_BASE_URL;

  // `token` is the app's "authenticated" signal used by route guards. With
  // cookie auth there is no readable bearer token, so a stored user counts as
  // an active session (sentinel "session"); a real bearer is used if present.
  const [token, setToken] = useState(
    () =>
      authStorage.getAccessToken() ||
      (authStorage.isAuthenticated() ? "session" : null),
  );
  const [refreshToken, setRefreshToken] = useState(() =>
    authStorage.getRefreshToken(),
  );
  const [user, setUser] = useState(() => authStorage.getUserEmail());
  const [userProfileId, setUserProfileId] = useState(() =>
    authStorage.getProfileId(),
  );
  const [baseData, setBaseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastPath, setLastPath] = useState(null);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [transporterId, setTransporterId] = useState(null);
  const [jobTitle, setJobTitle] = useState(null);
  // Global buyer/supplier view mode. Null until the user (or the job-title
  // default below) picks one; persisted so it survives reloads.
  const [viewMode, setViewModeState] = useState(
    () => storage.get("view_mode") || null,
  );
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Design tokens still consumed by a few components.
  const tailwindValues = { secondary: "gray-600", primary: "indigo-600" };
  const primaryBg = "bg-brand";
  const primaryText = "text-brand";
  const primaryBtn =
    "bg-card text-muted-foreground font-semibold py-[2vw] px-[4vw] sm:py-[1vw] sm:px-[3vw] md:py-4 md:px-8 rounded-md hover:scale-110! duration-300 text-[max(1.2vw,14px)] sm:text-[max(1.5vw,16px)] md:text-[1rem] lg:text-[1.2rem]";

  const clearSession = () => {
    setBaseData(null);
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setUserProfileId(null);
    setCompanyId(null);
    setTransporterId(null);
    setViewModeState(null);
    storage.remove("view_mode");
    authStorage.clear();
    clearCsrfToken();
  };

  // Switch the global buyer/supplier view and remember the choice.
  const setViewMode = (mode) => {
    setViewModeState(mode);
    storage.set("view_mode", mode);
  };

  // Fetch the CSRF token as soon as the app mounts.
  useEffect(() => {
    ensureCsrfToken().catch(() => {
      /* interceptor will retry on the first mutating request */
    });
  }, []);

  // Register a state-clearing logout for the HTTP client's 401 fallback path.
  useEffect(() => {
    registerLogoutHandler(() => {
      clearSession();
    });
  }, []);

  const fetchUserData = async () => {
    try {
      setSidebarLoading(true);
      const userData = await getCurrentUser();
      if (!userData) return null;

      if (userData.company) {
        const id = userData.company.split("/").slice(-2)[0];
        if (userData.company.includes("/transporters/")) setTransporterId(id);
        else if (userData.company.includes("/companies/")) setCompanyId(id);
      }

      const profileId = userData.profile?.split("/").slice(-2)[0] || null;
      setUserProfileId(profileId);
      return profileId;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load user data");
      return null;
    } finally {
      setSidebarLoading(false);
    }
  };

  useEffect(() => {
    if (token && !transporterId && !companyId) fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const applySession = (data) => {
    setBaseData(data);
    setUser(data.user_email);
    setUserProfileId(data.profile_id);
    // Cookie auth returns no bearer token — mark the session authenticated so
    // the route guards let the user through.
    setToken(data.access || "session");
    setRefreshToken(data.refresh || null);
  };

  const signup = async (email, password1, password2, navigate) => {
    setError(null);
    setLoading(true);
    try {
      const data = await signupRequest({ email, password1, password2 });
      applySession(data);
      navigate("/onboarding/user", { replace: true });
      toast(data.detail || "Signup successful");
      return data;
    } catch (err) {
      const message =
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.email?.[0] ||
        err.response?.data?.password1?.[0] ||
        err.response?.data?.password2?.[0] ||
        err.response?.data?.detail ||
        err.message ||
        "Signup failed. Please try again.";
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, navigate) => {
    setError(null);
    setLoading(true);
    try {
      const data = await loginRequest({ email, password });
      applySession(data);
      // Navigate straight away using the login response. Awaiting the extra
      // `users/` call here could hang or fail (e.g. a transient 401 →
      // refresh → logout cascade) and strand the user on the sign-in page.
      // The `[token]` effect hydrates company/transporter ids in the
      // background, and DashboardLayout re-verifies the profile — redirecting
      // to onboarding if it isn't complete.
      navigate(data.profile_id ? "/dashboard" : "/onboarding/user", {
        replace: true,
      });
      return data;
    } catch (err) {
      const message =
        err.response?.data?.email?.[0] ||
        err.response?.data?.password?.[0] ||
        err.response?.data?.detail ||
        err.message ||
        "Login failed. Please try again.";
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Google sign-in is not wired to a provider yet; keep a safe stub so the
  // auth UI's "Continue with Google" button doesn't throw.
  const googleLogin = async () => {
    toast.info("Google sign-in is not available yet.");
  };

  const refreshTokenFunction = async () => {
    await refreshSession();
    // Keep the session marked authenticated (a real bearer if one was stored).
    setToken((prev) => authStorage.getAccessToken() || prev || "session");
    return true;
  };

  // Rotate the session cookie on mount if we appear to be logged in.
  useEffect(() => {
    if (token) {
      refreshTokenFunction().catch(() => {
        /* leave the user logged in; the 401 interceptor handles hard failures */
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodic silent refresh.
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      refreshTokenFunction().catch(() => clearInterval(interval));
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [token]);

  const logout = async () => {
    setError(null);
    setLoading(true);
    try {
      await logoutRequest();
    } catch {
      /* clear locally regardless of network outcome */
    } finally {
      clearSession();
      setLoading(false);
      toast.success("Logout successful.");
    }
  };

  // Log out of every device/session for this account.
  const logoutAll = async () => {
    setError(null);
    setLoading(true);
    try {
      await logoutAllRequest();
    } catch {
      /* clear locally regardless of network outcome */
    } finally {
      clearSession();
      setLoading(false);
      toast.success("Logged out of all devices.");
    }
  };

  const fetchProfileInfo = async () => {
    if (!userProfileId) return;
    try {
      setSidebarLoading(true);
      const profile = await getUserProfile(userProfileId);
      setJobTitle(profile.job_title);
    } catch {
      /* non-critical */
    } finally {
      setSidebarLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        tailwindValues,
        primaryBtn,
        primaryText,
        primaryBg,
        token,
        setToken,
        user,
        setUser,
        userProfileId,
        setUserProfileId,
        baseData,
        setBaseData,
        loading,
        setLoading,
        signup,
        login,
        googleLogin,
        logout,
        logoutAll,
        error,
        setError,
        currentCompany,
        setCurrentCompany,
        authAxios: http,
        lastPath,
        setLastPath,
        BASE_URL,
        refreshTokenFunction,
        jobTitle,
        setJobTitle,
        // Effective view mode: an explicit choice wins, otherwise default from
        // the job title (sales manager = supplier, everyone else = buyer).
        viewMode: viewMode || (jobTitle === "sales manager" ? "supplier" : "buyer"),
        setViewMode,
        profileLoading,
        setProfileLoading,
        sidebarLoading,
        setSidebarLoading,
        companyId,
        setCompanyId,
        transporterId,
        setTransporterId,
        fetchProfileInfo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAuth = () => useContext(AppContext);
