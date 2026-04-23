import axios from "axios";

// This log runs immediately when the app starts, regardless of API calls
console.log("%c>>> API CONFIG LOADED - VERSION 1.1.0 <<<", "color: yellow; font-size: 20px; font-weight: bold;");

const api = axios.create({
  baseURL: "https://shashankh3.pythonanywhere.com/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  console.log(`%c[Request] ${config.method?.toUpperCase()} ${config.url}`, "color: cyan;");

  if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
    config.url += '/';
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("%c[Auth] Token attached.", "color: green;");
    } else {
      console.warn("%c[Auth] No token found in localStorage['access']", "color: orange;");
    }
  }
  return config;
}, (error) => Promise.reject(error));

export default api;