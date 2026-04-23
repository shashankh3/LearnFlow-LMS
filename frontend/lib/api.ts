import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // 1. Django strict trailing slash enforcer (Fixes dropped POST payloads during registration)
    if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
      config.url = `${config.url}/`;
    }

    // 2. Attach JWT token if we are in the browser
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    
    // Prevent infinite loop if the refresh endpoint itself throws a 401
    if (error.response?.status === 401 && !original._retry && !original.url.includes('/auth/token/refresh/')) {
      original._retry = true;
      
      if (typeof window !== "undefined") {
        const refresh = localStorage.getItem("refresh_token");
        if (refresh) {
          try {
            // Explicitly use basic axios here to prevent interceptor loops
            const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh });
            localStorage.setItem("access_token", data.access);
            original.headers.Authorization = `Bearer ${data.access}`;
            return api(original);
          } catch (refreshError) {
            // Refresh token is dead. Purge storage and force re-login.
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            window.location.href = "/login";
          }
        } else {
          // No refresh token exists
          localStorage.removeItem("access_token");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;