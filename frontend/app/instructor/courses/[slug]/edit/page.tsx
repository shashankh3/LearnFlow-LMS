"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { ArrowLeft, Save, CheckCircle2 } from "lucide-react";

export default function EditCoursePage() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("BEGINNER");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await api.get(`/courses/${slug}/`);
        setTitle(res.data.title);
        setDescription(res.data.description);
        setDifficulty(res.data.difficulty);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [slug]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Use PUT to update the course in Django
      const res = await api.put(`/courses/${slug}/`, { title, description, difficulty });
      setSuccess(true);
      setTimeout(() => {
        router.push(`/courses/${res.data.slug}`); // Redirect back to course page
      }, 1500);
    } catch (err) {
      console.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-8 lg:p-12">
      <div className="max-w-3xl mx-auto">
        <Link href={`/courses/${slug}`} className="inline-flex items-center text-slate-500 font-bold text-sm mb-8 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4 mr-2" /> CANCEL EDIT
        </Link>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 p-10 lg:p-16">
          <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter mb-2 uppercase">Edit Course</h1>
          
          {success && (
             <div className="mb-8 p-4 bg-green-50 border-2 border-green-200 rounded-2xl text-green-700 font-bold flex items-center gap-2">
               <CheckCircle2 className="h-5 w-5" /> Course updated successfully! Redirecting...
             </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-10 mt-8">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block">Course Title</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} type="text" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl py-5 px-8 font-bold text-xl outline-none transition-all" />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block">Full Description</label>
              <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={6} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl py-5 px-8 font-medium text-lg outline-none transition-all" />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block">Complexity Level</label>
              <div className="grid grid-cols-3 gap-4">
                {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map(lvl => (
                  <button key={lvl} type="button" onClick={() => setDifficulty(lvl)} className={`py-4 rounded-2xl font-black text-xs border-2 transition-all ${difficulty === lvl ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <button disabled={saving} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-lg tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl">
              {saving ? "SAVING CHANGES..." : "SAVE CHANGES"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}