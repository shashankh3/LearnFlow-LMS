"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import { BookOpen, Video, FileText, Plus, CheckCircle, ArrowLeft, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function CreateLessonPage() {
    const router = useRouter();
    const { slug } = useParams();
    const [course, setCourse] = useState<any>(null);
    const [lessons, setLessons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        title: "",
        video_url: "",
        content: ""
    });

    useEffect(() => {
        const fetchCourseData = async () => {
            try {
                const res = await api.get(`/courses/${slug}/`);
                setCourse(res.data);
                setLessons(res.data.lessons || []);
            } catch (err) {
                toast.error("Failed to load course");
                router.push("/dashboard");
            } finally {
                setLoading(false);
            }
        };
        fetchCourseData();
    }, [slug, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post(`/courses/${slug}/lessons/`, formData);
            setLessons([...lessons, res.data]);
            setFormData({ title: "", video_url: "", content: "" });
            toast.success("Lesson published!");
        } catch (err) {
            toast.error("Failed to save lesson");
        }
    };

    // NEW DELETE LOGIC
    const handleDelete = async (lessonId: number) => {
        if (!confirm("Are you sure you want to remove this lesson?")) return;
        
        try {
            await api.delete(`/lessons/${lessonId}/`);
            setLessons(lessons.filter(l => l.id !== lessonId));
            toast.success("Lesson removed");
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete lesson");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
            <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors">
                    <ArrowLeft className="h-4 w-4" /> BACK TO COURSE
                </button>
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs">
                        {course?.title[0]}
                    </div>
                    <span className="font-bold text-slate-900">{course?.title}</span>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* LEFT: FORM */}
                <main className="flex-1 overflow-y-auto p-12">
                    <div className="max-w-2xl mx-auto">
                        <div className="mb-10">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                                {course?.title}
                            </span>
                            <h1 className="text-4xl font-black text-slate-900 mt-4 italic tracking-tight">ADD NEW LESSON</h1>
                            <p className="text-slate-500 font-medium mt-2">Upload your video content and required reading materials.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Lesson Title</label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="e.g. Introduction to logic gates"
                                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-slate-900 outline-none focus:ring-2 ring-indigo-500/20 transition-all"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                                        <Video className="h-3 w-3" /> Video URL (YouTube / Vimeo / S3)
                                    </label>
                                    <input 
                                        type="url" 
                                        required 
                                        placeholder="https://youtube.com/..."
                                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-slate-900 outline-none focus:ring-2 ring-indigo-500/20 transition-all"
                                        value={formData.video_url}
                                        onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                                        <FileText className="h-3 w-3" /> Lesson Text / Reading Material
                                    </label>
                                    <textarea 
                                        rows={6}
                                        required
                                        placeholder="What will students learn in this lesson?"
                                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-slate-900 outline-none focus:ring-2 ring-indigo-500/20 transition-all resize-none"
                                        value={formData.content}
                                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase">
                                Publish Lesson
                            </button>
                        </form>
                    </div>
                </main>

                {/* RIGHT: CURRICULUM LIST */}
                <aside className="w-96 bg-white border-l border-slate-200 overflow-y-auto p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-slate-100 p-2 rounded-lg">
                            <BookOpen className="h-5 w-5 text-slate-600" />
                        </div>
                        <h2 className="font-black text-slate-900 tracking-tight uppercase text-sm">Current Curriculum</h2>
                    </div>

                    <div className="space-y-4">
                        {lessons.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem]">
                                <p className="text-slate-400 font-bold text-sm">No lessons yet.</p>
                            </div>
                        ) : (
                            lessons.map((lesson, idx) => (
                                <div key={lesson.id} className="group relative bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <span className="text-xs font-black text-indigo-400 mt-1">{(idx + 1).toString().padStart(2, '0')}</span>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm leading-tight">{lesson.title}</h4>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                                                        <Video className="h-3 w-3" /> Video
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* THE DELETE BUTTON */}
                                        <button 
                                            onClick={() => handleDelete(lesson.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete Lesson"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}