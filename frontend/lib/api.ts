import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://your-backend.pythonanywhere.com/api",
  headers: { "Content-Type": "application/json" },
});

// ✅ Attach token to every request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ On 401 — clear tokens but DON'T redirect from here
// Redirect is handled by each page individually
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined") {
      if (error.response?.status === 401) {
        // Only clear if we're NOT already on login/register page
        const path = window.location.pathname;
        if (!path.includes("/login") && !path.includes("/register")) {
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;