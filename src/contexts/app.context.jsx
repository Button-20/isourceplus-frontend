import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import axios from "axios";
import { registerLogoutHandler } from "@/utils/apiService";

export const AppContext = createContext();

// NO CHANGES: Environment setup
const NODE_ENV = import.meta.env.VITE_NODE_ENV || "development";
console.log("Environment:", NODE_ENV);

export const AppProvider = ({ children }) => {
  const BASE_URL =
    NODE_ENV === "development"
      ? `${import.meta.env.VITE_SERVER_URL}api/v1/`
      : `${import.meta.env.VITE_SECURE_URL}api/v1/`;

  // UPDATED: State initialization, removed cookie usage, added csrfToken and refreshToken
  const [token, setToken] = useState(null); // Access token
  const [refreshToken, setRefreshToken] = useState(null); // Refresh token
  const [csrfToken, setCsrfToken] = useState(null); // CSRF token
  const [user, setUser] = useState(
    () => localStorage.getItem("user_email") || null
  );
  const [userProfileId, setUserProfileId] = useState(
    () => localStorage.getItem("profile_id") || null
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

  // UPDATED: Fetch CSRF token from response body
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

  // UPDATED: Fetch CSRF token on mount with retry
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

  // UPDATED: authAxios configuration, use state instead of cookies
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
        console.error("authAxios error:", err.response?.data, err.response?.headers);
        if (
          err.response?.status === 403 &&
          err.response?.data?.code === "token_not_valid" &&
          !orig._retry
        ) {
          orig._retry = true;
          try {
            const newTok = await refreshTokenFunction();
            orig.headers.Authorization = `Bearer ${newTok}`;
            return inst(orig);
          } catch {
            /* refreshToken calls logout() on failure */
          }
        }
        return Promise.reject(err);
      }
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

      const userData = res.data.results[0];
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
      toast.error(err.response.data.message || "Failed to load user data");
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

  // UPDATED: Signup, use response body for tokens
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
        }
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

  // UPDATED: Login, use response body for tokens
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
        }
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

  // UPDATED: refreshToken, use state for refresh token
  const refreshTokenFunction = async () => {
    try {
      if (!csrfToken) {
        console.log("No CSRF token found for refresh, fetching...");
        await fetchCsrfToken();
      }
      console.log("Refresh token CSRF:", csrfToken);

      const response = await axios.post(
        `${BASE_URL}account_auth/token/refresh/`,
        { refresh: refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
            ...(csrfToken && { "X-CSRFToken": csrfToken }),
          },
          withCredentials: true,
        }
      );
      console.log("Refresh token response:", response.data, response.headers);
      const newAccessToken = response.data.access;
      if (!newAccessToken) {
        console.warn("No new access token found in response");
        throw new Error("New access token not found");
      }
      setToken(newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error("Refresh token failed:", error);
      toast.error("Session expired. Please login again.");
      logout();
      throw error;
    }
  };

  // NO CHANGES: useEffect for token refresh
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      try {
        await refreshTokenFunction();
      } catch (error) {
        console.error("Auto-refresh failed:", error);
        clearInterval(interval);
      }
    }, 4.5 * 60 * 1000); // 4.5 minutes
    return () => clearInterval(interval);
  }, [token]);

  // UPDATED: logout, use csrfToken state
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
        }
      );
      setBaseData(null);
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      setUserProfileId(null);
      setTransporterId(null);
      setCompanyId(null);
      localStorage.removeItem("user_email");
      localStorage.removeItem("profile_id");
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
      localStorage.removeItem("profile_id");
      toast.success("Logout successful.");
    } finally {
      setLoading(false);
    }
  };

  // NO CHANGES: useEffect for registerLogoutHandler
  useEffect(() => {
    registerLogoutHandler(logout);
  }, [logout]);

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

  // UPDATED: AppContext.Provider, removed googleLogin
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
        refreshToken,
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