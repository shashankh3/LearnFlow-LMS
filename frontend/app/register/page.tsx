"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { GraduationCap, BookOpen, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        username: username.trim(),
        email: email.trim(),
        password: password,
        role: role.toUpperCase(), // Ensures "STUDENT" or "INSTRUCTOR"
      };

      console.log("Sending Payload:", payload);

      const response = await api.post("/auth/register/", payload);
      
      if (response.status === 201 || response.status === 200) {
        router.push("/login?registered=true");
      }
    } catch (err: any) {
      console.error("Full Backend Error Object:", err.response?.data);
      
      // Extracting the exact error message from Django
      const serverError = err.response?.data;
      if (typeof serverError === 'object') {
        const firstKey = Object.keys(serverError)[0];
        const firstMessage = serverError[firstKey];
        setError(`${firstKey}: ${Array.isArray(firstMessage) ? firstMessage[0] : firstMessage}`);
      } else {
        setError("Registration failed. Please try a different username or email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <BookOpen className="h-10 w-10 text-indigo-600" />
          <span className="ml-2 text-3xl font-bold text-slate-900">LearnFlow</span>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900">Create your account</h2>
        <p className="mt-2 text-center text-sm text-slate-600">Join thousands of learners today</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 flex items-center text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="johndoe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full border border-slate-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">I want to join as</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole("STUDENT")}
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                    role === "STUDENT" ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <GraduationCap className={`h-6 w-6 ${role === "STUDENT" ? "text-indigo-600" : "text-slate-400"}`} />
                  <span className={`mt-1 font-medium ${role === "STUDENT" ? "text-indigo-900" : "text-slate-600"}`}>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("INSTRUCTOR")}
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                    role === "INSTRUCTOR" ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <BookOpen className={`h-6 w-6 ${role === "INSTRUCTOR" ? "text-indigo-600" : "text-slate-400"}`} />
                  <span className={`mt-1 font-medium ${role === "INSTRUCTOR" ? "text-indigo-900" : "text-slate-600"}`}>Instructor</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Create Account →"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}