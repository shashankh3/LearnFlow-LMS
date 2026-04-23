import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  user_id: number;
  username: string;
  role: string;
  exp: number;
}

export function getUser(): JWTPayload | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  
  try {
    return jwtDecode<JWTPayload>(token);
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  const user = getUser();
  if (!user) return false;
  
  // Add a 5-second buffer to prevent edge-case expirations mid-request
  return user.exp * 1000 > Date.now() + 5000;
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
  }
}