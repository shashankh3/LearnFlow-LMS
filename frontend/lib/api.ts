import axios from "axios";

// CHANGE THIS NUMBER EVERY TIME YOU PUSH TO VERIFY DEPLOYMENT
const DEBUG_VERSION = "1.0.5"; 

const api = axios.create({
  baseURL: "https://shashankh3.pythonanywhere.com/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  console.log(`%c[API DEBUG v${DEBUG_VERSION}] Request to: ${config.url}`, "color: cyan; font-weight: bold;");

  // 1. Django Trailing Slash Fix
  if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
    config.url += '/';
  }

  // 2. Token Injection
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("%c[API DEBUG] SUCCESS: Token attached to headers.", "color: green;");
    } else {
      console.warn("%c[API DEBUG] WARNING: No 'access' key found in localStorage!", "color: orange;");
      // Double check if it's under 'access_token' just in case
      const backupToken = localStorage.getItem("access_token");
      if (backupToken) {
        config.headers.Authorization = `Bearer ${backupToken}`;
        console.log("[API DEBUG] Used backup 'access_token' key.");
      }
    }
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;