import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import Cookies from "js-cookie";
import { getCookie } from "@/utility/getCookie";
import { registerLogoutHandler } from "@/utils/apiService";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const BASE_URL = "http://127.0.0.1:8000/api/v1/";

  // Axios instance for protected API calls
  const authAxios = useMemo(() => {
    const inst = axios.create({
      baseURL: BASE_URL,
      withCredentials: true,
      xsrfCookieName: "csrftoken",
      xsrfHeaderName: "X-CSRFToken",
    });

    inst.interceptors.request.use((cfg) => {
      const token = localStorage.getItem("access_token");
      if (token) cfg.headers.Authorization = `Bearer ${token}`;
      return cfg;
    });

    inst.interceptors.response.use(
      (res) => res,
      async (err) => {
        const orig = err.config;
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
            /* refreshAccessToken calls logout() on failure */
          }
        }
        return Promise.reject(err);
      }
    );

    return inst;
  }, []);

  const tailwindValues = {
    secondary: "gray-600",
    primary: "indigo-600",
  };
  const primaryBg = "bg-indigo-600";
  const primaryBtn =
    "bg-white text-gray-500 font-semibold py-[2vw] px-[4vw] sm:py-[1vw] sm:px-[3vw] md:py-[1rem] md:px-[2rem] rounded-md hover:!scale-110 duration-300 text-[max(1.2vw,14px)] sm:text-[max(1.5vw,16px)] md:text-[1rem] lg:text-[1.2rem]";
  const primaryText = "text-indigo-600";

  const [token, setToken] = useState(() => localStorage.getItem("access_token") || false);
  const [user, setUser] = useState(() => localStorage.getItem("user_email") || null);
  const [userProfileId, setUserProfileId] = useState(() => localStorage.getItem("profile_id") || null);
  const [baseData, setBaseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [jobTitle, setJobTitle] = useState(null);
  const [lastPath, setLastPath] = useState(null);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [companyId, setCompanyId] = useState(null); // Remove localStorage dependency
  const [transporterId, setTransporterId] = useState(null); // Remove localStorage dependency
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch user data to get transporterId or companyId
  const fetchUserData = async () => {
    try {
      setSidebarLoading(true);
      const res = await authAxios.get("users/");
      const userData = res.data.results[0];
      if (userData.company) {
        const companyUrl = userData.company;
        const id = companyUrl.split("/").slice(-2)[0]; // Extract ID from URL
        if (companyUrl.includes("/transporters/")) {
          setTransporterId(id);
        } else if (companyUrl.includes("/companies/")) {
          setCompanyId(id);
        }
      }
      setUserProfileId(userData.profile?.split("/").slice(-2)[0] || null);
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      toast.error("Failed to load user data");
    } finally {
      setSidebarLoading(false);
    }
  };

  // Fetch user data on mount if token exists or after login
  useEffect(() => {
    if (token && !transporterId && !companyId) {
      fetchUserData();
    }
  }, [token]);

  const signup = async (email, password1, password2) => {
    setError(null);
    setLoading(true);
    try {
      let csrfToken = getCookie("csrftoken");
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
      setBaseData(data);
      setUser(data.user_email);
      setToken(data.access);
      setUserProfileId(data.profile_id);
      localStorage.setItem("user_email", data.user_email);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("profile_id", data.profile_id);
      await fetchUserData(); // Fetch user data to set transporterId/companyId
      return data;
    } catch (error) {
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

  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      let csrfToken = Cookies.get("csrftoken");
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
      setBaseData(data);
      setUser(data.user_email);
      setToken(data.access);
      setUserProfileId(data.profile_id);
      localStorage.setItem("user_email", data.user_email);
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("profile_id", data.profile_id);
      await fetchUserData(); // Fetch user data to set transporterId/companyId
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

  const googleLogin = async () => {
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
            fetchUserData(); // Fetch user data after Google login
            resolve(user);
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

  const refreshToken = async () => {
    const refresh = getCookie("isource-plus-refresh-token");
    try {
      const csrf = getCookie("csrftoken");
      const response = await axios.post(
        `${BASE_URL}account_auth/token/refresh/`,
        { refresh },
        {
          headers: {
            "Content-Type": "application/json",
            ...(csrf && { "X-CSRFToken": csrf }),
          },
          withCredentials: true,
        }
      );
      const newAccessToken = response.data.access;
      setToken(newAccessToken);
      localStorage.setItem("access_token", newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error("Refresh token failed:", error);
      toast.error("Session expired. Please login again.");
      logout();
      throw error;
    }
  };

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

  const logout = async () => {
    setError(null);
    setLoading(true);
    try {
      let csrfToken = getCookie("csrftoken");
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
      setUserProfileId(null);
      setTransporterId(null); // Clear on logout
      setCompanyId(null); // Clear on logout
      localStorage.removeItem("user_email");
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_profile");
      localStorage.removeItem("company_id");
      localStorage.removeItem("transporter_id");
      localStorage.removeItem("profile_id");
      toast.success("Logout successful.");
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Logout failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    registerLogoutHandler(logout);
  }, [logout]);

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