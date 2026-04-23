"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function CreateCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("BEGINNER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await api.post("/courses/", { title, description, difficulty });
      router.push(`/instructor/courses/${res.data.slug}/lessons/create`);
    } catch (err: any) {
      // Defensively parse the exact error Django is returning
      let errorMsg = "Server error. Please try again.";
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (err.response.data.detail) {
          errorMsg = err.response.data.detail;
        } else {
          const keys = Object.keys(err.response.data);
          if (keys.length > 0) {
            // E.g., translates {"title": ["This field must be unique."]} to "title: This field must be unique."
            const firstErrorValue = Array.isArray(err.response.data[keys[0]]) 
              ? err.response.data[keys[0]][0] 
              : err.response.data[keys[0]];
            errorMsg = `${keys[0].toUpperCase()}: ${firstErrorValue}`;
          }
        }
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-8 lg:p-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center text-slate-500 font-bold text-sm mb-8 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4 mr-2" /> BACK TO DASHBOARD
        </Link>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 p-10 lg:p-16">
          <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter mb-2 uppercase">Create Course</h1>
          <p className="text-slate-500 font-medium mb-12">Step 1: Define the foundation of your curriculum.</p>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-600 font-bold flex items-center gap-2">
              <AlertCircle /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block">Course Title</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} type="text" placeholder="e.g. Python Masterclass 2026" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl py-5 px-8 font-bold text-xl outline-none transition-all" />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block">Full Description</label>
              <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={6} placeholder="Describe the learning outcomes..." className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl py-5 px-8 font-medium text-lg outline-none transition-all" />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block">Complexity Level</label>
              <div className="grid grid-cols-3 gap-4">
                {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map(lvl => (
                  <button key={lvl} type="button" onClick={() => setDifficulty(lvl)} className={`py-4 rounded-2xl font-black text-xs border-2 transition-all ${difficulty === lvl ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white border-slate-100 text-slate-400'}`}>
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <button disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-lg tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl disabled:opacity-50">
              {loading ? "SAVING..." : "NEXT: ADD LESSONS & VIDEOS"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}