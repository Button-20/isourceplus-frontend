import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import axios from "axios";
import Cookies from "js-cookie";
import { getCookie } from "@/utility/getCookie";
import { registerLogoutHandler } from "@/utils/apiService";

export const AppContext = createContext();

const NODE_ENV = import.meta.env.VITE_NODE_ENV || "development";
console.log("Environment:", NODE_ENV);

export const AppProvider = ({ children }) => {
  const BASE_URL =
    NODE_ENV === "development"
      ? `${import.meta.env.VITE_SERVER_URL}api/v1/`
      : `${import.meta.env.VITE_SECURE_URL}api/v1/`;

  // NEW ADDITION: State for CSRF token
  const [csrfToken, setCsrfToken] = useState(null);

  // NO CHANGES: Other state initialization
  const [token, setToken] = useState(
    () => Cookies.get("isource-plus-auth-token") || false
  );
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

  // UPDATED: Fetch and store CSRF token
  const fetchCsrfToken = async () => {
    try {
      const response = await axios.get(`${BASE_URL}init/`, {
        withCredentials: true,
      });
      console.log("fetchCsrfToken response:", response.data, response.headers);
      const newCsrfToken = Cookies.get("csrftoken");
      console.log("Fetched CSRF token:", newCsrfToken); // NEW ADDITION: Debug
      if (newCsrfToken) {
        setCsrfToken(newCsrfToken); // Store in state
      }
      return newCsrfToken;
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
      return null;
    }
  };

  // NEW ADDITION: Fetch CSRF token on mount with retry
  useEffect(() => {
    const initCsrf = async () => {
      let newCsrfToken = await fetchCsrfToken();
      // Retry once after a short delay if token is not set
      if (!newCsrfToken) {
        console.log("Retrying CSRF token fetch after delay...");
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
        newCsrfToken = await fetchCsrfToken();
        if (newCsrfToken) {
          setCsrfToken(newCsrfToken);
        }
      }
    };
    initCsrf();
  }, []);

  // NO CHANGES: authAxios configuration
  const authAxios = useMemo(() => {
    const inst = axios.create({
      baseURL: BASE_URL,
      withCredentials: true,
      xsrfCookieName: "csrftoken",
      xsrfHeaderName: "X-CSRFToken",
    });

    inst.interceptors.request.use((cfg) => {
      const token = Cookies.get("isource-plus-auth-token");
      console.log("authAxios request - isource-plus-auth-token:", token);
      if (token) cfg.headers.Authorization = `Bearer ${token}`;
      // NEW ADDITION: Ensure CSRF token in headers for POST requests
      if (cfg.method.toLowerCase() === "post" && csrfToken) {
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
            const newTok = await refreshToken();
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
  }, [csrfToken]); // UPDATED: Add csrfToken dependency

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

  // UPDATED: Fix signup CSRF handling
  const signup = async (email, password1, password2, navigate) => {
    setError(null);
    setLoading(true);
    try {
      // NEW ADDITION: Ensure CSRF token is available
      let csrfTokenLocal = csrfToken || Cookies.get("csrftoken");
      if (!csrfTokenLocal) {
        console.log("No CSRF token found for signup, fetching...");
        csrfTokenLocal = await fetchCsrfToken();
        if (csrfTokenLocal) setCsrfToken(csrfTokenLocal);
      }
      console.log("Signup CSRF token:", csrfTokenLocal);

      const response = await axios.post(
        `${BASE_URL}account_auth/registration/`,
        { email: email.trim(), password1, password2 },
        {
          headers: {
            "Content-Type": "application/json",
            ...(csrfTokenLocal && { "X-CSRFToken": csrfTokenLocal }),
          },
          withCredentials: true,
        }
      );
      const data = response.data;
      console.log("Signup response:", data, response.headers);

      setBaseData(data);
      setUser(data.user_email);
      setUserProfileId(data.profile_id);
      const accessToken = Cookies.get("isource-plus-auth-token");
      if (accessToken) {
        setToken(accessToken);
      } else {
        console.warn("No auth token found in cookies");
        setError("Authentication token not received. Please try again.");
      }
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

  // UPDATED: Ensure reliable CSRF token for login
  const login = async (email, password, navigate) => {
    setError(null);
    setLoading(true);
    try {
      // NEW ADDITION: Ensure CSRF token is available
      let csrfTokenLocal = csrfToken || Cookies.get("csrftoken");
      if (!csrfTokenLocal) {
        console.log("No CSRF token found for login, fetching...");
        csrfTokenLocal = await fetchCsrfToken();
        if (csrfTokenLocal) setCsrfToken(csrfTokenLocal);
      }
      console.log("Login CSRF token:", csrfTokenLocal);

      const response = await axios.post(
        `${BASE_URL}account_auth/login/`,
        { email: email.trim(), password },
        {
          headers: {
            "Content-Type": "application/json",
            ...(csrfTokenLocal && { "X-CSRFToken": csrfTokenLocal }),
          },
          withCredentials: true,
        }
      );
      const data = response.data;
      console.log("Login response:", data, response.headers);

      setBaseData(data);
      setUser(data.user_email);
      setUserProfileId(data.profile_id);
      const accessToken = Cookies.get("isource-plus-auth-token");
      if (accessToken) {
        setToken(accessToken);
      } else {
        console.warn("No auth token found in cookies");
        setError("Authentication token not received. Please try again.");
      }
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

  // NO CHANGES: googleLogin
  const googleLogin = async (navigate) => {
    setError(null);
    setLoading(true);
    try {
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      const popup = window.open(
        `${BASE_URL}auth/google/`,
        "Google OAuth",
        `width=${width},height=${height},top=${top},left=${left}`
      );
      return new Promise((resolve, reject) => {
        const messageListener = (event) => {
          if (event.origin !== "http://127.0.0.1:8000") return;
          if (event.data.type === "OAUTH_SUCCESS") {
            const { access_token, user } = event.data;
            setToken(access_token);
            setUser(user.email);
            localStorage.setItem("access_token", access_token);
            localStorage.setItem("user_email", user.email);
            popup.close();
            window.removeEventListener("message", messageListener);
            fetchUserData().then((profileId) => {
              const from =
                window.location.state?.from?.pathname ||
                (profileId ? "/dashboard" : "/onboarding/user");
              navigate(from, { replace: true });
              resolve(user);
            });
          } else if (event.data.type === "OAUTH_ERROR") {
            setError(event.data.message);
            popup.close();
            window.removeEventListener("message", messageListener);
            reject(new Error(event.data.message));
          }
        };
        window.addEventListener("message", messageListener);
      });
    } catch (error) {
      setError(error.message || "Google login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Ensure CSRF token for refreshToken
  const refreshToken = async () => {
    const refresh = Cookies.get("isource-plus-refresh-token");
    try {
      let csrfTokenLocal = csrfToken || Cookies.get("csrftoken");
      if (!csrfTokenLocal) {
        console.log("No CSRF token found for refresh, fetching...");
        csrfTokenLocal = await fetchCsrfToken();
        if (csrfTokenLocal) setCsrfToken(csrfTokenLocal);
      }
      console.log("Refresh token CSRF:", csrfTokenLocal);

      const response = await axios.post(
        `${BASE_URL}account_auth/token/refresh/`,
        { refresh },
        {
          headers: {
            "Content-Type": "application/json",
            ...(csrfTokenLocal && { "X-CSRFToken": csrfTokenLocal }),
          },
          withCredentials: true,
        }
      );
      console.log("Refresh token response:", response.data, response.headers);
      const newAccessToken = Cookies.get("isource-plus-auth-token");
      if (!newAccessToken) {
        console.warn("No new auth token found in cookies");
        throw new Error("New auth token not found");
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
        await refreshToken();
      } catch (error) {
        console.error("Auto-refresh failed:", error);
        clearInterval(interval);
      }
    }, 4.5 * 60 * 1000); // 4.5 minutes
    return () => clearInterval(interval);
  }, [token]);

  // UPDATED: Ensure CSRF token for logout
  const logout = async () => {
    console.log("Logging out...");
    setError(null);
    setLoading(true);
    try {
      let csrfTokenLocal = csrfToken || Cookies.get("csrftoken");
      if (!csrfTokenLocal) {
        console.log("No CSRF token found for logout, fetching...");
        csrfTokenLocal = await fetchCsrfToken();
        if (csrfTokenLocal) setCsrfToken(csrfTokenLocal);
      }
      console.log("Logout CSRF token:", csrfTokenLocal);

      await axios.post(
        `${BASE_URL}account_auth/logout/`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            ...(csrfTokenLocal && { "X-CSRFToken": csrfTokenLocal }),
          },
          withCredentials: true,
        }
      );
      setBaseData(null);
      setUser(null);
      setToken(null);
      setUserProfileId(null);
      setTransporterId(null);
      setCompanyId(null);
      localStorage.removeItem("user_email");
      localStorage.setItem("profile_id");
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
        googleLogin,
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