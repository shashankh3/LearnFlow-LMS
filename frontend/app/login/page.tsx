"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Eye, EyeOff, Loader2, BookOpen } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        `${BASE_URL}/auth/token/`,
        { username: form.username.trim(), password: form.password },
        { headers: { "Content-Type": "application/json" } }
      );

      const { access, refresh } = res.data;
      if (!access) { setError("Invalid response. Please try again."); return; }

      localStorage.setItem("access", access);
      if (refresh) localStorage.setItem("refresh", refresh);

      // Decode JWT payload to get role
      try {
        const payload = JSON.parse(atob(access.split(".")[1]));
        router.push(payload.is_instructor ? "/instructor/dashboard" : "/student/dashboard");
      } catch {
        // Fallback — fetch profile
        const profile = await axios.get(`${BASE_URL}/auth/me/`, {
          headers: { Authorization: `Bearer ${access}` }
        });
        router.push(profile.data.is_instructor ? "/instructor/dashboard" : "/student/dashboard");
      }

    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        "Incorrect username or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <BookOpen size={20} className="text-white" />
          </div>
          <span className="text-2xl font-black text-indigo-600 tracking-tight">LEARNFLOW</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-200/40 p-8">
          <div className="mb-7">
            <h1 className="text-2xl font-black text-gray-900 mb-1">Welcome back</h1>
            <p className="text-sm text-gray-400">Sign in to continue learning</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                type="text"
                value={form.username}
                onChange={e => { setForm({ ...form, username: e.target.value }); setError(""); }}
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => { setForm({ ...form, password: e.target.value }); setError(""); }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-60 transition-all shadow-sm shadow-indigo-200 flex items-center justify-center gap-2 mt-2">
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Signing in...</>
                : "Sign In"
              }
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Don't have an account?{" "}
          <Link href="/register" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}