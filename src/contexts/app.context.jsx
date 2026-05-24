import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import axios from "axios";

export const AppContext = createContext();

// NO CHANGES: Environment setup
const NODE_ENV = import.meta.env.VITE_NODE_ENV || "development";
console.log("Environment:", NODE_ENV);
console.log("VITE_SERVER_URL", import.meta.env.VITE_SERVER_URL);
console.log("VITE_SECURE_URL", import.meta.env.VITE_SECURE_URL);

export const AppProvider = ({ children }) => {
  const BASE_URL =
    NODE_ENV === "development"
      ? `${import.meta.env.VITE_SERVER_URL}api/v1/`
      : `${import.meta.env.VITE_SECURE_URL}api/v1/`;

  // NO CHANGES: State initialization
  const [token, setToken] = useState(
    () => localStorage.getItem("access_token") || null,
  ); // Access token
  const [refreshToken, setRefreshToken] = useState(
    () => localStorage.getItem("refresh_token") || null,
  ); // Refresh token
  const [csrfToken, setCsrfToken] = useState(null); // CSRF token
  const [user, setUser] = useState(
    () => localStorage.getItem("user_email") || null,
  );
  const [userProfileId, setUserProfileId] = useState(
    () => localStorage.getItem("profile_id") || null,
  );
  const [baseData, setBaseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [jobTitle, setJobTitle] = useState(null);
  const [lastPath, setLastPath] = useState(null);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [transporterId, setTransporterId] = useState(null);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // NO CHANGES: Fetch CSRF token from response body
  const fetchCsrfToken = async () => {
    try {
      const response = await axios.get(`${BASE_URL}init/`, {
        withCredentials: true,
      });
      console.log("fetchCsrfToken response:", response.data, response.headers);
      const newCsrfToken = response.data.csrftoken;
      if (!newCsrfToken) {
        console.error("CSRF token not found in response");
        return null;
      }
      setCsrfToken(newCsrfToken);
      console.log("Fetched CSRF token:", newCsrfToken);
      return newCsrfToken;
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
      return null;
    }
  };

  // NO CHANGES: Fetch CSRF token on mount with retry
  useEffect(() => {
    const initCsrf = async () => {
      let newCsrfToken = await fetchCsrfToken();
      if (!newCsrfToken) {
        console.log("Retrying CSRF token fetch after delay...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        newCsrfToken = await fetchCsrfToken();
        if (!newCsrfToken) {
          console.error("Failed to fetch CSRF token after retry");
        }
      }
      console.log("CSRF token after init:", newCsrfToken);
    };
    initCsrf();
  }, []);

  // UPDATED: Attempt token refresh on mount only after CSRF token is available
  useEffect(() => {
    const attemptRefreshOnMount = async () => {
      if (token && refreshToken && csrfToken && !loading) {
        try {
          console.log(
            "Attempting token refresh on mount with CSRF:",
            csrfToken,
          );
          await refreshTokenFunction();
        } catch (error) {
          console.error(
            "Initial token refresh failed:",
            error,
            error.response?.data,
          );
          // Do not call logout here to avoid immediate redirect
          // toast.error(
          //   error.response?.data?.error ||
          //     "Failed to refresh session. You may need to log in again.",
          // );
        }
      } else {
        console.log(
          "Skipping on-mount refresh: missing token, refreshToken, or csrfToken",
          {
            token,
            refreshToken,
            csrfToken,
          },
        );
      }
    };
    attemptRefreshOnMount();
  }, [csrfToken]); // Depend on csrfToken to ensure it's available

  // NO CHANGES: authAxios configuration
  const authAxios = useMemo(() => {
    const inst = axios.create({
      baseURL: BASE_URL,
      withCredentials: true,
      xsrfHeaderName: "X-CSRFToken",
    });

    inst.interceptors.request.use((cfg) => {
      console.log("authAxios request - token:", token);
      if (token) cfg.headers.Authorization = `Bearer ${token}`;
      if (cfg.method.toLowerCase() === "post" && csrfToken) {
        console.log("authAxios CSRF token:", csrfToken);
        cfg.headers["X-CSRFToken"] = csrfToken;
      }
      return cfg;
    });

    inst.interceptors.response.use(
      (res) => {
        console.log("authAxios response headers:", res.headers);
        return res;
      },
      async (err) => {
        const orig = err.config;
        console.error(
          "authAxios error:",
          err.response?.data,
          err.response?.headers,
        );
        if (
          err.response?.status === 401 &&
          err.response?.data?.code === "token_not_valid" &&
          !orig._retry
        ) {
          orig._retry = true;
          try {
            const newTok = await refreshTokenFunction();
            orig.headers.Authorization = `Bearer ${newTok}`;
            return inst(orig);
          } catch {
            /* refreshTokenFunction calls logout() on failure */
          }
        }
        return Promise.reject(err);
      },
    );

    return inst;
  }, [token, csrfToken]); // Depend on token and csrfToken

  // NO CHANGES: Tailwind values
  const tailwindValues = {
    secondary: "gray-600",
    primary: "indigo-600",
  };
  const primaryBg = "bg-indigo-600";
  const primaryBtn =
    "bg-white text-gray-500 font-semibold py-[2vw] px-[4vw] sm:py-[1vw] sm:px-[3vw] md:py-[1rem] md:px-[2rem] rounded-md hover:!scale-110 duration-300 text-[max(1.2vw,14px)] sm:text-[max(1.5vw,16px)] md:text-[1rem] lg:text-[1.2rem]";
  const primaryText = "text-indigo-600";

  // NO CHANGES: fetchUserData
  const fetchUserData = async () => {
    try {
      console.log("Fetching user data...");
      setSidebarLoading(true);
      const res = await authAxios.get("users/");
      console.log("Fetched user data");

      const userData = res.data?.results[0];
      if (!userData) {
        console.error("No user data found in response:", res.data);
        return null;
      }
      console.log("Assigned user data to userData");

      if (userData.company) {
        const companyUrl = userData.company;
        const id = companyUrl.split("/").slice(-2)[0];
        if (companyUrl.includes("/transporters/")) {
          setTransporterId(id);
        } else if (companyUrl.includes("/companies/")) {
          setCompanyId(id);
        }
      }

      const profileId = userData.profile?.split("/").slice(-2)[0] || null;
      setUserProfileId(profileId);
      return profileId;
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      toast.error(err.response?.data?.message || "Failed to load user data");
      return null;
    } finally {
      setSidebarLoading(false);
    }
  };

  // NO CHANGES: useEffect for fetchUserData
  useEffect(() => {
    if (token && !transporterId && !companyId) {
      fetchUserData();
    }
  }, [token]);

  // NO CHANGES: Signup
  const signup = async (email, password1, password2, navigate) => {
    setError(null);
    setLoading(true);
    try {
      if (!csrfToken) {
        console.log("No CSRF token found for signup, fetching...");
        await fetchCsrfToken();
      }
      console.log("Signup CSRF token:", csrfToken);

      const response = await axios.post(
        `${BASE_URL}account_auth/registration/`,
        { email: email.trim(), password1, password2 },
        {
          headers: {
            "Content-Type": "application/json",
            ...(csrfToken && { "X-CSRFToken": csrfToken }),
          },
          withCredentials: true,
        },
      );
      const data = response.data;
      console.log("Signup response:", data, response.headers);

      setBaseData(data);
      setUser(data.user_email);
      setUserProfileId(data.profile_id);
      setToken(data.access);
      setRefreshToken(data.refresh);
      localStorage.setItem("user_email", data.user_email);
      localStorage.setItem("profile_id", data.profile_id);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      await fetchCsrfToken();

      console.log(`Navigating to onboarding for user ${data.user_email}`);
      navigate("/onboarding/user", { replace: true });

      toast(data.detail || "Signup successful");
      return data;
    } catch (error) {
      console.error("Signup error:", error);
      const errorMessage =
        error.response?.data?.non_field_errors?.[0] ||
        error.response?.data?.email?.[0] ||
        error.response?.data?.password1?.[0] ||
        error.response?.data?.password2?.[0] ||
        error.response?.data?.detail ||
        error.message ||
        "Signup failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // NO CHANGES: Login
  const login = async (email, password, navigate) => {
    setError(null);
    setLoading(true);
    try {
      if (!csrfToken) {
        console.log("No CSRF token found for login, fetching...");
        await fetchCsrfToken();
      }
      console.log("Login CSRF token:", csrfToken);

      const response = await axios.post(
        `${BASE_URL}account_auth/login/`,
        { email: email.trim(), password },
        {
          headers: {
            "Content-Type": "application/json",
            ...(csrfToken && { "X-CSRFToken": csrfToken }),
          },
          withCredentials: true,
        },
      );
      const data = response.data;
      console.log("Login response:", data, response.headers);

      setBaseData(data);
      setUser(data.user_email);
      setUserProfileId(data.profile_id);
      setToken(data.access);
      setRefreshToken(data.refresh);
      localStorage.setItem("user_email", data.user_email);
      localStorage.setItem("profile_id", data.profile_id);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      await fetchCsrfToken();
      const profileId = await fetchUserData();
      const from =
        window.location.state?.from?.pathname ||
        (profileId ? "/dashboard" : "/onboarding/user");
      navigate(from, { replace: true });
      return data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.email?.[0] ||
        error.response?.data?.password?.[0] ||
        error.response?.data?.detail ||
        error.message ||
        "Login failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: refreshTokenFunction, improved error logging
  const refreshTokenFunction = async () => {
    try {
      if (!csrfToken) {
        console.log("No CSRF token found for refresh, fetching...");
        await fetchCsrfToken();
      }
      if (!csrfToken) {
        throw new Error("CSRF token unavailable after fetch attempt");
      }
      console.log("Refresh token CSRF:", csrfToken);

      const response = await axios.post(
        `${BASE_URL}account_auth/token/refresh/`,
        { refresh: refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          withCredentials: true,
        },
      );
      console.log("Refresh token response:", response.data, response.headers);
      const newAccessToken = response.data.access;
      if (!newAccessToken) {
        console.warn("No new access token found in response");
        throw new Error("New access token not found");
      }
      setToken(newAccessToken);
      localStorage.setItem("access_token", newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error("Refresh token failed:", error, error.response?.data);
      // toast.error(
      //   error.response?.data?.error || "Session expired. Please login again.",
      // );
      // logout();
      throw error;
    }
  };

  // NO CHANGES: useEffect for token refresh
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(
      async () => {
        try {
          await refreshTokenFunction();
        } catch (error) {
          console.error("Auto-refresh failed:", error);
          clearInterval(interval);
        }
      },
      4.5 * 60 * 1000,
    ); // 4.5 minutes
    return () => clearInterval(interval);
  }, [token]);

  // NO CHANGES: logout
  const logout = async () => {
    console.log("Logging out...");
    setError(null);
    setLoading(true);
    try {
      if (!csrfToken) {
        console.log("No CSRF token found for logout, fetching...");
        await fetchCsrfToken();
      }
      console.log("Logout CSRF token:", csrfToken);

      await axios.post(
        `${BASE_URL}account_auth/logout/`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            ...(csrfToken && { "X-CSRFToken": csrfToken }),
          },
          withCredentials: true,
        },
      );
      setBaseData(null);
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      setUserProfileId(null);
      setTransporterId(null);
      setCompanyId(null);
      localStorage.removeItem("user_email");
      localStorage.setItem("profile_id", "");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      toast.success("Logout successful.");
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Logout failed. Please try again.";
      setError(errorMessage);
      console.error("Logout error:", errorMessage);
      setBaseData(null);
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      setUserProfileId(null);
      setTransporterId(null);
      setCompanyId(null);
      localStorage.removeItem("user_email");
      localStorage.setItem("profile_id", "");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      toast.success("Logout successful.");
    } finally {
      setLoading(false);
    }
  };

  // NO CHANGES: fetchProfileInfo
  const fetchProfileInfo = async () => {
    try {
      setSidebarLoading(true);
      const res = await authAxios.get(`user-profiles/${userProfileId}`);
      const profile = res.data;
      setJobTitle(profile.job_title);
    } catch (error) {
      console.error("Could not fetch user profile", error);
    } finally {
      setSidebarLoading(false);
    }
  };

  // NO CHANGES: AppContext.Provider
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
        logout,
        error,
        setError,
        currentCompany,
        setCurrentCompany,
        authAxios,
        setLastPath,
        BASE_URL,
        refreshTokenFunction,
        jobTitle,
        setJobTitle,
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
