"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { ArrowLeft, BookOpen, Loader2, CheckCircle } from "lucide-react";

export default function EditCoursePage() {
  const router = useRouter();
  const { slug } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    difficulty: "Beginner",
  });

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) { router.push("/login"); return; }
        const res = await api.get(`/courses/${slug}/`);
        setForm({
          title: res.data.title || "",
          description: res.data.description || "",
          difficulty: res.data.difficulty || "Beginner",
        });
      } catch {
        router.push("/instructor/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [slug, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await api.patch(`/courses/${slug}/`, form);
      setSaved(true);
      setTimeout(() => {
        router.push(`/courses/${slug}`);
      }, 1000);
    } catch (err: any) {
      setError(
        err.response?.data?.title?.[0] ||
        err.response?.data?.detail ||
        "Failed to save changes."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Link href={`/courses/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-semibold mb-8 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Course
        </Link>

        <div className="bg-white rounded-3xl border border-gray-200/60 shadow-xl shadow-gray-200/40 p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <BookOpen size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Edit Course</h1>
              <p className="text-xs text-gray-400">Update your course details</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 font-semibold">
              {error}
            </div>
          )}

          {saved && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-600 font-semibold flex items-center gap-2">
              <CheckCircle size={16} /> Changes saved! Redirecting...
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
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                        : 'border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-500'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Link href={`/courses/${slug}`}
                className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all text-center">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || saved}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                {saving
                  ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
                  : saved
                  ? <><CheckCircle size={16} /> Saved!</>
                  : "Save Changes"
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}