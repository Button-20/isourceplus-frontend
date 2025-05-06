// src/api/apiService.js
import axios from 'axios';
import { getCookie } from '@/utility/getCookie';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

let logoutHandler = null;

export const registerLogoutHandler = (fn) => {
      logoutHandler = fn;
    };

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});



// Request interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
  }
  
  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
  }
  
  return config;
});


// Response interceptor
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

        // If we get FORBIDDEN anywhere, immediately log out:
    if (error.response?.status === 403) {
      console.warn('Request forbidden (403) – forcing logout');
      if (logoutHandler) logoutHandler();
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const response = await axios.post(
          `${API_BASE_URL}/account_auth/token/refresh/`,
          {},
          { withCredentials: true }
        );
        
        const newToken = response.data.access;
        localStorage.setItem('access_token', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Refresh failed:', refreshError);
        // Handle logout 
        if (logoutHandler) logoutHandler();
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// API functions
export const createUserProfile = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  return api.post('/user-profiles/', formData);
};

export const updateUserProfile = (id, data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  return api.patch(`/user-profiles/${id}/`, formData);
};

export const createCompany = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  return api.post('/companies/', formData);
};

export const createTransporter = (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key])) {
        data[key].forEach(item => formData.append(key, item));
      } else if (data[key] != null) {
        formData.append(key, data[key]);
      }
    });
    return api.post('/transporters/', formData);
  };
  

export default api;