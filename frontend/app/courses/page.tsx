"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { LayoutDashboard, Compass, LogOut } from "lucide-react";
import toast from "react-hot-toast";

export default function ExplorePage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) { router.push("/login"); return; }

    api.get("/courses/explore/")
      .then(res => setCourses(res.data))
      .catch(() => toast.error("Failed to load courses"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleEnroll = async (courseId: number) => {
    setEnrollingId(courseId);
    try {
      await api.post("/enrollments/", { course: courseId });
      toast.success("Enrolled successfully! Redirecting...");
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch {
      toast.error("Could not enroll. You may already be enrolled.");
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="p-8 font-black text-2xl text-indigo-600 tracking-tighter">LEARNFLOW</div>
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/dashboard" className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <button className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-100">
            <Compass size={20} /> Explore
          </button>
        </nav>
        <button
          onClick={() => { localStorage.clear(); router.push("/login"); }}
          className="m-8 flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={20} /> Logout
        </button>
      </aside>

      <main className="flex-1 p-12">
        <h1 className="text-4xl font-black text-slate-900 mb-2">Explore Courses</h1>
        <p className="text-slate-500 font-medium mb-12">Find your next course and start learning today</p>

        {loading ? (
          <div className="text-slate-400">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-slate-400 text-lg">🎉 You're enrolled in all available courses!</p>
            <Link href="/dashboard" className="mt-6 inline-block px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all">
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {courses.map(course => (
              <div
                key={course.id}
                className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col"
              >
                <img
                  src={course.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.title)}&background=4f46e5&color=fff&size=512`}
                  className="w-full aspect-video object-cover"
                  alt={course.title}
                />
                <div className="p-8 flex flex-col flex-1">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">
                    {course.difficulty}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{course.title}</h3>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2">{course.description}</p>
                  <span className="text-xs text-slate-400 mb-6">
                    By {course.instructor_name} · {course.lessons?.length || 0} lessons
                  </span>
                  <button
                    onClick={() => handleEnroll(course.id)}
                    disabled={enrollingId === course.id}
                    className="mt-auto w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrollingId === course.id ? "ENROLLING..." : "ENROLL NOW"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}