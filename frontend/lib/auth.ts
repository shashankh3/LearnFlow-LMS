import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  user_id: number;
  username: string;
  role: string;
  exp: number;
}

export function getUser(): JWTPayload | null {
  if (typeof window === "undefined") return null;
  // MATCHING YOUR SCREENSHOT: Using 'access'
  const token = localStorage.getItem("access");
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
  return user.exp * 1000 > Date.now() + 5000;
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.href = "/login";
  }
}