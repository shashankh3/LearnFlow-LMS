"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) { router.push("/login"); return; }
        const res = await api.get("/auth/me/");
        if (res.data.is_instructor) {
          router.replace("/instructor/dashboard");
        } else {
          router.replace("/student/dashboard");
        }
      } catch {
        localStorage.clear();
        router.push("/login");
      }
    };
    check();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading your dashboard...</p>
      </div>
    </div>
  );
}