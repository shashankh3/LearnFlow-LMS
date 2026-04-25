"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { LogOut, LayoutDashboard, Compass, Award, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

// ✅ FIXED: url now accepts string | null | undefined
const getCourseThumbnail = (url: string | null | undefined, title: string) => {
  if (url) {
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch && ytMatch[1]) return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=4f46e5&color=fff&size=512`;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) { router.push("/login"); return; }

        const [profileRes, enrollRes] = await Promise.all([
          api.get("/auth/me/"),
          api.get("/enrollments/")
        ]);

        setUser(profileRes.data);
        setMyCourses(enrollRes.data);
      } catch (err) {
        localStorage.clear();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const renderCourseCard = (enrollment: any) => {
    const course = enrollment.course_details;
    if (!course) return null;

    const progress = enrollment.progress ?? 0;
    const isFinished = enrollment.is_completed === true;

    return (
      <div key={enrollment.id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col h-full">
        <div className="aspect-video relative">
          <img
            src={getCourseThumbnail(course.lessons?.[0]?.video_url, course.title)}
            className="w-full h-full object-cover"
            alt={course.title}
          />
          {isFinished && (
            <div className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full shadow-lg">
              <CheckCircle size={20} />
            </div>
          )}
        </div>

        <div className="p-8 flex flex-col flex-1">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">
            PROGRESS: {progress}%
          </span>
          <h3 className="text-xl font-bold text-slate-900 mb-6 leading-tight">{course.title}</h3>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-6">
            <div
              className={`h-full transition-all duration-1000 ${isFinished ? 'bg-green-500' : 'bg-indigo-600'}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-auto space-y-3">
            <Link
              href={`/courses/${course.slug}`}
              className="w-full block text-center py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs tracking-widest hover:bg-indigo-600 transition-all"
            >
              {isFinished ? "REVIEW COURSE" : "RESUME LEARNING"}
            </Link>

            {isFinished && (
              <Link
                href={`/courses/${course.slug}/certificate`}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-2xl font-black text-xs tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-yellow-200"
              >
                <Award size={16} /> CLAIM CERTIFICATE
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="p-8 font-black text-2xl text-indigo-600 tracking-tighter">LEARNFLOW</div>
        <nav className="flex-1 px-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-100">
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <Link href="/courses" className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50">
            <Compass size={20} /> Explore
          </Link>
        </nav>
        <button
          onClick={() => { localStorage.clear(); router.push("/login"); }}
          className="m-8 flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={20} /> Logout
        </button>
      </aside>

      <main className="flex-1 p-12">
        <h1 className="text-4xl font-black text-slate-900 mb-2">Welcome, {user?.username}</h1>
        <p className="text-slate-500 font-medium mb-12">Ready to continue your journey?</p>

        {myCourses.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-slate-400 text-lg mb-6">You haven't enrolled in any courses yet.</p>
            <Link href="/courses" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all">
              Explore Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {myCourses.map(enroll => renderCourseCard(enroll))}
          </div>
        )}
      </main>
    </div>
  );
}