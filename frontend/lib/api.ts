import axios from "axios";

const api = axios.create({
  // Hardcoding the URL here just to be 100% sure Vercel environment variables aren't the issue
  baseURL: "https://shashankh3.pythonanywhere.com/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  // 1. Force trailing slash
  if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
    config.url += '/';
  }

  // 2. The Truth Test
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access");
    console.log("DEBUG: Current token in storage for key 'access':", token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("DEBUG: Authorization header attached successfully.");
    } else {
      console.error("DEBUG: FAILED to find token. Storage is empty or key is wrong.");
    }
  }
  return config;
});

export default api;