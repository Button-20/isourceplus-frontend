import { getCookie } from "@/utility/getCookie";
import { registerLogoutHandler } from "@/utils/apiService";
import axios from "axios";
import Cookies from "js-cookie";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { set } from "react-hook-form";
import { useLocation } from "react-router";
import { toast } from "sonner";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const BASE_URL = "http://127.0.0.1:8000/api/v1/";

  // ── 1) Axios instance for your protected API calls ─────────
  const authAxios = useMemo(() => {
    const inst = axios.create({
      baseURL: BASE_URL,
      withCredentials: true,
    });

    // Always attach latest access token
    inst.interceptors.request.use((cfg) => {
      const token = localStorage.getItem("access_token");
      if (token) cfg.headers.Authorization = `Bearer ${token}`;
      return cfg;
    });

    // Retry once on 403/token_invalid
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

  const [token, setToken] = useState(() => {
    return localStorage.getItem("access_token") || false;
  });
  const [user, setUser] = useState(() => {
    return localStorage.getItem("user_email") || null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  //route
  const [lastPath, setLastPath] = useState(null);

  // onboarding
  const [currentCompany, setCurrentCompany] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const signup = async (email, password1, password2) => {
    setError(null);
    setLoading(true);

    try {
      // Get CSRF token from cookies (may exist from page load)
      let csrfToken = getCookie("csrftoken");

      // If no token, proceed anyway - the signup request will set it
      if (!csrfToken) {
        console.warn("CSRF token not found in cookies - proceeding anyway");
      }

      // Make the signup request
      const response = await axios.post(
        "http://127.0.0.1:8000/api/v1/account_auth/registration/",
        {
          email: email.trim(),
          password1,
          password2,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(csrfToken && { "X-CSRFToken": csrfToken }), // Only include if we have it
          },
          withCredentials: true,
        }
      );

      const data = response.data;

      // The response will set cookies automatically (as seen in Postman)
      setUser(data.user_email);
      setToken(data.access);

      localStorage.setItem("user_email", data.user_email);
      localStorage.setItem("access_token", data.access);

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
      // Get CSRF token from cookies (may exist from page load)
      let csrfToken = Cookies.get("csrftoken");

      // If no token, proceed anyway - the signup request will set it
      if (!csrfToken) {
        console.warn("CSRF token not found in cookies - proceeding anyway");
      }

      // Make the signup request
      const response = await axios.post(
        "http://127.0.0.1:8000/api/v1/account_auth/login/",
        {
          email: email.trim(),
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(csrfToken && { "X-CSRFToken": csrfToken }), // Only include if we have it
          },
          withCredentials: true,
        }
      );

      const data = response.data;

      // The response will set cookies automatically (as seen in Postman)
      setUser(data.user_email);
      setToken(data.access);

      localStorage.setItem("user_email", data.user_email);
      localStorage.setItem("access_token", data.access);

      return data;
    } catch (error) {
      const errorMessage =
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

  const googleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      // Open Google OAuth in a popup window
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        "http://127.0.0.1:8000/api/v1/auth/google/",
        "Google OAuth",
        `width=${width},height=${height},top=${top},left=${left}`
      );

      // Listen for messages from the popup
      return new Promise((resolve, reject) => {
        const messageListener = (event) => {
          // Check origin for security
          if (event.origin !== "http://127.0.0.1:8000") return;

          if (event.data.type === "OAUTH_SUCCESS") {
            const { access_token, user } = event.data;
            setToken(access_token);
            setUser(user.email);
            localStorage.setItem("access_token", access_token);
            localStorage.setItem("user_email", user.email);
            popup.close();
            window.removeEventListener("message", messageListener);
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

  // const refreshAccessToken = async () => {
  //   try {
  //     const res = await axios.post(
  //       `${BASE_URL}account_auth/token/refresh/`,
  //       {}, // Empty body since refresh token is in HttpOnly cookie
  //       {
  //         withCredentials: true,
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //       }
  //     );

  //     if (res.data?.access) {
  //       const { access } = res.data;
  //       setToken(access);
  //       localStorage.setItem('access_token', access);
  //       return access;
  //     }
  //     throw new Error('No access token in response');
  //   } catch (error) {
  //     console.error('Refresh failed:', error);
  //     logout();
  //     throw new Error('Refresh failed');
  //   }
  // };

  // ── 4) Kick‐off one early refresh to prime CSRF & get tokens ──
  // useEffect(() => {
  //   refreshAccessToken().catch(() => {
  //     /* ignore on startup */
  //   });
  // }, []);

  const refreshToken = async () => {
    const refresh = getCookie('isource-plus-refresh-token')
    try {
      // console.log("Refresh token attempt. Current token:", token);
      const csrf = getCookie("csrftoken");
      const response = await axios.post(
        `${BASE_URL}account_auth/token/refresh/`,
        {refresh}, // empty body
        {
          headers: {
            "Content-Type": "application/json",
            ...(csrf && { "X-CSRFToken": csrf }),
          },
          withCredentials: true, // sends your HttpOnly refresh-cookie
        }
      );

      const newAccessToken = response.data.access;
      // console.log( 'response.data.access',response.data.access)
      setToken(newAccessToken);
      localStorage.setItem("access_token", newAccessToken);
      // console.log("new access token.", newAccessToken);

      return newAccessToken;
    } catch (error) {
      // If refresh fails, logout the user
      console.error("Refresh token failed:", error);
      // if (error.response?.status === 401) {
      //   toast.error("Session expired. Please login again.");
      //   logout();
      // }
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
        // console.log("Token refreshed successfully");
      } catch (error) {
        console.error("Auto-refresh failed:", error);
        clearInterval(interval);
      }
    }, 4.5 * 60 * 1000); // 4.5 minutes (before 5-minute expiry)

    return () => clearInterval(interval);
  }, [token]);

  const logout = async () => {
    setError(null);
    setLoading(true);

    try {
      // Get CSRF token from cookies (may exist from page load)
      let csrfToken = getCookie("csrftoken");

      // If no token, proceed anyway - the signup request will set it
      if (!csrfToken) {
        console.warn("CSRF token not found in cookies - proceeding anyway");
      }

      // Make the logout request
      const response = await axios.post(
        "http://127.0.0.1:8000/api/v1/account_auth/logout/",
        {},
        {
          headers: {
            "Content-Type": "application/json",
            ...(csrfToken && { "X-CSRFToken": csrfToken }), // Only include if we have it
          },
          withCredentials: true,
        }
      );

      // The response will set cookies automatically (as seen in Postman)
      setUser(null);
      setToken(null);

      localStorage.removeItem("user_email");
      localStorage.removeItem("access_token");

      toast.success("Logout successful.");

      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.email?.[0] ||
        error.response?.data?.password1?.[0] ||
        error.response?.data?.password2?.[0] ||
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
        BASE_URL,refreshToken
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAuth = () => useContext(AppContext);
