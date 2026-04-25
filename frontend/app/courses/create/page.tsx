"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";

export default function CreateCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    difficulty: "Beginner",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/courses/", form);
      router.push(`/courses/${res.data.slug}`);
    } catch (err: any) {
      setError(
        err.response?.data?.title?.[0] ||
        err.response?.data?.detail ||
        "Failed to create course."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Link href="/instructor/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-medium mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
              <BookOpen size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Create New Course</h1>
              <p className="text-xs text-gray-400">Fill in the details to publish your course</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Course Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Complete React Developer Course"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="What will students learn in this course?"
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {["Beginner", "Intermediate", "Advanced"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setForm({ ...form, difficulty: level })}
                    className={`py-3 rounded-xl text-xs font-bold border-2 transition-all ${
                      form.difficulty === level
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-gray-200 text-gray-500 hover:border-indigo-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Creating...</>
                : "Create Course →"
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}