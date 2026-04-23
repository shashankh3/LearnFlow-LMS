"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { ArrowLeft, Video, FileText, Save, CheckCircle2, ListOrdered, PlayCircle } from "lucide-react";

export default function CreateLessonPage() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [course, setCourse] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch course details so we know what we are adding lessons to
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await api.get(`/courses/${slug}/`);
        setCourse(res.data);
      } catch (err) {
        console.error("Failed to fetch course");
      }
    };
    fetchCourse();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Send lesson data to our Django backend
      await api.post(`/courses/${slug}/lessons/`, {
        title,
        video_url: videoUrl,
        content,
        order: course?.lessons?.length ? course.lessons.length + 1 : 1
      });
      
      setSuccess(true);
      setTitle("");
      setVideoUrl("");
      setContent("");
      
      // Refresh course data to show the new lesson in the list
      const res = await api.get(`/courses/${slug}/`);
      setCourse(res.data);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save lesson");
    } finally {
      setLoading(false);
    }
  };

  if (!course) return <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">Loading builder...</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col lg:flex-row">
      
      {/* LEFT: LESSON CREATOR FORM */}
      <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <Link href={`/courses/${slug}`} className="inline-flex items-center text-slate-500 font-bold text-sm mb-8 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4 mr-2" /> BACK TO COURSE
        </Link>

        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-10">
          <span className="bg-indigo-100 text-indigo-800 text-xs font-black uppercase tracking-widest px-3 py-1 rounded mb-4 inline-block">
            {course.title}
          </span>
          <h1 className="text-3xl font-black text-slate-900 italic tracking-tighter mb-2 uppercase">Add New Lesson</h1>
          <p className="text-slate-500 font-medium mb-10">Upload your video content and required reading materials.</p>

          {success && (
            <div className="mb-8 p-4 bg-green-50 border-2 border-green-200 rounded-2xl text-green-700 font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Lesson published successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Lesson Title</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} type="text" placeholder="e.g. Introduction to Variables" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl py-4 px-6 font-bold text-lg outline-none transition-all" />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2 block">
                <Video className="h-3 w-3" /> Video URL (YouTube / Vimeo / S3)
              </label>
              <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} type="url" placeholder="https://youtube.com/watch?v=..." className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl py-4 px-6 font-medium outline-none transition-all" />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2 block">
                <FileText className="h-3 w-3" /> Lesson Text / Reading Material
              </label>
              <textarea required value={content} onChange={e => setContent(e.target.value)} rows={6} placeholder="Add notes, code snippets, or reading materials..." className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl py-4 px-6 font-medium outline-none transition-all" />
            </div>

            <button disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
              {loading ? "SAVING..." : "PUBLISH LESSON"}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT: EXISTING CURRICULUM */}
      <div className="w-full lg:w-[400px] bg-white border-l border-slate-200 p-8 lg:p-12 hidden lg:block overflow-y-auto">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
          <ListOrdered className="h-4 w-4" /> Current Curriculum
        </h3>
        
        {course.lessons?.length > 0 ? (
          <div className="space-y-4">
            {course.lessons.map((lesson: any, index: number) => (
              <div key={lesson.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <div className="h-8 w-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight">{lesson.title}</h4>
                  {lesson.video_url && <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1"><PlayCircle className="h-3 w-3"/> Video Attached</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl">
            <p className="text-slate-400 font-bold text-sm">No lessons yet.</p>
          </div>
        )}
      </div>

    </div>
  );
}