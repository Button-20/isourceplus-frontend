import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";
let logoutHandler = null;
export const registerLogoutHandler = (fn) => {
  logoutHandler = fn;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Attach access token
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("access_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// Retry once on 401 → refresh
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      // use same refresh helper
      const csrf = Cookies.get("csrftoken");
      const r = await fetch(`${API_BASE_URL}/account_auth/token/refresh/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrf && { "X-CSRFToken": csrf }),
        },
      });
      if (!r.ok) {
        if (logoutHandler) logoutHandler();
        return Promise.reject(err);
      }
      const { access } = await r.json();
      localStorage.setItem("access_token", access);
      orig.headers.Authorization = `Bearer ${access}`;
      return api(orig);
    }
    if (err.response?.status === 403 && logoutHandler) {
      logoutHandler();
    }
    return Promise.reject(err);
  }
);

// // API functions
// export const createUserProfile = (data) => {
//   const formData = new FormData();
//   Object.keys(data).forEach(key => {
//     if (data[key] !== null && data[key] !== undefined) {
//       formData.append(key, data[key]);
//     }
//   });
//   return api.post('/user-profiles/', formData);
// };

// export const updateUserProfile = (id, data) => {
//   const formData = new FormData();
//   Object.keys(data).forEach(key => {
//     if (data[key] !== null && data[key] !== undefined) {
//       formData.append(key, data[key]);
//     }
//   });
//   return api.patch(`/user-profiles/${id}/`, formData);
// };

// export const createCompany = (data) => {
//   const formData = new FormData();
//   Object.keys(data).forEach(key => {
//     if (data[key] !== null && data[key] !== undefined) {
//       formData.append(key, data[key]);
//     }
//   });
//   return api.post('/companies/', formData);
// };

// export const createTransporter = (data) => {
//     const formData = new FormData();
//     Object.keys(data).forEach(key => {
//       if (Array.isArray(data[key])) {
//         data[key].forEach(item => formData.append(key, item));
//       } else if (data[key] != null) {
//         formData.append(key, data[key]);
//       }
//     });
//     return api.post('/transporters/', formData);
//   };

export default api;
